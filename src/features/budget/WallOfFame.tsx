import { motion } from 'framer-motion';
import { Crown, Bird, Target, Ghost } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PrivateContribution, BadgeType } from '@/types/domain';

interface WallOfFameProps {
  contributions: PrivateContribution[];
}

const badgeConfig: Record<NonNullable<BadgeType>, { icon: typeof Crown; label: string; variant: 'whale' | 'warning' | 'success' }> = {
  whale: { icon: Crown, label: 'The Whale', variant: 'whale' },
  early_bird: { icon: Bird, label: 'Early Bird', variant: 'warning' },
  closer: { icon: Target, label: 'The Closer', variant: 'success' },
};

export const WallOfFame = ({ contributions }: WallOfFameProps) => {
  const sortedContributions = [...contributions].sort((a, b) => b.amount - a.amount);

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-warning" />
          Wall of Fame
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contributions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Noch keine Beiträge</p>
            <p className="text-sm text-muted-foreground mt-1">
              Sei der Erste und werde zum Early Bird! 🐦
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedContributions.map((contribution, index) => {
              const badge = contribution.badge ? badgeConfig[contribution.badge] : null;
              
              return (
                <motion.div
                  key={contribution.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    index === 0 ? 'bg-warning/10 border border-warning/20' : 'bg-secondary/50'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    contribution.is_anonymous 
                      ? 'bg-muted' 
                      : 'gradient-primary'
                  }`}>
                    {contribution.is_anonymous ? (
                      <Ghost className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <span className="text-primary-foreground font-bold">
                        {contribution.user_name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${
                        contribution.is_anonymous ? 'italic text-muted-foreground' : ''
                      }`}>
                        {contribution.is_anonymous 
                          ? 'Ein mysteriöser Gönner 🕵️‍♂️' 
                          : contribution.user_name
                        }
                      </span>
                      {badge && (
                        <Badge variant={badge.variant} className="text-xs shrink-0">
                          {badge.label}
                        </Badge>
                      )}
                    </div>
                    {contribution.is_hero && !contribution.is_anonymous && (
                      <p className="text-xs text-muted-foreground">Team-Held ⭐</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="font-bold text-lg">€{contribution.amount}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
