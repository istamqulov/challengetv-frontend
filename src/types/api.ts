// API Types based on OpenAPI specification

export type ChallengeStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Challenge {
  id: number;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  image?: string | null;
  prize_description?: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  spare_days?: number;
  status: ChallengeStatus;
  created_by: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  min_participants: number;
  max_participants?: number | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  participants_count: number;
  is_full: boolean;
  levels: ChallengeLevel[];
  allowed_activities: ChallengeAllowedActivity[];
  joined?: boolean; // True if the authenticated user has joined this challenge
}

export interface ChallengeList {
  id: number;
  title: string;
  slug: string;
  short_description?: string;
  image?: string | null;
  start_date: string;
  end_date: string;
  duration_days: number;
  status: ChallengeStatus;
  is_public: boolean;
  participants_count: number;
  is_full: boolean;
  min_participants: number;
  max_participants?: number | null;
  joined?: boolean; // True if the authenticated user has joined this challenge
  levels?: ChallengeLevel[]; // Challenge levels for join modal
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Activity {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  hp_per_unit: string;
  unit_name: string;
}

export interface ChallengeAllowedActivity {
  id: number;
  activity: Activity;
  is_active: boolean;
}

// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile?: UserProfile;
  date_joined: string;
}

export interface UserProfile {
  avatar?: string | null;
  bio?: string;
  total_challenges_joined: number;
  total_challenges_completed: number;
  total_hp_earned: number;
  rank: number;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: User;
}

export interface ChallengeLevel {
  id: number;
  level_number: number;
  name: string;
  description?: string;
  required_hp_per_day: number;
  order: number;
}

export interface ChallengeFilters {
  search?: string;
  status?: ChallengeStatus;
  is_public?: boolean;
  has_space?: boolean;
  created_by?: number;
  start_date_from?: string;
  start_date_to?: string;
  duration_min?: number;
  duration_max?: number;
  ordering?: string;
  page?: number;
}

export interface Participant {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    profile?: any;
    date_joined: string;
  };
  challenge: number;
  challenge_level: number;
  joined_at: string;
  status: 'active' | 'completed' | 'failed' | 'withdrew';
  spare_days_used: number;
  current_streak: number;
  longest_streak: number;
  total_hp_earned: number;
  completion_percentage: string;
  days_completed: number;
  days_total: number;
  completed_at?: string | null;
}

// Daily Progress Types
export interface DailyProgressItem {
  id: number;
  daily_progress: number;
  activity: number;
  quantity: number;
  hp_earned: number;
  type: 'photo' | 'video' | 'text';
  file?: string;
  description: string;
  uploaded_at: string;
  status: 'pending' | 'approved' | 'rejected';
  activity_name?: string; // Added for display purposes
  activity_unit?: string; // Added for display purposes
}

export interface DailyProgress {
  id: number;
  date: string;
  total_hp: number;
  required_hp: number;
  is_completed: boolean;
  is_spare_day: boolean;
  activities_data: Record<string, any>;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
  completion_percentage: number;
  items: DailyProgressItem[];
}

export interface DailyProgressResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DailyProgress[];
}
