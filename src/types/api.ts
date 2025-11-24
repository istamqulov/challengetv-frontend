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
  allow_photo: boolean;
  allow_video: boolean;
  recommended_proof_type: 'photo' | 'video' | null;
  recommended_proof_description?: string | null;
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
  challenge: {
    id: number;
    title: string;
    slug: string;
    short_description?: string;
    image?: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    status: ChallengeStatus;
    is_public: boolean;
    participants_count: number;
    is_full: boolean;
    min_participants: number;
    max_participants?: number;
    joined?: boolean;
  };
  challenge_level: {
    id: number;
    level_number: number;
    name: string;
    description?: string;
    required_hp_per_day: number;
    order: number;
    activities: Array<{
      id: number;
      activity: Activity;
      daily_target: number;
      target_hp: number;
      is_required: boolean;
      order: number;
    }>;
  };
  joined_at: string;
  status: 'active' | 'completed' | 'failed' | 'withdrew';
  spare_days_used: number;
  current_streak: number;
  current_streak_display: string;
  longest_streak: number;
  total_hp_earned: number;
  completion_percentage: string;
  completion_percentage_display: string;
  days_completed: number;
  days_total: number;
  completed_at?: string | null;
  daily_progress?: DailyProgress[];
  statistics?: any;
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

// Daily Progress Upload Types
export interface DailyProgressUploadItem {
  activity: number;
  quantity: number;
  type: 'photo' | 'video' | 'text';
  file?: File;
  description: string;
}

export interface DailyProgressUploadRequest {
  participant_id: number;
  date: string;
  items: DailyProgressUploadItem[];
}

export interface DailyProgressUploadResponse {
  message: string;
  daily_progress_id: number;
  date: string;
  total_hp: number;
  required_hp: number;
  is_completed: boolean;
  items_created: number;
  items: Array<{
    id: number;
    activity: string;
    quantity: number;
    hp_earned: number;
    type: 'photo' | 'video' | 'text';
    status: 'pending' | 'approved' | 'rejected';
    uploaded_at: string;
  }>;
}

// Participant overall stats for a challenge
export interface ParticipantStats {
  total_days: number;
  completed_days: number;
  failed_days: number;
  spare_days_used: number;
  average_hp_per_day: string;
  completion_rate: string; // percentage string like "25.00"
  total_hp: number; // total earned by user for the challenge
  total_hp_required: number; // total required by challenge for full duration
  days_by_status: {
    completed: number;
    failed: number;
    spare: number;
  };
  hp_trend: Array<{
    date: string; // YYYY-MM-DD
    total_hp: number;
  }>;
}

// Achievement Types
export interface Achievement {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  condition: string;
  activity: number;
  activity_name: string;
  activity_slug: string;
  achievement_type: 'daily' | 'total_in_period' | 'streak' | 'total';
  achievement_type_display: string;
  required_quantity: number;
  minimum_quantity: number | null;
  period_days: number | null;
  hp_reward: number;
  is_active: boolean;
}

export interface AchievementProgress {
  is_earned: boolean;
  current: number;
  target: number;
  percentage: number;
  earned_at: string | null;
}

export interface ChallengeAchievement {
  achievement: Achievement;
  progress: AchievementProgress;
  is_earned: boolean;
  current: number;
  target: number;
  percentage: number;
  earned_at: string | null;
}

export interface AchievementWithUsers {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  condition: string;
  activity: number;
  activity_name: string;
  activity_slug: string;
  achievement_type: 'daily' | 'total_in_period' | 'streak' | 'total';
  achievement_type_display: string;
  required_quantity: number;
  minimum_quantity: number | null;
  period_days: number | null;
  hp_reward: number;
  is_active: boolean;
  users: Array<{
    user: User;
    earned_at: string;
  }>;
}

// Feed Types
export interface FeedItem {
  id: number;
  user: User;
  participant: {
    id: number;
    current_streak: number;
    total_hp_earned: number;
  };
  challenge: {
    id: number;
    title: string;
    slug: string;
  };
  activity_name: string;
  quantity: number;
  hp_earned: number;
  type: 'photo' | 'video' | 'text';
  file?: string | null;
  description: string;
  date: string;
  daily_progress_date?: string;
  uploaded_at: string;
  kudos_count: number;
  comments_count: number;
  has_user_kudoed: boolean;
  recent_kudos: Array<{
    id: number;
    user: User;
    created_at: string;
  }>;
  recent_comments: Array<{
    id: number;
    user: User;
    text: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface FeedResponse extends PaginatedResponse<FeedItem> {}

export interface KudoResponse {
  message: string;
  has_kudoed: boolean;
  kudos_count: number;
}

export interface Comment {
  id: number;
  user: User;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface CommentListResponse extends PaginatedResponse<Comment> {}

export interface KudoListResponse extends PaginatedResponse<{
  id: number;
  user: User;
  created_at: string;
}> {}

export interface CreateCommentRequest {
  text: string;
}

export interface UpdateCommentRequest {
  text: string;
}

// User Profile Types
export interface ActivityByType {
  activity_name: string;
  activity_slug: string;
  unit_name: string;
  total_quantity: number;
  items_count: number;
}

export interface UserProfileStatistics {
  total_hp_earned: number;
  total_hp_from_items: number;
  total_challenges_joined: number;
  total_challenges_completed: number;
  participations: {
    total: number;
    active: number;
    completed: number;
  };
  progress_items: {
    total: number;
    approved: number;
    pending: number;
  };
  activities_by_type: ActivityByType[];
  achievements: {
    total_count: number;
  };
  daily_progress: {
    total_days: number;
    avg_hp_per_day: number;
  };
}

export interface UserProfileResponse {
  user: User;
  profile: UserProfile;
  statistics: UserProfileStatistics;
}

// Top Users Types
export interface TopUser {
  user: User;
  total_quantity: number;
  rank: number;
}
