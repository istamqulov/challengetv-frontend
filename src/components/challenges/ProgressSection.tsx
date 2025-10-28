import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { CalendarTimeline } from './CalendarTimeline';
import { SingleDayProgress } from './SingleDayProgress';
import { apiClient } from '@/lib/api';
import type { DailyProgress, DailyProgressResponse, Challenge } from '@/types/api';

interface ProgressSectionProps {
  challengeSlug: string;
  participantId?: number; // If provided, shows progress for specific participant
  challenge?: Challenge; // Challenge data for timeline
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({ 
  challengeSlug, 
  participantId,
  challenge
}) => {
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentDateIndex, setCurrentDateIndex] = useState<number>(0);

  useEffect(() => {
    loadDailyProgress();
  }, [challengeSlug, participantId]);

  useEffect(() => {
    if (challenge) {
      // Set initial selected date to today or the most recent progress date
      const today = new Date().toISOString().split('T')[0];
      const challengeStart = new Date(challenge.start_date).toISOString().split('T')[0];
      const challengeEnd = new Date(challenge.end_date).toISOString().split('T')[0];
      
      let initialDate = today;
      if (today < challengeStart) initialDate = challengeStart;
      if (today > challengeEnd) initialDate = challengeEnd;
      
      setSelectedDate(initialDate);
      
      // Find the index of the selected date in the challenge timeline
      const challengeDates = generateChallengeDates(challenge.start_date, challenge.end_date);
      const dateIndex = challengeDates.findIndex(date => date === initialDate);
      setCurrentDateIndex(Math.max(0, dateIndex));
    }
  }, [challenge]);

  const generateChallengeDates = (startDate: string, endDate: string) => {
    const dates = [];
    const start = new Date(startDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Use the earlier of challenge end date or tomorrow
    const end = new Date(Math.min(new Date(endDate).getTime(), tomorrow.getTime()));
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
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
  const today = new Date().toISOString().split('T')[0];
  const challengeStart = new Date(challenge.start_date).toISOString().split('T')[0];
  
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

  return (
    <div>
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
      />
    </div>
  );
};
