import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, Flame, Trophy } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { CalendarTimeline } from './CalendarTimeline';
import { SingleDayProgress } from './SingleDayProgress';
import { apiClient } from '@/lib/api';
import { formatLocalDate, getTodayLocalDate, parseAndFormatLocalDate, getErrorMessage } from '@/lib/utils';
import type { DailyProgress, Challenge, ParticipantStats } from '@/types/api';

interface ProgressSectionProps {
  challengeSlug: string;
  participantId?: number; // If provided, shows progress for specific participant
  challenge?: Challenge; // Challenge data for timeline
  initialSelectedDate?: string;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({ 
  challengeSlug, 
  participantId,
  challenge,
  initialSelectedDate
}) => {
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentDateIndex, setCurrentDateIndex] = useState<number>(0);
  const [stats, setStats] = useState<ParticipantStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadDailyProgress();
    loadParticipantStats();
  }, [challengeSlug, participantId]);

  useEffect(() => {
    if (!challenge) return;

    const challengeDates = generateChallengeDates(challenge.start_date, challenge.end_date);
    if (challengeDates.length === 0) {
      return;
    }

    const today = getTodayLocalDate();
    const challengeStart = parseAndFormatLocalDate(challenge.start_date);
    const challengeEnd = parseAndFormatLocalDate(challenge.end_date);

    let initialDate = initialSelectedDate && challengeDates.includes(initialSelectedDate)
      ? initialSelectedDate
      : today;

    if (initialDate < challengeStart) initialDate = challengeStart;
    if (initialDate > challengeEnd) initialDate = challengeEnd;

    if (!challengeDates.includes(initialDate)) {
      initialDate = challengeDates[challengeDates.length - 1];
    }

    setSelectedDate(initialDate);
    const dateIndex = challengeDates.findIndex(date => date === initialDate);
    setCurrentDateIndex(Math.max(0, dateIndex));
  }, [challenge, initialSelectedDate]);

  useEffect(() => {
    setActionMessage(null);
  }, [selectedDate]);

  const generateChallengeDates = (startDate: string, endDate: string) => {
    const dates = [];
    // Parse dates in local timezone
    const startParts = startDate.split('-').map(Number);
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse end date in local timezone
    const endParts = endDate.split('-').map(Number);
    const endDateLocal = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    
    // Use the earlier of challenge end date or today (exclude tomorrow)
    const end = new Date(Math.min(endDateLocal.getTime(), today.getTime()));
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(formatLocalDate(d));
    }
    
    return dates;
  };

  const loadDailyProgress = async () => {
    if (!challengeSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getDailyProgress(challengeSlug, participantId);
      
      // Enrich progress items with activity information
      const enrichedProgress = response.results.map(progress => ({
        ...progress,
        items: progress.items.map(item => {
          // Find activity info from challenge allowed activities
          const activityInfo = challenge?.allowed_activities?.find(
            allowedActivity => allowedActivity.activity.id === item.activity
          );
          
          return {
            ...item,
            activity_name: activityInfo?.activity.name || `Активность ${item.activity}`,
            activity_unit: activityInfo?.activity.unit_name || 'единица'
          };
        })
      }));
      
      setDailyProgress(enrichedProgress);
    } catch (err: any) {
      console.error('Error loading daily progress:', err);
      setError(err.response?.data?.detail || 'Ошибка загрузки прогресса');
    } finally {
      setIsLoading(false);
    }
  };

  const loadParticipantStats = async () => {
    if (!challengeSlug) return;

    setIsStatsLoading(true);
    try {
      const data = await apiClient.getParticipantStats(challengeSlug, participantId);
      setStats(data);
    } catch (err: any) {
      console.error('Error loading participant stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    if (challenge) {
      const challengeDates = generateChallengeDates(challenge.start_date, challenge.end_date);
      const dateIndex = challengeDates.findIndex(d => d === date);
      setCurrentDateIndex(Math.max(0, dateIndex));
    }
  };

  const handlePrevious = () => {
    if (!challenge) return;
    const challengeDates = generateChallengeDates(challenge.start_date, challenge.end_date);
    const newIndex = Math.max(0, currentDateIndex - 1);
    setCurrentDateIndex(newIndex);
    setSelectedDate(challengeDates[newIndex]);
  };

  const handleNext = () => {
    if (!challenge) return;
    const challengeDates = generateChallengeDates(challenge.start_date, challenge.end_date);
    const newIndex = Math.min(challengeDates.length - 1, currentDateIndex + 1);
    setCurrentDateIndex(newIndex);
    setSelectedDate(challengeDates[newIndex]);
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!itemId) return;

    const confirmed = window.confirm('Удалить эту активность? Действие нельзя отменить.');
    if (!confirmed) {
      return;
    }

    setActionMessage(null);
    setDeletingItemId(itemId);

    try {
      await apiClient.deleteDailyProgressItem(itemId);
      await loadDailyProgress();
      setActionMessage({ type: 'success', text: 'Активность успешно удалена.' });
    } catch (error) {
      setActionMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setDeletingItemId(null);
    }
  };

  const getSelectedDayProgress = () => {
    return dailyProgress.find(p => p.date === selectedDate) || null;
  };

  const getChallengeDates = () => {
    if (!challenge) return [];
    return generateChallengeDates(challenge.start_date, challenge.end_date);
  };

  if (isLoading && dailyProgress.length === 0) {
    return (
      <Card className="p-8">
        <Loading text="Загрузка прогресса..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ошибка загрузки
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDailyProgress}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Данные челленджа не найдены
          </h3>
          <p className="text-gray-600">
            Не удалось загрузить информацию о челлендже для отображения календаря
          </p>
        </div>
      </Card>
    );
  }

  // Check if challenge hasn't started yet
  const today = getTodayLocalDate();
  const challengeStart = parseAndFormatLocalDate(challenge.start_date);
  
  if (today < challengeStart) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Челлендж еще не начался
          </h3>
          <p className="text-gray-600">
            Челлендж начнется {new Date(challenge.start_date).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </Card>
    );
  }

  const challengeDates = getChallengeDates();
  const canGoPrevious = currentDateIndex > 0;
  const canGoNext = currentDateIndex < challengeDates.length - 1;
  const isOwnProgress = participantId === undefined;

  return (
    <div>
      {/* Overall Stats */}
      <div className="mb-6">
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-primary-600" />
                Общий прогресс
              </h2>
              <p className="text-sm text-gray-600">Сводка по челленджу</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 w-full sm:w-auto">
              <div className="text-center">
                <div className="text-sm text-gray-600">Выполнено дней</div>
                <div className="text-lg font-semibold text-gray-900">
                  {isStatsLoading ? '—' : `${stats?.completed_days ?? 0}/${stats?.total_days ?? (challenge ? Math.max(1, Math.round((new Date(challenge.end_date).getTime() - new Date(challenge.start_date).getTime()) / (1000*60*60*24)) + 1) : 0)}`}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Средний HP/день</div>
                <div className="text-lg font-semibold text-gray-900">
                  {isStatsLoading ? '—' : (stats?.average_hp_per_day ? `${stats.average_hp_per_day}/день` : '—')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Прогресс</div>
                <div className="text-lg font-semibold text-gray-900">
                  {isStatsLoading ? '—' : `${stats?.completion_rate ?? '0.00'}%`}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Провалов / Запас</div>
                <div className="text-lg font-semibold text-gray-900 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-500 mr-1" />
                  {isStatsLoading ? '—' : `${stats?.failed_days ?? 0} / ${stats?.spare_days_used ?? 0}`}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">HP (итог/норма)</div>
                <div className="text-lg font-semibold text-gray-900">
                  {isStatsLoading ? '—' : `${stats?.total_hp ?? 0}/${stats?.total_hp_required ?? 0}`}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Прогресс выполнения</span>
              <span>
                {isStatsLoading ? '—' : `${stats?.completion_rate ?? '0.00'}%`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                style={{ width: `${isStatsLoading ? 0 : Math.min(100, parseFloat(String(stats?.completion_rate || '0'))) || 0}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* HP Trend Chart */}
      <div className="mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-primary-600" />
              Тренд HP по дням
            </h3>
          </div>
          {isStatsLoading || !challenge ? (
            <div className="text-sm text-gray-500">Данных для графика пока нет</div>
          ) : (
            <div className="w-full" style={{ height: 260 }}>
              {(() => {
                const timelineDates = generateChallengeDates(challenge.start_date, challenge.end_date);
                const hpByDate: Record<string, number> = (stats?.hp_trend || []).reduce((acc, item) => {
                  acc[item.date] = item.total_hp;
                  return acc;
                }, {} as Record<string, number>);
                const chartData = timelineDates.map((date, idx) => ({
                  date,
                  day: idx + 1,
                  hp: hpByDate[date] ?? 0,
                }));
                const maxY = Math.max(100, ...chartData.map(d => d.hp));
                const CustomTooltip = ({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const item = payload[0];
                    const point = chartData[(label as number) - 1];
                    return (
                      <div className="bg-white border border-gray-200 rounded-md p-2 text-xs shadow">
                        <div className="font-medium text-gray-800">День {label}</div>
                        <div className="text-gray-600">{point?.date}</div>
                        <div className="text-primary-600 font-semibold">{item.value} HP</div>
                      </div>
                    );
                  }
                  return null;
                };
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                      <YAxis domain={[0, maxY]} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} width={36} />
                      <Tooltip content={<CustomTooltip />} formatter={(value: any) => [value, 'HP']} labelFormatter={(label: any) => label} />
                      <ReferenceLine y={0} stroke="#e5e7eb" />
                      <Line type="monotone" dataKey="hp" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          )}
        </Card>
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-primary-600" />
          {participantId ? 'Прогресс участника' : 'Мой прогресс'}
        </h2>
        <p className="text-gray-600">
          {participantId 
            ? 'История активности участника в челлендже'
            : 'Ваша история активности в челлендже'
          }
        </p>
      </div>

      {/* Calendar Timeline */}
      <CalendarTimeline
        dailyProgress={dailyProgress}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        challengeStartDate={challenge.start_date}
        challengeEndDate={challenge.end_date}
      />

      {/* Single Day Progress */}
      <SingleDayProgress
        dailyProgress={getSelectedDayProgress()}
        selectedDate={selectedDate}
        isLoading={isLoading}
        onDeleteItem={isOwnProgress ? handleDeleteItem : undefined}
        isOwnProgress={isOwnProgress}
        deletingItemId={deletingItemId}
        actionMessage={isOwnProgress ? actionMessage : null}
      />
    </div>
  );
};
