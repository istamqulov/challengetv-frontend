import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Clock,
  Award,
  Trophy,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Share2,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Loading } from '@/components/ui/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { SubmitProofModal } from '@/components/challenges/SubmitProofModal';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Challenge, ChallengeLevel, LeaderboardEntry, Participant } from '@/types/api';
import {
  formatDate,
  formatDateTime,
  getDaysUntil,
  getChallengeStatusText,
  getParticipantStatusText,
  formatHP,
  getImageUrl,
  isChallengeActive,
  isChallengeUpcoming,
  getErrorMessage,
} from '@/lib/utils';

export const ChallengeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'info' | 'levels' | 'leaderboard' | 'participants'>('info');

  useEffect(() => {
    if (slug) {
      loadChallengeData();
    }
  }, [slug]);

  const loadChallengeData = async () => {
    if (!slug) return;

    setIsLoading(true);
    setError(null);

    try {
      const [challengeData, leaderboardData, participantsData] = await Promise.all([
        apiClient.getChallenge(slug),
        apiClient.getChallengeLeaderboard(slug, 10).catch(() => []),
        apiClient.getChallengeParticipants(slug).catch(() => []),
      ]);

      console.log('Challenge data:', challengeData);
      console.log('Leaderboard data:', leaderboardData);
      console.log('Participants data:', participantsData);

      setChallenge(challengeData);
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
      setParticipants(Array.isArray(participantsData) ? participantsData : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChallenge = async () => {
    if (!selectedLevelId || !slug) return;

    setActionLoading(true);
    try {
      await apiClient.joinChallenge(slug, { challenge_level_id: selectedLevelId });
      setShowJoinModal(false);
      await loadChallengeData();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveChallenge = async () => {
    if (!slug) return;

    if (!confirm('Вы уверены, что хотите покинуть этот челлендж?')) {
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.leaveChallenge(slug);
      await loadChallengeData();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChallenge = async () => {
    if (!slug) return;

    setActionLoading(true);
    try {
      await apiClient.deleteChallenge(slug);
      navigate('/challenges');
    } catch (err) {
      alert(getErrorMessage(err));
      setActionLoading(false);
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
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
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
  const isCreator = user?.id === challenge.created_by.id;
  const isParticipant = Array.isArray(participants)
    ? participants.some(p => p.user.id === user?.id && p.status === 'active')
    : false;
  const currentParticipant = Array.isArray(participants)
    ? participants.find(p => p.user.id === user?.id && p.status === 'active')
    : undefined;

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
          <div className="relative h-64 md:h-96 bg-gradient-to-r from-primary-400 to-secondary-400">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

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
                <Avatar
                  src={challenge.created_by.profile?.avatar}
                  firstName={challenge.created_by.first_name}
                  lastName={challenge.created_by.last_name}
                  username={challenge.created_by.username}
                  size="md"
                />
                <div>
                  <p className="text-sm text-gray-600">Создатель</p>
                  <p className="font-medium">{challenge.created_by.username}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Поделиться
                </Button>

                {isCreator && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/challenges/${slug}/edit`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Редактировать
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Удалить
                    </Button>
                  </>
                )}

                {isAuthenticated && !isCreator && (
                  <>
                    {isParticipant ? (
                      <>
                        {isActive && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowProofModal(true)}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Отправить отчет
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={handleLeaveChallenge}
                          isLoading={actionLoading}
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          Покинуть
                        </Button>
                      </>
                    ) : !challenge.is_full && (isActive || isUpcoming) ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowJoinModal(true)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Присоединиться
                      </Button>
                    ) : null}
                  </>
                )}

                {!isAuthenticated && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/login')}
                  >
                    Войти чтобы участвовать
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

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
                <p className="text-sm text-gray-600">Уровней</p>
                <p className="font-semibold">{challenge.levels.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'info', label: 'Информация', icon: AlertCircle },
                { id: 'levels', label: 'Уровни', icon: Target },
                { id: 'leaderboard', label: 'Лидерборд', icon: Trophy },
                { id: 'participants', label: 'Участники', icon: Users },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'info' && (
            <Card>
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

              <h3 className="text-xl font-bold mb-3">Разрешенные активности</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {challenge.allowed_activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {activity.activity.icon && (
                      <img src={activity.activity.icon} alt="" className="w-8 h-8" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{activity.activity.name}</p>
                      <p className="text-sm text-gray-600">
                        {activity.activity.hp_per_unit} HP за {activity.activity.unit_name}
                      </p>
                    </div>
                    {activity.is_active ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'levels' && (
            <div className="space-y-4">
              {challenge.levels.map((level, index) => (
                <Card key={level.id}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-3xl font-bold text-primary-600">
                          {level.level_number}
                        </span>
                        <div>
                          <h3 className="text-xl font-bold">{level.name}</h3>
                          <p className="text-sm text-gray-600">
                            {formatHP(level.required_hp_per_day)} в день
                          </p>
                        </div>
                      </div>
                      {level.description && (
                        <p className="text-gray-700 mb-4">{level.description}</p>
                      )}
                    </div>
                  </div>

                  <h4 className="font-semibold mb-3">Активности уровня:</h4>
                  <div className="space-y-2">
                    {level.activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {activity.activity.icon && (
                            <img src={activity.activity.icon} alt="" className="w-6 h-6" />
                          )}
                          <div>
                            <p className="font-medium">{activity.activity.name}</p>
                            <p className="text-sm text-gray-600">
                              {activity.daily_target} {activity.activity.unit_name} в день
                              {activity.is_required && (
                                <span className="ml-2 text-red-600">*обязательная</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary-600">
                            {formatHP(activity.target_hp)}
                          </p>
                          <p className="text-xs text-gray-500">цель</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <Card>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
                Топ участников
              </h2>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.user.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        index === 0
                          ? 'bg-yellow-50 border-2 border-yellow-300'
                          : index === 1
                          ? 'bg-gray-100 border-2 border-gray-300'
                          : index === 2
                          ? 'bg-orange-50 border-2 border-orange-300'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-gray-400 w-8 text-center">
                          {index < 3 ? (
                            <span className={
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-500' :
                              'text-orange-500'
                            }>
                              {index + 1}
                            </span>
                          ) : (
                            index + 1
                          )}
                        </div>
                        <Avatar
                          src={entry.user.profile?.avatar}
                          firstName={entry.user.first_name}
                          lastName={entry.user.last_name}
                          username={entry.user.username}
                          size="lg"
                        />
                        <div>
                          <p className="font-semibold text-lg">
                            {entry.user.username}
                          </p>
                          {(entry.user.first_name || entry.user.last_name) && (
                            <p className="text-sm text-gray-600">
                              {entry.user.first_name} {entry.user.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">
                          {formatHP(entry.total_hp)}
                        </p>
                        <p className="text-sm text-gray-600">всего заработано</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">
                  Пока нет участников в таблице лидеров
                </p>
              )}
            </Card>
          )}

          {activeTab === 'participants' && (
            <Card>
              <h2 className="text-2xl font-bold mb-6">
                Участники ({Array.isArray(participants) ? participants.length : 0})
              </h2>
              {Array.isArray(participants) && participants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={participant.user.profile?.avatar}
                          firstName={participant.user.first_name}
                          lastName={participant.user.last_name}
                          username={participant.user.username}
                        />
                        <div>
                          <p className="font-medium">{participant.user.username}</p>
                          <p className="text-sm text-gray-600">
                            {getParticipantStatusText(participant.status)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Присоединился: {formatDate(participant.joined_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary-600">
                          {formatHP(participant.total_hp_earned)}
                        </p>
                        <p className="text-xs text-gray-500">заработано</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">
                  Пока нет участников
                </p>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Join Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Выберите уровень сложности"
        size="lg"
      >
        <div className="space-y-4">
          {challenge.levels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevelId(level.id)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                selectedLevelId === level.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">{level.name}</h3>
                <Badge variant={selectedLevelId === level.id ? 'success' : 'default'}>
                  Уровень {level.level_number}
                </Badge>
              </div>
              {level.description && (
                <p className="text-sm text-gray-600 mb-2">{level.description}</p>
              )}
              <p className="text-sm font-medium text-primary-600">
                Требуется: {formatHP(level.required_hp_per_day)} в день
              </p>
            </button>
          ))}

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowJoinModal(false)}
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleJoinChallenge}
              isLoading={actionLoading}
              disabled={!selectedLevelId}
            >
              Присоединиться
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Удалить челлендж?"
      >
        <p className="text-gray-600 mb-6">
          Вы уверены, что хотите удалить этот челлендж? Это действие нельзя отменить.
          Все участники и их прогресс будут потеряны.
        </p>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowDeleteModal(false)}
          >
            Отмена
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleDeleteChallenge}
            isLoading={actionLoading}
          >
            Удалить
          </Button>
        </div>
      </Modal>

      {/* Submit Proof Modal */}
      {isParticipant && currentParticipant && (
        <SubmitProofModal
          isOpen={showProofModal}
          onClose={() => setShowProofModal(false)}
          challenge={challenge}
          participant={currentParticipant}
          onSuccess={() => {
            // Reload challenge data to show updated stats
            loadChallengeData();
          }}
        />
      )}
    </div>
  );
};
