import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { DailyProgress } from '@/types/api';

interface CalendarTimelineProps {
  dailyProgress: DailyProgress[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  challengeStartDate: string;
  challengeEndDate: string;
}

export const CalendarTimeline: React.FC<CalendarTimelineProps> = ({
  dailyProgress,
  selectedDate,
  onDateSelect,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  challengeStartDate,
  challengeEndDate,
}) => {
  // Generate all dates between challenge start and tomorrow
  const generateChallengeDates = () => {
    const dates = [];
    const start = new Date(challengeStartDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Use the earlier of challenge end date or tomorrow
    const end = new Date(Math.min(new Date(challengeEndDate).getTime(), tomorrow.getTime()));
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const challengeDates = generateChallengeDates();
  const progressMap = new Map(dailyProgress.map(p => [p.date, p]));

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return {
        day: '??',
        month: '???',
        weekday: '???',
      };
    }
    
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('ru-RU', { month: 'short' }),
      weekday: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
    };
  };

  const getDateStatus = (dateString: string) => {
    const progress = progressMap.get(dateString);
    if (!progress) return 'no-data';
    
    if (progress.is_completed) return 'completed';
    if (progress.completion_percentage > 0) return 'partial';
    return 'started';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500 text-white';
      case 'partial':
        return 'bg-yellow-500 border-yellow-500 text-white';
      case 'started':
        return 'bg-blue-500 border-blue-500 text-white';
      default:
        return 'bg-gray-200 border-gray-300 text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" className="text-xs">✓</Badge>;
      case 'partial':
        return <Badge variant="warning" className="text-xs">~</Badge>;
      case 'started':
        return <Badge variant="info" className="text-xs">•</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      {/* Navigation Controls */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Назад</span>
        </Button>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedDate ? (
              <>
                {formatDateForDisplay(selectedDate).weekday}, {formatDateForDisplay(selectedDate).day} {formatDateForDisplay(selectedDate).month}
              </>
            ) : (
              'Выберите дату'
            )}
          </h3>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={!canGoNext}
          className="flex items-center space-x-1"
        >
          <span>Вперед</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Timeline */}
      <div className="overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {challengeDates.map((dateString) => {
            const status = getDateStatus(dateString);
            const isSelected = dateString === selectedDate;
            const dateInfo = formatDateForDisplay(dateString);
            
            return (
              <button
                key={dateString}
                onClick={() => onDateSelect(dateString)}
                className={`
                  flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 min-w-[60px]
                  ${isSelected 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                  ${getStatusColor(status)}
                `}
              >
                <div className="text-xs font-medium mb-1">
                  {dateInfo.weekday}
                </div>
                <div className="text-lg font-bold mb-1">
                  {dateInfo.day}
                </div>
                <div className="text-xs">
                  {dateInfo.month}
                </div>
                {getStatusBadge(status)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Завершен</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Частично</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Начат</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
          <span>Нет данных</span>
        </div>
      </div>
    </div>
  );
};
