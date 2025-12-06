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

// Keep the existing demo content as fallback to seed the backend if it is empty
const fallbackEventOptions: EventOption[] = [
  {
    id: 'evt-1',
    title: 'Kartbahn Leonding',
    category: 'Action',
    tags: ['indoor', 'competitive', 'loud', 'adrenalin'],
    location_region: 'OOE',
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
    id: 'evt-8',
    title: 'Genusstour Graz',
    category: 'Food',
    tags: ['urban', 'food', 'walking'],
    location_region: 'Stmk',
    est_price_pp: 55,
    min_participants: 4,
    accessibility_flags: ['wheelchair'],
    weather_dependent: false,
    image_url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600',
    description: 'Kulinarische Stadtführung durch Graz mit Verkostungen.',
  },
  {
    id: 'evt-9',
    title: 'Weinwandern Südsteiermark',
    category: 'Relax',
    tags: ['outdoor', 'wine', 'nature'],
    location_region: 'Stmk',
    est_price_pp: 60,
    min_participants: 6,
    accessibility_flags: [],
    weather_dependent: true,
    image_url: 'https://images.unsplash.com/photo-1514369118554-e20d93546b30?w=600',
    description: 'Weinberge, Jausen und Panoramablicke in der Südsteiermark.',
  },
  {
    id: 'evt-10',
    title: 'Panorama-Dinner Mönchsberg',
    category: 'Food',
    tags: ['elegant', 'view', 'city'],
    location_region: 'Sbg',
    est_price_pp: 95,
    min_participants: 4,
    accessibility_flags: ['wheelchair'],
    weather_dependent: false,
    image_url: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600',
    description: 'Privates Dinner mit Stadtblick und regionalem Degustationsmenü.',
  },
  {
    id: 'evt-11',
    title: 'E-MTB Salzkammergut',
    category: 'Action',
    tags: ['outdoor', 'nature', 'fitness'],
    location_region: 'Sbg',
    est_price_pp: 70,
    min_participants: 5,
    accessibility_flags: [],
    weather_dependent: true,
    image_url: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600',
    description: 'Geführte E-MTB Tour mit See-Stopps und Almjause.',
  },
  {
    id: 'evt-12',
    title: 'Wörthersee Sunset Cruise',
    category: 'Relax',
    tags: ['boat', 'sunset', 'chill'],
    location_region: 'Ktn',
    est_price_pp: 65,
    min_participants: 6,
    accessibility_flags: [],
    weather_dependent: true,
    image_url: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=600',
    description: 'Afterwork-Bootstour mit Drinks und Musik am Wörthersee.',
  },
  {
    id: 'evt-13',
    title: 'Pyramidenkogel Team-Challenge',
    category: 'Action',
    tags: ['view', 'adventure', 'team'],
    location_region: 'Ktn',
    est_price_pp: 45,
    min_participants: 5,
    accessibility_flags: [],
    weather_dependent: true,
    image_url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600',
    description: 'Aussichtsturm, Flying-Fox und Team-Rallye am Pyramidenkogel.',
  },
  {
    id: 'evt-14',
    title: 'Alpen Co-Working Innsbruck',
    category: 'Relax',
    tags: ['indoor', 'focus', 'team'],
    location_region: 'Tirol',
    est_price_pp: 40,
    min_participants: 4,
    accessibility_flags: [],
    weather_dependent: false,
    image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600',
    description: 'Co-Working Tag mit Blick auf die Nordkette, Meetingraum & Kaffee-Flat.',
  },
  {
    id: 'evt-15',
    title: 'Snow & Fun Stubai',
    category: 'Action',
    tags: ['outdoor', 'snow', 'adventure'],
    location_region: 'Tirol',
    est_price_pp: 75,
    min_participants: 6,
    accessibility_flags: [],
    weather_dependent: true,
    image_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600',
    description: 'Rodeln, Zipline und Glühwein-Stopps im Stubaital.',
  },
  {
    id: 'mystery-1',
            title: 'Überraschungsevent',
    category: 'Action',
    tags: ['mystery', 'surprise', 'adventure'],
    location_region: 'OOE',
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
    location_region: 'OOE',
    est_price_pp: 30,
    min_participants: 4,
    accessibility_flags: ['wheelchair'],
    weather_dependent: false,
    image_url: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=600',
    description: 'Knifflige Rätsel lösen und gemeinsam aus dem Raum entkommen.',
  },
];

