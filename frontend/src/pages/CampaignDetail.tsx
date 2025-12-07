import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Vote,
  Calendar,
  BarChart3,
  Copy,
  Share2,
  UserCog,
  Plus,
  X,
  Loader2,
  AlertCircle,
  MapPin,
  Users,
  CloudRain,
  SunSnow,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toBlob } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetOverview, StretchGoals } from '@/features/budget/BudgetOverview';
import { WallOfFame } from '@/features/budget/WallOfFame';
import { ContributionForm } from '@/features/budget/ContributionForm';
import { DateGrid } from '@/features/scheduling/DateGrid';
import { TeamMeter, PersonaSummary } from '@/features/analytics/TeamAnalytics';
import { getCampaign, submitContribution, getTeamAnalytics, getFundingPercentage, submitAvailability, getAllEventOptions } from '@/services/apiClient';
import { useAppStore } from '@/store/appStore';
import type { Campaign, TeamAnalytics, Availability, EventOption } from '@/types/domain';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { sanitizeName, sanitizeText, sanitizeStringArray } from '@/lib/sanitize';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, setUser } = useAppStore();
  const qrCardRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [hobbyInput, setHobbyInput] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [preferenceInput, setPreferenceInput] = useState('');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [activityTabLoading, setActivityTabLoading] = useState(false);
  const [activityOptions, setActivityOptions] = useState<EventOption[]>([]);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityRegionFilter, setActivityRegionFilter] = useState<string[]>([]);
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string[]>([]);
  const [activityTagFilter, setActivityTagFilter] = useState<string[]>([]);
  const [activityWeatherFilter, setActivityWeatherFilter] = useState<'all' | 'weather' | 'indoor'>('all');
  const [activitySeasonFilter, setActivitySeasonFilter] = useState<'all' | 'summer' | 'winter'>('all');
  const [activityPriceRange, setActivityPriceRange] = useState<[number, number]>([0, 0]);
  const [selectedActivity, setSelectedActivity] = useState<EventOption | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [campaignData, analyticsData] = await Promise.all([
          getCampaign(id),
          getTeamAnalytics(id),
        ]);
        setCampaign(campaignData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);
  useEffect(() => {
    const loadActivities = async () => {
      setActivityTabLoading(true);
      try {
        const options = await getAllEventOptions();
        setActivityOptions(options);
      } catch (error) {
        console.error('Failed to fetch activities', error);
      } finally {
        setActivityTabLoading(false);
      }
    };
    loadActivities();
  }, []);

  useEffect(() => {
    if (user?.name) {
      setNameDraft(user.name);
      setHobbies(user.hobbies || []);
      setPreferences(user.history?.liked_categories || []);
    }
  }, [user]);

  const handleContribution = useCallback(async (amount: number, isAnonymous: boolean) => {
    if (!id || !user) return;
    setSubmitting(true);
    try {
      const updated = await submitContribution(id, {
        user_name: user.name,
        amount,
        is_hero: amount >= 50,
        is_anonymous: isAnonymous,
      });
      setCampaign(updated);
      toast.success('Beitrag gespeichert!');
    } catch (error) {
      toast.error('Fehler beim Speichern');
    } finally {
      setSubmitting(false);
    }
  }, [id, user]);

  const handleAvailability = useCallback(async (availability: Availability[]) => {
    if (!id) return;
    try {
      await submitAvailability(id, availability);
      toast.success('Verfuegbarkeit gespeichert!');
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  }, [id]);

  // All memoized values - must be before conditional returns
  const fundingPercentage = useMemo(() => campaign ? getFundingPercentage(campaign) : 0, [campaign]);

  const appOrigin = useMemo(
    () => (typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://event-horizon.sp23.online'),
    []
  );

  const eventUrl = useMemo(() => {
    if (!campaign) return '';
    const eventPath = campaign.status === 'voting' ? `/voting/${campaign.id}` : `/campaign/${campaign.id}`;
    return `${appOrigin}${eventPath}`;
  }, [campaign, appOrigin]);

  const votingDeadline = useMemo(
    () => campaign?.voting_deadline ? new Date(campaign.voting_deadline) : null,
    [campaign?.voting_deadline]
  );

  const votingProgress = useMemo(() => {
    if (!votingDeadline) return null;
    const now = Date.now();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const startMs = start.getTime();
    const endMs = votingDeadline.getTime();
    if (endMs <= startMs) return 100;
    const ratio = Math.min(1, Math.max(0, (now - startMs) / (endMs - startMs)));
    return Math.round(ratio * 100);
  }, [votingDeadline]);

  const votingClosed = useMemo(
    () => votingDeadline ? Date.now() >= votingDeadline.getTime() : false,
    [votingDeadline]
  );

  const formatDeadline = useCallback(
    (date: Date) => date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }),
    []
  );

  const copyEventLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      toast.success('Link kopiert!');
    } catch (error) {
      console.error('Copy failed', error);
      toast.error('Konnte Link nicht kopieren.');
    }
  }, [eventUrl]);

  const shareEventCard = useCallback(async () => {
    if (!qrCardRef.current || !campaign) return;
    try {
      const blob = await toBlob(qrCardRef.current, { cacheBust: true });
      if (!blob) throw new Error('Bild konnte nicht generiert werden');
      const file = new File([blob], `event-${campaign.id}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: campaign.name,
          text: 'Stimme fuer unser Event ab!',
          files: [file],
        });
      } else {
        const link = document.createElement('a');
        link.download = `event-${campaign.id}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        toast.success('QR-Code als Bild geladen');
      }
    } catch (error) {
      console.error('Share failed', error);
      copyEventLink();
      toast.error('Teilen fehlgeschlagen, Link wurde kopiert.');
    }
  }, [campaign, copyEventLink]);

  const handleProfileSave = useCallback(async () => {
    if (!user) return setProfileOpen(false);
    setSavingProfile(true);
    try {
      // Sanitize all user inputs
      const sanitizedName = sanitizeName(nameDraft) || 'Team Member';
      const sanitizedHobbies = sanitizeStringArray(hobbies);
      const sanitizedPreferences = sanitizeStringArray(preferences);

      setUser({
        ...user,
        name: sanitizedName,
        hobbies: sanitizedHobbies,
        history: { liked_categories: sanitizedPreferences },
      });
      toast.success('Profil aktualisiert');
      setProfileOpen(false);
    } catch (error) {
      console.error('Update failed', error);
      toast.error('Konnte Aenderungen nicht speichern.');
    } finally {
      setSavingProfile(false);
    }
  }, [user, nameDraft, hobbies, preferences, setUser]);

  // Memoize unique regions for filter buttons
  const uniqueRegions = useMemo(
    () => Array.from(new Set(activityOptions.map((o) => o.location_region))),
    [activityOptions]
  );

  const uniqueTags = useMemo(
    () => Array.from(new Set(activityOptions.flatMap((o) => o.tags || []))).sort(),
    [activityOptions]
  );

  const priceBounds = useMemo(() => {
    if (!activityOptions.length) return { min: 0, max: 0 };
    const prices = activityOptions.map((o) => Number(o.est_price_pp) || 0);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [activityOptions]);

  useEffect(() => {
    if (priceBounds.max > 0) {
      setActivityPriceRange([priceBounds.min, priceBounds.max]);
    }
  }, [priceBounds.min, priceBounds.max]);

  const formatSeason = useCallback((season?: EventOption['season']) => {
    if (season === 'summer') return 'Sommer';
    if (season === 'winter') return 'Winter';
    return 'Ganzjährig';
  }, []);

  const accessibilityLabel = useCallback((flag: EventOption['accessibility_flags'][number]) => {
    if (flag === 'wheelchair') return 'Rollstuhl';
    if (flag === 'vegan') return 'Vegan';
    if (flag === 'pregnant_friendly') return 'Schwangerschaftsfreundlich';
    return flag;
  }, []);

  // Memoize filtered activities to avoid recalculating on every render
  const filteredActivities = useMemo(() => {
    return activityOptions.filter((opt) => {
      const term = activitySearch.trim().toLowerCase();
      const description = (opt.description || '').toLowerCase();
      const [minPrice, maxPrice] = activityPriceRange;
      const matchesSearch =
        opt.title.toLowerCase().includes(term) ||
        opt.tags.join(' ').toLowerCase().includes(term) ||
        opt.location_region.toLowerCase().includes(term) ||
        description.includes(term);
      const matchesRegion =
        activityRegionFilter.length === 0 || activityRegionFilter.includes(opt.location_region);
      const matchesCategory =
        activityCategoryFilter.length === 0 || activityCategoryFilter.includes(opt.category);
      const matchesTags =
        activityTagFilter.length === 0 || opt.tags.some((tag) => activityTagFilter.includes(tag));
      const matchesWeather =
        activityWeatherFilter === 'all' ||
        (activityWeatherFilter === 'weather' && opt.weather_dependent) ||
        (activityWeatherFilter === 'indoor' && !opt.weather_dependent);
      const matchesSeason =
        activitySeasonFilter === 'all' ||
        opt.season === activitySeasonFilter ||
        (!opt.season && activitySeasonFilter === 'all') ||
        (activitySeasonFilter === 'summer' && opt.season === 'all_year') ||
        (activitySeasonFilter === 'winter' && opt.season === 'all_year');
      const price = Number(opt.est_price_pp) || 0;
      const matchesPrice = price >= minPrice && price <= maxPrice;
      return (
        matchesSearch &&
        matchesRegion &&
        matchesCategory &&
        matchesTags &&
        matchesWeather &&
        matchesSeason &&
        matchesPrice
      );
    });
  }, [
    activityOptions,
    activitySearch,
    activityRegionFilter,
    activityCategoryFilter,
    activityTagFilter,
    activityWeatherFilter,
    activitySeasonFilter,
    activityPriceRange,
  ]);

  // Conditional returns AFTER all hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" aria-hidden="true" />
          <p className="text-typo-body text-muted-foreground">Kampagne wird geladen...</p>
          <span className="sr-only">Kampagnendetails werden geladen</span>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6" role="alert">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-destructive" aria-hidden="true" />
            </div>
            <CardTitle className="font-display text-typo-h2 text-center">Kampagne nicht gefunden</CardTitle>
            <CardDescription className="text-typo-body text-center">
              Die angeforderte Kampagne konnte nicht geladen werden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="default"
              className="w-full"
              aria-label="Zurück zum Dashboard"
            >
              Zurück zum Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border" role="banner">
        <div className="container max-w-5xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              aria-label="Zurück zum Dashboard"
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-typo-h1 truncate" id="campaign-title">
                {campaign.name}
              </h1>
              <p className="text-typo-body text-muted-foreground truncate" aria-label={`Zeitraum: ${campaign.target_date_range}`}>
                {campaign.target_date_range}
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Profil und Event verwalten"
                    className="shrink-0"
                  >
                    <UserCog className="w-5 h-5" aria-hidden="true" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display text-typo-h2" id="profile-dialog-title">Profil & Event verwalten</DialogTitle>
                    <DialogDescription className="text-typo-body" id="profile-dialog-description">
                      Passe deinen Namen, Hobbys und Vorlieben an.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="profileName" className="text-typo-body font-medium">Dein Name</Label>
                      <Input
                        id="profileName"
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        placeholder="Max Mustermann"
                        aria-describedby="profileName-hint"
                        maxLength={50}
                      />
                      <p id="profileName-hint" className="text-typo-body text-muted-foreground">
                        Wird für Beiträge, Votes und Hinweise verwendet.
                      </p>
                    </div>

                    <fieldset className="space-y-3 rounded-xl border border-border p-4 bg-secondary/30">
                      <legend className="text-typo-body font-semibold px-2">Hobbys</legend>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Label htmlFor="hobbyInput" className="sr-only">Neues Hobby hinzufügen</Label>
                        <Input
                          id="hobbyInput"
                          placeholder="z.B. Bowling"
                          value={hobbyInput}
                          onChange={(e) => setHobbyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = hobbyInput.trim();
                              if (value && !hobbies.includes(value)) {
                                setHobbies([...hobbies, value]);
                                setHobbyInput('');
                              }
                            }
                          }}
                          className="h-9 flex-1"
                          maxLength={30}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const value = hobbyInput.trim();
                            if (!value) return;
                            if (!hobbies.includes(value)) setHobbies([...hobbies, value]);
                            setHobbyInput('');
                          }}
                          aria-label="Hobby hinzufügen"
                          className="shrink-0"
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" />
                          <span className="ml-1 hidden sm:inline">Hinzufügen</span>
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2" role="list" aria-label="Deine Hobbys">
                        {hobbies.length === 0 && (
                          <span className="text-typo-body text-muted-foreground">Noch keine Hobbys hinzugefügt.</span>
                        )}
                        {hobbies.map((hobby) => (
                          <span
                            key={hobby}
                            role="listitem"
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-typo-body font-medium"
                          >
                            {hobby}
                            <button
                              type="button"
                              onClick={() => setHobbies((prev) => prev.filter((h) => h !== hobby))}
                              className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-full"
                              aria-label={`${hobby} entfernen`}
                            >
                              <X className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset className="space-y-3 rounded-xl border border-border p-4 bg-secondary/30">
                      <legend className="text-typo-body font-semibold px-2">Vorlieben</legend>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Label htmlFor="preferenceInput" className="sr-only">Neue Vorliebe hinzufügen</Label>
                        <Input
                          id="preferenceInput"
                          placeholder="z.B. vegetarisch"
                          value={preferenceInput}
                          onChange={(e) => setPreferenceInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = preferenceInput.trim();
                              if (value && !preferences.includes(value)) {
                                setPreferences([...preferences, value]);
                                setPreferenceInput('');
                              }
                            }
                          }}
                          className="h-9 flex-1"
                          maxLength={30}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const value = preferenceInput.trim();
                            if (!value) return;
                            if (!preferences.includes(value)) setPreferences([...preferences, value]);
                            setPreferenceInput('');
                          }}
                          aria-label="Vorliebe hinzufügen"
                          className="shrink-0"
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" />
                          <span className="ml-1 hidden sm:inline">Hinzufügen</span>
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2" role="list" aria-label="Deine Vorlieben">
                        {preferences.length === 0 && (
                          <span className="text-typo-body text-muted-foreground">Noch keine Vorlieben hinzugefügt.</span>
                        )}
                        {preferences.map((pref) => (
                          <span
                            key={pref}
                            role="listitem"
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-typo-body font-medium"
                          >
                            {pref}
                            <button
                              type="button"
                              onClick={() => setPreferences((prev) => prev.filter((p) => p !== pref))}
                              className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-full"
                              aria-label={`${pref} entfernen`}
                            >
                              <X className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </fieldset>
                  </div>

                  <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setProfileOpen(false)}
                      disabled={savingProfile}
                      className="w-full sm:w-auto"
                    >
                      Abbrechen
                    </Button>
                    <Button
                      variant="gradient"
                      onClick={handleProfileSave}
                      disabled={savingProfile}
                      className="w-full sm:w-auto"
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                          Speichern...
                        </>
                      ) : (
                        'Speichern'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <ThemeToggle />
            </div>
            {campaign.status === 'voting' && (
              <Button
                variant="gradient"
                size="sm"
                onClick={() => navigate(`/voting/${id}`)}
                className="ml-auto sm:ml-0"
                aria-label="Zur Abstimmung"
              >
                <Vote className="w-4 h-4 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Abstimmen</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6 sm:py-8" role="main" aria-labelledby="campaign-title">
        <Tabs defaultValue="budget" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 h-auto" role="tablist" aria-label="Kampagnen-Navigation">
            <TabsTrigger value="budget" className="text-xs sm:text-sm py-2">
              Budget
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs sm:text-sm py-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" aria-hidden="true" />
              <span className="hidden xs:inline">Termine</span>
              <span className="xs:hidden">Zeit</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" aria-hidden="true" />
              <span className="hidden xs:inline">Insights</span>
              <span className="xs:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="text-xs sm:text-sm py-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" aria-hidden="true" />
              <span className="hidden xs:inline">Aktivitäten</span>
              <span className="xs:hidden">Events</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="budget" className="space-y-4" role="tabpanel" aria-label="Budget-Übersicht">
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-7">
                <Card variant="elevated" className="border border-border/60 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-5 h-5 text-primary" aria-hidden="true" />
                      <CardTitle className="font-display text-typo-h2">Voting & Deadline</CardTitle>
                    </div>
                    <CardDescription className="text-typo-body text-muted-foreground">
                      Aktueller Stand der Abstimmung
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-typo-body text-muted-foreground">Voting-Deadline</span>
                      <span className="text-typo-h3" aria-label={votingDeadline ? `Deadline am ${formatDeadline(votingDeadline)}` : 'Keine Deadline gesetzt'}>
                        {votingDeadline ? formatDeadline(votingDeadline) : 'Keine Deadline gesetzt'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-typo-body text-muted-foreground">Status</span>
                      <Badge variant={votingClosed ? 'secondary' : 'default'}>
                        {votingDeadline ? (votingClosed ? 'Abgeschlossen' : 'Laufend') : 'Offen'}
                      </Badge>
                    </div>
                    {votingDeadline && (
                      <div className="space-y-1.5" role="group" aria-label="Voting-Fortschritt">
                        <Progress
                          value={votingProgress ?? 0}
                          variant={votingClosed ? 'success' : 'gradient'}
                          className="h-3"
                          aria-label={`Voting-Fortschritt: ${votingProgress ?? 0} Prozent`}
                        />
                        <div className="flex justify-between text-typo-body text-muted-foreground" aria-hidden="true">
                          <span>Heute</span>
                          <span>{votingProgress ?? 0}%</span>
                          <span>Deadline</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <BudgetOverview campaign={campaign} />
                <ContributionForm onSubmit={handleContribution} isSubmitting={submitting} />
              </div>
              <div className="space-y-4 lg:col-span-5">
                <StretchGoals goals={campaign.stretch_goals} currentPercentage={fundingPercentage} />
                <WallOfFame contributions={campaign.private_contributions} />
                <div className="space-y-3">
                  <Card ref={qrCardRef} variant="elevated" className="border border-border/60 shadow-sm">
                    <CardHeader className="text-center pb-4">
                      <div className="mb-2">
                        <Badge variant="outline" className="text-typo-body font-semibold tracking-widest uppercase">
                          Event
                        </Badge>
                      </div>
                      <CardTitle className="font-display text-typo-h2">QR-Code für dein Event</CardTitle>
                      <CardDescription className="text-typo-body">
                        Teile den Code, damit dein Team direkt zum Event gelangt.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-6">
                      <motion.div
                        initial={prefersReducedMotion ? { opacity: 1 } : { scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
                        className="p-4 bg-white rounded-2xl shadow-sm border"
                      >
                        <QRCodeSVG
                          value={eventUrl}
                          size={200}
                          level="H"
                          includeMargin
                          className="rounded-xl"
                          aria-label={`QR-Code für Event: ${campaign.name}`}
                        />
                      </motion.div>
                    </CardContent>
                  </Card>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={copyEventLink}
                      aria-label="Event-Link in Zwischenablage kopieren"
                    >
                      <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
                      <span className="hidden sm:inline">Link kopieren</span>
                      <span className="sm:hidden">Kopieren</span>
                    </Button>
                    <Button
                      variant="gradient"
                      className="flex-1"
                      onClick={shareEventCard}
                      aria-label="Event-QR-Code teilen"
                    >
                      <Share2 className="w-4 h-4 mr-2" aria-hidden="true" />
                      Teilen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" role="tabpanel" aria-label="Termine und Verfügbarkeit">
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <DateGrid onSubmit={handleAvailability} />
              </div>
              <aside className="lg:col-span-4 space-y-3 text-typo-body text-muted-foreground border border-border rounded-2xl p-4 bg-secondary/40" aria-label="Tipps zur Terminfindung">
                <h3 className="text-typo-h3 text-foreground">Tipps für Terminfindung</h3>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Wochenenden bevorzugen für Outdoor-Events.</li>
                  <li>Mindestens zwei Slots pro Person anfragen.</li>
                  <li>Später Verfügbarkeiten aktualisieren? Einfach neu absenden.</li>
                </ul>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4" role="tabpanel" aria-label="Team-Analytics und Insights">
            {analytics ? (
              <>
                <PersonaSummary analytics={analytics} />
                <TeamMeter analytics={analytics} />
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 text-muted-foreground animate-spin" aria-hidden="true" />
                  <p className="text-typo-body text-muted-foreground">Analytics werden geladen...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activities" className="space-y-4" role="tabpanel" aria-label="Verfügbare Event-Aktivitäten">
            <Card variant="elevated">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-5 h-5 text-primary" aria-hidden="true" />
                    <CardTitle className="font-display text-typo-h2">Verfügbare Events</CardTitle>
                  </div>
                <CardDescription className="text-typo-body">Alle Optionen aus allen Regionen mit Filter und Suche.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="activitySearch" className="text-typo-body font-medium">Suche</Label>
                    <Input
                      id="activitySearch"
                      placeholder="Titel, Tags, Region, Beschreibung..."
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      aria-label="Nach Aktivitäten suchen"
                    />
                  </div>
                  <fieldset className="space-y-1.5">
                    <legend className="text-typo-body font-medium">Regionen</legend>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Regionsfilter">
                      {uniqueRegions.map((regionCode) => (
                        <Button
                          key={regionCode}
                          type="button"
                          size="sm"
                          variant={activityRegionFilter.includes(regionCode) ? 'default' : 'outline'}
                          onClick={() =>
                            setActivityRegionFilter((prev) =>
                              prev.includes(regionCode) ? prev.filter((r) => r !== regionCode) : [...prev, regionCode]
                            )
                          }
                          aria-pressed={activityRegionFilter.includes(regionCode)}
                          aria-label={`Region ${regionCode} ${activityRegionFilter.includes(regionCode) ? 'abwählen' : 'auswählen'}`}
                        >
                          {regionCode}
                        </Button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="space-y-1.5">
                    <legend className="text-typo-body font-medium">Tags</legend>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Tagfilter">
                      {uniqueTags.map((tag) => (
                        <Button
                          key={tag}
                          type="button"
                          size="sm"
                          variant={activityTagFilter.includes(tag) ? 'default' : 'outline'}
                          onClick={() =>
                            setActivityTagFilter((prev) =>
                              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                            )
                          }
                          aria-pressed={activityTagFilter.includes(tag)}
                          aria-label={`Tag ${tag} ${activityTagFilter.includes(tag) ? 'abwählen' : 'auswählen'}`}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </fieldset>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <fieldset className="space-y-1.5">
                    <legend className="text-typo-body font-medium">Wetter</legend>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Wetterabhängigkeit">
                      {[
                        { key: 'all', label: 'Alle' },
                        { key: 'weather', label: 'Wetterabhängig' },
                        { key: 'indoor', label: 'Allwetter / Indoor' },
                      ].map((opt) => (
                        <Button
                          key={opt.key}
                          type="button"
                          size="sm"
                          variant={activityWeatherFilter === opt.key ? 'default' : 'outline'}
                          onClick={() => setActivityWeatherFilter(opt.key as typeof activityWeatherFilter)}
                          aria-pressed={activityWeatherFilter === opt.key}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="space-y-1.5">
                    <legend className="text-typo-body font-medium">Saison</legend>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Saisonfilter">
                      {[
                        { key: 'all', label: 'Alle' },
                        { key: 'summer', label: 'Sommer' },
                        { key: 'winter', label: 'Winter' },
                      ].map((opt) => (
                        <Button
                          key={opt.key}
                          type="button"
                          size="sm"
                          variant={activitySeasonFilter === opt.key ? 'default' : 'outline'}
                          onClick={() => setActivitySeasonFilter(opt.key as typeof activitySeasonFilter)}
                          aria-pressed={activitySeasonFilter === opt.key}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="space-y-1.5">
                    <legend className="text-typo-body font-medium">Preis p.P. (€)</legend>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Label htmlFor="priceMin" className="text-typo-body text-muted-foreground">Min</Label>
                          <Input
                            id="priceMin"
                            type="number"
                            min={priceBounds.min}
                            max={activityPriceRange[1]}
                            value={activityPriceRange[0]}
                            onChange={(e) =>
                              setActivityPriceRange((prev) => {
                                const next = [Number(e.target.value) || 0, prev[1]] as [number, number];
                                if (next[0] > next[1]) next[1] = next[0];
                                return next;
                              })
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="priceMax" className="text-typo-body text-muted-foreground">Max</Label>
                          <Input
                            id="priceMax"
                            type="number"
                            min={activityPriceRange[0]}
                            max={priceBounds.max || undefined}
                            value={activityPriceRange[1]}
                            onChange={(e) =>
                              setActivityPriceRange((prev) => {
                                const next = [prev[0], Number(e.target.value) || prev[0]] as [number, number];
                                if (next[1] < next[0]) next[0] = next[1];
                                return next;
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="text-typo-body text-muted-foreground flex justify-between">
                        <span>von {priceBounds.min || 0}€</span>
                        <span>bis {priceBounds.max || 0}€</span>
                      </div>
                    </div>
                  </fieldset>
                </div>

                {activityTabLoading ? (
                  <div className="text-center py-12 rounded-xl border border-border bg-secondary/20" role="status" aria-live="polite">
                    <Loader2 className="w-8 h-8 mx-auto mb-3 text-primary animate-spin" aria-hidden="true" />
                    <p className="text-typo-body text-muted-foreground">Lade Events...</p>
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="text-center py-12 rounded-xl border border-border bg-secondary/20">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
                    <p className="text-typo-body font-medium">Keine Events gefunden</p>
                    <p className="text-typo-body text-muted-foreground mt-1">Versuche andere Filter oder Suchbegriffe.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Event-Optionen">
                    <AnimatePresence mode="popLayout">
                      {filteredActivities.map((option, index) => (
                        <motion.div
                          key={option.id}
                          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                          role="listitem"
                        >
                          <Card
                            variant="elevated"
                            className="overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col h-full group focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            onClick={() => setSelectedActivity(option)}
                            tabIndex={0}
                            role="button"
                            aria-label={`${option.title} - ${option.category} in ${option.location_region}, ${Math.round(option.est_price_pp)} Euro pro Person`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedActivity(option);
                              }
                            }}
                          >
                            <div
                              className={`h-32 w-full bg-cover bg-center ${!prefersReducedMotion ? 'transition-transform duration-200 group-hover:scale-105' : ''}`}
                              style={{
                                backgroundImage: option.image_url
                                  ? `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.25)), url(${option.image_url})`
                                  : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                              }}
                              role="img"
                              aria-label={`Bild für ${option.title}`}
                            />
                            <CardContent className="p-4 flex flex-col gap-2 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="outline">{option.category}</Badge>
                                <span className="text-typo-body text-muted-foreground truncate">{option.location_region}</span>
                              </div>
                              <h4 className="text-typo-h3 leading-tight line-clamp-2">{option.title}</h4>
                              {option.is_mystery && (
                                <Badge variant="warning" className="w-fit">Mystery-Event</Badge>
                              )}
                              <div className="flex flex-wrap gap-2 text-[13px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-1">
                                  <Users className="w-3.5 h-3.5" aria-hidden="true" />
                                  {option.min_participants ? `${option.min_participants}+ Pers.` : 'Teamgröße offen'}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-1">
                                  <CloudRain className="w-3.5 h-3.5" aria-hidden="true" />
                                  {option.weather_dependent ? 'Wetterabhängig' : 'Allwetter/Indoor'}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-1">
                                  <SunSnow className="w-3.5 h-3.5" aria-hidden="true" />
                                  {formatSeason(option.season)}
                                </span>
                              </div>
                              <p className="text-typo-body text-muted-foreground line-clamp-2">
                                {option.description || 'Keine Beschreibung vorhanden.'}
                              </p>
                              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                                <span className="text-typo-body text-muted-foreground">Preis p.P.</span>
                                <span className="text-typo-h3">€{Math.round(option.est_price_pp)}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
                {!activityTabLoading && filteredActivities.length > 0 && (
                  <p className="text-typo-body text-center text-muted-foreground" aria-live="polite">
                    {filteredActivities.length} {filteredActivities.length === 1 ? 'Event' : 'Events'} gefunden
                  </p>
                )}
              </CardContent>
            </Card>

            <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
              <DialogContent className="sm:max-w-lg">
                {selectedActivity && (
                  <div className="space-y-4">
                    <DialogHeader>
                      <DialogTitle className="font-display text-typo-h2" id="activity-dialog-title">{selectedActivity.title}</DialogTitle>
                      <DialogDescription className="text-typo-body" id="activity-dialog-description">
                        {selectedActivity.category} • {selectedActivity.location_region}
                      </DialogDescription>
                      {selectedActivity.is_mystery && (
                        <Badge variant="warning" className="w-fit">Mystery-Event</Badge>
                      )}
                    </DialogHeader>
                    {selectedActivity.image_url && (
                      <div
                        className="w-full h-48 rounded-lg bg-cover bg-center"
                        style={{
                          backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.2)), url(${selectedActivity.image_url})`,
                        }}
                        role="img"
                        aria-label={`Bild für ${selectedActivity.title}`}
                      />
                    )}
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-typo-h3 mb-1">Beschreibung</h4>
                        <p className="text-typo-body text-muted-foreground">
                          {selectedActivity.description || 'Keine Beschreibung vorhanden.'}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                          <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
                          <div>
                            <p className="text-typo-body text-muted-foreground">Region</p>
                            <p className="text-typo-body font-semibold">{selectedActivity.location_region}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                          <Users className="w-4 h-4 text-primary" aria-hidden="true" />
                          <div>
                            <p className="text-typo-body text-muted-foreground">Mindestteilnehmer</p>
                            <p className="text-typo-body font-semibold">
                              {selectedActivity.min_participants ? `${selectedActivity.min_participants}+ Personen` : 'Flexibel'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                          <CloudRain className="w-4 h-4 text-primary" aria-hidden="true" />
                          <div>
                            <p className="text-typo-body text-muted-foreground">Wetter</p>
                            <p className="text-typo-body font-semibold">
                              {selectedActivity.weather_dependent ? 'Wetterabhängig / Outdoor' : 'Allwetter oder Indoor'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                          <SunSnow className="w-4 h-4 text-primary" aria-hidden="true" />
                          <div>
                            <p className="text-typo-body text-muted-foreground">Saison</p>
                            <p className="text-typo-body font-semibold">{formatSeason(selectedActivity.season)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                          <BarChart3 className="w-4 h-4 text-primary" aria-hidden="true" />
                          <div>
                            <p className="text-typo-body text-muted-foreground">Kategorie</p>
                            <p className="text-typo-body font-semibold">{selectedActivity.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                          <HelpCircle className="w-4 h-4 text-primary" aria-hidden="true" />
                          <div>
                            <p className="text-typo-body text-muted-foreground">Preis pro Person</p>
                            <p className="text-typo-h3 leading-tight">€{Math.round(selectedActivity.est_price_pp)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
                        {selectedActivity.accessibility_flags?.length ? (
                          selectedActivity.accessibility_flags.map((flag) => (
                            <Badge key={flag} variant="secondary">
                              {accessibilityLabel(flag)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-typo-body text-muted-foreground">Keine speziellen Accessibility-Hinweise</span>
                        )}
                      </div>
                      {selectedActivity.tags?.length > 0 && (
                        <div>
                          <h4 className="text-typo-h3 mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2" role="list" aria-label="Event-Tags">
                            {selectedActivity.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-typo-body" role="listitem">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CampaignDetail;
