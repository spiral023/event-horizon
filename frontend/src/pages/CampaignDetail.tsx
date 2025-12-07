import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Vote, Calendar, BarChart3, Copy, Share2, UserCog, Plus, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toBlob } from 'html-to-image';
import { Button } from '@/components/ui/button';
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

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const handleContribution = async (amount: number, isAnonymous: boolean) => {
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
  };

  const handleAvailability = async (availability: Availability[]) => {
    if (!id) return;
    try {
      await submitAvailability(id, availability);
      toast.success('Verfuegbarkeit gespeichert!');
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Kampagne nicht gefunden</h2>
          <Button onClick={() => navigate('/dashboard')}>Zurueck</Button>
        </div>
      </div>
    );
  }

  const fundingPercentage = getFundingPercentage(campaign);
  const appOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://event-horizon.sp23.online';
  const eventPath = campaign.status === 'voting' ? `/voting/${campaign.id}` : `/campaign/${campaign.id}`;
  const eventUrl = `${appOrigin}${eventPath}`;
  const votingDeadline = campaign.voting_deadline ? new Date(campaign.voting_deadline) : null;
  const votingProgress = votingDeadline
    ? (() => {
        const now = Date.now();
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const startMs = start.getTime();
        const endMs = votingDeadline.getTime();
        if (endMs <= startMs) return 100;
        const ratio = Math.min(1, Math.max(0, (now - startMs) / (endMs - startMs)));
        return Math.round(ratio * 100);
      })()
    : null;
  const votingClosed = votingDeadline ? Date.now() >= votingDeadline.getTime() : false;
  const formatDeadline = (date: Date) =>
    date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });

  const copyEventLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      toast.success('Link kopiert!');
    } catch (error) {
      console.error('Copy failed', error);
      toast.error('Konnte Link nicht kopieren.');
    }
  };

  const shareEventCard = async () => {
    if (!qrCardRef.current) return;
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
  };

  const handleProfileSave = async () => {
    if (!user) return setProfileOpen(false);
    setSavingProfile(true);
    try {
      const trimmedName = nameDraft.trim() || 'Team Member';
      setUser({
        ...user,
        name: trimmedName,
        hobbies,
        history: { liked_categories: preferences },
      });
      toast.success('Profil aktualisiert');
      setProfileOpen(false);
    } catch (error) {
      console.error('Update failed', error);
      toast.error('Konnte Aenderungen nicht speichern.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-display font-bold">{campaign.name}</h1>
              <p className="text-xs text-muted-foreground">{campaign.target_date_range}</p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Profil & Event verwalten">
                    <UserCog className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Profil & Event verwalten</DialogTitle>
                    <DialogDescription>
                      Passe deinen Namen an und aktualisiere die Event-Details.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="profileName">Dein Name</Label>
                      <Input
                        id="profileName"
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        placeholder="Max Mustermann"
                      />
                      <p className="text-xs text-muted-foreground">
                        Wird fuer Beitraege, Votes und Hinweise verwendet.
                      </p>
                    </div>

                    <div className="space-y-3 rounded-xl border border-border p-4 bg-secondary/30">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Hobbys</p>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="z.B. Bowling"
                            value={hobbyInput}
                            onChange={(e) => setHobbyInput(e.target.value)}
                            className="h-9"
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
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hobbies.length === 0 && (
                          <span className="text-xs text-muted-foreground">Noch keine Hobbys hinzugefuegt.</span>
                        )}
                        {hobbies.map((hobby) => (
                          <span
                            key={hobby}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                          >
                            {hobby}
                            <button
                              type="button"
                              onClick={() => setHobbies((prev) => prev.filter((h) => h !== hobby))}
                              className="text-muted-foreground hover:text-foreground"
                              aria-label={`${hobby} entfernen`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-border p-4 bg-secondary/30">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Vorlieben</p>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="z.B. vegetarisch"
                            value={preferenceInput}
                            onChange={(e) => setPreferenceInput(e.target.value)}
                            className="h-9"
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
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {preferences.length === 0 && (
                          <span className="text-xs text-muted-foreground">Noch keine Vorlieben hinzugefuegt.</span>
                        )}
                        {preferences.map((pref) => (
                          <span
                            key={pref}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                          >
                            {pref}
                            <button
                              type="button"
                              onClick={() => setPreferences((prev) => prev.filter((p) => p !== pref))}
                              className="text-muted-foreground hover:text-foreground"
                              aria-label={`${pref} entfernen`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={() => setProfileOpen(false)} disabled={savingProfile}>
                      Abbrechen
                    </Button>
                    <Button variant="gradient" onClick={handleProfileSave} disabled={savingProfile}>
                      {savingProfile ? 'Speichern...' : 'Speichern'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <ThemeToggle />
            </div>
            {campaign.status === 'voting' && (
              <Button variant="gradient" size="sm" onClick={() => navigate(`/voting/${id}`)}>
                <Vote className="w-4 h-4" />
                Abstimmen
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="budget" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="w-4 h-4 mr-1" />
              Termine
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-1" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="activities">
              <Calendar className="w-4 h-4 mr-1" />
              Aktivitaeten
            </TabsTrigger>
          </TabsList>

          <TabsContent value="budget" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-7">
                <Card variant="elevated" className="border border-border/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          <Calendar className="w-4 h-4" />
                          Uebersicht
                        </span>
                        <CardTitle className="text-base">Voting & Deadline</CardTitle>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground">
                        Aktueller Stand der Abstimmung
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Voting-Deadline</span>
                      <span className="font-semibold">
                        {votingDeadline ? formatDeadline(votingDeadline) : 'Keine Deadline gesetzt'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`font-semibold ${votingClosed ? 'text-muted-foreground' : 'text-primary'}`}>
                        {votingDeadline ? (votingClosed ? 'Abgeschlossen' : 'Laufend') : 'Offen'}
                      </span>
                    </div>
                    {votingDeadline && (
                      <div className="space-y-1.5">
                        <Progress
                          value={votingProgress ?? 0}
                          variant={votingClosed ? 'success' : 'gradient'}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
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
                    <CardHeader className="text-center pb-2">
                      <div className="mb-2">
                        <span className="px-3 py-1 text-xs font-semibold tracking-widest text-primary/80 uppercase bg-primary/10 rounded-full">
                          Event
                        </span>
                      </div>
                      <CardTitle className="text-2xl">QR-Code fuer dein Event</CardTitle>
                      <CardDescription>
                        Teile den Code, damit dein Team direkt zum Event gelangt.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-6">
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 bg-white rounded-2xl shadow-sm border"
                      >
                        <QRCodeSVG value={eventUrl} size={200} level="H" includeMargin className="rounded-xl" />
                      </motion.div>
                    </CardContent>
                  </Card>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={copyEventLink}>
                      <Copy className="w-4 h-4" />
                      Link kopieren
                    </Button>
                    <Button variant="gradient" className="flex-1" onClick={shareEventCard}>
                      <Share2 className="w-4 h-4" />
                      Teilen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <DateGrid onSubmit={handleAvailability} />
              </div>
              <div className="lg:col-span-4 space-y-3 text-sm text-muted-foreground border border-border rounded-2xl p-4 bg-secondary/40">
                <p className="font-semibold text-foreground">Tipps fuer Terminfindung</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Wochenenden bevorzugen fuer Outdoor-Events.</li>
                  <li>Mindestens zwei Slots pro Person anfragen.</li>
                  <li>Spaeter Verfuegbarkeiten aktualisieren? Einfach neu absenden.</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {analytics && (
              <>
                <PersonaSummary analytics={analytics} />
                <TeamMeter analytics={analytics} />
              </>
            )}
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card variant="elevated">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Verfuegbare Events
                </CardTitle>
                <CardDescription>Alle Optionen aus allen Regionen mit Filter und Suche.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Suche</Label>
                    <Input
                      placeholder="Titel, Tags, Region..."
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Regionen</Label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(activityOptions.map((o) => o.location_region))).map((regionCode) => (
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
                        >
                          {regionCode}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Kategorien</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Action', 'Food', 'Relax', 'Party'].map((cat) => (
                        <Button
                          key={cat}
                          type="button"
                          size="sm"
                          variant={activityCategoryFilter.includes(cat) ? 'default' : 'outline'}
                          onClick={() =>
                            setActivityCategoryFilter((prev) =>
                              prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                            )
                          }
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="max-h-[520px] overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-secondary/40 text-muted-foreground sticky top-0">
                        <tr className="text-left">
                          <th className="p-3">Titel</th>
                          <th className="p-3">Kategorie</th>
                          <th className="p-3">Region</th>
                          <th className="p-3 text-right">Preis p.P.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityTabLoading ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-xs text-muted-foreground">
                              Lade Events...
                            </td>
                          </tr>
                        ) : (
                          activityOptions
                            .filter((opt) => {
                              const matchesSearch =
                                opt.title.toLowerCase().includes(activitySearch.toLowerCase()) ||
                                opt.tags.join(' ').toLowerCase().includes(activitySearch.toLowerCase()) ||
                                opt.location_region.toLowerCase().includes(activitySearch.toLowerCase());
                              const matchesRegion =
                                activityRegionFilter.length === 0 || activityRegionFilter.includes(opt.location_region);
                              const matchesCategory =
                                activityCategoryFilter.length === 0 || activityCategoryFilter.includes(opt.category);
                              return matchesSearch && matchesRegion && matchesCategory;
                            })
                            .map((option) => (
                              <tr
                                key={option.id}
                                className="border-t border-border/60 hover:bg-secondary/30 cursor-pointer"
                                onClick={() => setSelectedActivity(option)}
                              >
                                <td className="p-3 font-medium">{option.title}</td>
                                <td className="p-3">{option.category}</td>
                                <td className="p-3">{option.location_region}</td>
                                <td className="p-3 text-right">EUR {Math.round(option.est_price_pp)}</td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
              <DialogContent className="sm:max-w-lg">
                {selectedActivity && (
                  <div className="space-y-3">
                    <DialogHeader>
                      <DialogTitle>{selectedActivity.title}</DialogTitle>
                      <DialogDescription>
                        {selectedActivity.category} • {selectedActivity.location_region}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>{selectedActivity.description || 'Keine Beschreibung vorhanden.'}</p>
                      <p>Preis p.P.: EUR {Math.round(selectedActivity.est_price_pp)}</p>
                      {selectedActivity.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedActivity.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 text-xs rounded-full bg-secondary">
                              {tag}
                            </span>
                          ))}
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

