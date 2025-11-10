import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Plus, 
  Trash2, 
  Upload, 
  Calendar,
  Target,
  Zap,
  FileImage,
  Video
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { 
  Challenge, 
  DailyProgressUploadItem, 
  Participant 
} from '@/types/api';

type ProgressItemForm = Omit<DailyProgressUploadItem, 'quantity'> & { 
  quantity: string;
  // Walking-specific fields
  walkingUnit?: 'steps' | 'meters';
  stepLength?: string;
  subtractRunning?: boolean;
};

import { cn, getErrorMessage, isChallengeActive, isChallengeUpcoming, getDaysUntil, formatLocalDate } from '@/lib/utils';

// Component for Running Subtraction Checkbox
const RunningSubtractionCheckbox: React.FC<{
  item: ProgressItemForm;
  index: number;
  challenge: Challenge | null;
  slug: string | undefined;
  participant: Participant | null;
  selectedDate: string;
  progressItems: ProgressItemForm[];
  getActivitySlug: (activityId: number) => string | null;
  getQuantityValue: (item: ProgressItemForm) => number;
  updateProgressItem: (index: number, field: keyof ProgressItemForm, value: any) => void;
}> = ({ item, index, challenge, slug, participant, selectedDate, progressItems, getActivitySlug, getQuantityValue, updateProgressItem }) => {
  const [runningDistance, setRunningDistance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRunning = async () => {
      if (!slug || !participant || !selectedDate) {
        setRunningDistance(0);
        setLoading(false);
        return;
      }
      
      let totalRunningMeters = 0;
      
      // Check existing progress for running activities
      try {
        const response = await apiClient.getDailyProgress(slug, participant.id);
        const progressForDate = response.results.find(p => p.date === selectedDate);
        
        if (progressForDate) {
          progressForDate.items.forEach(existingItem => {
            const activityData = challenge?.allowed_activities?.find(
              a => a.activity.id === existingItem.activity
            );
            if (activityData?.activity.slug === 'running') {
              totalRunningMeters += existingItem.quantity;
            }
          });
        }
      } catch (err) {
        console.error('Error loading running distance:', err);
      }
      
      // Check current form for running activities
      progressItems.forEach(formItem => {
        const activitySlug = getActivitySlug(formItem.activity);
        if (activitySlug === 'running' && formItem !== item) {
          totalRunningMeters += getQuantityValue(formItem);
        }
      });
      
      setRunningDistance(totalRunningMeters);
      setLoading(false);
    };

    loadRunning();
  }, [slug, participant, selectedDate, progressItems, challenge]);

  if (loading || runningDistance === 0) {
    return null;
  }

  const steps = getQuantityValue(item);
  const finalSteps = item.subtractRunning !== false && steps > runningDistance ? steps - runningDistance : steps;

  return (
    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
      <label className="flex items-start space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={item.subtractRunning !== false}
          onChange={(e) => {
            updateProgressItem(index, 'subtractRunning', e.target.checked);
          }}
          className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <div className="flex-1">
          <span className="text-sm font-medium text-orange-900">
            Вычесть шаги бега
          </span>
          <p className="text-xs text-orange-700 mt-1">
            Обнаружено {runningDistance.toLocaleString()} м бега. 
            {item.subtractRunning !== false && steps > runningDistance && (
              <span className="block mt-1 font-medium">
                Итого: {finalSteps.toLocaleString()} шагов
              </span>
            )}
            {item.subtractRunning !== false && steps <= runningDistance && (
              <span className="block mt-1 text-red-600 font-medium">
                ⚠️ Шагов меньше дистанции бега. Вычитание не будет применено.
              </span>
            )}
          </p>
        </div>
      </label>
    </div>
  );
};

