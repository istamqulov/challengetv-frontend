import axios, { AxiosInstance } from 'axios';
import type {
  Challenge,
  ChallengeList,
  ChallengeFilters,
  PaginatedResponse,
  Participant,
  ChallengeLevel,
  Activity,
  ChallengeAllowedActivity,
  LoginCredentials,
  LoginResponse,
  AuthTokens,
  VerifyTokenRequest,
  VerifyTokenResponse,
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