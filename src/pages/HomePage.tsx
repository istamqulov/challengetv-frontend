import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Calendar, Users, Clock, UserPlus, Upload } from 'lucide-react';
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
        <section className="bg-gradient-to-br from-primary-600 to-primary-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                ChallengeTV
              </h1>
              <p className="text-lg md:text-xl mb-6 text-white/90">
                Участвуйте в челленджах и достигайте целей
              </p>
              <Link to="/challenges">
                <Button size="lg" variant="secondary" className="shadow-lg">
                  Смотреть челленджи
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Send Report Section - Desktop only, mobile uses FAB in bottom nav */}
      {getFirstActiveChallenge() && (
        <section className="hidden md:block bg-gradient-to-r from-primary-500 to-primary-700 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card padding={false} className="overflow-hidden bg-white/95 backdrop-blur">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full">
                    <Upload className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Отправить отчет
                    </h2>
                    <p className="text-sm text-gray-600">
                      Обновите ваш прогресс
                    </p>
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  onClick={handleSendReport}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Отправить</span>
                </Button>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Challenges Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Челленджи</h2>
            <Link to="/challenges" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              Все
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : challenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map((challenge) => {
                return (
                  <Link key={challenge.id} to={`/challenges/${challenge.slug}`}>
                    <Card padding={false} hover className="overflow-hidden h-full">
                      {/* Image */}
                      <div className="relative w-full h-48 bg-gradient-to-br from-primary-500 to-primary-600">
                        {challenge.image ? (
                          <img
                            src={getImageUrl(challenge.image)}
                            alt={challenge.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Award className="w-16 h-16 text-white opacity-50" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          {getStatusBadge(challenge)}
                        </div>
                        {challenge.joined && (
                          <div className="absolute top-3 left-3">
                            <Badge variant="info" className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>Участвуете</span>
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                          {challenge.title}
                        </h3>

                        {challenge.short_description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {challenge.short_description}
                          </p>
                        )}

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{formatDate(challenge.start_date)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              <span>{challenge.participants_count} участников</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>{challenge.duration_days} дней</span>
                            </div>
                          </div>
                        </div>

                        {isAuthenticated && !challenge.joined && !challenge.is_full && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => handleJoinChallenge(challenge, e)}
                            disabled={joiningChallenges.has(challenge.id)}
                            className="w-full mt-3 flex items-center justify-center space-x-1"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>
                              {joiningChallenges.has(challenge.id) ? 'Загрузка...' : 'Присоединиться'}
                            </span>
                          </Button>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                Пока нет активных челленджей
              </p>
            </div>
          )}
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
