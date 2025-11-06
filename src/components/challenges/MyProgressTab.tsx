import React from 'react';
import { useParams } from 'react-router-dom';
import { ProgressSection } from './ProgressSection';
import { useAuthStore } from '@/stores/authStore';
import type { Challenge } from '@/types/api';

interface MyProgressTabProps {
  challenge?: Challenge;
}

export const MyProgressTab: React.FC<MyProgressTabProps> = ({ challenge }) => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();

  if (!slug) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Ошибка: не найден slug челленджа</p>
      </div>
    );
  }

  return (
    <ProgressSection
      challengeSlug={slug}
      challenge={challenge}
      userId={user?.id}
      username={user?.username}
    />
  );
};
