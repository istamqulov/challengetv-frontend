import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage, formatDate } from '@/lib/utils';
import type { Challenge, Participant, ParticipantStats, DailyProgress } from '@/types/api';

export const CertificatePage: React.FC = () => {
  const { slug, participantId } = useParams<{ slug: string; participantId: string }>();
  const navigate = useNavigate();
  const { tokens, isAuthenticated, isInitialized, initializeAuth } = useAuthStore();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [stats, setStats] = useState<ParticipantStats | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth if not already initialized
  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized, initializeAuth]);

  // Ensure auth token is set before making requests
  useEffect(() => {
    if (tokens?.access) {
      apiClient.setAuthToken(tokens.access);
    }
  }, [tokens?.access]);

  useEffect(() => {
    // Wait for auth initialization before loading data
    if (slug && participantId && isInitialized) {
      loadData();
    }
  }, [slug, participantId, tokens?.access, isInitialized]);

  const loadData = async () => {
    if (!slug || !participantId) return;

    // Ensure auth token is set before making requests
    if (tokens?.access) {
      apiClient.setAuthToken(tokens.access);
    }

    setIsLoading(true);
    setError(null);

    try {
      const [challengeData, participantsData, statsData, progressData] = await Promise.all([
        apiClient.getChallenge(slug),
        apiClient.getChallengeParticipants(slug).catch(() => []),
        apiClient.getParticipantStats(slug, parseInt(participantId, 10)),
        apiClient.getDailyProgress(slug, parseInt(participantId, 10)),
      ]);

      setChallenge(challengeData);
      
      const foundParticipant = participantsData.find(
        p => p.id === parseInt(participantId, 10)
      );

      if (foundParticipant) {
        setParticipant(foundParticipant);
      } else {
        setError('Участник не найден');
      }

      setStats(statsData);
      
      // Enrich progress items with activity information
      const enrichedProgress = progressData.results.map(progress => ({
        ...progress,
        items: progress.items.map(item => {
          const activityInfo = challengeData?.allowed_activities?.find(
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
      // Handle authentication errors
      if (err?.response?.status === 401) {
        setError('Требуется авторизация для просмотра сертификата');
        // Optionally redirect to login
        // navigate('/login');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (slug) {
      navigate(`/challenges/${slug}/participants`);
    } else {
      navigate('/challenges');
    }
  };

  // Calculate activities statistics
  const getActivitiesStats = () => {
    const activitiesMap: Record<number, {
      name: string;
      unit: string;
      totalQuantity: number;
      itemsCount: number;
    }> = {};

    dailyProgress.forEach(progress => {
      progress.items.forEach(item => {
        if (!activitiesMap[item.activity]) {
          const activityInfo = challenge?.allowed_activities?.find(
            allowedActivity => allowedActivity.activity.id === item.activity
          );
          activitiesMap[item.activity] = {
            name: activityInfo?.activity.name || `Активность ${item.activity}`,
            unit: activityInfo?.activity.unit_name || 'единица',
            totalQuantity: 0,
            itemsCount: 0,
          };
        }
        activitiesMap[item.activity].totalQuantity += item.quantity;
        activitiesMap[item.activity].itemsCount += 1;
      });
    });

    return Object.values(activitiesMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
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

  if (error || !participant || !challenge || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-red-600 mb-2">Ошибка загрузки</h3>
            <p className="text-gray-600 mb-4">{error || 'Данные не найдены'}</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Check if participant completed all challenge days (typically 50 days)
  const isCompleted = stats.completed_days >= challenge.duration_days;
  const activitiesStats = getActivitiesStats();
  const participantName = participant.user.first_name && participant.user.last_name
    ? `${participant.user.first_name} ${participant.user.last_name}`
    : participant.user.username;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Print controls - hidden when printing */}
      <div className="mb-6 print:hidden">
        <Button
          onClick={handleBack}
          variant="ghost"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Сертификат о выполнении
          </h1>
          <Button
            onClick={handlePrint}
            variant="primary"
            className="flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Печать</span>
          </Button>
        </div>
      </div>

      {/* Certificate Pages */}
      <div className="certificate-container">
        {/* Page 1 */}
        <div className="certificate-page">
          <div className="certificate-content">
            <div className="text-center mb-8">
              <h1 className="certificate-title">Сертификат</h1>
            </div>

            <div className="text-center mb-12">
              <h2 className="certificate-subtitle">
                {isCompleted
                  ? 'об успешном выполнении челленджа'
                  : 'об участии в челлендже'}
              </h2>
            </div>

            <div className="certificate-text mb-8">
              <p className="mb-4">
                Настоящим подтверждается, что
              </p>
              <p className="certificate-name mb-4">
                {participantName}
              </p>
              <p className="mb-4">
                {isCompleted
                  ? `успешно выполнил(а) челлендж "${challenge.title}"`
                  : `принял(а) участие в челлендже "${challenge.title}"`}
              </p>
              <p className="mb-4">
                Период проведения: с {formatDate(challenge.start_date, 'dd MMMM yyyy')} по {formatDate(challenge.end_date, 'dd MMMM yyyy')}
              </p>
              {isCompleted && (
                <p className="mb-4">
                  Выполнено дней: {stats.completed_days} из {challenge.duration_days}
                </p>
              )}
            </div>

            <div className="certificate-footer">
              <div className="certificate-seal">
                <div className="seal-placeholder"></div>
                <p className="seal-text">ChallengeTV</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 */}
        <div className="certificate-page">
          <div className="certificate-content">
            <div className="text-center mb-8">
              <h1 className="certificate-title">Статистика</h1>
            </div>

            <div className="certificate-stats mb-12">
              <div className="stat-item">
                <div className="stat-label">Общее количество полученных XP</div>
                <div className="stat-value">{stats.total_hp}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Общее количество выполненных дней</div>
                <div className="stat-value">{stats.completed_days}</div>
              </div>
            </div>

            <div className="certificate-activities">
              <h3 className="activities-title">Активности</h3>
              <div className="activities-list">
                {activitiesStats.length > 0 ? (
                  activitiesStats.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-name">{activity.name}</div>
                      <div className="activity-quantity">
                        {activity.totalQuantity} {activity.unit}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">Нет данных об активностях</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .print\\:hidden {
            display: none !important;
          }
        }

        .certificate-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        @media print {
          .certificate-container {
            gap: 0;
          }
        }

        .certificate-page {
          width: 100%;
          min-height: 297mm;
          background: white;
          padding: 40mm 30mm;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          page-break-after: always;
          page-break-inside: avoid;
        }

        @media print {
          .certificate-page {
            width: 297mm;
            height: 210mm;
            padding: 30mm 25mm;
            box-shadow: none;
            margin: 0;
            page-break-after: always;
          }

          @page {
            size: A4 landscape;
            margin: 0;
          }
        }

        .certificate-content {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .certificate-title {
          font-size: 4rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 1rem;
          letter-spacing: 0.1em;
        }

        @media print {
          .certificate-title {
            font-size: 3.5rem;
          }
        }

        .certificate-subtitle {
          font-size: 1.8rem;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 2rem;
        }

        @media print {
          .certificate-subtitle {
            font-size: 1.5rem;
          }
        }

        .certificate-text {
          font-size: 1.2rem;
          line-height: 1.8;
          color: #374151;
          text-align: center;
        }

        @media print {
          .certificate-text {
            font-size: 1.1rem;
          }
        }

        .certificate-name {
          font-size: 1.8rem;
          font-weight: bold;
          color: #1f2937;
          margin: 1rem 0;
        }

        @media print {
          .certificate-name {
            font-size: 1.6rem;
          }
        }

        .certificate-footer {
          margin-top: auto;
          display: flex;
          justify-content: center;
          align-items: flex-end;
        }

        .certificate-seal {
          text-align: center;
        }

        .seal-placeholder {
          width: 120px;
          height: 120px;
          border: 3px solid #1f2937;
          border-radius: 50%;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media print {
          .seal-placeholder {
            width: 100px;
            height: 100px;
          }
        }

        .seal-text {
          font-size: 1.2rem;
          font-weight: bold;
          color: #1f2937;
        }

        @media print {
          .seal-text {
            font-size: 1rem;
          }
        }

        .certificate-stats {
          display: flex;
          flex-direction: column;
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .stat-item {
          text-align: center;
        }

        .stat-label {
          font-size: 1.3rem;
          color: #6b7280;
          margin-bottom: 1rem;
        }

        @media print {
          .stat-label {
            font-size: 1.1rem;
          }
        }

        .stat-value {
          font-size: 3rem;
          font-weight: bold;
          color: #1f2937;
        }

        @media print {
          .stat-value {
            font-size: 2.5rem;
          }
        }

        .certificate-activities {
          margin-top: 2rem;
        }

        .activities-title {
          font-size: 1.8rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 2rem;
          text-align: center;
        }

        @media print {
          .activities-title {
            font-size: 1.5rem;
          }
        }

        .activities-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #6366f1;
        }

        @media print {
          .activity-item {
            padding: 0.8rem;
          }
        }

        .activity-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
        }

        @media print {
          .activity-name {
            font-size: 1rem;
          }
        }

        .activity-quantity {
          font-size: 1.1rem;
          color: #4b5563;
        }

        @media print {
          .activity-quantity {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};



