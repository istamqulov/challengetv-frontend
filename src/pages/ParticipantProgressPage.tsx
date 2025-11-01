import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ProgressSection } from '@/components/challenges/ProgressSection';
import { apiClient } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import type { Challenge, Participant } from '@/types/api';

export const ParticipantProgressPage: React.FC = () => {
  const { slug, participantId } = useParams<{ slug: string; participantId: string }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug && participantId) {
      loadData();
    }
  }, [slug, participantId]);

  const loadData = async () => {
    if (!slug || !participantId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [challengeData, participantsData] = await Promise.all([
        apiClient.getChallenge(slug),
        apiClient.getChallengeParticipants(slug).catch(() => [])
      ]);

      setChallenge(challengeData);
      
      // Find the specific participant
      const foundParticipant = participantsData.find(
        p => p.id === parseInt(participantId, 10)
      );

      if (foundParticipant) {
        setParticipant(foundParticipant);
      } else {
        setError('Участник не найден');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (slug) {
      navigate(`/challenges/${slug}/participants`);
    } else {
      navigate('/challenges');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <Loading text="Загрузка данных..." />
        </Card>
      </div>
    );
  }

  if (error || !participant || !challenge) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-red-600 mb-2">Ошибка загрузки</h3>
            <p className="text-gray-600 mb-4">{error || 'Участник или челлендж не найден'}</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к участникам
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          onClick={handleBack}
          variant="ghost"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться к участникам
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          Прогресс {participant.user.username}
        </h1>
        <p className="text-gray-600 mt-2">
          {challenge.title}
        </p>
      </div>

      <ProgressSection
        challengeSlug={slug}
        participantId={participant.id}
        challenge={challenge}
      />
    </div>
  );
};

