import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Loading } from '@/components/ui/Loading';
import { AchievementsGrid } from './AchievementsGrid';
import { apiClient } from '@/lib/api';
import type { ChallengeAchievement } from '@/types/api';

interface UserAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeSlug: string;
  userId: number;
  username?: string;
}

export const UserAchievementsModal: React.FC<UserAchievementsModalProps> = ({
  isOpen,
  onClose,
  challengeSlug,
  userId,
  username,
}) => {
  const [achievements, setAchievements] = useState<ChallengeAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAchievements();
    }
  }, [isOpen, challengeSlug, userId]);

  const loadAchievements = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getUserChallengeAchievements(challengeSlug, userId);
      setAchievements(data);
    } catch (err: any) {
      console.error('Error loading user achievements:', err);
      setError('Не удалось загрузить достижения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={username ? `Достижения ${username}` : 'Достижения'}
      size="xl"
    >
      <div className="max-h-[70vh] overflow-y-auto">
        {isLoading ? (
          <div className="py-8">
            <Loading text="Загрузка достижений..." />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <AchievementsGrid achievements={achievements} />
        )}
      </div>
    </Modal>
  );
};

