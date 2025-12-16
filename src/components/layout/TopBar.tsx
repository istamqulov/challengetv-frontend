import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, LogOut, TrendingUp, Award, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { PWAInstallButton } from '@/components/ui/PWAInstallButton';
import { apiClient } from '@/lib/api';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [totalHP, setTotalHP] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      loadUserStats();
    }
  }, [isAuthenticated, user]);

  const loadUserStats = async () => {
    try {
      const profile = await apiClient.getCurrentUser();
      if (profile?.profile) {
        setTotalHP(profile.profile.total_hp_earned || 0);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative overflow-hidden">
      {/* Festive border gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-festive-red via-festive-gold via-festive-green to-festive-red animate-festive-glow"></div>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <Trophy className="w-8 h-8 text-primary-600 group-hover:text-festive-gold transition-colors duration-300" />
            <span className="text-2xl font-bold text-gray-900">
              Challenge<span className="text-primary-600 group-hover:text-festive-red transition-colors duration-300">TV</span>
              <span className="ml-1 text-lg animate-twinkle">🎄</span>
            </span>
          </Link>

          {/* Right side: PWA Install Button and Navigation */}
          <div className="flex items-center space-x-4">
            {/* PWA Install Button - visible on all screen sizes */}
            <PWAInstallButton />

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/challenges"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Челленджи
              </Link>
              
              {isAuthenticated && (
                <>
                  {/* Top button - icon only */}
                  <Link
                    to="/top"
                    className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                    title="Top"
                  >
                    <TrendingUp className="w-5 h-5" />
                  </Link>
                  
                  {/* Achievements button - icon only */}
                  <Link
                    to="/achievements"
                    className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                    title="Достижения"
                  >
                    <Award className="w-5 h-5" />
                  </Link>
                  
                  {/* Total HP badge */}
                  {totalHP !== null && (
                    <div className="flex items-center space-x-1 text-sm bg-primary-50 px-3 py-1 rounded-full">
                      <Zap className="w-4 h-4 text-primary-600" />
                      <span className="font-bold text-primary-600">
                        {totalHP.toLocaleString()} HP
                      </span>
                    </div>
                  )}
                </>
              )}
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    Привет, {user?.username}!
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Выйти</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login">
                    <Button variant="outline" size="sm">
                      Войти
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      Регистрация
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

