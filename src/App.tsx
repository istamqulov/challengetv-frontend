import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { HomePage } from '@/pages/HomePage';
import { ChallengesPage } from '@/pages/ChallengesPage';
import { ChallengeDetailPage } from '@/pages/ChallengeDetailPage';
import { LoginPage } from '@/pages/LoginPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';

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
  console.log('App component rendering...');
  
  try {
    const { verifyToken, tokens, isAuthenticated, user, initializeAuth } = useAuthStore();
    
    console.log('Current auth state:', { tokens, isAuthenticated, user });

    // Initialize authentication on app start
    useEffect(() => {
      console.log('App mounted, initializing auth...');
      initializeAuth();
    }, [initializeAuth]);

    // Verify token after initialization
    useEffect(() => {
      if (tokens?.access) {
        verifyToken().catch((error) => {
          console.warn('Token verification failed:', error);
        });
      }
    }, [tokens, verifyToken]);

    return (
      <BrowserRouter>
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
            path="/challenges/:slug"
            element={
              <Layout>
                <ChallengeDetailPage />
              </Layout>
            }
          />

          {/* Auth routes without layout */}
          <Route path="/login" element={<LoginPage />} />

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
