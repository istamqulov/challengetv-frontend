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
  DailyProgressUploadRequest,
  DailyProgressUploadResponse,
  ParticipantStats,
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
    const response = await this.client.patch('/users/update_profile/', data);
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

  async getParticipantStats(slug: string, participantId?: number): Promise<ParticipantStats> {
    const endpoint = participantId
      ? `/challenges/${slug}/participants/${participantId}/stats/`
      : `/challenges/${slug}/participants/me/stats/`;
    const response = await this.client.get(endpoint);
    return response.data;
  }

  async uploadDailyProgress(
    data: DailyProgressUploadRequest,
    onUploadProgress?: (progress: number) => void
  ): Promise<DailyProgressUploadResponse> {
    const formData = new FormData();
    formData.append('participant_id', data.participant_id.toString());
    formData.append('date', data.date);
    
    data.items.forEach((item, index) => {
      // Используем формат, который требует Django: items[0][field]
      formData.append(`items[${index}][activity]`, item.activity.toString());
      formData.append(`items[${index}][quantity]`, item.quantity.toString());
      formData.append(`items[${index}][type]`, item.type);
      formData.append(`items[${index}][description]`, item.description || '');
      
      if (item.file) {
        console.log(`Adding file for item ${index}:`, {
          name: item.file.name,
          size: item.file.size,
          type: item.file.type,
          lastModified: item.file.lastModified
        });
        formData.append(`items[${index}][file]`, item.file, item.file.name);
      }
    });

    // Debug: проверим содержимое FormData
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }


    const response = await this.client.post('/participants/daily-progress/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onUploadProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      },
    });
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