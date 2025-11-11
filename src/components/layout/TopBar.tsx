import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Trophy className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">
              Challenge<span className="text-primary-600">TV</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/challenges"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              Челленджи
            </Link>
            <Link
              to="/achievements"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              Достижения
            </Link>
            <Link
              to="/top"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              Top
            </Link>
            
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
      </nav>
    </header>
  );
};

