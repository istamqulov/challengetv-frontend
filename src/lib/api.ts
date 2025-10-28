import axios, { AxiosInstance } from 'axios';
import type {
  Challenge,
  ChallengeList,
  ChallengeFilters,
  PaginatedResponse,
  Participant,
  LoginCredentials,
  SignupCredentials,
  LoginResponse,
  AuthTokens,
  VerifyTokenResponse,
  User,
  DailyProgressResponse,
} from '@/types/api';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
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

  async getChallengeParticipants(slug: string): Promise<Participant[]> {
    const response = await this.client.get(`/challenges/${slug}/participants/`);
    // Handle paginated response
    if (response.data.results) {
      return response.data.results;
    }
    return response.data;
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.client.post('/auth/login/', credentials);
    return response.data;
  }

  async signup(credentials: SignupCredentials): Promise<User> {
    const response = await this.client.post('/users/', credentials);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await this.client.post('/auth/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  }

  async verifyToken(token: string): Promise<VerifyTokenResponse> {
    const response = await this.client.post('/auth/verify/', {
      token,
    });
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get('/users/me/');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.client.patch('/users/me/', data);
    return response.data;
  }

  async joinChallenge(slug: string, challengeLevelId: number): Promise<void> {
    await this.client.post(`/challenges/${slug}/join/`, {
      challenge_level_id: challengeLevelId,
    });
  }

  async leaveChallenge(slug: string): Promise<void> {
    await this.client.post(`/challenges/${slug}/leave/`);
  }

  async getDailyProgress(slug: string, participantId?: number): Promise<DailyProgressResponse> {
    const endpoint = participantId 
      ? `/challenges/${slug}/participants/${participantId}/daily-progress/`
      : `/challenges/${slug}/participants/me/daily-progress/`;
    const response = await this.client.get(endpoint);
    return response.data;
  }

  // Set authorization header for authenticated requests
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Remove authorization header
  clearAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }
}

export const apiClient = new ApiClient();