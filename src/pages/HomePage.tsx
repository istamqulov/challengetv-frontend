import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
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

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Готовы начать свой путь?
          </h2>
          <p className="text-xl mb-8">
            Присоединяйтесь к ChallengeTV и начните достигать своих целей уже сегодня!
          </p>
          <Link to="/challenges">
            <Button size="lg" variant="secondary">
              Посмотреть челленджи
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
