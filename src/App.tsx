import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TopBar } from '@/components/layout/TopBar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { PWAUpdatePrompt } from '@/components/ui/PWAUpdatePrompt';
import { HomePage } from '@/pages/HomePage';
import { ChallengesPage } from '@/pages/ChallengesPage';
import { ChallengeDetailPage } from '@/pages/ChallengeDetailPage';
import { TopPage } from '@/pages/TopPage';
import { AllAchievementsPage } from '@/pages/AllAchievementsPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ParticipantProgressPage } from '@/pages/ParticipantProgressPage';
import { SendProgressPage } from '@/pages/SendProgressPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <MobileHeader />
      <main className="pt-14 pb-20 md:pt-0 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
};

function App() {
  console.log('App component rendering...');
  
  try {
    const { verifyToken, tokens, isAuthenticated, user, initializeAuth } = useAuthStore();
    
    console.log('Current auth state:', { tokens, isAuthenticated, user });

    // Initialize authentication on app start (only once)
    useEffect(() => {
      console.log('App mounted, initializing auth...');
      initializeAuth();
    }, []); // Empty dependency array - run only once

    // Verify token after initialization (only when tokens change)
    useEffect(() => {
      if (tokens?.access && isAuthenticated) {
        console.log('Verifying token...');
        verifyToken().catch((error) => {
          console.warn('Token verification failed:', error);
        });
      }
    }, [tokens?.access, isAuthenticated]); // Only depend on access token and auth status

    return (
      <BrowserRouter>
        <PWAUpdatePrompt />
        <Routes>
          {/* Public routes with layout */}
          <Route
            path="/"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/challenges"
            element={
              <Layout>
                <ChallengesPage />
              </Layout>
            }
          />
          <Route
            path="/challenges/:slug/participants/:participantId/progress"
            element={
              <Layout>
                <ParticipantProgressPage />
              </Layout>
            }
          />
          <Route
            path="/challenges/:slug/participants"
            element={
              <Layout>
                <ChallengeDetailPage />
              </Layout>
            }
          />
          <Route
            path="/challenges/:slug/table"
            element={
              <Layout>
                <ChallengeDetailPage />
              </Layout>
            }
          />
          <Route
            path="/challenges/:slug/progress"
            element={
              <Layout>
                <ChallengeDetailPage />
              </Layout>
            }
          />
          <Route
            path="/challenges/:slug/achievements"
            element={
              <Layout>
                <ChallengeDetailPage />
              </Layout>
            }
          />
          <Route
            path="/challenges/:slug"
            element={
              <Layout>
                <ChallengeDetailPage />
              </Layout>
            }
          />
          <Route
            path="/top"
            element={
              <Layout>
                <TopPage />
              </Layout>
            }
          />
          <Route
            path="/achievements"
            element={
              <Layout>
                <AllAchievementsPage />
              </Layout>
            }
          />

          {/* Protected routes */}
          <Route
            path="/send-progress"
            element={
              <ProtectedRoute>
                <Layout>
                  <SendProgressPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Auth routes without layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <Layout>
                <div className="py-20 text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-xl text-gray-600 mb-8">Страница не найдена</p>
                  <a href="/" className="text-primary-600 hover:text-primary-700 font-medium">
                    Вернуться на главную
                  </a>
                </div>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    );
  } catch (error) {
    console.error('App rendering error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">
            Ошибка загрузки
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Произошла ошибка при загрузке приложения
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }
}

export default App;
