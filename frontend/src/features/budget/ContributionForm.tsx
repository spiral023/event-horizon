import { useState } from 'react';
import { motion } from 'framer-motion';
import { Euro, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppStore } from '@/store/appStore';
import { sanitizeNumber } from '@/lib/sanitize';

interface ContributionFormProps {
  onSubmit: (amount: number, isAnonymous: boolean) => void;
  isSubmitting?: boolean;
}

const presetAmounts = [10, 25, 50, 100];

export const ContributionForm = ({ onSubmit, isSubmitting }: ContributionFormProps) => {
  const [amount, setAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { user } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Sanitize and validate the amount (min: 1€, max: 100000€)
    const sanitizedValue = sanitizeNumber(amount, { min: 1, max: 100000 });
    if (sanitizedValue > 0) {
      onSubmit(sanitizedValue, isAnonymous);
      setAmount('');
    }
  };

  const handlePresetClick = (preset: number) => {
    setAmount(preset.toString());
  };

  return (
    <Card variant="elevated">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle className="font-display text-typo-h2">Beitrag leisten</CardTitle>
        </div>
        <CardDescription className="text-typo-body">
          Unterstütze das Team-Event mit deinem Beitrag
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset amounts */}
          <div className="grid grid-cols-4 gap-2">
            {presetAmounts.map((preset) => (
              <motion.button
                key={preset}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePresetClick(preset)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  amount === preset.toString()
                    ? 'gradient-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                }`}
              >
                €{preset}
              </motion.button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="relative">
            <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Anderer Betrag"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10"
              min="1"
              step="any"
            />
          </div>

          {/* Anonymous toggle */}
          <motion.button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${
              isAnonymous 
                ? 'border-primary bg-primary/10' 
                : 'border-input hover:border-primary/50'
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              {isAnonymous ? (
                <EyeOff className="w-5 h-5 text-primary" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground" />
              )}
              <div className="text-left">
                <p className="text-typo-h3">
                  {isAnonymous ? 'Robin-Hood-Modus' : 'Öffentlicher Beitrag'}
                </p>
                <p className="text-typo-body text-muted-foreground">
                  {isAnonymous
                    ? 'Dein Beitrag bleibt geheim 🕵️‍♂️'
                    : `Wird als "${user?.name || 'Du'}" angezeigt`
                  }
                </p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors ${
              isAnonymous ? 'bg-primary' : 'bg-secondary'
            }`}>
              <motion.div
                className="w-5 h-5 bg-background rounded-full shadow-md mt-0.5"
                animate={{ x: isAnonymous ? 18 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
          </motion.button>

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full"
            disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
          >
            {isSubmitting ? (
              'Wird gespeichert...'
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                €{amount || '0'} beitragen
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
