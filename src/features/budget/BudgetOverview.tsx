import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Trophy, Gift, Users, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Campaign, StretchGoal } from '@/types/domain';
import { getTotalFunded, getFundingPercentage } from '@/services/apiClient';
import confetti from 'canvas-confetti';

interface BudgetOverviewProps {
  campaign: Campaign;
}

export const BudgetOverview = ({ campaign }: BudgetOverviewProps) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const totalFunded = getTotalFunded(campaign);
  const percentage = getFundingPercentage(campaign);
  const privateTotal = campaign.private_contributions.reduce((sum, c) => sum + c.amount, 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 300);
    return () => clearTimeout(timer);
  }, [percentage]);

  const fundingSources = [
    {
      label: 'Firmenbudget',
      amount: campaign.company_budget_available,
      color: 'bg-primary',
      icon: Users,
    },
    {
      label: 'Sponsoring',
      amount: campaign.external_sponsors,
      color: 'bg-accent',
      icon: Gift,
    },
    {
      label: 'Private Beiträge',
      amount: privateTotal,
      color: 'bg-success',
      icon: Trophy,
    },
  ];

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Budget-Topf
          </CardTitle>
          <Badge variant={percentage >= 100 ? 'success' : 'default'}>
            {Math.round(percentage)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gesammelt</span>
            <span className="font-bold text-lg">
              €{totalFunded.toLocaleString()} 
              <span className="text-muted-foreground font-normal text-sm">
                {' '}/ €{campaign.total_budget_needed.toLocaleString()}
              </span>
            </span>
          </div>
          <Progress 
            value={Math.min(animatedPercentage, 100)} 
            variant={percentage >= 100 ? 'success' : 'gradient'}
            className="h-4"
          />
        </div>

        {/* Funding sources breakdown */}
        <div className="grid grid-cols-3 gap-3">
          {fundingSources.map((source) => (
            <motion.div
              key={source.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-3 rounded-xl bg-secondary/50"
            >
              <source.icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">€{source.amount}</p>
              <p className="text-xs text-muted-foreground">{source.label}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface StretchGoalsProps {
  goals: StretchGoal[];
  currentPercentage: number;
}

export const StretchGoals = ({ goals, currentPercentage }: StretchGoalsProps) => {
  const [celebratedGoals, setCelebratedGoals] = useState<Set<string>>(new Set());

  useEffect(() => {
    goals.forEach(goal => {
      if (goal.unlocked && !celebratedGoals.has(goal.id)) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
        setCelebratedGoals(prev => new Set([...prev, goal.id]));
      }
    });
  }, [goals, celebratedGoals]);

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-warning" />
          Stretch Goals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-secondary" />
          <motion.div
            className="absolute left-4 top-0 w-0.5 gradient-primary"
            initial={{ height: 0 }}
            animate={{ height: `${Math.min((currentPercentage / 130) * 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />

          {/* Goals */}
          <div className="space-y-4">
            {goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 pl-2"
              >
                <motion.div
                  className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    goal.unlocked
                      ? 'gradient-primary text-primary-foreground'
                      : currentPercentage >= goal.amount_threshold - 5
                      ? 'bg-warning/20 text-warning border-2 border-warning'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                  animate={goal.unlocked ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {goal.icon || '🎯'}
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{goal.amount_threshold}%</span>
                    {goal.unlocked && (
                      <Badge variant="success" className="text-xs">
                        Erreicht!
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm ${goal.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {goal.reward_description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
