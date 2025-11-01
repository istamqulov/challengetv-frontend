import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, Award, Calendar, Users, Clock, ArrowRight, UserPlus, UserMinus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { JoinChallengeModal } from '@/components/challenges/JoinChallengeModal';
import { LeaveChallengeModal } from '@/components/challenges/LeaveChallengeModal';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import type { ChallengeList } from '@/types/api';
import {
  formatDate,
  getDaysUntil,
  getChallengeStatusText,
  getImageUrl,
  isChallengeActive,
  isChallengeUpcoming,
} from '@/lib/utils';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<ChallengeList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningChallenges, setJoiningChallenges] = useState<Set<number>>(new Set());
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeList | null>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setIsLoading(true);
      console.log('Loading challenges...');
      const response = await apiClient.getChallenges();
      console.log('Challenges response:', response);
      
      // Извлекаем массив челленджей из пагинированного ответа
      const challengesData = response.results || [];
      console.log('Challenges array:', challengesData);
      
      // Показываем только первые 6 челленджей на главной странице
      setChallenges(challengesData.slice(0, 6));
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (challenge: ChallengeList) => {
    const isActive = isChallengeActive(challenge.start_date, challenge.end_date);
    const isUpcoming = isChallengeUpcoming(challenge.start_date);
    
    if (challenge.status === 'active' && isActive) {
      return <Badge variant="success">Активен</Badge>;
    }
    if (challenge.status === 'active' && isUpcoming) {
      return <Badge variant="info">Скоро начнется</Badge>;
    }
    if (challenge.status === 'completed') {
      return <Badge variant="default">Завершен</Badge>;
    }
    if (challenge.status === 'cancelled') {
      return <Badge variant="danger">Отменен</Badge>;
    }
    return <Badge variant="warning">{getChallengeStatusText(challenge.status)}</Badge>;
  };

  const handleJoinChallenge = async (challenge: ChallengeList, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    // Open modal for level selection
    setSelectedChallenge(challenge);
    setJoinModalOpen(true);
  };

  const handleJoinWithLevel = async (challengeLevelId: number) => {
    if (!selectedChallenge) return;

    setJoiningChallenges(prev => new Set(prev).add(selectedChallenge.id));
    
    try {
      await apiClient.joinChallenge(selectedChallenge.slug, challengeLevelId);
      
      // Update the challenge in the list
      setChallenges(prev => prev.map(c => 
        c.id === selectedChallenge.id ? { ...c, joined: true } : c
      ));
      
      // Close modal
      setJoinModalOpen(false);
      setSelectedChallenge(null);
    } catch (error) {
      console.error('Error joining challenge:', error);
      // You could add a toast notification here
    } finally {
      setJoiningChallenges(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedChallenge.id);
        return newSet;
      });
    }
  };

  const handleLeaveChallenge = async (challenge: ChallengeList, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Open modal for confirmation
    setSelectedChallenge(challenge);
    setLeaveModalOpen(true);
  };

  const handleConfirmLeave = async () => {
    if (!selectedChallenge) return;

    setJoiningChallenges(prev => new Set(prev).add(selectedChallenge.id));
    
    try {
      await apiClient.leaveChallenge(selectedChallenge.slug);
      
      // Update the challenge in the list
      setChallenges(prev => prev.map(c => 
        c.id === selectedChallenge.id ? { ...c, joined: false } : c
      ));
      
      // Close modal
      setLeaveModalOpen(false);
      setSelectedChallenge(null);
    } catch (error) {
      console.error('Error leaving challenge:', error);
      // You could add a toast notification here
    } finally {
      setJoiningChallenges(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedChallenge.id);
        return newSet;
      });
    }
  };

  // Find first active challenge that user has joined
  const getFirstActiveChallenge = (): ChallengeList | null => {
    return challenges.find(challenge => {
      // Challenge must be active (started and not ended) AND user must be joined
      return isChallengeActive(challenge.start_date, challenge.end_date) && challenge.joined === true;
    }) || null;
  };

  const handleSendReport = () => {
    const firstActiveChallenge = getFirstActiveChallenge();
    if (firstActiveChallenge) {
      navigate(`/challenges/${firstActiveChallenge.slug}/send`);
    } else {
      console.warn('No active challenge found for sending report');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthenticated && (
        <section className="bg-primary-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Добро пожаловать в ChallengeTV
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-100">
                Платформа для создания и участия в челленджах
              </p>
              <p className="text-lg mb-10 max-w-3xl mx-auto">
                Присоединяйтесь к сообществу активных людей, создавайте свои челленджи,
                участвуйте в существующих, зарабатывайте HP и получайте достижения!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/challenges">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Смотреть челленджи
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Send Report Section */}
      {getFirstActiveChallenge() && (
        <section className="bg-gradient-to-r from-primary-500 to-primary-700 py-12 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Отправить отчет о прогрессе
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Быстро отправьте свой прогресс по активному челленджу
              </p>
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-xl px-10 py-6 font-bold shadow-2xl hover:scale-105 transition-transform"
                onClick={handleSendReport}
              >
                <Upload className="w-7 h-7 mr-3" />
                Отправить отчет
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Почему ChallengeTV?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Создавайте челленджи</h3>
              <p className="text-gray-600">
                Создавайте собственные челленджи с различными уровнями сложности
                и активностями
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 text-secondary-600 rounded-full mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Зарабатывайте HP</h3>
              <p className="text-gray-600">
                Выполняйте активности и зарабатывайте HP (Health Points),
                соревнуйтесь с другими участниками
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Получайте достижения</h3>
              <p className="text-gray-600">
                Получайте уникальные достижения за выполнение различных условий
                и челленджей
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Популярные челленджи</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Присоединяйтесь к активным челленджам и начните свой путь к достижению целей
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Загрузка челленджей...</span>
            </div>
          ) : challenges.length > 0 ? (
            <div className="space-y-8">
              {challenges.map((challenge) => {
                const daysUntilStart = getDaysUntil(challenge.start_date);
                const isUpcoming = isChallengeUpcoming(challenge.start_date);
                
                return (
                  <Link key={challenge.id} to={`/challenges/${challenge.slug}`}>
                    <Card padding={false} hover className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        {/* Image */}
                        <div className="relative w-full md:w-[45%] h-56 md:h-auto bg-primary-600 flex-shrink-0">
                          {challenge.image ? (
                            <img
                              src={getImageUrl(challenge.image)}
                              alt={challenge.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Award className="w-24 h-24 text-white opacity-50" />
                            </div>
                          )}
                          <div className="absolute top-4 right-4">
                            {getStatusBadge(challenge)}
                          </div>
                          {challenge.joined && (
                            <div className="absolute top-4 left-4">
                              <Badge variant="info" className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>Участвуете</span>
                              </Badge>
                            </div>
                          )}
                          {challenge.is_full && !challenge.joined && (
                            <div className="absolute top-4 left-4">
                              <Badge variant="danger">Набор закрыт</Badge>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-8">
                          <div className="flex flex-col h-full">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                {challenge.title}
                              </h3>

                              {challenge.short_description && (
                                <p className="text-gray-600 mb-6 line-clamp-2 text-lg">
                                  {challenge.short_description}
                                </p>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="w-5 h-5 mr-3" />
                                  <div>
                                    <div className="font-medium text-base">Даты</div>
                                    <div className="text-sm">
                                      {formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center text-sm text-gray-600">
                                  <Clock className="w-5 h-5 mr-3" />
                                  <div>
                                    <div className="font-medium text-base">Длительность</div>
                                    <div className="text-sm">
                                      {challenge.duration_days} дней
                                      {isUpcoming && daysUntilStart > 0 && (
                                        <span className="text-primary-600 font-medium">
                                          • Начнется через {daysUntilStart} {daysUntilStart === 1 ? 'день' : 'дней'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center text-sm text-gray-600">
                                  <Users className="w-5 h-5 mr-3" />
                                  <div>
                                    <div className="font-medium text-base">Участники</div>
                                    <div className="text-sm">
                                      {challenge.participants_count} / {challenge.max_participants || '∞'}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center text-sm text-gray-600">
                                  <div>
                                    <div className="font-medium text-base">Тип</div>
                                    <div className="text-sm">
                                      {challenge.is_public ? (
                                        <Badge variant="info" className="text-sm">Публичный</Badge>
                                      ) : (
                                        <Badge variant="default" className="text-sm">Приватный</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                              <div className="flex items-center text-primary-600 font-medium text-lg">
                                <span>Подробнее</span>
                                <ArrowRight className="w-5 h-5 ml-2" />
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                {isAuthenticated ? (
                                  challenge.joined ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => handleLeaveChallenge(challenge, e)}
                                      disabled={joiningChallenges.has(challenge.id)}
                                      className="flex items-center space-x-1"
                                    >
                                      <UserMinus className="w-4 h-4" />
                                      <span>
                                        {joiningChallenges.has(challenge.id) ? 'Покидаем...' : 'Покинуть'}
                                      </span>
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={(e) => handleJoinChallenge(challenge, e)}
                                      disabled={joiningChallenges.has(challenge.id) || challenge.is_full}
                                      className="flex items-center space-x-1"
                                    >
                                      <UserPlus className="w-4 h-4" />
                                      <span>
                                        {joiningChallenges.has(challenge.id) ? 'Присоединяемся...' : 'Присоединиться'}
                                      </span>
                                    </Button>
                                  )
                                ) : (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={(e) => handleJoinChallenge(challenge, e)}
                                    className="flex items-center space-x-1"
                                  >
                                    <UserPlus className="w-4 h-4" />
                                    <span>Войти для участия</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Пока нет активных челленджей
              </h3>
              <p className="text-gray-600 mb-4">
                Создайте первый челлендж или зайдите позже
              </p>
              <p className="text-sm text-gray-500">
                Загружено челленджей: {challenges.length}
              </p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/challenges">
              <Button size="lg" variant="outline">
                Посмотреть все челленджи
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Join Challenge Modal */}
      {selectedChallenge && (
        <JoinChallengeModal
          isOpen={joinModalOpen}
          onClose={() => {
            setJoinModalOpen(false);
            setSelectedChallenge(null);
          }}
          onJoin={handleJoinWithLevel}
          challengeTitle={selectedChallenge.title}
          levels={(selectedChallenge as any)?.levels || []}
          isLoading={joiningChallenges.has(selectedChallenge.id)}
        />
      )}

      {/* Leave Challenge Modal */}
      {selectedChallenge && (
        <LeaveChallengeModal
          isOpen={leaveModalOpen}
          onClose={() => {
            setLeaveModalOpen(false);
            setSelectedChallenge(null);
          }}
          onLeave={handleConfirmLeave}
          challengeTitle={selectedChallenge.title}
          isLoading={joiningChallenges.has(selectedChallenge.id)}
        />
      )}
     
    </div>
  );
};
