import { motion } from 'framer-motion';
import { Zap, Coffee, Mountain, Users, Target, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { TeamAnalytics } from '@/types/domain';

interface TeamMeterProps {
  analytics: TeamAnalytics;
}

export const TeamMeter = ({ analytics }: TeamMeterProps) => {
  const meters = [
    { label: 'Action-Level', value: analytics.action_level, icon: Zap, color: 'destructive' as const },
    { label: 'Food-Fokus', value: analytics.food_focus, icon: Coffee, color: 'warning' as const },
    { label: 'Outdoor-Wunsch', value: analytics.outdoor_wish, icon: Mountain, color: 'success' as const },
  ];

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Team-Meter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {meters.map((meter, index) => (
          <motion.div
            key={meter.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <meter.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{meter.label}</span>
              </div>
              <span className="text-sm font-bold">{meter.value}%</span>
            </div>
            <Progress value={meter.value} variant={meter.color} />
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

interface PersonaSummaryProps {
  analytics: TeamAnalytics;
}

export const PersonaSummary = ({ analytics }: PersonaSummaryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <Card variant="elevated" className="overflow-hidden">
        <div className="gradient-primary p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-background/20 backdrop-blur flex items-center justify-center"
          >
            <Award className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h2 className="text-2xl font-display font-bold text-primary-foreground mb-2">
            {analytics.persona_label}
          </h2>
          <p className="text-primary-foreground/80">
            {analytics.persona_description}
          </p>
        </div>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <p className="text-2xl font-bold text-primary">{analytics.compromise_score}%</p>
              <p className="text-xs text-muted-foreground">Kompromiss-Score</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/50">
              <p className="text-2xl font-bold text-success">{analytics.participation_rate}%</p>
              <p className="text-xs text-muted-foreground">Teilnahmerate</p>
            </div>
          </div>

          {analytics.top_categories.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Top Kategorien</p>
              <div className="flex gap-2">
                {analytics.top_categories.map((cat) => (
                  <Badge key={cat} variant="gradient">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface CompromiseScoreBadgeProps {
  score: number;
}

export const CompromiseScoreBadge = ({ score }: CompromiseScoreBadgeProps) => {
  const getScoreLevel = () => {
    if (score >= 90) return { label: 'Perfekt', color: 'success' as const };
    if (score >= 70) return { label: 'Gut', color: 'default' as const };
    if (score >= 50) return { label: 'Okay', color: 'warning' as const };
    return { label: 'Schwierig', color: 'destructive' as const };
  };

  const { label, color } = getScoreLevel();

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="inline-flex items-center gap-2"
    >
      <Badge variant={color} className="text-sm px-3 py-1">
        <Users className="w-3 h-3 mr-1" />
        {score}% Kompromiss
      </Badge>
      <span className="text-xs text-muted-foreground">{label}</span>
    </motion.div>
  );
};
