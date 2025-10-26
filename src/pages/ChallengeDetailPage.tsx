import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Clock,
  Award,
  Trophy,
  Target,
  ChevronRight,
  Share2,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { ParticipantsTab } from '@/components/challenges/ParticipantsTab';
import { MyProgressTab } from '@/components/challenges/MyProgressTab';
import { SendProgressTab } from '@/components/challenges/SendProgressTab';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import type { Challenge, Participant } from '@/types/api';
import {
  formatDate,
  getDaysUntil,
  getChallengeStatusText,
  getImageUrl,
  isChallengeActive,
  isChallengeUpcoming,
  getErrorMessage,
} from '@/lib/utils';

export const ChallengeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'participants' | 'progress' | 'send'>('info');

  useEffect(() => {
    if (slug) {
      loadChallengeData();
    }
  }, [slug]);

  // Reset active tab if user is not authenticated and tries to access auth-only tabs
  useEffect(() => {
    if (!isAuthenticated && (activeTab === 'progress' || activeTab === 'send')) {
      setActiveTab('info');
    }
  }, [isAuthenticated, activeTab]);

  const loadChallengeData = async () => {
    if (!slug) return;

    setIsLoading(true);
    setParticipantsLoading(true);
    setError(null);

    try {
      const [challengeData, participantsData] = await Promise.all([
        apiClient.getChallenge(slug),
        apiClient.getChallengeParticipants(slug).catch((err: any) => {
          console.error('Error loading participants:', err);
          return [];
        }),
      ]);

      setChallenge(challengeData);
      setParticipants(participantsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setParticipantsLoading(false);
    }
  };


  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: challenge?.title,
        text: challenge?.short_description,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Ссылка скопирована в буфер обмена!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Loading text="Загрузка челленджа..." />
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ошибка загрузки
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Челлендж не найден'}
            </p>
            <Button onClick={() => navigate('/challenges')}>
              Вернуться к списку
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const isActive = isChallengeActive(challenge.start_date, challenge.end_date);
  const isUpcoming = isChallengeUpcoming(challenge.start_date);
  const daysUntilStart = getDaysUntil(challenge.start_date);

  const getStatusBadge = () => {
    if (challenge.status === 'active' && isActive) {
      return <Badge variant="success">Активен</Badge>;
    }
    if (challenge.status === 'active' && isUpcoming) {
      return <Badge variant="info">Начнется через {daysUntilStart} дн.</Badge>;
    }
    if (challenge.status === 'completed') {
      return <Badge variant="default">Завершен</Badge>;
    }
    if (challenge.status === 'cancelled') {
      return <Badge variant="danger">Отменен</Badge>;
    }
    return <Badge variant="warning">{getChallengeStatusText(challenge.status)}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-primary-600">Главная</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/challenges" className="hover:text-primary-600">Челленджи</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{challenge.title}</span>
        </div>

        {/* Hero Section */}
        <Card padding={false} className="mb-8 overflow-hidden">
          {/* Cover Image */}
          <div className="relative h-96 bg-primary-600">
            {challenge.image ? (
              <img
                src={getImageUrl(challenge.image)}
                alt={challenge.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Trophy className="w-32 h-32 text-white opacity-50" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40" />

            {/* Badges */}
            <div className="absolute top-4 right-4 flex flex-wrap gap-2">
              {getStatusBadge()}
              {challenge.is_public ? (
                <Badge variant="info">Публичный</Badge>
              ) : (
                <Badge variant="default">Приватный</Badge>
              )}
              {challenge.is_full && <Badge variant="danger">Набор закрыт</Badge>}
            </div>

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {challenge.title}
              </h1>
              {challenge.short_description && (
                <p className="text-lg text-gray-200">
                  {challenge.short_description}
                </p>
              )}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm text-gray-600">Создатель</p>
                  <p className="font-medium">{challenge.created_by.username}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {challenge.joined && (
                  <Badge variant="info" className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>Вы участвуете</span>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Поделиться
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 lg:gap-8">
              {[
                { id: 'info', label: 'Информация', icon: Trophy, shortLabel: 'Инфо' },
                { id: 'participants', label: 'Участники', icon: Users, shortLabel: 'Участники' },
                ...(isAuthenticated ? [
                  { id: 'progress', label: 'Мой прогресс', icon: Target, shortLabel: 'Прогресс' },
                  { id: 'send', label: 'Отправить прогресс', icon: Activity, shortLabel: 'Отправить' },
                ] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center justify-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm
                    sm:flex-none min-w-0
                    ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'info' && (
            <>
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Даты</p>
                      <p className="font-semibold">
                        {formatDate(challenge.start_date, 'dd MMM')} - {formatDate(challenge.end_date, 'dd MMM')}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-secondary-100 rounded-lg">
                      <Clock className="w-6 h-6 text-secondary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Длительность</p>
                      <p className="font-semibold">{challenge.duration_days} дней</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Участники</p>
                      <p className="font-semibold">
                        {challenge.participants_count} / {challenge.max_participants || '∞'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <Target className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Минимум участников</p>
                      <p className="font-semibold">{challenge.min_participants}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Description */}
              <Card className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Описание</h2>
                <div
                  className="prose max-w-none text-gray-700 mb-6"
                  dangerouslySetInnerHTML={{ __html: challenge.description.replace(/\n/g, '<br/>') }}
                />

                {challenge.prize_description && (
                  <>
                    <h3 className="text-xl font-bold mb-3 flex items-center">
                      <Award className="w-6 h-6 mr-2 text-yellow-500" />
                      Призы
                    </h3>
                    <div
                      className="prose max-w-none text-gray-700 mb-6"
                      dangerouslySetInnerHTML={{ __html: challenge.prize_description.replace(/\n/g, '<br/>') }}
                    />
                  </>
                )}
              </Card>

              {/* Levels */}
              {challenge.levels && challenge.levels.length > 0 && (
                <Card className="mb-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Target className="w-8 h-8 mr-3 text-primary-600" />
                    Уровни сложности ({challenge.levels.length})
                  </h2>
                  <div className="space-y-4">
                    {challenge.levels.map((level) => (
                      <div
                        key={level.id}
                        className="p-4 bg-gray-50 rounded-lg border-l-2 border-primary-600"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl font-bold text-primary-600">
                              {level.level_number}
                            </span>
                            <div>
                              <h3 className="text-lg font-bold">{level.name}</h3>
                              {level.description && (
                                <div 
                                  className="text-sm text-gray-600 prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: level.description.replace(/\n/g, '<br/>') }}
                                />
                              )}
                            </div>
                          </div>
                          <Badge variant="info">
                            {level.required_hp_per_day} HP/день
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Allowed Activities */}
              {challenge.allowed_activities && challenge.allowed_activities.length > 0 && (
                <Card>
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Activity className="w-8 h-8 mr-3 text-primary-600" />
                    Разрешенные активности ({challenge.allowed_activities.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {challenge.allowed_activities.map((allowedActivity) => (
                      <div
                        key={allowedActivity.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          allowedActivity.is_active
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {allowedActivity.activity.name}
                          </h3>

                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium text-primary-600">
                            {allowedActivity.activity.hp_per_unit} HP за {allowedActivity.activity.unit_name}
                          </p>
                          {allowedActivity.activity.icon && (
                            <div className="mt-2">
                              <img 
                                src={allowedActivity.activity.icon} 
                                alt={allowedActivity.activity.name}
                                className="w-8 h-8"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {activeTab === 'participants' && (
            <ParticipantsTab
              participants={participants}
              participantsLoading={participantsLoading}
              challengeLevels={challenge?.levels || []}
            />
          )}

          {activeTab === 'progress' && isAuthenticated && <MyProgressTab />}

          {activeTab === 'send' && isAuthenticated && <SendProgressTab />}
        </div>
      </div>
    </div>
  );
};
