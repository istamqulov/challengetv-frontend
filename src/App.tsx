import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ChallengesPage } from '@/pages/ChallengesPage';
import { ChallengeDetailPage } from '@/pages/ChallengeDetailPage';
import { useAuthStore } from '@/store/authStore';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>{children}</main>
    </div>
  );
};

function App() {
  const { fetchCurrentUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Load user data if authenticated
    const loadUser = async () => {
      if (isAuthenticated) {
        try {
          await fetchCurrentUser();
        } catch (error) {
          console.error('Failed to load user:', error);
        }
      }
    };
    
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes without layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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

        {/* Protected routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="py-20 text-center">
                  <h1 className="text-3xl font-bold">Profile Page</h1>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/create"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="py-20 text-center">
                  <h1 className="text-3xl font-bold">Create Challenge</h1>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
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
          path="/achievements"
          element={
            <Layout>
              <div className="py-20 text-center">
                <h1 className="text-3xl font-bold">Achievements</h1>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <Layout>
              <div className="py-20 text-center">
                <h1 className="text-3xl font-bold">Leaderboard</h1>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </Layout>
          }
        />

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
}

export default App;
