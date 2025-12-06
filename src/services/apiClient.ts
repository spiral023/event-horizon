import type {
  Campaign,
  EventOption,
  PrivateContribution,
  TeamAnalytics,
  Vote,
  Availability,
  StretchGoal,
} from '@/types/domain';
import { storage, generateId } from '@/utils/storage';

// Mock data
const mockEventOptions: EventOption[] = [
  {
    id: 'evt-1',
    title: 'Kartbahn Leonding',
    category: 'Action',
    tags: ['indoor', 'competitive', 'loud', 'adrenalin'],
    location_region: 'OÖ',
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
    location_region: 'OÖ',
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
    location_region: 'OÖ',
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
    location_region: 'OÖ',
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
    location_region: 'OÖ',
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
    location_region: 'OÖ',
    est_price_pp: 30,
    min_participants: 4,
    accessibility_flags: ['wheelchair'],
    weather_dependent: false,
    image_url: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=600',
    description: 'Knifflige Rätsel lösen und gemeinsam aus dem Raum entkommen.',
  },
];

const mockStretchGoals: StretchGoal[] = [
  {
    id: 'sg-1',
    amount_threshold: 100,
    reward_description: 'Event finanziert! 🎉',
    unlocked: false,
    icon: '🎯',
  },
  {
    id: 'sg-2',
    amount_threshold: 110,
    reward_description: 'Erste Runde Getränke geht aufs Haus! 🍻',
    unlocked: false,
    icon: '🍺',
  },
  {
    id: 'sg-3',
    amount_threshold: 125,
    reward_description: 'Upgrade auf 4-Sterne-Hotel! ⭐',
    unlocked: false,
    icon: '🏨',
  },
];

// Initialize mock data
const initializeMockData = () => {
  const campaigns = storage.get<Campaign[]>('campaigns', []);
  if (campaigns.length === 0) {
    const demoCampaign: Campaign = {
      id: 'campaign-demo',
      name: 'Sommer Team Event 2024',
      dept_code: 'IN-VIA-1234',
      target_date_range: '15.07 - 31.08.2024',
      status: 'voting',
      total_budget_needed: 2500,
      company_budget_available: 1500,
      external_sponsors: 300,
      private_contributions: [
        {
          id: 'pc-1',
          user_name: 'Max M.',
          amount: 100,
          is_hero: true,
          badge: 'early_bird',
          timestamp: Date.now() - 86400000,
        },
        {
          id: 'pc-2',
          user_name: 'Ein mysteriöser Gönner',
          amount: 150,
          is_hero: true,
          is_anonymous: true,
          badge: 'whale',
          timestamp: Date.now() - 43200000,
        },
      ],
      stretch_goals: mockStretchGoals,
      event_options: mockEventOptions.slice(0, 6),
      created_at: Date.now() - 172800000,
    };
    storage.set('campaigns', [demoCampaign]);
  }
};

initializeMockData();

// Simulated network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Functions
export const getCampaigns = async (deptCode: string): Promise<Campaign[]> => {
  await delay(300);
  const campaigns = storage.get<Campaign[]>('campaigns', []);
  return campaigns.filter(c => c.dept_code === deptCode);
};

export const getCampaign = async (campaignId: string): Promise<Campaign | null> => {
  await delay(200);
  const campaigns = storage.get<Campaign[]>('campaigns', []);
  return campaigns.find(c => c.id === campaignId) || null;
};

export const createCampaign = async (
  payload: Partial<Campaign> & { region?: EventOption['location_region'] }
): Promise<Campaign> => {
  await delay(400);
  const campaigns = storage.get<Campaign[]>('campaigns', []);

  const selectedRegion = payload.region || 'OÇ-';
  const eventOptions =
    payload.event_options ||
    mockEventOptions.filter((option) => selectedRegion === 'OÇ-' || option.location_region === selectedRegion);
  const stretchGoals =
    payload.stretch_goals || mockStretchGoals.map(g => ({ ...g, id: generateId() }));
  
  const newCampaign: Campaign = {
    id: generateId(),
    name: payload.name || 'Neues Team Event',
    dept_code: payload.dept_code || '',
    target_date_range: payload.target_date_range || '',
    status: payload.status || 'voting',
    total_budget_needed: payload.total_budget_needed || 2000,
    company_budget_available: payload.company_budget_available || 1000,
    external_sponsors: payload.external_sponsors ?? 0,
    private_contributions: payload.private_contributions || [],
    stretch_goals: stretchGoals,
    event_options: eventOptions,
    created_at: Date.now(),
  };
  
  campaigns.push(newCampaign);
  storage.set('campaigns', campaigns);
  
  return newCampaign;
};

export const getEventOptions = async (region: EventOption['location_region']): Promise<EventOption[]> => {
  await delay(200);
  return mockEventOptions.filter(e => e.location_region === region || region === 'OÖ');
};

export const submitVotes = async (
  campaignId: string,
  votes: Vote[]
): Promise<void> => {
  await delay(300);
  const existingVotes = storage.get<Record<string, Vote[]>>('votes', {});
  existingVotes[campaignId] = votes;
  storage.set('votes', existingVotes);
};

