import { useEffect } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { DeptCodeForm } from "@/features/auth/DeptCodeForm";
import { useAppStore } from "@/store/appStore";

const Index = () => {
  const { deptCode } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (deptCode) {
      navigate("/dashboard");
    }
  }, [deptCode, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2"
        >
          <Link to="/">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
          </Link>
          <Link to="/" className="inline-block">
            <span className="text-2xl font-display font-bold text-gradient">EventHorizon</span>
          </Link>
        </motion.div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 pb-10">
        <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-12 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-6 space-y-5"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm w-fit">
              Mobile-first • PWA • Dark UI
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold leading-tight">
              Team-Events planen,
              <br /> gemeinsam abstimmen.
            </h1>
            <p className="text-muted-foreground text-lg">
              Aktivitäten vorschlagen, voten, Termine finden und Budget teilen – alles in einer Experience.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="px-3 py-1 rounded-full bg-secondary/50">Super-Like & Mystery-Card</span>
              <span className="px-3 py-1 rounded-full bg-secondary/50">Stretch Goals & Wall of Fame</span>
              <span className="px-3 py-1 rounded-full bg-secondary/50">QR-Onboarding</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-6"
          >
            <div className="w-full max-w-md lg:ml-auto">
              <DeptCodeForm />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground">
        Made with ❤️ for bessere Team-Events
      </footer>
    </div>
  );
};

export default Index;
