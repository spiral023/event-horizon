import { useNavigate, Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { LogOut, Sparkles, QrCode, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignList } from "@/features/campaigns/CampaignList";
import { useAppStore } from "@/store/appStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Dashboard = () => {
  const { user, deptCode, logout } = useAppStore();
  const navigate = useNavigate();


  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Link to="/">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
              </Link>
              <div>
                <Link to="/" className="inline-block">
              <h1 className="font-display font-bold">EventHorizon</h1>
            </Link>
              </div>
            </div>
            <TooltipProvider>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate("/qr-create")}>
                  <QrCode className="w-5 h-5" />
                </Button>
                <ThemeToggle />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Team verlassen</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-5 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-lg"
          >
            <p className="text-sm text-muted-foreground mb-2">
              Hallo {user?.name?.split(" ")[0] || "Team-Member"}
            </p>
            <h2 className="text-3xl font-display font-bold mb-3 leading-tight">
              Plane euer nächstes Team-Event.
            </h2>
            <p className="text-muted-foreground mb-6">
              Plane ein neues Team-Event, teile den (QR-)Code oder stimme bei bestehenden Events ab.
            </p>
            {deptCode && (
              <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl mb-4">
                <p className="text-sm text-muted-foreground">Abteilungscode:</p>
                <span className="font-semibold text-foreground">{deptCode}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="w-full" onClick={() => navigate("/qr-create")}>
                <QrCode className="w-4 h-4" />
                QR teilen
              </Button>
            </div>
          </motion.div>

          <div className="lg:col-span-7">
            <CampaignList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
