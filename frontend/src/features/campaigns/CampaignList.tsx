import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Calendar, Users, Vote, TrendingUp, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/appStore';
import { deleteCampaign, getCampaigns, getFundingPercentage } from '@/services/apiClient';
import type { Campaign } from '@/types/domain';
import { toast } from 'sonner';

const statusLabels: Record<Campaign['status'], string> = {
  voting: 'Abstimmung läuft',
  funding: 'Finanzierung',
  booked: 'Gebucht',
};

const statusVariants: Record<Campaign['status'], 'default' | 'warning' | 'success'> = {
  voting: 'default',
  funding: 'warning',
  booked: 'success',
};

export const CampaignList = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { deptCode, setCurrentCampaign } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!deptCode) return;
      try {
        const data = await getCampaigns(deptCode);
        const sorted = [...data].sort((a, b) => {
          const aTime = new Date(a.created_at || '').getTime();
          const bTime = new Date(b.created_at || '').getTime();
          return bTime - aTime;
        });
        setCampaigns(sorted);
      } catch (error) {
        console.error('Failed to fetch campaigns:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [deptCode]);

  const handleCampaignClick = (campaign: Campaign) => {
    setCurrentCampaign(campaign.id);
    if (campaign.status === 'voting') {
      navigate(`/voting/${campaign.id}`);
    } else {
      navigate(`/campaign/${campaign.id}`);
    }
  };

  const handleDetailsClick = (event: React.MouseEvent, campaign: Campaign) => {
    event.stopPropagation();
    setCurrentCampaign(campaign.id);
    navigate(`/campaign/${campaign.id}`);
  };

  const handleDelete = async (event: React.MouseEvent, campaign: Campaign) => {
    event.stopPropagation();
    if (!deptCode) return;
    const confirmed = window.confirm(`Event "${campaign.name}" wirklich l\u00f6schen?`);
    if (!confirmed) return;
    try {
      setDeletingId(campaign.id);
      await deleteCampaign(campaign.id, deptCode);
      setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
      toast.success('Event gel\u00f6scht');
    } catch (error) {
      console.error('Failed to delete campaign', error);
      toast.error('Event konnte nicht gel\u00f6scht werden');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} variant="elevated" className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-6 bg-muted rounded w-3/4 mb-3" />
              <div className="h-4 bg-muted rounded w-1/2 mb-4" />
              <div className="h-3 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold">Deine Events</h2>
        <Button size="sm" onClick={() => navigate('/create')}>
          <Plus className="w-4 h-4" />
          Neues Event
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card variant="elevated" className="text-center py-12">
          <CardContent>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center"
            >
              <Calendar className="w-8 h-8 text-primary" />
            </motion.div>
            <h3 className="text-lg font-semibold mb-2">Noch keine Events</h3>
            <p className="text-muted-foreground mb-6">
              Erstelle dein erstes Team-Event und starte die Abstimmung!
            </p>
            <Button variant="gradient" onClick={() => navigate('/create')}>
              <Plus className="w-4 h-4" />
              Event erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign, index) => {
            const fundingPercentage = getFundingPercentage(campaign);
            
            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  variant="elevated"
                  className="cursor-pointer hover:border-primary/50 transition-all duration-200"
                  onClick={() => handleCampaignClick(campaign)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {campaign.target_date_range}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariants[campaign.status]}>
                          {statusLabels[campaign.status]}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Event ${campaign.name} l\u00f6schen`}
                          onClick={(e) => handleDelete(e, campaign)}
                          disabled={deletingId === campaign.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Vote className="w-4 h-4" />
                          {campaign.event_options.length} Optionen
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {campaign.private_contributions.length} Beiträge
                        </span>
                      </div>
                      
                      {campaign.status !== 'voting' && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <TrendingUp className="w-4 h-4" />
                              Finanzierung
                            </span>
                            <span className="font-semibold">
                              {Math.round(fundingPercentage)}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(fundingPercentage, 100)}
                            variant={fundingPercentage >= 100 ? 'success' : 'gradient'}
                          />
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={(e) => handleDetailsClick(e, campaign)}
                        className="flex items-center justify-end text-sm text-primary font-medium hover:underline"
                      >
                        Details ansehen
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
