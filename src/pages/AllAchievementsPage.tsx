import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Trophy, Lock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { AchievementWithUsers } from '@/types/api';
import { formatDate, getImageUrl } from '@/lib/utils';

export const AllAchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<AchievementWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string>('all');
  const [expandedAchievement, setExpandedAchievement] = useState<number | null>(null);
  const { tokens } = useAuthStore();

  useEffect(() => {
    // Set auth token and load achievements when token is available
    if (tokens?.access) {
      apiClient.setAuthToken(tokens.access);
      loadAchievements();
    }
  }, [tokens?.access]);

  const loadAchievements = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAllAchievements();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setAchievements(data);
      } else {
        console.error('Expected array, got:', data);
        setAchievements([]);
        setError('Неверный формат данных');
      }
    } catch (err: any) {
      console.error('Error loading achievements:', err);
      setError('Не удалось загрузить достижения');
      setAchievements([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique activities for filter
  const activities = useMemo(() => {
    if (!Array.isArray(achievements)) return [];
    
    const activityMap = new Map<string, string>();
    achievements.forEach((item) => {
      const key = item.activity_slug || String(item.activity);
      if (!activityMap.has(key)) {
        activityMap.set(key, item.activity_name || 'Без активности');
      }
    });
    return Array.from(activityMap.entries()).map(([key, name]) => ({ key, name }));
  }, [achievements]);

  // Filter achievements by selected activity
  const filteredAchievements = useMemo(() => {
    if (!Array.isArray(achievements)) return [];
    
    if (selectedActivity === 'all') {
      return achievements;
    }
    return achievements.filter((item) => {
      const key = item.activity_slug || String(item.activity);
      return key === selectedActivity;
    });
  }, [achievements, selectedActivity]);

  // Group filtered achievements by activity
  const groupedAchievements = useMemo(() => {
    if (!Array.isArray(filteredAchievements)) return [];
    
    const groups = new Map<
      string,
      { activityName: string; items: AchievementWithUsers[] }
    >();

    filteredAchievements.forEach((item) => {
      const key = item.activity_slug || String(item.activity);

      if (!groups.has(key)) {
        groups.set(key, {
          activityName: item.activity_name || 'Без активности',
          items: [],
        });
      }

      groups.get(key)!.items.push(item);
    });

    return Array.from(groups.entries()).map(([key, value]) => ({
      key,
      ...value,
    }));
  }, [filteredAchievements]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <Loading text="Загрузка достижений..." />
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const MAX_VISIBLE_AVATARS = 5;

  const toggleAchievement = (achievementId: number) => {
    setExpandedAchievement(expandedAchievement === achievementId ? null : achievementId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Award className="w-10 h-10 mr-3 text-primary-600" />
            Все достижения
          </h1>
          <p className="text-gray-600">
            Список всех доступных достижений и пользователей, которые их получили
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Activity Filter (Sidebar) */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-primary-600" />
                Активности
              </h2>
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedActivity('all')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedActivity === 'all'
                      ? 'bg-primary-100 text-primary-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Все активности</span>
                    <Badge variant="default" className="ml-2">
                      {achievements.length}
                    </Badge>
                  </div>
                </button>
                {activities.map(({ key, name }) => {
                  const count = achievements.filter((item) => {
                    const itemKey = item.activity_slug || String(item.activity);
                    return itemKey === key;
                  }).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedActivity(key)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedActivity === key
                          ? 'bg-primary-100 text-primary-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{name}</span>
                        <Badge variant="default" className="ml-2">
                          {count}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Right Column - Achievements Grid */}
          <div className="lg:col-span-3">
            {filteredAchievements.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAchievements.map((achievement) => {
                  const hasUsers = achievement.users && achievement.users.length > 0;
                  const isExpanded = expandedAchievement === achievement.id;
                  const visibleUsers = isExpanded 
                    ? achievement.users 
                    : achievement.users?.slice(0, MAX_VISIBLE_AVATARS) || [];
                  const hasMoreUsers = achievement.users && achievement.users.length > MAX_VISIBLE_AVATARS;

                  return (
                    <div
                      key={achievement.id}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        hasUsers
                          ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 hover:shadow-lg cursor-pointer'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => hasUsers && toggleAchievement(achievement.id)}
                    >
                      {/* Achievement Icon/Badge at top */}
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg ${hasUsers ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                          {hasUsers ? (
                            <Trophy className="w-6 h-6 text-yellow-600" />
                          ) : (
                            <Lock className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        {achievement.icon && (
                          <img
                            src={achievement.icon}
                            alt={achievement.name}
                            className="w-10 h-10"
                          />
                        )}
                      </div>

                      {/* Achievement Name */}
                      <h3 className="text-base font-bold text-gray-900 mb-2">
                        {achievement.name}
                      </h3>

                      {/* Activity Badge */}
                      <div className="mb-2">
                        <Badge variant="default" className="text-xs">
                          {achievement.activity_name}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {hasUsers && (
                          <Badge variant="success" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {achievement.users.length}
                          </Badge>
                        )}
                        {achievement.hp_reward > 0 && (
                          <Badge variant="info" className="text-xs">{achievement.hp_reward} HP</Badge>
                        )}
                      </div>

                      {/* Description */}
                      <div
                        className="text-sm text-gray-600 mb-3 line-clamp-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: achievement.description }}
                      />

                      {/* Condition */}
                      {achievement.condition && (
                        <div
                          className="text-xs text-gray-500 mb-3 line-clamp-2 prose prose-xs max-w-none"
                          dangerouslySetInnerHTML={{ __html: achievement.condition }}
                        />
                      )}

                      {/* Users who earned it - Avatars only when collapsed */}
                      {hasUsers && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          {!isExpanded ? (
                            // Collapsed view - just avatars in a row
                            <div className="flex items-center">
                              <div className="flex -space-x-2">
                                {visibleUsers.map((userAchievement) => (
                                  <Link
                                    key={userAchievement.user.id}
                                    to={`/users/${userAchievement.user.id}/profile`}
                                    className="relative block"
                                    title={`${userAchievement.user.first_name} ${userAchievement.user.last_name}`}
                                  >
                                    <Avatar
                                      src={userAchievement.user.profile?.avatar ? getImageUrl(userAchievement.user.profile.avatar) : undefined}
                                      alt={userAchievement.user.username}
                                      firstName={userAchievement.user.first_name}
                                      lastName={userAchievement.user.last_name}
                                      username={userAchievement.user.username}
                                      size="sm"
                                      className="ring-2 ring-white hover:ring-primary-400 transition-colors"
                                    />
                                  </Link>
                                ))}
                                {hasMoreUsers && (
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold ring-2 ring-white">
                                    +{achievement.users.length - MAX_VISIBLE_AVATARS}
                                  </div>
                                )}
                              </div>
                              {hasMoreUsers && (
                                <ChevronDown className="w-5 h-5 ml-auto text-gray-400" />
                              )}
                            </div>
                          ) : (
                            // Expanded view - full user list with names and dates
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-gray-700">
                                  Получили ({achievement.users.length}):
                                </p>
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              </div>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {achievement.users.map((userAchievement) => (
                                  <Link
                                    key={userAchievement.user.id}
                                    to={`/users/${userAchievement.user.id}/profile`}
                                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/50 transition-colors"
                                  >
                                    <Avatar
                                      src={userAchievement.user.profile?.avatar ? getImageUrl(userAchievement.user.profile.avatar) : undefined}
                                      alt={userAchievement.user.username}
                                      firstName={userAchievement.user.first_name}
                                      lastName={userAchievement.user.last_name}
                                      username={userAchievement.user.username}
                                      size="sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate hover:text-primary-600">
                                        {userAchievement.user.first_name} {userAchievement.user.last_name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatDate(userAchievement.earned_at, 'dd MMM yyyy, HH:mm')}
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card>
                <p className="text-center text-gray-600 py-8">
                  Нет достижений для выбранной активности
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

