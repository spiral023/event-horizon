import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Vote, Calendar, BarChart3, Copy, Share2, UserCog } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toBlob } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetOverview, StretchGoals } from '@/features/budget/BudgetOverview';
import { WallOfFame } from '@/features/budget/WallOfFame';
import { ContributionForm } from '@/features/budget/ContributionForm';
import { DateGrid } from '@/features/scheduling/DateGrid';
import { TeamMeter, PersonaSummary } from '@/features/analytics/TeamAnalytics';
import { getCampaign, submitContribution, getTeamAnalytics, getFundingPercentage, submitAvailability, updateCampaign } from '@/services/apiClient';
import { useAppStore } from '@/store/appStore';
import type { Campaign, TeamAnalytics, Availability } from '@/types/domain';
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
  const [eventName, setEventName] = useState('');
  const [eventRange, setEventRange] = useState('');
  const [eventTotal, setEventTotal] = useState<number | ''>('');
  const [eventCompany, setEventCompany] = useState<number | ''>('');
  const [eventBudgetPP, setEventBudgetPP] = useState<number | ''>('');
  const [savingProfile, setSavingProfile] = useState(false);

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
    if (campaign) {
      setEventName(campaign.name);
      setEventRange(campaign.target_date_range);
      setEventTotal(Number(campaign.total_budget_needed) || 0);
      setEventCompany(Number(campaign.company_budget_available) || 0);
      setEventBudgetPP(
        typeof campaign.budget_per_participant === 'number' && !Number.isNaN(campaign.budget_per_participant)
          ? Number(campaign.budget_per_participant)
          : ''
      );
    }
  }, [campaign]);

  useEffect(() => {
    if (user?.name) {
      setNameDraft(user.name);
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
    if (!campaign && !user) {
      setProfileOpen(false);
      return;
    }
    setSavingProfile(true);
    try {
      const trimmedName = nameDraft.trim() || 'Team Member';
      if (user) {
        setUser({ ...user, name: trimmedName });
      }

      const payload: Record<string, unknown> = {};
      if (campaign) {
        if (eventName.trim() && eventName.trim() !== campaign.name) payload.name = eventName.trim();
        if (eventRange.trim() && eventRange.trim() !== campaign.target_date_range) payload.target_date_range = eventRange.trim();
        if (eventTotal !== '' && eventTotal !== campaign.total_budget_needed) payload.total_budget_needed = Math.max(Number(eventTotal) || 0, 0);
        if (eventCompany !== '' && eventCompany !== campaign.company_budget_available) payload.company_budget_available = Math.max(Number(eventCompany) || 0, 0);
        if (
          eventBudgetPP !== '' &&
          (campaign.budget_per_participant ?? null) !== Number(eventBudgetPP)
        ) {
          payload.budget_per_participant = Math.max(Number(eventBudgetPP) || 0, 0);
        }

        if (Object.keys(payload).length && campaign.id) {
          const updated = await updateCampaign(campaign.id, payload);
          setCampaign(updated);
        }
      }

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

                    {campaign && (
                      <div className="space-y-3 rounded-xl border border-border p-4 bg-secondary/30">
                        <p className="text-sm font-semibold">Event-Details</p>
                        <div className="space-y-2">
                          <Label htmlFor="eventName">Titel</Label>
                          <Input
                            id="eventName"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="eventRange">Zeitraum</Label>
                          <Input
                            id="eventRange"
                            value={eventRange}
                            onChange={(e) => setEventRange(e.target.value)}
                            placeholder="z.B. KW 30 - 32"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="eventTotal">Gesamtbudget</Label>
                            <Input
                              id="eventTotal"
                              type="number"
                              min={0}
                              value={eventTotal}
                              onChange={(e) => setEventTotal(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="eventCompany">Firmenanteil</Label>
                            <Input
                              id="eventCompany"
                              type="number"
                              min={0}
                              value={eventCompany}
                              onChange={(e) => setEventCompany(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="eventBudgetPP">Budget pro Person</Label>
                          <Input
                            id="eventBudgetPP"
                            type="number"
                            min={0}
                            value={eventBudgetPP}
                            onChange={(e) => setEventBudgetPP(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="optional"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Aenderungen werden sofort gespeichert, damit dein Team die aktuellsten Infos sieht.
                        </p>
                      </div>
                    )}
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
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="w-4 h-4 mr-1" />
              Termine
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-1" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="budget" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-7">
                <BudgetOverview campaign={campaign} />
                <ContributionForm onSubmit={handleContribution} isSubmitting={submitting} />
              </div>
              <div className="space-y-4 lg:col-span-5">
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
                    <CardContent className="space-y-6">
                      <div className="flex justify-center">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="p-4 bg-white rounded-2xl shadow-sm border"
                        >
                          <QRCodeSVG value={eventUrl} size={200} level="H" includeMargin className="rounded-xl" />
                        </motion.div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl">
                        <div className="w-11 shrink-0" aria-hidden="true" />
                        <code className="flex-1 text-center font-mono text-sm font-semibold break-all">
                          {eventUrl}
                        </code>
                        <Button variant="ghost" size="icon" onClick={copyEventLink} aria-label="Link kopieren">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
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

                <StretchGoals goals={campaign.stretch_goals} currentPercentage={fundingPercentage} />
                <WallOfFame contributions={campaign.private_contributions} />
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
        </Tabs>
      </main>
    </div>
  );
};

export default CampaignDetail;