type ApiMessage = { message: string };

interface RawContribution {
  id: string;
  user_name: string;
  amount: string | number;
  is_hero: boolean;
  is_anonymous?: boolean;
  badge?: string | null;
  created_at?: string;
}

interface RawStretchGoal {
  id?: string; // Backend might not always send ID for creation
  amount_threshold: string | number;
  reward_description: string;
  unlocked: boolean;
  icon?: string;
}

interface RawCampaign {
  id: string;
  name: string;
  dept_code: string;
  target_date_range: string;
  status: CampaignStatus;
  total_budget_needed: string | number;
  company_budget_available: string | number;
  external_sponsors: string | number;
  private_contributions?: RawContribution[];
  stretch_goals?: RawStretchGoal[];
  event_options?: EventOption[];
  winning_event_id?: string | null;
  created_at?: string;
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
        .map((d: { msg?: string; message?: string }) => d?.msg || d?.message || JSON.stringify(d))
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

const mapContribution = (contribution: RawContribution): PrivateContribution => ({
  id: contribution.id,
  user_name: contribution.user_name,
  amount: Number(contribution.amount) || 0,
  is_hero: Boolean(contribution.is_hero),
  is_anonymous: Boolean(contribution.is_anonymous),
  badge: contribution.badge ?? null,
  created_at: contribution.created_at ?? new Date().toISOString(),
});

const mapCampaign = (campaign: RawCampaign): Campaign => ({
  id: campaign.id,
  name: campaign.name,
  dept_code: campaign.dept_code,
  target_date_range: campaign.target_date_range,
  status: campaign.status,
  total_budget_needed: Number(campaign.total_budget_needed) || 0,
  company_budget_available: Number(campaign.company_budget_available) || 0,
  external_sponsors: Number(campaign.external_sponsors) || 0,
  private_contributions: (campaign.private_contributions || []).map(mapContribution),
  stretch_goals: (campaign.stretch_goals || []).map(goal => ({
    id: goal.id ?? generateId(), // Ensure ID is present
    amount_threshold: Number(goal.amount_threshold) || 0,
    reward_description: goal.reward_description,
    unlocked: goal.unlocked,
    icon: goal.icon,
  })),
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
  return fallbackEventOptions.filter((event) => event.location_region.toLowerCase() === normalized);
};

const getSeasonFromDate = (dateStr: string): 'summer' | 'winter' | 'all_year' => {
  if (!dateStr) return 'all_year';
  const lower = dateStr.toLowerCase();
  
  // Explicit Season Names override everything if just one is present
  const hasSummer = lower.includes('sommer');
  const hasWinter = lower.includes('winter');
  if (hasSummer && !hasWinter) return 'summer';
  if (hasWinter && !hasSummer) return 'winter';
  if (hasSummer && hasWinter) return 'all_year';

  // Check for multiple months (comma separated)
  const winterKeywords = ['dez', 'jan', 'jän', 'feb', '.12.', '.01.', '.02.'];
  const summerKeywords = ['jun', 'jul', 'aug', 'sep', '.06.', '.07.', '.08.'];
  
  let foundSummer = false;
  let foundWinter = false;

  // Scan for month keywords
  if (winterKeywords.some(k => lower.includes(k))) foundWinter = true;
  if (summerKeywords.some(k => lower.includes(k))) foundSummer = true;

  // KW Range Parsing: "KW 10 - 25"
  const kwRangeMatch = lower.match(/kw\s*(\d+)\s*-\s*(\d+)/);
  if (kwRangeMatch) {
    const start = parseInt(kwRangeMatch[1], 10);
    const end = parseInt(kwRangeMatch[2], 10);
    
    // Check every week in range approx
    // Winter: 48-52, 1-10. Summer: 22-38.
    // If range touches both -> mixed.
    // Simplified: If start is winter and end is summer -> mixed.
    
    const isWinterWeek = (w: number) => (w >= 48 || w <= 10);
    const isSummerWeek = (w: number) => (w >= 22 && w <= 38);

    let rangeHasWinter = false;
    let rangeHasSummer = false;
    
    // Simple sampling
    if (isWinterWeek(start) || isWinterWeek(end)) rangeHasWinter = true;
    if (isSummerWeek(start) || isSummerWeek(end)) rangeHasSummer = true;
    
    // Check middle of range if wide
    const mid = Math.floor((start + end) / 2);
    if (isWinterWeek(mid)) rangeHasWinter = true;
    if (isSummerWeek(mid)) rangeHasSummer = true;

    if (rangeHasWinter) foundWinter = true;
    if (rangeHasSummer) foundSummer = true;
  } else {
    // Single KW check
    const kwMatch = lower.match(/kw\s*(\d+)/);
    if (kwMatch) {
      const kw = parseInt(kwMatch[1], 10);
      if (kw >= 22 && kw <= 38) foundSummer = true;
      if (kw >= 48 || kw <= 10) foundWinter = true;
    }
  }

  if (foundWinter && foundSummer) return 'all_year';
  if (foundSummer) return 'summer';
  if (foundWinter) return 'winter';

  return 'all_year';
};

const resolveEventOptions = async (region?: RegionCode, season: string = 'all_year') => {
  const fromApi = await safeGetEventOptions(region);
  const minCount = 3;
  const fallback = fallbackEventsForRegion(region);

  const filterBySeason = (events: EventOption[]) => {
    if (season === 'all_year') return events;
    return events.filter((e) => !e.season || e.season === 'all_year' || e.season === season);
  };

  // Wenn zu wenige aus der API kommen, mit Fallback auffüllen
  const merged =
    fromApi.length >= minCount
      ? fromApi
      : dedupeEventOptions([...fromApi, ...fallback]);
  
  const filtered = filterBySeason(merged);

  return { options: filtered, source: fromApi.length ? ('api' as const) : ('fallback' as const) };
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
  budget_per_participant?: number;
  external_sponsors?: number;
  status?: Campaign['status'];
  region?: RegionCode;
  winning_event_id?: string;
  stretch_goals?: StretchGoal[];
  event_options?: EventOption[];
};

export const createCampaign = async (payload: CreateCampaignInput): Promise<Campaign> => {
  const { region, stretch_goals, event_options, ...rest } = payload;
  
  const season = getSeasonFromDate(payload.target_date_range);
  const resolvedEvents = await resolveEventOptions(region, season);
  const stretchGoals = stretch_goals && stretch_goals.length ? stretch_goals : fallbackStretchGoals;

  const sanitizeEventOption = (option: EventOption) => ({
    id: option.id,
    title: option.title,
    category: option.category,
    tags: option.tags,
    location_region: option.location_region,
    est_price_pp: option.est_price_pp,
    min_participants: option.min_participants,
    accessibility_flags: option.accessibility_flags,
    weather_dependent: option.weather_dependent,
    image_url: option.image_url,
    description: option.description,
    is_mystery: option.is_mystery,
    season: option.season,
  });

  const baseEvents = event_options?.length ? event_options : resolvedEvents.options;
  const eventOptionPayload = dedupeEventOptions(baseEvents).map(sanitizeEventOption);

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
  const fallback = fallbackEventsForRegion(region);
  const minCount = 3;
  const merged =
    fromApi.length >= minCount
      ? fromApi
      : dedupeEventOptions([...fromApi, ...fallback]);
  return merged;
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



