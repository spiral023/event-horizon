import type {
  Availability,
  Campaign,
  EventOption,
  PrivateContribution,
  RegionCode,
  StretchGoal,
  TeamAnalytics,
  Vote,
} from '@/types/domain';
import { storage, generateId } from '@/utils/storage';

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8000/api';

type ApiMessage = { message: string };

// Keep the existing demo content as fallback to seed the backend if it is empty
const fallbackEventOptions: EventOption[] = [
  {
    id: 'evt-1',
    title: 'Kartbahn Leonding',
    category: 'Action',
    tags: ['indoor', 'competitive', 'loud', 'adrenalin'],
    location_region: 'AT',
    est_price_pp: 45,
    min_participants: 6,
    accessibility_flags: [],
    weather_dependent: false,
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    description: 'Rasante Rennen auf der Indoor-Kartbahn mit Profi-Karts und Zeitmessung.',
  },
  {
    id: 'evt-2',
    title: 'Haubenrestaurant Steiereck',
    category: 'Food',
    tags: ['gourmet', 'elegant', 'indoor'],
    location_region: 'AT',
    est_price_pp: 120,
    min_participants: 4,
    accessibility_flags: ['vegan', 'wheelchair'],
    weather_dependent: false,
    image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
    description: 'Kulinarisches Erlebnis auf höchstem Niveau mit regionalen Spezialitäten.',
  },
  {
    id: 'evt-3',
    title: 'Wellnesstag Aqua Dome',
    category: 'Relax',
    tags: ['spa', 'indoor', 'entspannung'],
    location_region: 'Tirol',
    est_price_pp: 75,
    min_participants: 2,
    accessibility_flags: ['wheelchair', 'pregnant_friendly'],
    weather_dependent: false,
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
    description: 'Entspannung pur mit Saunalandschaft, Thermalbecken und Massage.',
  },
  {
    id: 'evt-4',
    title: 'Clubbing im Flex Wien',
    category: 'Party',
    tags: ['nightlife', 'music', 'indoor', 'loud'],
    location_region: 'AT',
    est_price_pp: 35,
    min_participants: 8,
    accessibility_flags: [],
    weather_dependent: false,
    image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
    description: 'Legendäre Club-Nacht mit DJ-Sets und VIP-Bereich für das Team.',
  },
  {
    id: 'evt-5',
    title: 'Klettersteig Dachstein',
    category: 'Action',
    tags: ['outdoor', 'adventure', 'nature', 'challenging'],
    location_region: 'Stmk',
    est_price_pp: 55,
    min_participants: 4,
    accessibility_flags: [],
    weather_dependent: true,
    image_url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600',
    description: 'Alpines Abenteuer mit atemberaubender Aussicht und Nervenkitzel.',
  },
  {
    id: 'evt-6',
    title: 'Weingut Tour Wachau',
    category: 'Food',
    tags: ['wine', 'outdoor', 'culture', 'relaxed'],
    location_region: 'AT',
    est_price_pp: 65,
    min_participants: 6,
    accessibility_flags: ['wheelchair'],
    weather_dependent: true,
    image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600',
    description: 'Weinverkostung und Kellerführung in einem der schönsten Weingebiete Österreichs.',
  },
  {
    id: 'mystery-1',
            title: 'Überraschungsevent',
    category: 'Action',
    tags: ['mystery', 'surprise', 'adventure'],
    location_region: 'AT',
    est_price_pp: 50,
    accessibility_flags: [],
    weather_dependent: false,
    is_mystery: true,
    description: 'Kategorie: Action – Das Team erfährt erst am Eventtag, was passiert!',
  },
  {
    id: 'evt-7',
    title: 'Escape Room Challenge',
    category: 'Action',
    tags: ['teamwork', 'indoor', 'puzzle', 'exciting'],
    location_region: 'AT',
    est_price_pp: 30,
    min_participants: 4,
    accessibility_flags: ['wheelchair'],
    weather_dependent: false,
    image_url: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=600',
    description: 'Knifflige Rätsel lösen und gemeinsam aus dem Raum entkommen.',
  },
];

