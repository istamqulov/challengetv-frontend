import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Plus, User, LogIn, Compass, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { isChallengeActive, cn } from '@/lib/utils';
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
    // First try to find active challenge where user is joined
    const activeJoined = challenges.find(challenge => {
      return isChallengeActive(challenge.start_date, challenge.end_date) && challenge.joined === true;
    });
    if (activeJoined) return activeJoined;
    
    // If not found, get first challenge where user is joined
    const firstJoined = challenges.find(challenge => challenge.joined === true);
    if (firstJoined) return firstJoined;
    
    // If still not found, get first challenge
    return challenges.length > 0 ? challenges[0] : null;
  };

  const handleSendReport = () => {
    const firstActiveChallenge = getFirstActiveChallenge();
    if (firstActiveChallenge) {
      navigate(`/send-progress?challenge=${firstActiveChallenge.slug}`);
    } else {
      // If no active challenge, go to send progress page
      navigate('/send-progress');
    }
  };

  const handleChallengeClick = () => {
    const firstChallenge = getFirstActiveChallenge();
    if (firstChallenge) {
      navigate(`/challenges/${firstChallenge.slug}`);
    } else {
      navigate('/challenges');
    }
  };

  const handleMyProgressClick = () => {
    const firstChallenge = getFirstActiveChallenge();
    if (firstChallenge) {
      navigate(`/challenges/${firstChallenge.slug}/progress`);
    } else {
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
        {/* Обзор (Explore) */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            isActive('/') && location.pathname === '/' ? 'text-primary-600' : 'text-gray-600'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-xs mt-1">Обзор</span>
        </Link>

        {/* Challenge */}
        <button
          onClick={handleChallengeClick}
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            isActive('/challenges') ? 'text-primary-600' : 'text-gray-600'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-xs mt-1">Challenge</span>
        </button>

        {/* Send Progress FAB (Floating Action Button) */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={handleSendReport}
            className={cn(
              "absolute -top-6 rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95",
              isActive('/send-progress')
                ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white ring-4 ring-primary-200'
                : 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
            )}
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {/* My Progress */}
        <button
          onClick={handleMyProgressClick}
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            isActive('/challenges') && location.pathname.includes('/progress') ? 'text-primary-600' : 'text-gray-600'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-xs mt-1">My Progress</span>
        </button>

        {/* Profile */}
        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center flex-1 transition-colors ${
            isActive('/profile') ? 'text-primary-600' : 'text-gray-600'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  );
};

