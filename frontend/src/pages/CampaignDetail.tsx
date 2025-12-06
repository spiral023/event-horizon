import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Vote, Calendar, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetOverview, StretchGoals } from '@/features/budget/BudgetOverview';
import { WallOfFame } from '@/features/budget/WallOfFame';
import { ContributionForm } from '@/features/budget/ContributionForm';
import { DateGrid } from '@/features/scheduling/DateGrid';
import { TeamMeter, PersonaSummary } from '@/features/analytics/TeamAnalytics';
import { getCampaign, submitContribution, getTeamAnalytics, getFundingPercentage, submitAvailability } from '@/services/apiClient';
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
  const { user } = useAppStore();

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
      toast.success('Beitrag gespeichert! 🎉');
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
      toast.success('Verfügbarkeit gespeichert!');
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
          <Button onClick={() => navigate('/dashboard')}>Zurück</Button>
        </div>
      </div>
    );
  }

  const fundingPercentage = getFundingPercentage(campaign);

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
            <ThemeToggle />
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
                <p className="font-semibold text-foreground">Tipps für Terminfindung</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Wochenenden bevorzugen für Outdoor-Events.</li>
                  <li>Mindestens zwei Slots pro Person anfragen.</li>
                  <li>Später Verfügbarkeiten aktualisieren? Einfach neu absenden.</li>
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

