import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Award, Calendar, Users, Clock, UserPlus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { JoinChallengeModal } from '@/components/challenges/JoinChallengeModal';
import { LeaveChallengeModal } from '@/components/challenges/LeaveChallengeModal';
import { SimpleCalendar } from '@/components/challenges/SimpleCalendar';
import { FeedItem } from '@/components/challenges/FeedItem';
import { DiscussionModal } from '@/components/challenges/DiscussionModal';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import type { ChallengeList, FeedItem as FeedItemType } from '@/types/api';
import {
  formatDate,
  getChallengeStatusText,
  getImageUrl,
  isChallengeActive,
  isChallengeUpcoming,
} from '@/lib/utils';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [challenges, setChallenges] = useState<ChallengeList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningChallenges, setJoiningChallenges] = useState<Set<number>>(new Set());
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeList | null>(null);
  const { isAuthenticated } = useAuthStore();

  // Feed state
  const [feedItems, setFeedItems] = useState<FeedItemType[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [feedNextPage, setFeedNextPage] = useState<string | null>(null);
  const [discussionModalOpen, setDiscussionModalOpen] = useState(false);
  const [selectedFeedItem, setSelectedFeedItem] = useState<FeedItemType | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Get selected date from URL
  const selectedDate = searchParams.get('daily_progress_date');

  // Feed functions
  const loadFeed = useCallback(async (date?: string | null) => {
    setIsLoadingFeed(true);
    try {
      const params: any = { page: 1, page_size: 20 };
      if (date) {
        params.daily_progress_date = date;
      }
      const response = await apiClient.getFeed(params);
      setFeedItems(response.results);
      setFeedNextPage(response.next);
    } catch (error) {
      console.error('Error loading feed:', error);
      setFeedItems([]);
      setFeedNextPage(null);
    } finally {
      setIsLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    loadChallenges();
    if (isAuthenticated) {
      loadFeed(selectedDate);
    }
  }, [isAuthenticated, selectedDate, loadFeed]); // Reload when authentication status or date changes

  const loadMoreFeed = useCallback(async () => {
    if (!feedNextPage || isLoadingFeed) return;

    setIsLoadingFeed(true);
    try {
      // Parse the next page URL
      const url = feedNextPage.startsWith('http')
        ? feedNextPage
        : `${(apiClient as any).client.defaults.baseURL}${feedNextPage}`;
      
      const response = await (apiClient as any).client.get(url);
      setFeedItems(prev => [...prev, ...response.data.results]);
      setFeedNextPage(response.data.next);
    } catch (error) {
      console.error('Error loading more feed:', error);
    } finally {
      setIsLoadingFeed(false);
    }
  }, [feedNextPage, isLoadingFeed]);

  // Infinite scroll observer
  useEffect(() => {
    if (!isAuthenticated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feedNextPage && !isLoadingFeed) {
          loadMoreFeed();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [feedNextPage, isLoadingFeed, isAuthenticated, loadMoreFeed]);

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
      navigate(`/send-progress?challenge=${firstActiveChallenge.slug}`);
    } else {
      navigate('/send-progress');
    }
  };

  const handleCommentClick = (itemId: number) => {
    const item = feedItems.find(i => i.id === itemId);
    if (item) {
      setSelectedFeedItem(item);
      setDiscussionModalOpen(true);
    }
  };

  const handleDateSelect = (date: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (date) {
      newSearchParams.set('daily_progress_date', date);
    } else {
      newSearchParams.delete('daily_progress_date');
    }
    setSearchParams(newSearchParams);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Authenticated User Home Page */}
      {isAuthenticated && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Calendar */}
          <SimpleCalendar 
            days={10} 
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />

          {/* Feed */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Лента активности</h2>
            
            {isLoadingFeed && feedItems.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
              </div>
            ) : feedItems.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <p className="text-gray-600">Пока нет активности в ленте</p>
                </div>
              </Card>
            ) : (
              <>
                {feedItems.map((item) => (
                  <FeedItem
                    key={item.id}
                    item={item}
                    onCommentClick={handleCommentClick}
                  />
                ))}
                
                {/* Infinite scroll trigger */}
                <div ref={observerTarget} className="h-10 flex justify-center items-center">
                  {isLoadingFeed && feedItems.length > 0 && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  )}
                </div>

                {!feedNextPage && feedItems.length > 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Все записи загружены
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Non-authenticated User Home Page */}
      {!isAuthenticated && (
        <section className="bg-gradient-to-br from-primary-600 via-festive-red to-primary-700 text-white py-12 relative overflow-hidden">
          {/* Festive background decorations */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-6xl animate-twinkle">🎄</div>
            <div className="absolute top-20 right-20 text-5xl animate-twinkle" style={{ animationDelay: '0.5s' }}>⭐</div>
            <div className="absolute bottom-20 left-20 text-4xl animate-twinkle" style={{ animationDelay: '1s' }}>❄️</div>
            <div className="absolute bottom-10 right-10 text-5xl animate-twinkle" style={{ animationDelay: '1.5s' }}>🎁</div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-2">
                ChallengeTV
                <span className="text-3xl animate-twinkle">🎉</span>
              </h1>
              <p className="text-lg md:text-xl mb-6 text-white/90">
                Участвуйте в челленджах и достигайте целей
              </p>
              <Link to="/challenges">
                <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-festive-gold/50 transition-all duration-300 border-2 border-festive-gold/30 hover:border-festive-gold">
                  Смотреть челленджи
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

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

      {/* Discussion Modal */}
      <DiscussionModal
        isOpen={discussionModalOpen}
        onClose={() => {
          setDiscussionModalOpen(false);
          setSelectedFeedItem(null);
        }}
        feedItem={selectedFeedItem}
      />
     
    </div>
  );
};
