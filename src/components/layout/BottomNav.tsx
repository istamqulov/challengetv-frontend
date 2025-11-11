import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Award, Plus, TrendingUp, User, LogIn } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { isChallengeActive } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import type { ChallengeList } from '@/types/api';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [challenges, setChallenges] = React.useState<ChallengeList[]>([]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadChallenges();
    }
  }, [isAuthenticated]);

  const loadChallenges = async () => {
    try {
      const response = await apiClient.getChallenges();
      const challengesData = response.results || [];
      setChallenges(challengesData);
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const getFirstActiveChallenge = (): ChallengeList | null => {
    return challenges.find(challenge => {
      return isChallengeActive(challenge.start_date, challenge.end_date) && challenge.joined === true;
    }) || null;
  };

  const handleSendReport = () => {
    const firstActiveChallenge = getFirstActiveChallenge();
    if (firstActiveChallenge) {
      navigate(`/challenges/${firstActiveChallenge.slug}/send`);
    } else {
      // If no active challenge, go to challenges page
      navigate('/challenges');
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (!isAuthenticated) {
    // Show minimal navigation for non-authenticated users
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-[100] will-change-transform" style={{ position: 'fixed', transform: 'translateZ(0)' }}>
        <div className="flex items-center justify-around h-16 px-4">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center flex-1 ${
              isActive('/') && location.pathname === '/' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <Trophy className="w-6 h-6" />
            <span className="text-xs mt-1">Главная</span>
          </Link>
          
          <Link
            to="/challenges"
            className={`flex flex-col items-center justify-center flex-1 ${
              isActive('/challenges') ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <Trophy className="w-6 h-6" />
            <span className="text-xs mt-1">Челленджи</span>
          </Link>

          <Link
            to="/login"
            className={`flex flex-col items-center justify-center flex-1 ${
              isActive('/login') ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <LogIn className="w-6 h-6" />
            <span className="text-xs mt-1">Войти</span>
          </Link>
        </div>
      </nav>
    );
  }

  // For authenticated users - show full navigation with FAB
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-[100] will-change-transform" style={{ position: 'fixed', transform: 'translateZ(0)' }}>
      <div className="relative flex items-center justify-around h-16 px-2">
        {/* Challenges */}
        <Link
          to="/challenges"
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            isActive('/challenges') ? 'text-primary-600' : 'text-gray-600'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-xs mt-1">Челленджи</span>
        </Link>

        {/* Achievements */}
        <Link
          to="/achievements"
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            isActive('/achievements') ? 'text-primary-600' : 'text-gray-600'
          }`}
        >
          <Award className="w-5 h-5" />
          <span className="text-xs mt-1">Достижения</span>
        </Link>

        {/* Send Progress FAB (Floating Action Button) */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={handleSendReport}
            className="absolute -top-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {/* Top */}
        <Link
          to="/top"
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            isActive('/top') ? 'text-primary-600' : 'text-gray-600'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-xs mt-1">Top</span>
        </Link>

        {/* Profile */}
        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            isActive('/profile') ? 'text-primary-600' : 'text-gray-600'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">Профиль</span>
        </Link>
      </div>
    </nav>
  );
};

