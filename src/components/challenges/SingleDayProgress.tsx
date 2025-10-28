import React from 'react';
import { Calendar, Target, CheckCircle, Clock, Zap, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DailyProgressItem } from './DailyProgressItem';
import type { DailyProgress } from '@/types/api';

interface SingleDayProgressProps {
  dailyProgress: DailyProgress | null;
  selectedDate: string;
  isLoading?: boolean;
}

export const SingleDayProgress: React.FC<SingleDayProgressProps> = ({ 
  dailyProgress, 
  selectedDate,
  isLoading = false 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Неверная дата';
    }
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  };

  const getCompletionStatus = () => {
    if (!dailyProgress) return null;
    
    if (dailyProgress.is_completed) {
      return (
        <Badge variant="success" className="flex items-center space-x-1">
          <CheckCircle className="w-4 h-4" />
          <span>Завершен</span>
        </Badge>
      );
    }
    
    if (dailyProgress.completion_percentage > 0) {
      return (
        <Badge variant="warning" className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>В процессе</span>
        </Badge>
      );
    }
    
    return (
      <Badge variant="default" className="flex items-center space-x-1">
        <Target className="w-4 h-4" />
        <span>Не начат</span>
      </Badge>
    );
  };

  const getProgressBarColor = () => {
    if (!dailyProgress) return 'bg-gray-200';
    if (dailyProgress.completion_percentage >= 100) return 'bg-green-500';
    if (dailyProgress.completion_percentage >= 75) return 'bg-blue-500';
    if (dailyProgress.completion_percentage >= 50) return 'bg-yellow-500';
    if (dailyProgress.completion_percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Загрузка...</span>
        </div>
      </Card>
    );
  }

  if (!dailyProgress) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {formatDate(selectedDate)}
          </h3>
          <p className="text-gray-600 mb-4">
            За этот день нет записей о прогрессе
          </p>
          <Badge variant="default">Нет данных</Badge>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {formatDate(dailyProgress.date)}
              </h2>
              {dailyProgress.is_spare_day && (
                <Badge variant="info" className="mt-1">Запасной день</Badge>
              )}
            </div>
          </div>
          {getCompletionStatus()}
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {dailyProgress.total_hp}
            </div>
            <div className="text-sm text-gray-600">Заработано HP</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-700 mb-1">
              {dailyProgress.required_hp}
            </div>
            <div className="text-sm text-gray-600">Требуется HP</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {Math.round(dailyProgress.completion_percentage)}%
            </div>
            <div className="text-sm text-gray-600">Прогресс</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Прогресс дня</span>
            <span>{dailyProgress.total_hp} / {dailyProgress.required_hp} HP</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(dailyProgress.completion_percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progress Items */}
      <div className="p-6">
        {dailyProgress.items.length > 0 ? (
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Zap className="w-6 h-6 text-primary-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Активности ({dailyProgress.items.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dailyProgress.items.map((item) => (
                <DailyProgressItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Нет активностей
            </h3>
            <p className="text-gray-600">
              За этот день не было добавлено ни одной активности
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
