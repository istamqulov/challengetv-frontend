import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { apiClient } from '@/lib/api';
import type { User } from '@/types/api';
import { getAvatarUrl, formatNumber } from '@/lib/utils';

export const TopPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    count: number;
    next: string | null;
    previous: string | null;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadTopUsers(currentPage);
  }, [currentPage]);

  const loadTopUsers = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getTopUsers(page);
      setUsers(response.results);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки топа пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Medal className="w-8 h-8 text-yellow-500" fill="currentColor" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" fill="currentColor" />;
      case 3:
        return <Medal className="w-8 h-8 text-[#b45f2a]" fill="currentColor" />;
      default:
        return null;
    }
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-[#fdf2e9] to-[#f4d9bf] border-[#c9793b]';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getPositionDisplay = (position: number) => {
    if (position <= 3) {
      return null; // Медаль заменяет номер
    }
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 font-bold">
        {position}
      </div>
    );
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="py-12">
        <Loading text="Загрузка топа пользователей..." />
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="py-12">
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => loadTopUsers(currentPage)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Попробовать снова
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <Trophy className="w-12 h-12 text-yellow-500 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">Топ участников</h1>
          <Sparkles className="w-12 h-12 text-yellow-500 ml-3" />
        </div>
        <p className="text-gray-600 text-lg">
          Рейтинг пользователей по заработанным HP
        </p>
        {pagination && (
          <p className="text-sm text-gray-500 mt-2">
            Всего участников: {formatNumber(pagination.count)}
          </p>
        )}
      </div>

      {/* Top 3 Podium */}
      {users.length >= 3 && (
        <div className="mb-8">
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-center sm:gap-6 mb-6">
            {/* 2nd Place */}
            <div className="w-full order-2 sm:order-1 sm:flex-1 sm:max-w-[200px]">
              <Card className={`h-full p-6 text-center ${getMedalColor(2)} border-2`}>
                <div className="flex justify-center mb-3">
                  {getMedalIcon(2)}
                </div>
                <Avatar
                  src={getAvatarUrl(users[1].profile?.avatar)}
                  alt={users[1].username}
                  size="lg"
                  className="mx-auto mb-3"
                />
                <h3 className="font-bold text-gray-900 mb-1 truncate">
                  {users[1].username}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {users[1].first_name && users[1].last_name
                    ? `${users[1].first_name} ${users[1].last_name}`
                    : ''}
                </p>
                <div className="bg-white rounded-lg p-2">
                  <div className="text-2xl font-bold text-[#b45f2a]">
                    {formatNumber(users[1].profile?.total_hp_earned || 0)}
                  </div>
                  <div className="text-xs text-gray-500">HP</div>
                </div>
              </Card>
            </div>

            {/* 1st Place */}
            <div className="w-full order-1 sm:order-2 sm:flex-1 sm:max-w-[240px] sm:-mt-6">
              <Card className={`h-full p-6 text-center ${getMedalColor(1)} border-2 border-yellow-400 shadow-lg sm:shadow-xl`}>
                <div className="flex justify-center mb-3">
                  {getMedalIcon(1)}
                </div>
                <div className="relative mb-3">
                  <Avatar
                    src={getAvatarUrl(users[0].profile?.avatar)}
                    alt={users[0].username}
                    size="xl"
                    className="mx-auto"
                  />
                  <Award className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 truncate text-lg">
                  {users[0].username}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {users[0].first_name && users[0].last_name
                    ? `${users[0].first_name} ${users[0].last_name}`
                    : ''}
                </p>
                <div className="bg-white rounded-lg p-2">
                  <div className="text-3xl font-bold text-yellow-600">
                    {formatNumber(users[0].profile?.total_hp_earned || 0)}
                  </div>
                  <div className="text-xs text-gray-500">HP</div>
                </div>
              </Card>
            </div>

            {/* 3rd Place */}
            <div className="w-full order-3 sm:order-3 sm:flex-1 sm:max-w-[200px]">
              <Card className={`h-full p-6 text-center ${getMedalColor(3)} border-2`}>
                <div className="flex justify-center mb-3">
                  {getMedalIcon(3)}
                </div>
                <Avatar
                  src={getAvatarUrl(users[2].profile?.avatar)}
                  alt={users[2].username}
                  size="lg"
                  className="mx-auto mb-3"
                />
                <h3 className="font-bold text-gray-900 mb-1 truncate">
                  {users[2].username}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {users[2].first_name && users[2].last_name
                    ? `${users[2].first_name} ${users[2].last_name}`
                    : ''}
                </p>
                <div className="bg-white rounded-lg p-2">
                  <div className="text-2xl font-bold text-gray-700">
                    {formatNumber(users[2].profile?.total_hp_earned || 0)}
                  </div>
                  <div className="text-xs text-gray-500">HP</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the list */}
      <div className="space-y-3">
        {users.map((user, index) => {
          const position = index + 1;
          const isTop3 = position <= 3;
          
          // Показываем топ-3 только в подиуме, в списке начинаем с 4-го
          if (isTop3 && users.length >= 3) {
            return null;
          }

          return (
            <Card
              key={user.id}
              className={`p-4 hover:shadow-md transition-shadow ${getMedalColor(position)}`}
            >
              <div className="flex items-center space-x-4">
                {/* Position */}
                <div className="flex-shrink-0">
                  {getPositionDisplay(position)}
                </div>

                {/* Avatar */}
                <Avatar
                  src={getAvatarUrl(user.profile?.avatar)}
                  alt={user.username}
                  size="md"
                />

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {user.username}
                  </h3>
                  {user.first_name && user.last_name && (
                    <p className="text-sm text-gray-600 truncate">
                      {user.first_name} {user.last_name}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span>
                      Челленджей: {user.profile?.total_challenges_joined || 0}
                    </span>
                    <span>
                      Завершено: {user.profile?.total_challenges_completed || 0}
                    </span>
                  </div>
                </div>

                {/* HP Earned */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {formatNumber(user.profile?.total_hp_earned || 0)}
                  </div>
                  <div className="text-sm text-gray-500">HP</div>
                  {user.profile?.rank && (
                    <div className="text-xs text-gray-400 mt-1">
                      Ранг: #{user.profile.rank}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && (pagination.next || pagination.previous) && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!pagination.previous || isLoading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Назад
          </button>
          <span className="text-gray-600">
            Страница {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pagination.next || isLoading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
};

