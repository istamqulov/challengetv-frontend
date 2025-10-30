import { create } from 'zustand';
import { apiClient } from '@/lib/api';
import type { User, LoginCredentials, AuthTokens } from '@/types/api';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean; // Add flag to prevent infinite refresh loops
  lastVerifiedToken: string | null; // Track last verified token to prevent re-verification
  expiresAt: number | null; // Unix ms timestamp when refresh lifetime ends
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  verifyToken: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
  updateUser: (user: User) => void;
}

type AuthStore = AuthState & AuthActions;

// Helper functions for localStorage
const AUTH_STORAGE_KEY = 'challengetv-auth';
const REFRESH_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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
  isRefreshing: false,
  lastVerifiedToken: null,
  expiresAt: null,

  // Initialize auth from localStorage
  initializeAuth: () => {
    const stored = loadAuthFromStorage();
    if (stored) {
      // Enforce 7-day lifetime aligned with refresh token policy
      if (stored.expiresAt && Date.now() > stored.expiresAt) {
        // Expired persisted auth -> clear everything
        clearAuthFromStorage();
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          lastVerifiedToken: null,
          expiresAt: null,
        });
        return;
      }

      set({
        user: stored.user || null,
        tokens: stored.tokens || null,
        isAuthenticated: stored.isAuthenticated || false,
        expiresAt: stored.expiresAt || null,
      });
      
      // Set auth token if available
      if (stored.tokens?.access) {
        apiClient.setAuthToken(stored.tokens.access);
        console.log('Auth token set from storage');
        
        // Only fetch fresh user data if we don't have user data or if it's stale
        if (!stored.user) {
          apiClient.getCurrentUser()
            .then((userData) => {
              console.log('Fetched fresh user data:', userData);
              set({ user: userData });
              // Update localStorage with fresh user data
              saveAuthToStorage({
                user: userData,
                tokens: stored.tokens,
                isAuthenticated: true,
                expiresAt: stored.expiresAt,
              });
            })
            .catch((error) => {
              console.warn('Failed to fetch user data:', error);
            });
        }
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
      const expiresAt = Date.now() + REFRESH_LIFETIME_MS;
      
      const authData = {
        user: response.user,
        tokens,
        isAuthenticated: true,
        expiresAt,
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
          expiresAt,
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
        expiresAt: null,
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
      lastVerifiedToken: null, // Reset verification flag
      expiresAt: null,
    });
    
    // Clear from localStorage
    clearAuthFromStorage();
    
    // Clear auth token from API client
    apiClient.clearAuthToken();
  },

  refreshTokens: async () => {
    const { tokens, isRefreshing } = get();
    if (!tokens?.refresh || isRefreshing) {
      if (!tokens?.refresh) {
        get().logout();
      }
      return;
    }

    set({ isRefreshing: true });

    try {
      const newTokens = await apiClient.refreshToken(tokens.refresh);
      
      set({
        tokens: newTokens,
        error: null,
        isRefreshing: false,
      });

      // Update localStorage
      const currentState = get();
      saveAuthToStorage({
        user: currentState.user,
        tokens: newTokens,
        isAuthenticated: currentState.isAuthenticated,
        expiresAt: currentState.expiresAt || null,
      });

      // Update auth token for future requests
      apiClient.setAuthToken(newTokens.access);
    } catch (error) {
      // If refresh fails, logout user
      console.warn('Token refresh failed:', error);
      set({ isRefreshing: false });
      get().logout();
    }
  },

  verifyToken: async () => {
    const { tokens, isRefreshing, isVerifying, lastVerifiedToken } = get();
    if (!tokens?.access || isRefreshing || isVerifying) return;

    // Don't verify same token twice
    if (lastVerifiedToken === tokens.access) return;

    set({ isVerifying: true });
    try {
      const response = await apiClient.verifyToken(tokens.access);
      if (!response.valid && !isRefreshing) {
        await get().refreshTokens();
      } else {
        set({ lastVerifiedToken: tokens.access });
      }
    } catch (error) {
      get().logout();
    } finally {
      set({ isVerifying: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  updateUser: (user: User) => {
    set((state) => {
      const nextState = {
        ...state,
        user,
        isAuthenticated: true,
      } as AuthState;
      // Persist updated user
      saveAuthToStorage({
        user,
        tokens: state.tokens || null,
        isAuthenticated: true,
        expiresAt: state.expiresAt || null,
      });
      return nextState;
    });
  },
}));