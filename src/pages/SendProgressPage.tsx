import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Activity, 
  Plus, 
  Trash2, 
  Upload, 
  Calendar,
  Target,
  Zap,
  FileImage,
  Video,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { 
  Challenge, 
  DailyProgressUploadItem, 
  Participant,
  ChallengeList
} from '@/types/api';
import { cn, getErrorMessage, formatLocalDate } from '@/lib/utils';

type ProgressItemForm = Omit<DailyProgressUploadItem, 'quantity'> & { 
  quantity: string;
  walkingUnit?: 'steps' | 'meters';
  stepLength?: string;
  subtractRunning?: boolean;
};

export const SendProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const challengeSlug = searchParams.get('challenge');
  
  const [challenges, setChallenges] = useState<ChallengeList[]>([]);
  const [selectedChallengeSlug, setSelectedChallengeSlug] = useState<string | null>(challengeSlug);
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

  // Calculate available dates (yesterday and today)
  const getAvailableDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
      { 
        value: formatLocalDate(yesterday), 
        label: 'Вчера',
        dayName: 'Вчера',
        date: yesterday.getDate(),
        month: yesterday.toLocaleDateString('ru-RU', { month: 'short' })
      },
      { 
        value: formatLocalDate(today), 
        label: 'Сегодня',
        dayName: 'Сегодня',
        date: today.getDate(),
        month: today.toLocaleDateString('ru-RU', { month: 'short' })
      }
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
  const [existingProgressHp, setExistingProgressHp] = useState(0);

  // Load user's active challenges
  useEffect(() => {
    loadUserChallenges();
  }, [user?.id]);

  // Load challenge data when slug changes
  useEffect(() => {
    if (selectedChallengeSlug) {
      loadChallengeData(selectedChallengeSlug);
    }
  }, [selectedChallengeSlug, user?.id]);

  useEffect(() => {
    loadExistingProgress();
  }, [selectedDate, selectedChallengeSlug, participant]);

  useEffect(() => {
    calculateTotalHp();
  }, [progressItems, challenge, existingProgressHp]);

  const loadUserChallenges = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getChallenges();
      const allChallenges = response.results || [];
      // Filter only joined and active challenges
      const activeChallenges = allChallenges.filter(c => c.joined === true && c.status === 'active');
      setChallenges(activeChallenges);
      
      // Auto-select first challenge if no slug provided
      if (!selectedChallengeSlug && activeChallenges.length > 0) {
        setSelectedChallengeSlug(activeChallenges[0].slug);
      }
    } catch (err) {
      console.error('Error loading challenges:', err);
      setError('Не удалось загрузить челленджи');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChallengeData = async (slug: string) => {
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
            console.warn('Failed to load current participant:', participantError);
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
    if (!selectedChallengeSlug || !participant || !selectedDate) {
      setExistingProgressHp(0);
      return;
    }

    try {
      const response = await apiClient.getDailyProgress(selectedChallengeSlug, participant.id);
      const progressForDate = response.results.find(p => p.date === selectedDate);
      
      if (progressForDate) {
        setExistingProgressHp(progressForDate.total_hp || 0);
      } else {
        setExistingProgressHp(0);
      }
    } catch (err) {
      setExistingProgressHp(0);
    }
  };

  const getActivitySlug = (activityId: number): string | null => {
    if (!challenge) return null;
    const activity = challenge.allowed_activities?.find(
      allowedActivity => allowedActivity.activity.id === activityId
    );
    return activity?.activity.slug || null;
  };

  const metersToSteps = (meters: number, stepLength: number): number => {
    if (stepLength <= 0) return 0;
    return Math.round(meters / stepLength);
  };

  const getQuantityValue = (item: ProgressItemForm): number => {
    const activitySlug = getActivitySlug(item.activity);
    
    if (activitySlug === 'walking') {
      const stepLength = parseFloat(item.stepLength || '0.7');
      
      let steps = 0;
      if (item.walkingUnit === 'meters') {
        const meters = parseFloat(item.quantity || '0');
        steps = metersToSteps(meters, stepLength);
      } else {
        steps = Math.trunc(parseFloat(item.quantity || '0'));
      }
      
      return steps;
    }
    
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
    
    const total = existingProgressHp + newHp;
    setTotalHp(total);
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
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const maxSize = 300 * 1024 * 1024; // 300MB
      
      if (file.size > maxSize) {
        setError(`Файл слишком большой. Максимальный размер: 300MB`);
        return;
      }
      
      if (type === 'photo' && !['jpg', 'jpeg', 'png'].includes(fileExtension || '')) {
        setError(`Неподдерживаемый формат файла. Для фото разрешены: JPG, PNG`);
        return;
      }
      if (type === 'video' && !['mp4', 'mov', 'mkv'].includes(fileExtension || '')) {
        setError(`Неподдерживаемый формат файла. Для видео разрешены: MP4, MOV, MKV`);
        return;
      }
      
      const updated = [...progressItems];
      updated[index] = { 
        ...updated[index], 
        file: file,
        type: type
      };
      setProgressItems(updated);
      setError(null);
    } else {
      updateProgressItem(index, 'file', file);
    }
  };

  const removeFile = (index: number) => {
    const updated = [...progressItems];
    updated[index] = { 
      ...updated[index], 
      file: undefined,
      type: 'photo'
    };
    setProgressItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!participant || !selectedChallengeSlug) {
      setError('Выберите челлендж');
      return;
    }

    const normalizedItems: DailyProgressUploadItem[] = progressItems.map(item => ({
      activity: item.activity,
      quantity: getQuantityValue(item),
      type: item.type,
      file: item.file,
      description: item.description,
    }));

    const validItems = normalizedItems.filter(item => 
      item.activity && item.quantity > 0 && item.file && (item.type === 'photo' || item.type === 'video')
    );

    if (validItems.length === 0) {
      setError('Добавьте хотя бы один элемент прогресса с фото или видео');
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

      setSuccess(`${response.message} HP: ${response.total_hp}/${response.required_hp}`);
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
      
      // Redirect to challenge progress tab
      setTimeout(() => {
        navigate(`/challenges/${selectedChallengeSlug}/progress`);
      }, 1500);
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <Loading text="Загрузка..." />
        </Card>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет активных челленджей</h3>
            <p className="text-gray-600 mb-4">
              Присоединитесь к челленджу, чтобы отправлять прогресс
            </p>
            <Button onClick={() => navigate('/challenges')}>
              Смотреть челленджи
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const availableDates = getAvailableDates();

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center">
            <Upload className="w-7 h-7 md:w-8 md:h-8 mr-3 text-primary-600" />
            Отправить прогресс
          </h1>
          {selectedChallengeSlug && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/challenges/${selectedChallengeSlug}`)}
              className="flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Вернуться в челлендж</span>
              <span className="sm:hidden">Назад</span>
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Challenge Selection */}
          {challenges.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Челлендж
              </label>
              <div className="grid grid-cols-1 gap-3">
                {challenges.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedChallengeSlug(ch.slug)}
                    className={cn(
                      'p-4 border-2 rounded-lg text-left transition-all',
                      selectedChallengeSlug === ch.slug
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    )}
                  >
                    <div className="font-semibold text-gray-900">{ch.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{ch.short_description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date Selection - Mini Cards */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Calendar className="w-4 h-4 inline mr-2" />
              Дата
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableDates.map((date) => (
                <button
                  key={date.value}
                  type="button"
                  onClick={() => setSelectedDate(date.value)}
                  className={cn(
                    'relative p-4 border-2 rounded-xl transition-all hover:shadow-md',
                    selectedDate === date.value
                      ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-md'
                      : 'border-gray-200 hover:border-primary-300 bg-white'
                  )}
                >
                  {selectedDate === date.value && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {date.date}
                    </div>
                    <div className="text-xs text-gray-500 uppercase mb-2">
                      {date.month}
                    </div>
                    <div className={cn(
                      'text-sm font-medium',
                      selectedDate === date.value ? 'text-primary-700' : 'text-gray-700'
                    )}>
                      {date.dayName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* HP Summary */}
          {challenge && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 md:p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mr-2" />
                <h3 className="text-base md:text-lg font-bold text-gray-900">Прогресс HP</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-primary-600 mb-1">
                    {totalHp.toFixed(1)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">
                    Общий HP
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                    {requiredHp}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Требуется</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-xl md:text-2xl font-bold mb-1 ${
                    totalHp >= requiredHp ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {Math.max(0, requiredHp - totalHp).toFixed(1)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Осталось</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
                  <div 
                    className={`h-2 md:h-3 rounded-full transition-all duration-700 ${
                      totalHp >= requiredHp 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    }`}
                    style={{ width: `${Math.min((totalHp / requiredHp) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Progress Items - Simplified for mobile */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Активности</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProgressItem}
                className="flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Добавить</span>
              </Button>
            </div>

            <div className="space-y-4">
              {progressItems.map((item, index) => {
                const unitName = getActivityUnitName(item.activity);

                return (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900">Элемент #{index + 1}</span>
                      {progressItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProgressItem(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Activity Selection - Compact Grid */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Активность
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {challenge?.allowed_activities?.map((allowedActivity) => (
                          <button
                            key={allowedActivity.id}
                            type="button"
                            onClick={() => updateProgressItem(index, 'activity', allowedActivity.activity.id)}
                            className={cn(
                              'p-2 border rounded-lg text-left transition-all text-xs',
                              item.activity === allowedActivity.activity.id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200'
                            )}
                          >
                            <div className="font-semibold text-gray-900">{allowedActivity.activity.name}</div>
                            <div className="text-primary-600 font-bold mt-1">{allowedActivity.activity.hp_per_unit} HP</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Количество {unitName && `(${unitName})`}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateProgressItem(index, 'quantity', e.target.value)}
                        placeholder="0"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    {/* File Upload - Compact */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Файл *
                      </label>
                      
                      {!item.file ? (
                        (() => {
                          const selectedActivity = challenge?.allowed_activities?.find(
                            a => a.activity.id === item.activity
                          )?.activity;
                          const allowPhoto = selectedActivity?.allow_photo ?? true;
                          const allowVideo = selectedActivity?.allow_video ?? true;
                          const recommendedType = selectedActivity?.recommended_proof_type;
                          const recommendedDescription = selectedActivity?.recommended_proof_description;
                          
                          // Calculate grid columns based on what's allowed
                          const gridCols = (allowPhoto && allowVideo) ? 'grid-cols-2' : 'grid-cols-1';
                          
                          return (
                            <div className="space-y-2">
                              <div className={cn('grid gap-2', gridCols)}>
                                {allowPhoto && (
                                  <div>
                                    <input
                                      type="file"
                                      id={`photo-${index}`}
                                      accept="image/jpeg,image/png"
                                      onChange={(e) => {
                                        handleFileChange(index, e.target.files?.[0] || null, 'photo');
                                        e.target.value = '';
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor={`photo-${index}`}
                                      className={cn(
                                        "relative flex flex-col items-center justify-center h-16 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                                        recommendedType === 'photo'
                                          ? "border-green-400 bg-green-50 hover:border-green-500"
                                          : "border-gray-300 hover:border-primary-400"
                                      )}
                                    >
                                      {recommendedType === 'photo' && (
                                        <span className="absolute top-1 right-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                          Рекомендуется
                                        </span>
                                      )}
                                      <FileImage className="w-5 h-5 text-gray-400 mb-1" />
                                      <span className="text-xs text-gray-600">Фото</span>
                                    </label>
                                  </div>
                                )}
                                
                                {allowVideo && (
                                  <div>
                                    <input
                                      type="file"
                                      id={`video-${index}`}
                                      accept=".mp4,.mov,.mkv"
                                      onChange={(e) => {
                                        handleFileChange(index, e.target.files?.[0] || null, 'video');
                                        e.target.value = '';
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor={`video-${index}`}
                                      className={cn(
                                        "relative flex flex-col items-center justify-center h-16 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                                        recommendedType === 'video'
                                          ? "border-green-400 bg-green-50 hover:border-green-500"
                                          : "border-gray-300 hover:border-primary-400"
                                      )}
                                    >
                                      {recommendedType === 'video' && (
                                        <span className="absolute top-1 right-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                          Рекомендуется
                                        </span>
                                      )}
                                      <Video className="w-5 h-5 text-gray-400 mb-1" />
                                      <span className="text-xs text-gray-600">Видео</span>
                                    </label>
                                  </div>
                                )}
                              </div>
                              
                              {/* Recommended proof description info box */}
                              {recommendedType && recommendedDescription && (
                                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-start space-x-2">
                                    <div className="flex-shrink-0 mt-0.5">
                                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div 
                                      className="text-xs text-blue-700 flex-1"
                                      dangerouslySetInnerHTML={{ __html: recommendedDescription }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            {item.type === 'photo' ? (
                              <FileImage className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <Video className="w-4 h-4 text-green-600 flex-shrink-0" />
                            )}
                            <span className="text-xs text-green-700 truncate">{item.file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* HP Preview */}
                    {item.activity && getQuantityValue(item) > 0 && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-700">HP за элемент:</span>
                        <span className="text-sm font-bold text-blue-600">{getItemHp(item).toFixed(1)} HP</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upload Progress */}
          {isSubmitting && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900">Отправка...</span>
                <span className="text-lg font-bold text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || totalHp === 0 || !challenge}
            className="w-full flex items-center justify-center space-x-2"
            size="lg"
          >
            {isSubmitting ? (
              <><Loading text="Отправка..." /></>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Отправить прогресс</span>
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