const fallbackStretchGoals: StretchGoal[] = [
  {
    id: 'sg-1',
    amount_threshold: 100,
    reward_description: 'Event finanziert! 🎉',
    unlocked: false,
    icon: '🎉',
  },
  {
    id: 'sg-2',
    amount_threshold: 110,
    reward_description: 'Erste Runde Getränke geht aufs Haus! 🍻',
    unlocked: false,
    icon: '🍻',
  },
  {
    id: 'sg-3',
    amount_threshold: 125,
    reward_description: 'Upgrade auf 4-Sterne-Hotel! 🏨',
    unlocked: false,
    icon: '🏨',
  },
];

class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const ensureSessionId = () => {
  const existing = storage.get<string>('session_id', '');
  if (existing) return existing;
  const sessionId = generateId();
  storage.set('session_id', sessionId);
  return sessionId;
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const rawDetail = (data && (data.detail || data.message)) || res.statusText || 'Request failed';
    let message: string;
    if (Array.isArray(rawDetail)) {
      message = rawDetail
        .map((d: any) => d?.msg || d?.message || JSON.stringify(d))
        .join('; ');
    } else if (typeof rawDetail === 'object') {
      message = rawDetail?.msg || rawDetail?.message || JSON.stringify(rawDetail);
    } else {
      message = String(rawDetail);
    }
    throw new ApiError(message, res.status, data);
  }

  return (data as T) ?? (undefined as T);
};

const mapContribution = (contribution: any): PrivateContribution => ({
  id: contribution.id,
  user_name: contribution.user_name,
  amount: Number(contribution.amount) || 0,
  is_hero: Boolean(contribution.is_hero),
  is_anonymous: Boolean(contribution.is_anonymous),
  badge: contribution.badge ?? null,
  created_at: contribution.created_at ?? new Date().toISOString(),
});

const mapCampaign = (campaign: any): Campaign => ({
  id: campaign.id,
  name: campaign.name,
  dept_code: campaign.dept_code,
  target_date_range: campaign.target_date_range,
  status: campaign.status,
  total_budget_needed: Number(campaign.total_budget_needed) || 0,
  company_budget_available: Number(campaign.company_budget_available) || 0,
  external_sponsors: Number(campaign.external_sponsors) || 0,
  private_contributions: (campaign.private_contributions || []).map(mapContribution),
  stretch_goals: (campaign.stretch_goals || []) as StretchGoal[],
  event_options: (campaign.event_options || []) as EventOption[],
  winning_event_id: campaign.winning_event_id ?? undefined,
  created_at: campaign.created_at ?? new Date().toISOString(),
});

const getDefaultAnalytics = (): TeamAnalytics => ({
  action_level: 35,
  food_focus: 30,
  outdoor_wish: 25,
  compromise_score: 85,
  persona_label: 'Die Entdecker',
  persona_description: 'Euer Team ist offen für alles und probiert gerne Neues aus!',
  top_categories: ['Action', 'Food'],
  participation_rate: 92,
});

const safeGetEventOptions = async (region?: RegionCode) => {
  try {
    const query = region ? `?region=${encodeURIComponent(region)}` : '';
    return await request<EventOption[]>(`/event-options${query}`);
  } catch {
    return [];
  }
};

const fallbackEventsForRegion = (region?: RegionCode) => {
  if (!region) return fallbackEventOptions;
  const normalized = region.toLowerCase();
  const filtered = fallbackEventOptions.filter(
    (event) => event.location_region.toLowerCase() === normalized
  );
  return filtered.length ? filtered : fallbackEventOptions;
};

