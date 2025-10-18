import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, Calendar, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ChallengeList } from '@/types/api';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [activeChallenges, setActiveChallenges] = useState<ChallengeList[]>([]);
  const [popularChallenges, setPopularChallenges] = useState<ChallengeList[]>([]);
  const [upcomingChallenges, setUpcomingChallenges] = useState<ChallengeList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const [active, popular, upcoming] = await Promise.all([
        apiClient.getActiveChallenges(),
        apiClient.getPopularChallenges(),
        apiClient.getUpcomingChallenges(),
      ]);

      setActiveChallenges(active.slice(0, 3));
      setPopularChallenges(popular.slice(0, 3));
      setUpcomingChallenges(upcoming.slice(0, 3));
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-20">
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
              {isAuthenticated ? (
                <>
                  <Link to="/challenges">
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                      Смотреть челленджи
                    </Button>
                  </Link>
                  <Link to="/challenges/create">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-600">
                      Создать челлендж
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                      Начать сейчас
                    </Button>
                  </Link>
                  <Link to="/challenges">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-600">
                      Посмотреть челленджи
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

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

      {/* Active Challenges */}
      {!isLoading && activeChallenges.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Активные челленджи</h2>
              <Link to="/challenges?status=active">
                <Button variant="ghost">Смотреть все</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Challenges */}
      {!isLoading && popularChallenges.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Популярные челленджи</h2>
              <Link to="/challenges">
                <Button variant="ghost">Смотреть все</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Challenges */}
      {!isLoading && upcomingChallenges.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Предстоящие челленджи</h2>
              <Link to="/challenges">
                <Button variant="ghost">Смотреть все</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Готовы начать свой путь?
            </h2>
            <p className="text-xl mb-8">
              Присоединяйтесь к ChallengeTV и начните достигать своих целей уже сегодня!
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary">
                Зарегистрироваться бесплатно
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};
