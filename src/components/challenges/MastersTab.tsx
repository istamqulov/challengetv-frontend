import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api';
import type { Challenge, TopUser } from '@/types/api';
import { getImageUrl } from '@/lib/utils';

interface MastersTabProps {
  challenge: Challenge;
}

export const MastersTab: React.FC<MastersTabProps> = ({ challenge }) => {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get active activities from challenge
  const activities = challenge.allowed_activities
    ?.filter((aa) => aa.is_active)
    .map((aa) => aa.activity) || [];

  // Set initial activity when component mounts or activities change
  useEffect(() => {
    if (activities.length > 0 && !selectedActivity) {
      setSelectedActivity(activities[0].slug);
    }
  }, [activities, selectedActivity]);

  // Load top users when activity changes
  useEffect(() => {
    if (selectedActivity && challenge.slug) {
      loadTopUsers(selectedActivity);
    }
  }, [selectedActivity, challenge.slug]);

  const loadTopUsers = async (activitySlug: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getTopUsersByActivity(challenge.slug, activitySlug);
      setTopUsers(data);
    } catch (err: any) {
      console.error('Error loading top users:', err);
      setError('Не удалось загрузить список мастеров');
      setTopUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="w-6 h-6 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="w-6 h-6 text-gray-400" />;
    } else if (rank === 3) {
      return <Medal className="w-6 h-6 text-amber-600" />;
    }
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-gray-200 text-gray-700';
  };

  const selectedActivityData = activities.find((a) => a.slug === selectedActivity);

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Trophy className="w-8 h-8 mr-3 text-primary-600" />
        Мастера
      </h2>

      {/* Activity Tabs */}
      {activities.length > 0 && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap gap-2">
              {activities.map((activity) => (
                <button
                  key={activity.slug}
                  onClick={() => setSelectedActivity(activity.slug)}
                  className={`
                    flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors
                    ${
                      selectedActivity === activity.slug
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {activity.icon && (
                    <img
                      src={getImageUrl(activity.icon)}
                      alt={activity.name}
                      className="w-5 h-5"
                    />
                  )}
                  <span>{activity.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Top Users List */}
      {selectedActivityData && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Топ по активности: {selectedActivityData.name}
            </h3>
            <p className="text-sm text-gray-600">
              Общее количество: {selectedActivityData.unit_name}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loading text="Загрузка мастеров..." />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => selectedActivity && loadTopUsers(selectedActivity)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Попробовать снова
              </button>
            </div>
          ) : topUsers.length > 0 ? (
            <div className="space-y-3">
              {topUsers.map((topUser) => (
                <div
                  key={topUser.user.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12">
                      {getRankIcon(topUser.rank) || (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankBadgeColor(
                            topUser.rank
                          )}`}
                        >
                          {topUser.rank}
                        </div>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar
                      src={topUser.user.profile?.avatar}
                      firstName={topUser.user.first_name}
                      lastName={topUser.user.last_name}
                      username={topUser.user.username}
                      size="md"
                    />

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-gray-900 truncate">
                          {topUser.user.first_name} {topUser.user.last_name}
                        </p>
                        {topUser.user.profile?.rank && (
                          <Badge variant="info" className="text-xs">
                            #{topUser.user.profile.rank}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        @{topUser.user.username}
                      </p>
                    </div>
                  </div>

                  {/* Total Quantity */}
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-primary-600">
                      {topUser.total_quantity.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedActivityData.unit_name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">
                Пока нет данных по этой активности
              </p>
            </div>
          )}
        </div>
      )}

      {activities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            Нет доступных активностей для отображения
          </p>
        </div>
      )}
    </Card>
  );
};