const resolveEventOptions = async (region?: RegionCode) => {
  const fromApi = await safeGetEventOptions(region);
  if (fromApi.length) {
    return { options: fromApi, source: 'api' as const };
  }
  return { options: fallbackEventsForRegion(region), source: 'fallback' as const };
};

export const getCampaigns = async (deptCode: string): Promise<Campaign[]> => {
  const query = `?dept_code=${encodeURIComponent(deptCode)}`;
  const campaigns = await request<Campaign[]>(`/campaigns${query}`);
  return campaigns.map(mapCampaign);
};

export const getCampaign = async (campaignId: string): Promise<Campaign | null> => {
  try {
    const campaign = await request<Campaign>(`/campaigns/${campaignId}`);
    return mapCampaign(campaign);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
};

type CreateCampaignInput = {
  name: string;
  dept_code: string;
  target_date_range: string;
  total_budget_needed: number;
  company_budget_available: number;
  external_sponsors?: number;
  status?: Campaign['status'];
  region?: RegionCode;
  winning_event_id?: string;
  stretch_goals?: StretchGoal[];
  event_options?: EventOption[];
};

export const createCampaign = async (payload: CreateCampaignInput): Promise<Campaign> => {
  const { region, stretch_goals, event_options, ...rest } = payload;
  const resolvedEvents = await resolveEventOptions(region);
  const stretchGoals = stretch_goals && stretch_goals.length ? stretch_goals : fallbackStretchGoals;

  const eventOptionPayload =
    resolvedEvents.source === 'api'
      ? resolvedEvents.options.map((option) => ({ id: option.id }))
      : resolvedEvents.options.map(({ id, ...option }) => option);

  const body = {
    ...rest,
    status: rest.status || 'voting',
    external_sponsors: rest.external_sponsors ?? 0,
    event_options: event_options?.length ? event_options : eventOptionPayload,
    stretch_goals: stretchGoals.map(({ id, ...goal }) => goal),
  };

  const created = await request<Campaign>('/campaigns', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return mapCampaign(created);
};

export const getEventOptions = async (region: RegionCode): Promise<EventOption[]> => {
  const fromApi = await safeGetEventOptions(region);
  return fromApi.length ? fromApi : fallbackEventsForRegion(region);
};

export const submitVotes = async (campaignId: string, votes: Vote[]): Promise<ApiMessage> => {
  const sessionId = ensureSessionId();
  return request<ApiMessage>(`/campaigns/${campaignId}/votes?session_id=${sessionId}`, {
    method: 'POST',
    body: JSON.stringify(votes),
  });
};

export const submitAvailability = async (
  campaignId: string,
  availability: Availability[]
): Promise<ApiMessage> => {
  const sessionId = ensureSessionId();
  return request<ApiMessage>(`/campaigns/${campaignId}/availability?session_id=${sessionId}`, {
    method: 'POST',
    body: JSON.stringify(availability),
  });
};

export const submitContribution = async (
  campaignId: string,
  contribution: Omit<PrivateContribution, 'id' | 'created_at'>
): Promise<Campaign> => {
  const updated = await request<Campaign>(`/campaigns/${campaignId}/contributions`, {
    method: 'POST',
    body: JSON.stringify(contribution),
  });
  return mapCampaign(updated);
};

export const getTeamAnalytics = async (campaignId: string): Promise<TeamAnalytics> => {
  try {
    return await request<TeamAnalytics>(`/campaigns/${campaignId}/analytics`);
  } catch (error) {
    console.error('Analytics fallback', error);
    return getDefaultAnalytics();
  }
};

export const getTotalFunded = (campaign: Campaign): number => {
  const privateTotal = campaign.private_contributions.reduce((sum, c) => sum + c.amount, 0);
  return campaign.company_budget_available + campaign.external_sponsors + privateTotal;
};

export const getFundingPercentage = (campaign: Campaign): number => {
  return Math.min((getTotalFunded(campaign) / campaign.total_budget_needed) * 100, 150);
};



