import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Coins, PiggyBank, Sparkles, Wand2 } from 'lucide-react';
import type { EventOption } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { createCampaign } from '@/services/apiClient';
import { useAppStore } from '@/store/appStore';

type RegionValue = EventOption['location_region'];

const regionOptions: { value: RegionValue; label: string }[] = [
  { value: 'AT', label: 'Austria (Standard)' },
  { value: 'Tirol', label: 'Tirol & Berge' },
  { value: 'Stmk', label: 'Steiermark' },
  { value: 'Sbg', label: 'Salzburg' },
  { value: 'Ktn', label: 'Kaernten' },
];

const budgetPresets = [
  { label: 'Afterwork', total: 800, company: 400 },
  { label: 'Eintages-Trip', total: 1800, company: 900 },
  { label: 'Premium Retreat', total: 3200, company: 1500 },
];

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { deptCode, user, setCurrentCampaign } = useAppStore();

  const [name, setName] = useState(() => `Team Event ${new Date().getFullYear()}`);
  const [targetDateRange, setTargetDateRange] = useState('');
  const [totalBudget, setTotalBudget] = useState(2000);
  const [companyBudget, setCompanyBudget] = useState(1000);
  const [region, setRegion] = useState<RegionValue>(regionOptions[0].value);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deptCode) {
      navigate('/');
    }
  }, [deptCode, navigate]);

  const fundingProgress = useMemo(() => {
    if (totalBudget <= 0) return 0;
    return Math.min((companyBudget / totalBudget) * 100, 100);
  }, [companyBudget, totalBudget]);

  const handlePreset = (preset: (typeof budgetPresets)[number]) => {
    setTotalBudget(preset.total);
    setCompanyBudget(preset.company);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptCode) return;

    setLoading(true);
    try {
      const campaign = await createCampaign({
        name: name.trim() || 'Neues Team Event',
        dept_code: deptCode,
        target_date_range: targetDateRange.trim() || 'Demnaechst',
        total_budget_needed: Math.max(totalBudget, 500),
        company_budget_available: Math.max(Math.min(companyBudget, totalBudget), 0),
        external_sponsors: 0,
        region,
      });

      setCurrentCampaign(campaign.id);
      toast.success('Event erstellt! Abstimmung gestartet.');
      navigate(`/voting/${campaign.id}`, { replace: true });
    } catch (error) {
      console.error('Failed to create campaign', error);
      toast.error('Erstellen fehlgeschlagen. Bitte probiere es noch einmal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dept: {deptCode || '--'}</p>
              <h1 className="font-display font-bold leading-tight">Neues Team-Event</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Event anlegen
              </CardTitle>
              <CardDescription>
                Name, Zeitraum und Budget festlegen. Wir fuellen dir passende Optionen automatisch auf.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name">Event-Name</Label>
                  <Input
                    id="name"
                    placeholder="Team Offsite, Sommerfest ..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="range">Zeitraum</Label>
                  <Input
                    id="range"
                    placeholder="z.B. 15.07 - 31.08"
                    value={targetDateRange}
                    onChange={(e) => setTargetDateRange(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Gesamtbudget (EUR)</Label>
                    <Input
                      id="budget"
                      type="number"
                      min={500}
                      step={50}
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyBudget">Budget vom Unternehmen</Label>
                    <Input
                      id="companyBudget"
                      type="number"
                      min={0}
                      step={50}
                      value={companyBudget}
                      onChange={(e) => setCompanyBudget(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-border p-4 bg-secondary/30">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <PiggyBank className="w-4 h-4" />
                      Firmenanteil
                    </span>
                    <span className="font-semibold text-foreground">
                      {Math.round(fundingProgress)}%
                    </span>
                  </div>
                  <Progress value={fundingProgress} variant={fundingProgress >= 100 ? 'success' : 'gradient'} />
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    Noch fehlen EUR {Math.max(totalBudget - companyBudget, 0)} bis zum Ziel.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Regionale Inspiration</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Region waehlen" />
                    </SelectTrigger>
                    <SelectContent>
                      {regionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Wir schlagen automatisch passende Aktivitaeten fuer diese Region vor.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Schnell-Setup</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {budgetPresets.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant="outline"
                        className="justify-between"
                        onClick={() => handlePreset(preset)}
                      >
                        <span>{preset.label}</span>
                        <span className="text-xs text-muted-foreground">EUR {preset.total}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Wird angelegt...' : 'Event erstellen & abstimmen'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {user?.name || 'Du'} startest eine Voting-Runde. Vorschlaege, Stretch Goals und Voting-Karten werden automatisch befuellt.
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default CreateCampaign;


