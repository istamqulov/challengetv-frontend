import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { AchievementsGrid } from './AchievementsGrid';
import { apiClient } from '@/lib/api';
import type { ChallengeAchievement } from '@/types/api';

interface AchievementsTabProps {
  challengeSlug: string;
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({ challengeSlug }) => {
  const [achievements, setAchievements] = useState<ChallengeAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAchievements();
  }, [challengeSlug]);

  const loadAchievements = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getChallengeAchievements(challengeSlug);
      setAchievements(data);
    } catch (err: any) {
      console.error('Error loading achievements:', err);
      setError('Не удалось загрузить достижения');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <Loading text="Загрузка достижений..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Award className="w-8 h-8 mr-3 text-primary-600" />
        Достижения ({achievements.length})
      </h2>
      <AchievementsGrid achievements={achievements} />
    </Card>
  );
};

