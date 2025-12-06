import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TinderDeck } from '@/features/voting/TinderDeck';
import { getCampaign, submitVotes } from '@/services/apiClient';
import { useAppStore } from '@/store/appStore';
import type { Campaign, Vote as VoteType } from '@/types/domain';
import { toast } from 'sonner';

const Voting = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const { resetVoting } = useAppStore();

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;
      try {
        const data = await getCampaign(id);
        setCampaign(data);
        resetVoting();
      } catch (error) {
        console.error('Failed to fetch campaign:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [id, resetVoting]);

  const handleVotesComplete = async (votes: VoteType[]) => {
    if (!id) return;
    try {
      await submitVotes(id, votes);
      toast.success('Deine Stimmen wurden gespeichert!');
      navigate(`/campaign/${id}`);
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-display font-bold flex items-center gap-2">
                <Vote className="w-5 h-5 text-primary" />
                Abstimmung
              </h1>
              <p className="text-xs text-muted-foreground">{campaign.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-6"
        >
          <p className="text-muted-foreground">
            Swipe nach rechts für 👍 oder links für 👎
          </p>
        </motion.div>

        <TinderDeck events={campaign.event_options} onVotesComplete={handleVotesComplete} />
      </main>
    </div>
  );
};

export default Voting;
