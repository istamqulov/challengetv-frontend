import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Type
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { 
  Challenge, 
  DailyProgressUploadItem, 
  Activity as ActivityType,
  Participant 
} from '@/types/api';
import { getErrorMessage, isChallengeActive, isChallengeUpcoming, getDaysUntil } from '@/lib/utils';

export const SendProgressTab: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Calculate available dates (today and yesterday)
  const getAvailableDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
      { value: today.toISOString().split('T')[0], label: 'Сегодня' },
      { value: yesterday.toISOString().split('T')[0], label: 'Вчера' }
    ];
  };
  
  const [progressItems, setProgressItems] = useState<DailyProgressUploadItem[]>([
    {
      activity: 0,
      quantity: 0,
      type: 'text',
      description: '',
    }
  ]);

  const [totalHp, setTotalHp] = useState(0);
  const [requiredHp, setRequiredHp] = useState(0);
  const [overflowHp, setOverflowHp] = useState(0);
  const [overflowPercentage, setOverflowPercentage] = useState(0);

  useEffect(() => {
    if (slug) {
      loadChallengeData();
    }
  }, [slug]);

  useEffect(() => {
    calculateTotalHp();
  }, [progressItems, challenge]);

  const loadChallengeData = async () => {
    if (!slug) return;

    setIsLoading(true);
    setError(null);

    try {
      const [challengeData, participantsData] = await Promise.all([
        apiClient.getChallenge(slug),
        apiClient.getChallengeParticipants(slug).catch(() => [])
      ]);

      setChallenge(challengeData);
      
      // Find current user's participant data
      const currentUserParticipant = participantsData.find(p => p.user.id === user?.id);
      if (currentUserParticipant) {
        setParticipant(currentUserParticipant);
        setRequiredHp(currentUserParticipant.challenge_level.required_hp_per_day);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalHp = () => {
    if (!challenge) return;

    let total = 0;
    progressItems.forEach(item => {
      if (item.activity && item.quantity > 0) {
        const activity = challenge.allowed_activities?.find(
          allowedActivity => allowedActivity.activity.id === item.activity
        );
        if (activity) {
          const hpPerUnit = parseFloat(activity.activity.hp_per_unit);
          total += hpPerUnit * item.quantity;
        }
      }
    });
    
    setTotalHp(total);
    
    // Calculate overflow
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
      quantity: 0,
      type: 'text',
      description: '',
    }]);
  };

  const removeProgressItem = (index: number) => {
    if (progressItems.length > 1) {
      setProgressItems(progressItems.filter((_, i) => i !== index));
    }
  };

  const updateProgressItem = (index: number, field: keyof DailyProgressUploadItem, value: any) => {
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
      
      if (type === 'video' && fileExtension !== 'mp4') {
        setError(`Неподдерживаемый формат файла. Для видео разрешен: MP4`);
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
      file: null,
      type: 'text'
    };
    setProgressItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!participant) {
      setError('Участник не найден');
      return;
    }

    // Validate form
    const validItems = progressItems.filter(item => 
      item.activity && item.quantity > 0 && 
      (item.type === 'text' || (item.type !== 'text' && item.file))
    );

    if (validItems.length === 0) {
      setError('Добавьте хотя бы один элемент прогресса');
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

      setSuccess(`${response.message} Создано элементов: ${response.items_created}, HP: ${response.total_hp}/${response.required_hp}`);
      setProgressItems([{
        activity: 0,
        quantity: 0,
        type: 'text',
        description: '',
      }]);
      setUploadProgress(0);
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

  const getItemHp = (item: DailyProgressUploadItem): number => {
    if (!item.activity || !item.quantity) return 0;
    return getActivityHpPerUnit(item.activity) * item.quantity;
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
          <p className="text-red-600">{error}</p>
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
              <div className="text-sm text-gray-600">Текущий HP</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {requiredHp}
              </div>
              <div className="text-sm text-gray-600">Требуется HP</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${
                Math.max(0, requiredHp - totalHp) <= 0 ? 'text-green-600' : 'text-orange-600'
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

          <div className="space-y-6">
            {progressItems.map((item, index) => (
              <div key={index} className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Элемент прогресса</h4>
                  </div>
                  {progressItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProgressItem(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Activity Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Выберите активность
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {challenge?.allowed_activities?.map((allowedActivity) => (
                      <div
                        key={allowedActivity.id}
                        onClick={() => updateProgressItem(index, 'activity', allowedActivity.activity.id)}
                        className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg group ${
                          item.activity === allowedActivity.activity.id
                            ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg scale-105'
                            : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                        }`}
                      >
                        {/* Selection indicator */}
                        {item.activity === allowedActivity.activity.id && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-sm mb-1">
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
                                className="w-8 h-8 object-contain"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-white/60 rounded-lg p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">
                              HP за единицу:
                            </span>
                            <span className="text-lg font-bold text-primary-600">
                              {allowedActivity.activity.hp_per_unit}
                            </span>
                          </div>
                        </div>
                        
                        {/* Hover effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Количество
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.quantity}
                      onChange={(e) => updateProgressItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Введите количество"
                      required
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Upload className="w-4 h-4 inline mr-2" />
                      Загрузить файл
                    </label>
                    
                    {!item.file || item.file === null ? (
                      <div className="space-y-3">
                        {/* Text Option */}
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => updateProgressItem(index, 'type', 'text')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors duration-200 ${
                              item.type === 'text'
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <Type className="w-5 h-5" />
                            <span className="font-medium">Только текст</span>
                          </button>
                        </div>
                        
                        {/* File Upload Options */}
                        <div className="flex space-x-3">
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
                              className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors duration-200"
                            >
                              <FileImage className="w-8 h-8 text-gray-400 mb-2" />
                              <span className="text-sm font-medium text-gray-600">Фото</span>
                              <span className="text-xs text-gray-500">JPG, PNG</span>
                            </label>
                          </div>
                          
                          {/* Video Upload Button */}
                          <div className="flex-1">
                          <input
                            type="file"
                            id={`video-${index}`}
                            accept="video/mp4"
                            onChange={(e) => {
                              handleFileChange(index, e.target.files?.[0] || null, 'video');
                              // Reset input value to allow selecting the same file again
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                            <label
                              htmlFor={`video-${index}`}
                              className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors duration-200"
                            >
                              <Video className="w-8 h-8 text-gray-400 mb-2" />
                              <span className="text-sm font-medium text-gray-600">Видео</span>
                              <span className="text-xs text-gray-500">MP4</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
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
                {item.activity && item.quantity > 0 && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">
                          HP за этот элемент:
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-blue-600">
                          {getItemHp(item).toFixed(1)}
                        </span>
                        <span className="text-sm text-blue-500 ml-1">HP</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      {item.quantity} × {getActivityHpPerUnit(item.activity)} HP = {getItemHp(item).toFixed(1)} HP
                    </div>
                  </div>
                )}
              </div>
            ))}
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
