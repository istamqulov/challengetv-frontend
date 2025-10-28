import React from 'react';
import { Calendar, Target, CheckCircle, Clock, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DailyProgressItem } from './DailyProgressItem';
import type { DailyProgress } from '@/types/api';

interface DailyProgressCardProps {
  dailyProgress: DailyProgress;
}

export const DailyProgressCard: React.FC<DailyProgressCardProps> = ({ dailyProgress }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  };

  const getCompletionStatus = () => {
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
    if (dailyProgress.completion_percentage >= 100) return 'bg-green-500';
    if (dailyProgress.completion_percentage >= 75) return 'bg-blue-500';
    if (dailyProgress.completion_percentage >= 50) return 'bg-yellow-500';
    if (dailyProgress.completion_percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card className="mb-6">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {formatDate(dailyProgress.date)}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {dailyProgress.is_spare_day && (
              <Badge variant="info">Запасной день</Badge>
            )}
            {getCompletionStatus()}
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {dailyProgress.total_hp}
            </div>
            <div className="text-sm text-gray-600">Заработано HP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">
              {dailyProgress.required_hp}
            </div>
            <div className="text-sm text-gray-600">Требуется HP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(dailyProgress.completion_percentage)}%
            </div>
            <div className="text-sm text-gray-600">Прогресс</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(dailyProgress.completion_percentage, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 text-center">
          {dailyProgress.total_hp} / {dailyProgress.required_hp} HP
        </div>
      </div>

      {/* Progress Items */}
      <div className="p-4">
        {dailyProgress.items.length > 0 ? (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-primary-600" />
              <h4 className="text-md font-semibold text-gray-900">
                Активности ({dailyProgress.items.length})
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dailyProgress.items.map((item) => (
                <DailyProgressItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-2">Нет активностей</p>
            <p className="text-sm">Активности за этот день не добавлены</p>
          </div>
        )}
      </div>
    </Card>
  );
};
