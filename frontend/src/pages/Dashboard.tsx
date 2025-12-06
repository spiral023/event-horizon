import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Sparkles, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CampaignList } from '@/features/campaigns/CampaignList';
import { useAppStore } from '@/store/appStore';

const Dashboard = () => {
  const { user, deptCode, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold">TeamVote</h1>
                <p className="text-xs text-muted-foreground">{deptCode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/qr-create')}>
                <QrCode className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-lg mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-display font-bold mb-1">
            Hallo, {user?.name?.split(' ')[0] || 'Team-Member'}! 👋
          </h2>
          <p className="text-muted-foreground">
            Bereit für das nächste Team-Event?
          </p>
        </motion.div>

        <CampaignList />
      </main>
    </div>
  );
};

export default Dashboard;