export const SendProgressTab: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return formatLocalDate(new Date());
  });

  // Calculate available dates (today and yesterday)
  const getAvailableDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
      { value: formatLocalDate(today), label: 'Сегодня' },
      { value: formatLocalDate(yesterday), label: 'Вчера' }
    ];
  };
  
  const [progressItems, setProgressItems] = useState<ProgressItemForm[]>([
    {
      activity: 0,
      quantity: '',
      type: 'photo',
      description: '',
      walkingUnit: 'steps',
      stepLength: '0.7',
      subtractRunning: false,
    }
  ]);

  const [totalHp, setTotalHp] = useState(0);
  const [requiredHp, setRequiredHp] = useState(0);
  const [overflowHp, setOverflowHp] = useState(0);
  const [overflowPercentage, setOverflowPercentage] = useState(0);
  const [existingProgressHp, setExistingProgressHp] = useState(0);

  useEffect(() => {
    if (slug) {
      loadChallengeData();
    }
  }, [slug, user?.id]);

  useEffect(() => {
    loadExistingProgress();
  }, [selectedDate, slug, participant]);

  useEffect(() => {
    calculateTotalHp();
  }, [progressItems, challenge, existingProgressHp]);

  const loadChallengeData = async () => {
    if (!slug) return;

    setIsLoading(true);
    setError(null);

    try {
      const challengeData = await apiClient.getChallenge(slug);
      setChallenge(challengeData);

      let currentUserParticipant: Participant | null = null;

      if (user) {
        try {
          currentUserParticipant = await apiClient.getMyChallengeParticipant(slug);
        } catch (participantError: any) {
          if (participantError?.response?.status !== 404) {
            console.warn('Failed to load current participant via /me endpoint:', participantError);
          }
        }
      }

      if (!currentUserParticipant) {
        const participantsData = await apiClient.getChallengeParticipants(slug).catch(() => []);
        currentUserParticipant = participantsData.find(p => p.user.id === user?.id) || null;
      }

      if (currentUserParticipant) {
        setParticipant(currentUserParticipant);
        setRequiredHp(currentUserParticipant.challenge_level.required_hp_per_day);
      } else {
        setParticipant(null);
        setRequiredHp(0);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingProgress = async () => {
    if (!slug || !participant || !selectedDate) {
      setExistingProgressHp(0);
      return;
    }

    try {
      const response = await apiClient.getDailyProgress(slug, participant.id);
      const progressForDate = response.results.find(p => p.date === selectedDate);
      
      if (progressForDate) {
        setExistingProgressHp(progressForDate.total_hp || 0);
      } else {
        setExistingProgressHp(0);
      }
    } catch (err) {
      // If error, assume no existing progress
      setExistingProgressHp(0);
    }
  };

  // Get activity slug by ID
  const getActivitySlug = (activityId: number): string | null => {
    if (!challenge) return null;
    const activity = challenge.allowed_activities?.find(
      allowedActivity => allowedActivity.activity.id === activityId
    );
    return activity?.activity.slug || null;
  };


  // Get localStorage key for subtracted running activities
  const getSubtractedRunningKey = () => {
    return `subtracted-running-${slug}-${selectedDate}-${participant?.id}`;
  };

  // Load subtracted running from localStorage
  const getSubtractedRunning = (): number[] => {
    try {
      const stored = localStorage.getItem(getSubtractedRunningKey());
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Save subtracted running to localStorage
  const saveSubtractedRunning = (runningIds: number[]) => {
    try {
      localStorage.setItem(getSubtractedRunningKey(), JSON.stringify(runningIds));
    } catch (err) {
      console.error('Error saving subtracted running:', err);
    }
  };

  // Convert meters to steps
  const metersToSteps = (meters: number, stepLength: number): number => {
    if (stepLength <= 0) return 0;
    return Math.round(meters / stepLength);
  };

  // Convert steps to meters
  const stepsToMeters = (steps: number, stepLength: number): number => {
    return Math.round(steps * stepLength);
  };

  const getQuantityValue = (item: ProgressItemForm, applyRunningSubtraction: boolean = false): number => {
    const activitySlug = getActivitySlug(item.activity);
    
    // For walking, handle unit conversion
    if (activitySlug === 'walking') {
      const stepLength = parseFloat(item.stepLength || '0.7');
      
      let steps = 0;
      if (item.walkingUnit === 'meters') {
        // Convert meters to steps
        const meters = parseFloat(item.quantity || '0');
        steps = metersToSteps(meters, stepLength);
      } else {
        // Already in steps
        steps = Math.trunc(parseFloat(item.quantity || '0'));
      }
      
      // Don't apply running subtraction during form validation/display
      // It will be applied during submission only
      return steps;
    }
    
    // For other activities, parse normally
    if (typeof item.quantity === 'number') {
      return Math.trunc(item.quantity);
    }
    const match = (item.quantity || '').trim().match(/\d+/);
    const normalized = match ? match[0] : '';
    if (!normalized) {
      return 0;
    }
    const parsed = parseInt(normalized, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const calculateTotalHp = () => {
    if (!challenge) return;

    // Calculate new HP from form
    let newHp = 0;
    progressItems.forEach(item => {
      const quantityValue = getQuantityValue(item);
      if (item.activity && quantityValue > 0) {
        const activity = challenge.allowed_activities?.find(
          allowedActivity => allowedActivity.activity.id === item.activity
        );
        if (activity) {
          const hpPerUnit = parseFloat(activity.activity.hp_per_unit);
          newHp += hpPerUnit * quantityValue;
        }
      }
    });
    
    // Total HP = existing HP + new HP from form
    const total = existingProgressHp + newHp;
    setTotalHp(total);
    
    // Calculate overflow (only if total exceeds required)
    const overflow = Math.max(0, total - requiredHp);
    setOverflowHp(overflow);
    
    // Calculate overflow percentage (40% of required HP for full overflow bar)
    const maxOverflow = requiredHp * 0.4;
    const overflowPercent = maxOverflow > 0 ? Math.min((overflow / maxOverflow) * 100, 100) : 0;
    setOverflowPercentage(overflowPercent);
  };

  const addProgressItem = () => {
    setProgressItems([...progressItems, {
      activity: 0,
      quantity: '',
      type: 'photo',
      description: '',
      walkingUnit: 'steps',
      stepLength: '0.7',
      subtractRunning: false,
    }]);
  };

  const removeProgressItem = (index: number) => {
    if (progressItems.length > 1) {
      setProgressItems(progressItems.filter((_, i) => i !== index));
    }
  };

  const updateProgressItem = (index: number, field: keyof ProgressItemForm, value: any) => {
    const updated = [...progressItems];
    updated[index] = { ...updated[index], [field]: value };
    setProgressItems(updated);
  };

  const handleFileChange = (index: number, file: File | null, type: 'photo' | 'video') => {
    if (file) {
      // Validate file type and size
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const maxSize = 300 * 1024 * 1024; // 300MB
      
      if (file.size > maxSize) {
        setError(`Файл слишком большой. Максимальный размер: 300MB`);
        return;
      }
      
      // Validate file type based on button clicked
      if (type === 'photo' && !['jpg', 'jpeg', 'png'].includes(fileExtension || '')) {
        setError(`Неподдерживаемый формат файла. Для фото разрешены: JPG, PNG`);
        return;
      }
      if (type === 'video' && !['mp4', 'mov', 'mkv'].includes(fileExtension || '')) {
        setError(`Неподдерживаемый формат файла. Для видео разрешены: MP4, MOV, MKV`);
        return;
      }
      // Update both file and type in one operation
      const updated = [...progressItems];
      updated[index] = { 
        ...updated[index], 
        file: file,
        type: type
      };
      setProgressItems(updated);
      setError(null); // Clear any previous errors
    } else {
      updateProgressItem(index, 'file', file);
    }
  };

  const removeFile = (index: number) => {
    // Reset both file and type in one operation
    const updated = [...progressItems];
    updated[index] = { 
      ...updated[index], 
      file: undefined,
      type: 'photo' // Reset to photo as default (will require user to select a file)
    };
    setProgressItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!participant || !slug) {
      setError('Участник не найден');
      return;
    }

    // Calculate total running distance from existing and current progress
    let totalRunningMeters = 0;
    
    // Check existing progress
    try {
      const response = await apiClient.getDailyProgress(slug, participant.id);
      const progressForDate = response.results.find(p => p.date === selectedDate);
      
      if (progressForDate) {
        progressForDate.items.forEach(existingItem => {
          const activityData = challenge?.allowed_activities?.find(
            a => a.activity.id === existingItem.activity
          );
          if (activityData?.activity.slug === 'running') {
            totalRunningMeters += existingItem.quantity;
          }
        });
      }
    } catch (err) {
      console.error('Error loading running distance:', err);
    }
    
    // Add running from current form
    progressItems.forEach(formItem => {
      const activitySlug = getActivitySlug(formItem.activity);
      if (activitySlug === 'running') {
        totalRunningMeters += getQuantityValue(formItem);
      }
    });

    // Validate form - file is required and apply running subtraction
    const normalizedItems: DailyProgressUploadItem[] = progressItems.map(item => {
      let quantity = getQuantityValue(item);
      
      // Apply running subtraction for walking if enabled
      const activitySlug = getActivitySlug(item.activity);
      if (activitySlug === 'walking' && item.subtractRunning !== false && totalRunningMeters > 0) {
        // Only subtract if steps > running distance
        if (quantity > totalRunningMeters) {
          quantity = quantity - totalRunningMeters;
        }
      }
      
      return {
        activity: item.activity,
        quantity: quantity,
        type: item.type,
        file: item.file,
        description: item.description,
      };
    });

    const validItems = normalizedItems.filter(item => 
      item.activity && item.quantity > 0 && item.file && (item.type === 'photo' || item.type === 'video')
    );

    if (validItems.length === 0) {
      setError('Добавьте хотя бы один элемент прогресса с фото или видео');
      return;
    }

    // Check if all items have files
    const itemsWithoutFiles = normalizedItems.filter(item => 
      item.activity && item.quantity > 0 && (!item.file || (item.type !== 'photo' && item.type !== 'video'))
    );
    
    if (itemsWithoutFiles.length > 0) {
      setError('Для каждого элемента прогресса необходимо загрузить фото или видео');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      const response = await apiClient.uploadDailyProgress(
        {
          participant_id: participant.id,
          date: selectedDate,
          items: validItems,
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Save that we've subtracted this running distance
      if (totalRunningMeters > 0) {
        saveSubtractedRunning([Date.now()]); // Simple timestamp to mark subtraction
      }

      setSuccess(`${response.message} Создано элементов: ${response.items_created}, HP: ${response.total_hp}/${response.required_hp}`);
      setProgressItems([{
        activity: 0,
        quantity: '',
        type: 'photo',
        description: '',
        walkingUnit: 'steps',
        stepLength: '0.7',
        subtractRunning: false,
      }]);
      setUploadProgress(0);
      
      // Redirect to progress tab after successful submission
      if (slug) {
        setTimeout(() => {
          navigate(`/challenges/${slug}/progress`, { replace: true });
        }, 1500); // Wait 1.5 seconds to show success message
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityHpPerUnit = (activityId: number): number => {
    if (!challenge) return 0;
    const activity = challenge.allowed_activities?.find(
      allowedActivity => allowedActivity.activity.id === activityId
    );
    return activity ? parseFloat(activity.activity.hp_per_unit) : 0;
  };

  const getActivityUnitName = (activityId: number): string | null => {
    if (!challenge) return null;
    const activity = challenge.allowed_activities?.find(
      allowedActivity => allowedActivity.activity.id === activityId
    );
    return activity ? activity.activity.unit_name : null;
  };

  const getItemHp = (item: ProgressItemForm): number => {
    const quantityValue = getQuantityValue(item);
    if (!item.activity || !quantityValue) return 0;
    return getActivityHpPerUnit(item.activity) * quantityValue;
  };

  if (isLoading) {
    return (
      <Card>
        <Loading text="Загрузка данных..." />
      </Card>
    );
  }

  if (error && !challenge) {
    return (
      <Card>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-red-600 mb-2">Ошибка загрузки</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </Card>
    );
  }

  if (!participant) {
    return (
      <Card>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Участие не найдено</h3>
          <p className="text-gray-600">Вы не участвуете в этом челлендже</p>
        </div>
      </Card>
    );
  }

  // Проверяем статус челленджа
  const isActive = challenge ? isChallengeActive(challenge.start_date, challenge.end_date) : false;
  const isUpcoming = challenge ? isChallengeUpcoming(challenge.start_date) : false;
  const daysUntilStart = challenge ? getDaysUntil(challenge.start_date) : 0;

  if (isUpcoming) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Челлендж еще не начался</h3>
          <p className="text-gray-600 mb-4">
            Загрузка прогресса будет доступна с {challenge?.start_date ? new Date(challenge.start_date).toLocaleDateString('ru-RU') : 'даты начала челленджа'}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
            <p className="text-sm text-blue-700">
              <strong>До начала челленджа:</strong> {daysUntilStart} {daysUntilStart === 1 ? 'день' : daysUntilStart < 5 ? 'дня' : 'дней'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!isActive) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Челлендж завершен</h3>
          <p className="text-gray-600">
            Загрузка прогресса недоступна для завершенных челленджей
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Activity className="w-8 h-8 mr-3 text-primary-600" />
        Отправить прогресс
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">Ошибка отправки прогресса</h3>
              <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Дата
          </label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            {getAvailableDates().map((date) => (
              <option key={date.value} value={date.value}>
                {date.label} ({date.value})
              </option>
            ))}
          </select>
        </div>

        {/* HP Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-xl">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-900">Прогресс HP</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {totalHp.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">
                Общий HP
                {existingProgressHp > 0 && (
                  <span className="text-xs text-gray-500 block mt-1">
                    (было: {existingProgressHp.toFixed(1)})
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {requiredHp}
              </div>
              <div className="text-sm text-gray-600">Требуется HP</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${
                totalHp >= requiredHp ? 'text-green-600' : 'text-orange-600'
              }`}>
                {Math.max(0, requiredHp - totalHp).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Осталось HP</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Прогресс</span>
              <span>
                {totalHp >= requiredHp 
                  ? `${Math.round((totalHp / requiredHp) * 100)}%` 
                  : `${Math.round((totalHp / requiredHp) * 100)}%`
                }
                {overflowHp > 0 && (
                  <span className="text-green-600 ml-1">
                    (+{Math.round((overflowHp / requiredHp) * 100)}% бонус)
                  </span>
                )}
              </span>
            </div>
            
            {/* Main progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
              {/* Base progress */}
              <div 
                className={`h-3 rounded-full transition-all duration-700 ${
                  totalHp >= requiredHp 
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                }`}
                style={{ width: `${Math.min((totalHp / requiredHp) * 100, 100)}%` }}
              />
              
              {/* Overflow progress bar */}
              {overflowHp > 0 && (
                <div 
                  className="absolute top-0 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                  style={{ 
                    left: '100%',
                    width: `${overflowPercentage}%`,
                    animation: 'slideIn 1s ease-out, overflowGlow 2s ease-in-out infinite'
                  }}
                />
              )}
            </div>
            
            {/* Overflow indicator */}
            {overflowHp > 0 && (
              <div className="mt-2 text-xs text-orange-600 font-medium">
                🎉 Превышение на {overflowHp.toFixed(1)} HP! (+{Math.round((overflowHp / requiredHp) * 100)}% бонус)
              </div>
            )}
          </div>
        </div>

        {/* Progress Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Элементы прогресса</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProgressItem}
              className="flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить</span>
            </Button>
          </div>

          <div className="space-y-4">
            {progressItems.map((item, index) => {
              const unitName = getActivityUnitName(item.activity);

              return (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-xs">{index + 1}</span>
                    </div>
                    <h4 className="text-base font-semibold text-gray-900">Элемент прогресса</h4>
                  </div>
                  {progressItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProgressItem(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Activity Selection */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Выберите активность
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {challenge?.allowed_activities?.map((allowedActivity) => (
                      <div
                        key={allowedActivity.id}
                        onClick={() => updateProgressItem(index, 'activity', allowedActivity.activity.id)}
                        className={`relative p-3 border rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md group ${
                          item.activity === allowedActivity.activity.id
                            ? 'border-primary-400 bg-gradient-to-br from-primary-50 to-primary-100 shadow-md scale-[1.02]'
                            : 'border-gray-200 bg-white hover:border-primary-300'
                        }`}
                      >
                        {/* Selection indicator */}
                        {item.activity === allowedActivity.activity.id && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">✓</span>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">
                              {allowedActivity.activity.name}
                            </h4>
                            <div className="text-xs text-gray-500">
                              {allowedActivity.activity.unit_name}
                            </div>
                          </div>
                          {allowedActivity.activity.icon && (
                            <div className="ml-3 flex-shrink-0">
                              <img 
                                src={allowedActivity.activity.icon} 
                                alt={allowedActivity.activity.name}
                                className="w-7 h-7 object-contain"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-white/70 rounded-md p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">
                              HP за единицу:
                            </span>
                            <span className="text-base font-bold text-primary-600">
                              {allowedActivity.activity.hp_per_unit}
                            </span>
                          </div>
                        </div>
                        
                        {/* Hover effect */}
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  {/* Quantity - with walking-specific logic */}
                  <div>
                    {getActivitySlug(item.activity) === 'walking' ? (
                      <div className="space-y-3">
                        {/* Unit Selection for Walking */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Единица измерения
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => updateProgressItem(index, 'walkingUnit', 'steps')}
                              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                                item.walkingUnit === 'steps'
                                  ? 'bg-primary-500 text-white border-primary-500'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                              }`}
                            >
                              Шаги
                            </button>
                            <button
                              type="button"
                              onClick={() => updateProgressItem(index, 'walkingUnit', 'meters')}
                              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                                item.walkingUnit === 'meters'
                                  ? 'bg-primary-500 text-white border-primary-500'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                              }`}
                            >
                              Метры
                            </button>
                          </div>
                        </div>

                        {/* Step Length (only for meters) */}
                        {item.walkingUnit === 'meters' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Длина шага (м)
                            </label>
                            <input
                              type="number"
                              min="0.1"
                              max="2"
                              step="0.1"
                              value={item.stepLength || '0.7'}
                              onChange={(e) => updateProgressItem(index, 'stepLength', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">По умолчанию: 0.7 м</p>
                          </div>
                        )}

                        {/* Quantity Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Количество
                            <span className="ml-1 text-xs text-gray-500">
                              ({item.walkingUnit === 'steps' ? 'шагов' : 'метров'})
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={item.quantity}
                              onChange={(e) => updateProgressItem(index, 'quantity', e.target.value)}
                              placeholder={`Введите количество ${item.walkingUnit === 'steps' ? 'шагов' : 'метров'}`}
                              required
                              className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                              <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-600">
                                {item.walkingUnit === 'steps' ? 'шагов' : 'м'}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Show conversion for meters -> steps */}
                        {item.walkingUnit === 'meters' && item.quantity && parseFloat(item.quantity) > 0 && (
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <strong>В шагах:</strong> {metersToSteps(
                                parseFloat(item.quantity), 
                                parseFloat(item.stepLength || '0.7')
                              ).toLocaleString()} шагов
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              {item.quantity} м ÷ {item.stepLength || '0.7'} м = {metersToSteps(
                                parseFloat(item.quantity), 
                                parseFloat(item.stepLength || '0.7')
                              ).toLocaleString()} шагов
                            </p>
                          </div>
                        )}

                        {/* Subtract Running Checkbox */}
                        <RunningSubtractionCheckbox
                          item={item}
                          index={index}
                          challenge={challenge}
                          slug={slug}
                          participant={participant}
                          selectedDate={selectedDate}
                          progressItems={progressItems}
                          getActivitySlug={getActivitySlug}
                          getQuantityValue={getQuantityValue}
                          updateProgressItem={updateProgressItem}
                        />
                      </div>
                    ) : (
                      /* Regular Quantity Input for Non-Walking Activities */
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Количество
                          {unitName && (
                            <span className="ml-1 text-xs text-gray-500">
                              ({unitName})
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={item.quantity}
                            onChange={(e) => updateProgressItem(index, 'quantity', e.target.value)}
                            placeholder="Введите количество"
                            required
                            className={cn(
                              'w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed border-gray-300',
                              unitName ? 'pr-20' : undefined
                            )}
                          />
                          {unitName && (
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                              <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-600">
                                {unitName}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Upload className="w-4 h-4 inline mr-2" />
                      Загрузить файл
                    </label>
                    
                    {!item.file || item.file === null ? (
                      <div className="space-y-2.5">
                        <div className="text-xs text-gray-600 mb-1 font-medium">
                          * Обязательно: выберите фото или видео
                        </div>
                        {/* File Upload Options */}
                        <div className="flex space-x-2.5">
                          {/* Photo Upload Button */}
                          <div className="flex-1">
                          <input
                            type="file"
                            id={`photo-${index}`}
                            accept="image/jpeg,image/png"
                            onChange={(e) => {
                              handleFileChange(index, e.target.files?.[0] || null, 'photo');
                              // Reset input value to allow selecting the same file again
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                            <label
                              htmlFor={`photo-${index}`}
                              className="flex flex-col items-center justify-center w-full h-20 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors duration-200"
                            >
                              <FileImage className="w-7 h-7 text-gray-400 mb-1.5" />
                              <span className="text-sm font-medium text-gray-600">Фото</span>
                              <span className="text-xs text-gray-500">JPG, PNG</span>
                            </label>
                          </div>
                          
                          {/* Video Upload Button */}
                          <div className="flex-1">
                          <input
                            type="file"
                            id={`video-${index}`}
                            accept=".mp4,.mov,.mkv"
                            onChange={(e) => {
                              handleFileChange(index, e.target.files?.[0] || null, 'video');
                              // Reset input value to allow selecting the same file again
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                            <label
                              htmlFor={`video-${index}`}
                              className="flex flex-col items-center justify-center w-full h-20 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors duration-200"
                            >
                              <Video className="w-7 h-7 text-gray-400 mb-1.5" />
                              <span className="text-sm font-medium text-gray-600">Видео</span>
                              <span className="text-xs text-gray-500">MP4, MOV</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            {item.type === 'photo' ? (
                              <FileImage className="w-6 h-6 text-green-600" />
                            ) : (
                              <Video className="w-6 h-6 text-green-600" />
                            )}
                            <div>
                              <div className="font-semibold text-green-700 text-sm">
                                {item.file.name}
                              </div>
                              <div className="text-xs text-green-600">
                                {item.type === 'photo' ? 'Фото' : 'Видео'} • {(item.file.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          ✓ Готов к загрузке
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Описание <span className="text-gray-400 font-normal">(необязательно)</span>
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateProgressItem(index, 'description', e.target.value)}
                      placeholder="Опишите ваш прогресс (необязательно)..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                    />
                  </div>
                </div>

                {/* HP Preview */}
                {item.activity && getQuantityValue(item) > 0 && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">
                          HP за этот элемент:
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-blue-600">
                          {getItemHp(item).toFixed(1)}
                        </span>
                        <span className="text-sm text-blue-500 ml-1">HP</span>
                      </div>
                    </div>
                    <div className="mt-1.5 text-xs text-blue-600">
                      {item.quantity || '—'} × {getActivityHpPerUnit(item.activity)} HP = {getItemHp(item).toFixed(1)} HP
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>

        {/* Upload Progress */}
        {isSubmitting && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Отправка прогресса...</span>
              </div>
              <span className="text-xl font-bold text-blue-600">{uploadProgress}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                style={{ width: `${uploadProgress}%` }}
              >
                {uploadProgress > 10 && (
                  <span className="text-xs font-semibold text-white">{uploadProgress}%</span>
                )}
              </div>
            </div>
            
            {uploadProgress < 100 && (
              <p className="mt-2 text-sm text-gray-600">
                Пожалуйста, не закрывайте страницу до завершения загрузки
              </p>
            )}
            {uploadProgress === 100 && (
              <p className="mt-2 text-sm text-green-600 font-medium">
                ✓ Файлы загружены, обработка данных...
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || totalHp === 0}
            className="flex items-center space-x-2"
          >
            {isSubmitting ? (
              <Loading text="Отправка..." />
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Отправить прогресс</span>
              </>
            )}
          </Button>
      </div>
      </form>
    </Card>
  );
};