export const submitAvailability = async (
  campaignId: string,
  availability: Availability[]
): Promise<void> => {
  await delay(200);
  const existingAvailability = storage.get<Record<string, Availability[]>>('availability', {});
  existingAvailability[campaignId] = availability;
  storage.set('availability', existingAvailability);
};

export const submitContribution = async (
  campaignId: string,
  contribution: Omit<PrivateContribution, 'id' | 'timestamp'>
): Promise<Campaign> => {
  await delay(400);
  const campaigns = storage.get<Campaign[]>('campaigns', []);
  const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
  
  if (campaignIndex === -1) {
    throw new Error('Campaign not found');
  }
  
  const campaign = campaigns[campaignIndex];
  const isFirstContribution = campaign.private_contributions.length === 0;
  const totalBefore = getTotalFunded(campaign);
  
  const newContribution: PrivateContribution = {
    ...contribution,
    id: generateId(),
    timestamp: Date.now(),
    badge: isFirstContribution ? 'early_bird' : null,
  };
  
  campaign.private_contributions.push(newContribution);
  
  // Check for "whale" badge (highest contribution)
  const maxAmount = Math.max(...campaign.private_contributions.map(c => c.amount));
  campaign.private_contributions.forEach(c => {
    if (c.amount === maxAmount && c.amount >= 100) {
      c.badge = 'whale';
    }
  });
  
  // Check for "closer" badge
  const totalAfter = getTotalFunded(campaign);
  const percentage = (totalAfter / campaign.total_budget_needed) * 100;
  if (totalBefore < campaign.total_budget_needed && totalAfter >= campaign.total_budget_needed) {
    newContribution.badge = 'closer';
  }
  
  // Update stretch goals
  campaign.stretch_goals = campaign.stretch_goals.map(goal => ({
    ...goal,
    unlocked: percentage >= goal.amount_threshold,
  }));
  
  campaigns[campaignIndex] = campaign;
  storage.set('campaigns', campaigns);
  
  return campaign;
};

export const getTeamAnalytics = async (campaignId: string): Promise<TeamAnalytics> => {
  await delay(300);
  const votes = storage.get<Record<string, Vote[]>>('votes', {});
  const campaignVotes = votes[campaignId] || [];
  
  // Calculate analytics based on votes
  const campaigns = storage.get<Campaign[]>('campaigns', []);
  const campaign = campaigns.find(c => c.id === campaignId);
  
  if (!campaign) {
    return getDefaultAnalytics();
  }
  
  const votedEvents = campaign.event_options.filter(e => 
    campaignVotes.some(v => v.event_id === e.id && v.weight > 0)
  );
  
  const categoryScores = {
    Action: 0,
    Food: 0,
    Relax: 0,
    Party: 0,
  };
  
  campaignVotes.forEach(vote => {
    const event = campaign.event_options.find(e => e.id === vote.event_id);
    if (event && vote.weight > 0) {
      categoryScores[event.category] += vote.weight;
    }
  });
  
  const totalScore = Object.values(categoryScores).reduce((a, b) => a + b, 0) || 1;
  const outdoorTags = votedEvents.filter(e => e.tags.includes('outdoor')).length;
  
  const actionLevel = Math.round((categoryScores.Action / totalScore) * 100);
  const foodFocus = Math.round((categoryScores.Food / totalScore) * 100);
  const outdoorWish = Math.round((outdoorTags / (votedEvents.length || 1)) * 100);
  
  // Determine persona
  let persona_label = 'Die Ausgewogenen';
  let persona_description = 'Euer Team mag Vielfalt und findet immer einen Kompromiss.';
  
  if (actionLevel > 50) {
    persona_label = 'Die Adrenalinjunkies';
    persona_description = 'Euer Team liebt Action und Abenteuer!';
  } else if (foodFocus > 50) {
    persona_label = 'Die Genießer';
    persona_description = 'Gutes Essen und Trinken steht bei euch im Mittelpunkt.';
  } else if (categoryScores.Relax > categoryScores.Action) {
    persona_label = 'Die Entspannten';
    persona_description = 'Wellness und Erholung sind euer Ding.';
  }
  
  return {
    action_level: actionLevel || 25,
    food_focus: foodFocus || 30,
    outdoor_wish: outdoorWish || 20,
    compromise_score: Math.round(Math.random() * 30 + 70),
    persona_label,
    persona_description,
    top_categories: Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([cat]) => cat),
    participation_rate: Math.round(Math.random() * 20 + 80),
  };
};

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

export const getTotalFunded = (campaign: Campaign): number => {
  const privateTotal = campaign.private_contributions.reduce((sum, c) => sum + c.amount, 0);
  return campaign.company_budget_available + campaign.external_sponsors + privateTotal;
};

export const getFundingPercentage = (campaign: Campaign): number => {
  return Math.min((getTotalFunded(campaign) / campaign.total_budget_needed) * 100, 150);
};
