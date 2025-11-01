import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Table } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { apiClient } from '@/lib/api';
import type { Participant, Challenge } from '@/types/api';
import { getErrorMessage, formatDate, formatLocalDate, parseISO } from '@/lib/utils';

interface ProgressTableTabProps {
  challenge?: Challenge;
}

export const ProgressTableTab: React.FC<ProgressTableTabProps> = ({ challenge }) => {
  const { slug } = useParams<{ slug: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadParticipants();
    }
  }, [slug]);

  const loadParticipants = async () => {
    if (!slug) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getChallengeParticipants(slug, 'progress');
      setParticipants(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Generate all dates for the challenge
  const generateChallengeDates = (): Array<{ date: string; dayNumber: number }> => {
    if (!challenge) return [];

    const dates: Array<{ date: string; dayNumber: number }> = [];
    const start = parseISO(challenge.start_date);
    const end = parseISO(challenge.end_date);
    let dayNumber = 1;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push({
        date: formatLocalDate(d),
        dayNumber: dayNumber++
      });
    }

    return dates;
  };

  // Get HP for a participant on a specific date
  const getHpForDate = (participant: Participant, date: string): { hp: number; requiredHp: number } | null => {
    const progress = participant.daily_progress?.find(p => p.date === date);
    if (!progress) {
      return null; // Day hasn't arrived yet or no progress
    }
    return {
      hp: progress.total_hp || 0,
      requiredHp: progress.required_hp || participant.challenge_level.required_hp_per_day
    };
  };

  // Check if date has passed
  const isDatePassed = (date: string): boolean => {
    const dateObj = parseISO(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj <= today;
  };

  // Get cell color class based on HP
  const getCellClass = (hp: number, requiredHp: number): string => {
    if (hp === 0) {
      return 'bg-red-50 text-red-700';
    }
    if (hp < requiredHp) {
      return 'bg-yellow-50 text-yellow-700';
    }
    return 'bg-green-50 text-green-700';
  };

  const challengeDates = generateChallengeDates();
  const today = formatLocalDate(new Date());

  if (isLoading) {
    return (
      <Card>
        <Loading text="Загрузка таблицы прогресса..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-red-600 mb-2">Ошибка загрузки</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-600">Челлендж не найден</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Table className="w-8 h-8 mr-3 text-primary-600" />
        Таблица прогресса
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 z-10 bg-gray-100">
                День / Дата
              </th>
              {participants.map((participant) => (
                <th
                  key={participant.id}
                  className="border border-gray-300 bg-gray-100 px-4 py-3 text-center font-semibold text-gray-700 min-w-[150px]"
                >
                  <div className="flex flex-col items-center">
                    <span className="font-bold">
                      {participant.user.first_name && participant.user.last_name
                        ? `${participant.user.first_name} ${participant.user.last_name}`
                        : participant.user.username}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Норма: {participant.challenge_level.required_hp_per_day} HP
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {challengeDates.map(({ date, dayNumber }) => {
              const isPassed = isDatePassed(date);
              const isToday = date === today;

              return (
                <tr key={date} className={isToday ? 'bg-blue-50' : ''}>
                  <td className={`border border-gray-300 px-4 py-2 font-semibold sticky left-0 z-10 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                    <div className="flex flex-col">
                      <span className="font-bold">День {dayNumber}</span>
                      <span className="text-xs text-gray-500">{formatDate(date, 'dd.MM.yyyy')}</span>
                      {isToday && <span className="text-xs text-blue-600 font-medium">Сегодня</span>}
                    </div>
                  </td>
                  {participants.map((participant) => {
                    const progress = getHpForDate(participant, date);
                    
                    if (!isPassed) {
                      return (
                        <td
                          key={participant.id}
                          className="border border-gray-300 px-4 py-2 text-center bg-gray-50 text-gray-400"
                        >
                          -
                        </td>
                      );
                    }

                    if (!progress) {
                      return (
                        <td
                          key={participant.id}
                          className="border border-gray-300 px-4 py-2 text-center bg-red-50 text-red-700"
                        >
                          0
                        </td>
                      );
                    }

                    const { hp, requiredHp } = progress;
                    const cellClass = getCellClass(hp, requiredHp);

                    return (
                      <td
                        key={participant.id}
                        className={`border border-gray-300 px-4 py-2 text-center font-medium ${cellClass}`}
                      >
                        {hp.toFixed(0)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Легенда:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-50 border border-red-200 rounded"></div>
            <span className="text-sm text-gray-700">0 HP (не выполнено)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-yellow-50 border border-yellow-200 rounded"></div>
            <span className="text-sm text-gray-700">Меньше нормы</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-50 border border-green-200 rounded"></div>
            <span className="text-sm text-gray-700">Норма выполнена</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

