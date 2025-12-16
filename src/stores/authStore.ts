import { create } from 'zustand';
import { apiClient } from '@/lib/api';
import type { User, LoginCredentials, AuthTokens } from '@/types/api';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // Flag to track if auth has been initialized from storage
  error: string | null;
  isRefreshing: boolean; // Add flag to prevent infinite refresh loops
  isVerifying: boolean; // Flag to track if token verification is in progress
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
  isInitialized: false,
  error: null,
  isRefreshing: false,
  isVerifying: false,
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
          isInitialized: true,
          lastVerifiedToken: null,
          expiresAt: null,
        });
        return;
      }

      // If we have tokens, we should be authenticated
      const shouldBeAuthenticated = !!(stored.tokens?.access);
      
      set({
        user: stored.user || null,
        tokens: stored.tokens || null,
        isAuthenticated: shouldBeAuthenticated || stored.isAuthenticated || false,
        isInitialized: true,
        expiresAt: stored.expiresAt || null,
      });
      
      // Set auth token if available
      if (stored.tokens?.access) {
        apiClient.setAuthToken(stored.tokens.access);
        console.log('Auth token set from storage');
        
        // Update localStorage to ensure isAuthenticated is set if we have tokens
        if (shouldBeAuthenticated) {
          saveAuthToStorage({
            user: stored.user || null,
            tokens: stored.tokens,
            isAuthenticated: true,
            expiresAt: stored.expiresAt,
          });
        }
        
        // Only fetch fresh user data if we don't have user data or if it's stale
        if (!stored.user) {
          apiClient.getCurrentUser()
            .then((userData) => {
              console.log('Fetched fresh user data:', userData);
              set({ 
                user: userData,
                isAuthenticated: true, // Ensure authenticated state
              });
              // Update localStorage with fresh user data
              saveAuthToStorage({
                user: userData,
                tokens: stored.tokens,
                isAuthenticated: true,
                expiresAt: stored.expiresAt,
              });
            })
            .catch((error) => {
              // Don't reset auth state on error - token might still be valid
              // Only log the error
              console.warn('Failed to fetch user data:', error);
              // Keep the current auth state with tokens
            });
        }
      }
    } else {
      // No stored auth, mark as initialized
      set({ isInitialized: true });
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
        // No refresh token available, logout
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
        isAuthenticated: true, // Ensure authenticated state after refresh
        lastVerifiedToken: null, // Reset to allow verification of new token
      });

      // Update localStorage
      const currentState = get();
      saveAuthToStorage({
        user: currentState.user,
        tokens: newTokens,
        isAuthenticated: true,
        expiresAt: currentState.expiresAt || null,
      });

      // Update auth token for future requests
      apiClient.setAuthToken(newTokens.access);
    } catch (error: any) {
      // Only logout on authentication errors (401, 403), not on network errors
      const status = error?.response?.status;
      const isAuthError = status === 401 || status === 403;
      
      set({ isRefreshing: false });
      
      if (isAuthError) {
        // Refresh token is invalid or expired, logout
        console.warn('Token refresh failed with auth error:', error);
        get().logout();
      } else {
        // Network error or other error - don't logout, just log
        // The old token might still be valid
        console.warn('Token refresh failed due to network error:', error);
        // Keep the current auth state
      }
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
        // Token is invalid, try to refresh
        await get().refreshTokens();
      } else {
        // Token is valid, update state
        set({ 
          lastVerifiedToken: tokens.access,
          isAuthenticated: true, // Ensure authenticated state is set
        });
        // Update localStorage to ensure isAuthenticated is persisted
        const currentState = get();
        saveAuthToStorage({
          user: currentState.user,
          tokens: currentState.tokens,
          isAuthenticated: true,
          expiresAt: currentState.expiresAt,
        });
      }
    } catch (error: any) {
      // Only logout on authentication errors (401, 403), not on network errors
      const status = error?.response?.status;
      const isAuthError = status === 401 || status === 403;
      
      if (isAuthError) {
        // Real authentication error - token is invalid
        // Try to refresh first before logging out
        try {
          await get().refreshTokens();
        } catch (refreshError) {
          // Refresh failed, now we can logout
          console.warn('Token verification and refresh failed, logging out');
          get().logout();
        }
      } else {
        // Network error or other error - don't logout, just log the error
        // Token might still be valid, we just couldn't verify it
        console.warn('Token verification failed due to network error:', error);
        // Keep the current auth state, don't change anything
      }
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