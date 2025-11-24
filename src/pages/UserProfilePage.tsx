import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  Award,
  Target,
  TrendingUp,
  Calendar,
  Activity,
  CheckCircle,
  Clock,
  BarChart3,
  Flame,
  MessageCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { FeedItem } from '@/components/challenges/FeedItem';
import { DiscussionModal } from '@/components/challenges/DiscussionModal';
import { apiClient } from '@/lib/api';
import type { UserProfileResponse, FeedItem as FeedItemType } from '@/types/api';
import { getAvatarUrl, formatDate } from '@/lib/utils';

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Feed state
  const [feedItems, setFeedItems] = useState<FeedItemType[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [feedNextPage, setFeedNextPage] = useState<string | null>(null);
  const [discussionModalOpen, setDiscussionModalOpen] = useState(false);
  const [selectedFeedItem, setSelectedFeedItem] = useState<FeedItemType | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadFeed();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        throw new Error('Invalid user ID');
      }
      const data = await apiClient.getUserProfile(userIdNum);
      setProfileData(data);
    } catch (err: any) {
      console.error('Error loading user profile:', err);
      setError(err.response?.data?.detail || 'Не удалось загрузить профиль пользователя');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeed = useCallback(async () => {
    if (!userId) return;

    setIsLoadingFeed(true);
    try {
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        return;
      }
      const response = await apiClient.getFeed({ 
        page: 1, 
        page_size: 20,
        user_id: userIdNum 
      });
      setFeedItems(response.results);
      setFeedNextPage(response.next);
    } catch (error) {
      console.error('Error loading feed:', error);
      setFeedItems([]);
      setFeedNextPage(null);
    } finally {
      setIsLoadingFeed(false);
    }
  }, [userId]);

  const loadMoreFeed = useCallback(async () => {
    if (!feedNextPage || isLoadingFeed) return;

    setIsLoadingFeed(true);
    try {
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
  }, [feedNextPage, isLoadingFeed, loadMoreFeed]);

  const handleCommentClick = (itemId: number) => {
    const item = feedItems.find(i => i.id === itemId);
    if (item) {
      setSelectedFeedItem(item);
      setDiscussionModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Loading text="Загрузка профиля..." />
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ошибка загрузки
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Профиль пользователя не найден'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={loadUserProfile}>
                Попробовать снова
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                Назад
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const { user, profile, statistics } = profileData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-primary-600">Главная</Link>
          <span>/</span>
          <span className="text-gray-900">{user.first_name} {user.last_name}</span>
        </div>

        {/* Profile Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar
                src={getAvatarUrl(profile.avatar)}
                firstName={user.first_name}
                lastName={user.last_name}
                username={user.username}
                size="xl"
                className="ring-4 ring-white shadow-lg"
              />
              <div className="flex-1 text-center md:text-left text-white">
                <h1 className="text-3xl font-bold mb-2">
                  {user.first_name} {user.last_name}
                </h1>
                <p className="text-lg text-white/90 mb-2">@{user.username}</p>
                {profile.bio && (
                  <p className="text-white/80 mb-4">{profile.bio}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                  <Badge variant="info" className="bg-white/20 text-white border-white/30">
                    Ранг: #{profile.rank}
                  </Badge>
                  <div className="flex items-center space-x-1 text-white/90">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Присоединился {formatDate(user.date_joined, 'dd MMMM yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Trophy className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Всего HP</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.total_hp_earned.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Челленджей</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.total_challenges_joined}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Достижений</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.achievements.total_count}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Средний HP/день</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.daily_progress.avg_hp_per_day.toFixed(1)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Participation Stats */}
            <Card>
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-primary-600" />
                Статистика участия
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Всего участий</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.participations.total}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Завершено</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statistics.participations.completed}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Активных</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {statistics.participations.active}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Завершено челленджей</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {statistics.total_challenges_completed}
                  </p>
                </div>
              </div>
            </Card>

            {/* Progress Items Stats */}
            <Card>
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Activity className="w-6 h-6 mr-2 text-primary-600" />
                Статистика прогресса
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Всего записей</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.progress_items.total}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="flex items-center justify-center mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                    <p className="text-sm text-gray-600">Одобрено</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {statistics.progress_items.approved}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 text-yellow-600 mr-1" />
                    <p className="text-sm text-gray-600">Ожидает</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {statistics.progress_items.pending}
                  </p>
                </div>
              </div>
            </Card>

            {/* Activities by Type */}
            {statistics.activities_by_type.length > 0 && (
              <Card>
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <Flame className="w-6 h-6 mr-2 text-primary-600" />
                  Активности по типам
                </h2>
                <div className="space-y-4">
                  {statistics.activities_by_type.map((activity, index) => (
                    <div
                      key={activity.activity_slug}
                      className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {activity.activity_name}
                        </h3>
                        <Badge variant="info">
                          {activity.items_count} записей
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div>
                          <span className="text-gray-600">Всего:</span>{' '}
                          <span className="font-bold text-gray-900">
                            {activity.total_quantity.toLocaleString()} {activity.unit_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold mb-6">Дополнительная информация</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">HP из записей</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {statistics.total_hp_from_items.toLocaleString()} HP
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Всего дней активности</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {statistics.daily_progress.total_days} дней
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {user.email}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* User Feed */}
        <Card className="mt-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <MessageCircle className="w-8 h-8 mr-3 text-primary-600" />
            Лента активности
          </h2>
          
          {isLoadingFeed && feedItems.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loading text="Загрузка активности..." />
            </div>
          ) : feedItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                Пока нет активности в ленте
              </p>
            </div>
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
        </Card>
      </div>

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


