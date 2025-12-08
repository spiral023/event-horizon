export type RegionCode = string;

export interface EventOption {
  id: string;
  title: string;
  category: 'Action' | 'Food' | 'Relax' | 'Party';
  tags: string[];
  location_region: RegionCode;
  est_price_pp: number;
  min_participants?: number;
  accessibility_flags: ('wheelchair' | 'vegan' | 'pregnant_friendly')[];
  weather_dependent: boolean;
  image_url?: string;
  description?: string;
  is_mystery?: boolean;
  season?: 'summer' | 'winter' | 'all_year';
  short_description?: string;
  long_description?: string;
  physical_intensity?: number;
  mental_challenge?: number;
  social_interaction_level?: number;
  price_comment?: string;
  external_rating?: number;
  lead_time_min_days?: number;
  travel_time_from_office_minutes?: number;
  address?: string;
  website?: string;
  provider?: string;
  phone?: string;
  email?: string;
}

export interface StretchGoal {
  id: string;
  amount_threshold: number;
  reward_description: string;
  unlocked: boolean;
  icon?: string;
}

export type BadgeType = 'whale' | 'early_bird' | 'closer' | null;

export interface PrivateContribution {
  id: string;
  user_name: string;
  amount: number;
  is_hero: boolean;
  is_anonymous?: boolean;
  badge?: BadgeType;
  created_at: string;
}

export type CampaignStatus = 'voting' | 'funding' | 'booked';

export interface Campaign {
  id: string;
  name: string;
  dept_code: string;
  target_date_range: string;
  voting_deadline?: string | null;
  status: CampaignStatus;
  total_budget_needed: number;
  company_budget_available: number;
  budget_per_participant?: number;
  external_sponsors: number;
  private_contributions: PrivateContribution[];
  stretch_goals: StretchGoal[];
  event_options: EventOption[];
  winning_event_id?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  dept_code: string;
  hobbies: string[];
  history: {
    liked_categories: string[];
  };
  super_likes_remaining: number;
}

export interface Vote {
  event_id: string;
  weight: number;
  is_super_like: boolean;
}

export interface TeamAnalytics {
  action_level: number;
  food_focus: number;
  outdoor_wish: number;
  compromise_score: number;
  persona_label: string;
  persona_description: string;
  top_categories: string[];
  participation_rate: number;
}

export interface Availability {
  date: string;
  slots: ('morning' | 'afternoon' | 'evening')[];
}
