import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { DeptCodeForm } from '@/features/auth/DeptCodeForm';
import { useAppStore } from '@/store/appStore';

const Index = () => {
  const { deptCode } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (deptCode) {
      navigate('/dashboard');
    }
  }, [deptCode, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-display font-bold text-gradient">TeamVote</span>
        </motion.div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-display font-bold mb-3">
              Team-Events planen,<br />
              <span className="text-gradient">gemeinsam abstimmen</span>
            </h1>
            <p className="text-muted-foreground">
              Aktivitäten vorschlagen, Budget sammeln und den perfekten Termin finden.
            </p>
          </motion.div>

          <DeptCodeForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground">
        Made with ❤️ for better team events
      </footer>
    </div>
  );
};

export default Index;
