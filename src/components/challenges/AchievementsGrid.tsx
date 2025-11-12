import React, { useMemo, useState } from 'react';
import { Trophy, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { ChallengeAchievement } from '@/types/api';
import { formatDate } from '@/lib/utils';

interface AchievementsGridProps {
  achievements: ChallengeAchievement[];
}

export const AchievementsGrid: React.FC<AchievementsGridProps> = ({ achievements }) => {
  const [selectedActivity, setSelectedActivity] = useState<string>('all');

  // Get unique activities for filter
  const activities = useMemo(() => {
    const activityMap = new Map<string, string>();
    achievements.forEach((item) => {
      const { achievement } = item;
      const key =
        achievement.activity_slug ||
        (typeof achievement.activity === 'number'
          ? String(achievement.activity)
          : achievement.activity_name);
      if (!activityMap.has(key)) {
        activityMap.set(key, achievement.activity_name || 'Без активности');
      }
    });
    return Array.from(activityMap.entries()).map(([key, name]) => ({ key, name }));
  }, [achievements]);

  // Filter achievements by selected activity
  const filteredAchievements = useMemo(() => {
    if (selectedActivity === 'all') {
      return achievements;
    }
    return achievements.filter((item) => {
      const key =
        item.achievement.activity_slug ||
        (typeof item.achievement.activity === 'number'
          ? String(item.achievement.activity)
          : item.achievement.activity_name);
      return key === selectedActivity;
    });
  }, [achievements, selectedActivity]);

  // Group filtered achievements by activity
  const groupedAchievements = useMemo(() => {
    const groups = new Map<
      string,
      { activityName: string; items: ChallengeAchievement[] }
    >();

    filteredAchievements.forEach((item) => {
      const { achievement } = item;
      const key =
        achievement.activity_slug ||
        (typeof achievement.activity === 'number'
          ? String(achievement.activity)
          : achievement.activity_name);

      if (!groups.has(key)) {
        groups.set(key, {
          activityName: achievement.activity_name || 'Без активности',
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

  if (achievements.length === 0) {
    return (
      <p className="text-center text-gray-600 py-8">
        Пока нет достижений
      </p>
    );
  }

  return (
    <>
      {/* Activity Filter - Tag Style */}
      {activities.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Фильтр по активности:
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedActivity('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedActivity === 'all'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Все активности ({achievements.length})
            </button>
            {activities.map(({ key, name }) => {
              const count = achievements.filter((item) => {
                const itemKey =
                  item.achievement.activity_slug ||
                  (typeof item.achievement.activity === 'number'
                    ? String(item.achievement.activity)
                    : item.achievement.activity_name);
                return itemKey === key;
              }).length;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedActivity(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedActivity === key
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grouped Achievements */}
      {groupedAchievements.length > 0 ? (
        <div className="space-y-8">
          {groupedAchievements.map(({ key, activityName, items }) => (
            <div key={key}>
              {/* Activity Header */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-px flex-1 bg-gray-200" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 px-3">
                  {activityName}
                </h3>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Achievements Grid - 4 per row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((achievementData) => {
                  const {
                    achievement,
                    progress,
                    is_earned,
                    current,
                    target,
                    percentage,
                    earned_at,
                  } = achievementData;
                  const hasProgress = progress && typeof progress.current !== 'undefined';
                  const displayCurrent = hasProgress ? progress.current : current;
                  const displayTarget = hasProgress ? progress.target : target;
                  const displayPercentage = hasProgress ? progress.percentage : percentage;
                  const displayEarned = hasProgress ? progress.is_earned : is_earned;

                  return (
                    <div
                      key={achievement.id}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        displayEarned
                          ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {/* Achievement Icon/Badge at top */}
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg ${displayEarned ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                          {displayEarned ? (
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
                      <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2">
                        {achievement.name}
                      </h3>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {displayEarned && (
                          <Badge variant="success" className="text-xs">Получено</Badge>
                        )}
                        {achievement.hp_reward > 0 && (
                          <Badge variant="info" className="text-xs">{achievement.hp_reward} HP</Badge>
                        )}
                      </div>

                      {/* Description */}
                      <div
                        className="text-xs text-gray-600 mb-3 line-clamp-3 prose prose-xs max-w-none"
                        dangerouslySetInnerHTML={{ __html: achievement.description }}
                      />

                      {/* Condition */}
                      {achievement.condition && (
                        <div
                          className="text-xs text-gray-500 mb-3 line-clamp-2 prose prose-xs max-w-none"
                          dangerouslySetInnerHTML={{ __html: achievement.condition }}
                        />
                      )}

                      {/* Progress */}
                      {hasProgress && (
                        <div className="mt-auto">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              {displayCurrent} / {displayTarget}
                            </span>
                            <span className="text-xs font-medium text-gray-700">
                              {displayPercentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                displayEarned ? 'bg-yellow-500' : 'bg-primary-600'
                              }`}
                              style={{ width: `${Math.min(displayPercentage, 100)}%` }}
                            />
                          </div>
                          {displayEarned && earned_at && (
                            <div className="mt-2 text-xs text-gray-500">
                              Получено: {formatDate(earned_at)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 py-8">
          Нет достижений для выбранной активности
        </p>
      )}
    </>
  );
};

