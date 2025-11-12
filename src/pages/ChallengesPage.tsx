import React, { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { apiClient } from '@/lib/api';
import type { ChallengeList, ChallengeFilters } from '@/types/api';

export const ChallengesPage: React.FC = () => {
  const [challenges, setChallenges] = useState<ChallengeList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ChallengeFilters>({
    page: 1,
    ordering: '-start_date',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadChallenges();
  }, [filters]);

  const loadChallenges = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getChallenges(filters);
      setChallenges(response.results);
      setTotalPages(Math.ceil(response.count / 10));
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchTerm, page: 1 });
  };

  const handleFilterChange = (key: keyof ChallengeFilters, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Челленджи
          </h1>
          <p className="text-lg text-gray-600">
            Найдите челлендж по душе и начните свой путь к успеху
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Поиск челленджей..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <Button type="submit" variant="primary" className="flex-1 sm:flex-none">
                Найти
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 sm:flex-none"
              >
                <Filter className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Фильтры</span>
              </Button>
            </div>
          </form>

          {showFilters && (
            <div className="border-t pt-4 mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) =>
                    handleFilterChange('status', e.target.value || undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                >
                  <option value="">Все</option>
                  <option value="active">Активные</option>
                  <option value="completed">Завершенные</option>
                  <option value="draft">Черновики</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип
                </label>
                <select
                  value={filters.is_public === undefined ? '' : String(filters.is_public)}
                  onChange={(e) =>
                    handleFilterChange(
                      'is_public',
                      e.target.value === '' ? undefined : e.target.value === 'true'
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                >
                  <option value="">Все</option>
                  <option value="true">Публичные</option>
                  <option value="false">Приватные</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сортировка
                </label>
                <select
                  value={filters.ordering || '-start_date'}
                  onChange={(e) => handleFilterChange('ordering', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                >
                  <option value="-start_date">Новые первыми</option>
                  <option value="start_date">Старые первыми</option>
                  <option value="-participants_count">Популярные</option>
                  <option value="duration_days">По длительности</option>
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-3 flex gap-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.has_space || false}
                    onChange={(e) =>
                      handleFilterChange('has_space', e.target.checked || undefined)
                    }
                    className="mr-2 rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Есть свободные места</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : challenges.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={(filters.page || 1) <= 1}
                >
                  Назад
                </Button>

                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === (filters.page || 1) ? 'primary' : 'ghost'}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={(filters.page || 1) >= totalPages}
                >
                  Вперед
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600 mb-4">
              Челленджи не найдены
            </p>
            <Button variant="primary" onClick={() => {
              setFilters({ page: 1, ordering: '-start_date' });
              setSearchTerm('');
            }}>
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
