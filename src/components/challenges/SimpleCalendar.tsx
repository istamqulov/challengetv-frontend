import React from 'react';
import { formatLocalDate } from '@/lib/utils';

interface SimpleCalendarProps {
  days?: number;
  onDateSelect?: (date: string) => void;
  selectedDate?: string | null;
}

export const SimpleCalendar: React.FC<SimpleCalendarProps> = ({ 
  days = 10, 
  onDateSelect,
  selectedDate 
}) => {
  // Generate last N days
  const generateLastDays = (count: number) => {
    const dates = [];
    const today = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(formatLocalDate(date));
    }
    
    return dates;
  };

  const lastDays = generateLastDays(days);

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('ru-RU', { month: 'short' }),
      weekday: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
    };
  };

  const todayDate = formatLocalDate(new Date());

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Последние {days} дней</h3>
      <div className="overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {lastDays.map((dateString) => {
            const dateInfo = formatDateForDisplay(dateString);
            const isToday = dateString === todayDate;
            
            const isSelected = selectedDate === dateString;
            const isClickable = !!onDateSelect;
            
            return (
              <div
                key={dateString}
                onClick={() => isClickable && onDateSelect?.(dateString)}
                className={`
                  flex flex-col items-center p-3 rounded-lg border-2 min-w-[60px] transition-colors
                  ${isSelected
                    ? 'border-primary-600 bg-primary-100'
                    : isToday 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 bg-gray-50'
                  }
                  ${isClickable ? 'cursor-pointer hover:border-primary-400 hover:bg-primary-50' : ''}
                `}
              >
                <div className="text-xs font-medium mb-1 text-gray-600">
                  {dateInfo.weekday}
                </div>
                <div className="text-lg font-bold mb-1 text-gray-900">
                  {dateInfo.day}
                </div>
                <div className="text-xs text-gray-600">
                  {dateInfo.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


