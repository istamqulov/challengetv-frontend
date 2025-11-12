import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import { PWAInstallButton } from '@/components/ui/PWAInstallButton';

export const MobileHeader: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [totalHP, setTotalHP] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      loadUserStats();
    }
  }, [isAuthenticated, user]);

  const loadUserStats = async () => {
    try {
      // Get current user profile with HP stats
      const profile = await apiClient.getCurrentUser();
      if (profile?.profile) {
        setTotalHP(profile.profile.total_hp_earned || 0);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  return (
    <header className="md:hidden bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-[100] will-change-transform" style={{ position: 'fixed', transform: 'translateZ(0)' }}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-primary-600" />
          <span className="text-lg font-bold text-gray-900">
            Challenge<span className="text-primary-600">TV</span>
          </span>
        </Link>

        {/* Right side: PWA Install Button and HP */}
        <div className="flex items-center space-x-2">
          {/* PWA Install Button */}
          <PWAInstallButton />
          
          {/* Total HP - only for authenticated users */}
          {isAuthenticated && totalHP !== null && (
            <div className="flex items-center space-x-1 text-sm bg-primary-50 px-3 py-1 rounded-full">
              <Zap className="w-4 h-4 text-primary-600" />
              <span className="font-bold text-primary-600">
                {totalHP.toLocaleString()} HP
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

