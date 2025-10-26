import { create } from 'zustand';
import { apiClient } from '@/lib/api';
import type { User, LoginCredentials, AuthTokens } from '@/types/api';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  verifyToken: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

// Helper functions for localStorage
const AUTH_STORAGE_KEY = 'challengetv-auth';

const saveAuthToStorage = (data: Partial<AuthState>) => {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    console.log('Saved to localStorage:', data);
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadAuthFromStorage = (): Partial<AuthState> | null => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('Loaded from localStorage:', parsed);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return null;
};

const clearAuthFromStorage = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    console.log('Cleared localStorage');
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Initialize auth from localStorage
  initializeAuth: () => {
    const stored = loadAuthFromStorage();
    if (stored) {
      set({
        user: stored.user || null,
        tokens: stored.tokens || null,
        isAuthenticated: stored.isAuthenticated || false,
      });
      
      // Set auth token if available
      if (stored.tokens?.access) {
        apiClient.setAuthToken(stored.tokens.access);
        console.log('Auth token set from storage');
        
        // Fetch fresh user data
        apiClient.getCurrentUser()
          .then((userData) => {
            console.log('Fetched fresh user data:', userData);
            set({ user: userData });
            // Update localStorage with fresh user data
            saveAuthToStorage({
              user: userData,
              tokens: stored.tokens,
              isAuthenticated: true,
            });
          })
          .catch((error) => {
            console.warn('Failed to fetch user data:', error);
          });
      }
    }
  },

  // Actions
  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.login(credentials);
      
      // Store tokens and user data
      const tokens = {
        access: response.access,
        refresh: response.refresh,
      };
      
      const authData = {
        user: response.user,
        tokens,
        isAuthenticated: true,
      };
      
      set({
        ...authData,
        isLoading: false,
        error: null,
      });

      // Set auth token for future requests
      apiClient.setAuthToken(response.access);

      // Fetch fresh user data from the server
      try {
        const freshUserData = await apiClient.getCurrentUser();
        console.log('Fetched fresh user data after login:', freshUserData);
        
        // Update state with fresh user data
        const updatedAuthData = {
          user: freshUserData,
          tokens,
          isAuthenticated: true,
        };
        
        set({
          ...updatedAuthData,
          isLoading: false,
          error: null,
        });

        // Save fresh data to localStorage
        saveAuthToStorage(updatedAuthData);
      } catch (error) {
        console.warn('Failed to fetch fresh user data, using login response:', error);
        
        // Fallback to login response data
        set({
          ...authData,
          isLoading: false,
          error: null,
        });

        // Save to localStorage
        saveAuthToStorage(authData);
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Login failed',
        isLoading: false,
        isAuthenticated: false,
        user: null,
        tokens: null,
      });
      throw error;
    }
  },

  logout: () => {
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      error: null,
    });
    
    // Clear from localStorage
    clearAuthFromStorage();
    
    // Clear auth token from API client
    apiClient.clearAuthToken();
  },

  refreshTokens: async () => {
    const { tokens } = get();
    if (!tokens?.refresh) {
      get().logout();
      return;
    }

    try {
      const newTokens = await apiClient.refreshToken(tokens.refresh);
      
      set({
        tokens: newTokens,
        error: null,
      });

      // Update localStorage
      const currentState = get();
      saveAuthToStorage({
        user: currentState.user,
        tokens: newTokens,
        isAuthenticated: currentState.isAuthenticated,
      });

      // Update auth token for future requests
      apiClient.setAuthToken(newTokens.access);
    } catch (error) {
      // If refresh fails, logout user
      console.warn('Token refresh failed:', error);
      get().logout();
    }
  },

  verifyToken: async () => {
    const { tokens } = get();
    if (!tokens?.access) {
      get().logout();
      return;
    }

    try {
      const response = await apiClient.verifyToken(tokens.access);
      
      if (!response.valid) {
        // Try to refresh tokens
        await get().refreshTokens();
      }
    } catch (error) {
      // If verification fails, logout user
      console.warn('Token verification failed:', error);
      get().logout();
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));