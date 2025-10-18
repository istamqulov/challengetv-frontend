// API Types based on OpenAPI specification

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile: UserProfile;
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

export interface UserRegistration {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

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
  created_by: User;
  min_participants: number;
  max_participants?: number | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  levels: ChallengeLevel[];
  allowed_activities: ChallengeAllowedActivity[];
  participants_count: number;
  is_full: boolean;
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
}

export interface ChallengeCreate {
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  image?: File | null;
  prize_description?: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  spare_days?: number;
  status?: ChallengeStatus;
  min_participants: number;
  max_participants?: number | null;
  is_public?: boolean;
}

export interface ChallengeLevel {
  id: number;
  level_number: number;
  name: string;
  description?: string;
  required_hp_per_day: number;
  order: number;
  activities: ChallengeLevelActivity[];
}

export interface ChallengeLevelActivity {
  id: number;
  activity: Activity;
  daily_target: number;
  target_hp: number;
  is_required: boolean;
  order: number;
}

export interface Activity {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  hp_per_unit: number;
  unit_name: string;
}

export interface ChallengeAllowedActivity {
  id: number;
  activity: Activity;
  is_active: boolean;
}

export interface Achievement {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: string | null;
  condition: string;
  hp_reward: number;
  is_active: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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

export interface JoinChallengeRequest {
  challenge_level_id: number;
}

export type ParticipantStatus = 'active' | 'completed' | 'failed' | 'withdrew';

export interface Participant {
  id: number;
  user: User;
  challenge: number;
  challenge_level: ChallengeLevel;
  status: ParticipantStatus;
  total_hp_earned: number;
  joined_at: string;
  completed_at?: string | null;
}

export interface LeaderboardEntry {
  user: User;
  total_hp: number;
  rank: number;
}

export interface ChallengeStatistics {
  total_participants: number;
  active_participants: number;
  completed_participants: number;
  failed_participants: number;
  average_hp_per_day: number;
  total_hp_earned: number;
}

export interface UserStatistics {
  total_challenges_joined: number;
  total_challenges_completed: number;
  total_challenges_failed: number;
  total_hp_earned: number;
  average_completion_rate: number;
  current_streak: number;
  longest_streak: number;
}

// Proof types
export type ProofType = 'photo' | 'video';
export type ProofStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type ModerationStatus = 'not_moderated' | 'under_review' | 'approved' | 'rejected';

export interface DailyProgress {
  id: number;
  participant: number;
  date: string;
  total_hp_earned: string;
  activities_completed: number;
  is_rest_day: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ModerationHistory {
  id: number;
  proof: number;
  moderator: User;
  old_status: ModerationStatus;
  new_status: ModerationStatus;
  comment?: string;
  moderated_at: string;
}

export interface Proof {
  id: number;
  participant: Participant;
  daily_progress: DailyProgress;
  activity: Activity;
  quantity: number;
  hp_earned: string;
  proof_type: ProofType;
  file: string;
  file_url: string;
  description?: string;
  uploaded_at: string;
  status: ProofStatus;
  moderation_status: ModerationStatus;
  moderations: ModerationHistory[];
}

export interface ProofList {
  id: number;
  participant: {
    id: number;
    user: {
      id: number;
      username: string;
      avatar?: string;
    };
  };
  daily_progress: {
    id: number;
    date: string;
  };
  activity: Activity;
  quantity: number;
  hp_earned: string;
  proof_type: ProofType;
  file_url: string;
  description?: string;
  uploaded_at: string;
  status: ProofStatus;
  moderation_status: ModerationStatus;
}

export interface ProofCreate {
  daily_progress: number;
  activity_id: number;
  quantity: number;
  proof_type: ProofType;
  file: File | string;
  description?: string;
}

export interface ProofFilters {
  challenge?: number;
  challenge_slug?: string;
  participant?: number;
  participant_username?: string;
  activity?: number;
  activity_name?: string;
  date?: string;
  status?: ProofStatus;
  moderation_status?: ModerationStatus;
  proof_type?: ProofType;
  needs_moderation?: boolean;
  has_file?: boolean;
  has_description?: boolean;
  min_hp?: number;
  max_hp?: number;
  min_quantity?: number;
  max_quantity?: number;
  uploaded_after?: string;
  uploaded_before?: string;
  search?: string;
  ordering?: string;
}
