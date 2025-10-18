import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthTokens,
  LoginCredentials,
  UserRegistration,
  User,
  Challenge,
  ChallengeList,
  ChallengeCreate,
  ChallengeFilters,
  PaginatedResponse,
  ChallengeLevel,
  Activity,
  Achievement,
  JoinChallengeRequest,
  LeaderboardEntry,
  ChallengeStatistics,
  UserStatistics,
  Participant,
  ParticipantStatus,
  Proof,
  ProofList,
  ProofCreate,
  ProofFilters,
  DailyProgress,
} from '@/types/api';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
                refresh: refreshToken,
              });

              const { access } = response.data;
              localStorage.setItem('access_token', access);

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${access}`;
              }

              return this.client(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: UserRegistration): Promise<User> {
    const response = await this.client.post('/auth/register/', data);
    return response.data;
  }

  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await this.client.post('/auth/login/', credentials);
    const tokens = response.data;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    return tokens;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get('/users/me/');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.client.patch('/users/update_profile/', data);
    return response.data;
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Challenge endpoints
  async getChallenges(filters?: ChallengeFilters): Promise<PaginatedResponse<ChallengeList>> {
    const response = await this.client.get('/challenges/', { params: filters });
    return response.data;
  }

  async getChallenge(slug: string): Promise<Challenge> {
    const response = await this.client.get(`/challenges/${slug}/`);
    return response.data;
  }

  async createChallenge(data: ChallengeCreate): Promise<Challenge> {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await this.client.post('/challenges/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateChallenge(slug: string, data: Partial<ChallengeCreate>): Promise<Challenge> {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await this.client.patch(`/challenges/${slug}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteChallenge(slug: string): Promise<void> {
    await this.client.delete(`/challenges/${slug}/`);
  }

  async joinChallenge(slug: string, data: JoinChallengeRequest): Promise<Challenge> {
    const response = await this.client.post(`/challenges/${slug}/join/`, data);
    return response.data;
  }

  async leaveChallenge(slug: string): Promise<Challenge> {
    const response = await this.client.post(`/challenges/${slug}/leave/`);
    return response.data;
  }

  async getChallengeLevels(slug: string): Promise<ChallengeLevel[]> {
    const response = await this.client.get(`/challenges/${slug}/levels/`);
    return response.data;
  }

  async getChallengeParticipants(slug: string, status?: ParticipantStatus): Promise<Participant[]> {
    const response = await this.client.get(`/challenges/${slug}/participants/`, {
      params: status ? { status } : undefined,
    });
    // API может вернуть массив или объект с results
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.results) {
      return response.data.results;
    }
    return [];
  }

  async getChallengeLeaderboard(slug: string, limit?: number): Promise<LeaderboardEntry[]> {
    const response = await this.client.get(`/challenges/${slug}/leaderboard/`, {
      params: limit ? { limit } : undefined,
    });
    // API может вернуть массив или объект с results
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.results) {
      return response.data.results;
    }
    return [];
  }

  async getChallengeStatistics(slug: string): Promise<ChallengeStatistics> {
    const response = await this.client.get(`/challenges/${slug}/statistics/`);
    return response.data;
  }

  async getActiveChallenges(): Promise<ChallengeList[]> {
    const response = await this.client.get('/challenges/active/');
    return response.data;
  }

  async getPopularChallenges(): Promise<ChallengeList[]> {
    const response = await this.client.get('/challenges/popular/');
    return response.data;
  }

  async getUpcomingChallenges(): Promise<ChallengeList[]> {
    const response = await this.client.get('/challenges/upcoming/');
    return response.data;
  }

  // Activity endpoints
  async getActivities(): Promise<PaginatedResponse<Activity>> {
    const response = await this.client.get('/activities/');
    return response.data;
  }

  async getActivity(slug: string): Promise<Activity> {
    const response = await this.client.get(`/activities/${slug}/`);
    return response.data;
  }

  // Achievement endpoints
  async getAchievements(): Promise<PaginatedResponse<Achievement>> {
    const response = await this.client.get('/achievements/');
    return response.data;
  }

  async getAchievement(slug: string): Promise<Achievement> {
    const response = await this.client.get(`/achievements/${slug}/`);
    return response.data;
  }

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    const response = await this.client.get(`/users/${userId}/achievements/`);
    return response.data;
  }

  // User endpoints
  async getUser(userId: number): Promise<User> {
    const response = await this.client.get(`/users/${userId}/`);
    return response.data;
  }

  async getUserStatistics(userId: number): Promise<UserStatistics> {
    const response = await this.client.get(`/users/${userId}/statistics/`);
    return response.data;
  }

  async getUsers(params?: { search?: string; page?: number }): Promise<PaginatedResponse<User>> {
    const response = await this.client.get('/users/', { params });
    return response.data;
  }

  // Proof endpoints
  async getProofs(filters?: ProofFilters): Promise<PaginatedResponse<ProofList>> {
    const response = await this.client.get('/proofs/', { params: filters });
    return response.data;
  }

  async getProof(id: number): Promise<Proof> {
    const response = await this.client.get(`/proofs/${id}/`);
    return response.data;
  }

  async createProof(data: ProofCreate): Promise<Proof> {
    const formData = new FormData();
    formData.append('daily_progress', data.daily_progress.toString());
    formData.append('activity_id', data.activity_id.toString());
    formData.append('quantity', data.quantity.toString());
    formData.append('proof_type', data.proof_type);
    
    if (data.file instanceof File) {
      formData.append('file', data.file);
    }
    
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await this.client.post('/proofs/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateProof(id: number, data: Partial<ProofCreate>): Promise<Proof> {
    const formData = new FormData();
    
    if (data.quantity !== undefined) {
      formData.append('quantity', data.quantity.toString());
    }
    if (data.description !== undefined) {
      formData.append('description', data.description);
    }
    if (data.file instanceof File) {
      formData.append('file', data.file);
    }

    const response = await this.client.patch(`/proofs/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteProof(id: number): Promise<void> {
    await this.client.delete(`/proofs/${id}/`);
  }

  async getMyProofs(params?: { page?: number; ordering?: string }): Promise<PaginatedResponse<ProofList>> {
    const response = await this.client.get('/proofs/my_proofs/', { params });
    return response.data;
  }

  async getProofStats(): Promise<any> {
    const response = await this.client.get('/proofs/stats/');
    return response.data;
  }

  async flagProof(id: number, reason: string): Promise<Proof> {
    const response = await this.client.post(`/proofs/${id}/flag/`, {
      flag_reason: reason,
    });
    return response.data;
  }

  // Daily Progress endpoints
  // ИСПРАВЛЕНО: использует правильный endpoint из API спецификации
  async getDailyProgress(participantId: number, date?: string): Promise<DailyProgress | null> {
    try {
      const params: any = { participant: participantId };
      if (date) {
        params.date = date;
      }

      const response = await this.client.get('/daily-progress/', { params });

      // API возвращает список, берем первый элемент если он есть
      if (Array.isArray(response.data)) {
        return response.data.length > 0 ? response.data[0] : null;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        return response.data.results.length > 0 ? response.data.results[0] : null;
      }

      return null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createDailyProgress(participantId: number, date: string, notes?: string): Promise<DailyProgress> {
    const response = await this.client.post('/daily-progress/', {
      participant: participantId,
      date,
      notes,
    });
    return response.data;
  }

  /**
   * Получить список дневного прогресса с фильтрацией
   */
  async getDailyProgressList(params?: {
    participant?: number;
    date?: string;
    challenge?: number;
    page?: number;
  }): Promise<PaginatedResponse<DailyProgress>> {
    const response = await this.client.get('/daily-progress/', { params });
    return response.data;
  }

  /**
   * Получить конкретный дневной прогресс по ID
   */
  async getDailyProgressById(id: number): Promise<DailyProgress> {
    const response = await this.client.get(`/daily-progress/${id}/`);
    return response.data;
  }

  /**
   * Обновить дневной прогресс
   */
  async updateDailyProgress(id: number, data: Partial<DailyProgress>): Promise<DailyProgress> {
    const response = await this.client.patch(`/daily-progress/${id}/`, data);
    return response.data;
  }
}

export const apiClient = new ApiClient();