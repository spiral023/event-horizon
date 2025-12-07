import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Coins, PiggyBank, Sparkles, Wand2, Plus, X } from 'lucide-react';
import type { EventOption, StretchGoal } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { createCampaign } from '@/services/apiClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAppStore } from '@/store/appStore';
import { generateId } from '@/utils/storage';

type RegionValue = EventOption['location_region'];
type StretchGoalDraft = {
  id: string;
  reward_description: string;
  amount_threshold: number;
};

const regionOptions: { value: RegionValue; label: string }[] = [
  { value: 'OOE', label: 'Oberösterreich' },
  { value: 'Tirol', label: 'Tirol' },
  { value: 'Sbg', label: 'Salzburg' },
  { value: 'Stmk', label: 'Steiermark' },
  { value: 'Ktn', label: 'Kärnten' },
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
  
  // Internal state for multi-selection tabs
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [kwStart, setKwStart] = useState('');
  const [kwEnd, setKwEnd] = useState('');

  const [budgetMode, setBudgetMode] = useState<'total' | 'perParticipant'>('total');
  const [totalBudgetInput, setTotalBudgetInput] = useState(2000);
  const [companyBudget, setCompanyBudget] = useState(1000);
  const [budgetPerParticipant, setBudgetPerParticipant] = useState<number | undefined>(50);
  const [estimatedParticipants, setEstimatedParticipants] = useState(10);
  const [region, setRegion] = useState<RegionValue>(regionOptions[0].value);
  const [stretchGoals, setStretchGoals] = useState<StretchGoalDraft[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deptCode) {
      navigate('/');
    }
  }, [deptCode, navigate]);

  // Season Selection Logic
  const toggleSeason = (season: string) => {
    const year = new Date().getFullYear();
    const fullSeason = `${season} ${year}`;
    
    setSelectedSeasons(prev => {
      const newSelection = prev.includes(fullSeason)
        ? prev.filter(s => s !== fullSeason)
        : [...prev, fullSeason];
      
      setTargetDateRange(newSelection.join(', '));
      return newSelection;
    });
  };

  // Month Selection Logic
  const toggleMonth = (mon: string) => {
    const year = new Date().getFullYear();
    const fullMon = `${mon} ${year}`;
    
    setSelectedMonths(prev => {
      const newSelection = prev.includes(fullMon)
        ? prev.filter(m => m !== fullMon)
        : [...prev, fullMon];
      
      // Sort based on standard calendar order if possible, or just keep insertion order
      // For simplicity: join with comma
      const text = newSelection.join(', ');
      setTargetDateRange(text);
      return newSelection;
    });
  };

  // KW Range Logic
  useEffect(() => {
    if (kwStart || kwEnd) {
      const year = new Date().getFullYear();
      if (kwStart && kwEnd) {
        setTargetDateRange(`KW ${kwStart} - ${kwEnd} (${year})`);
      } else if (kwStart) {
        setTargetDateRange(`KW ${kwStart} (${year})`);
      }
    }
  }, [kwStart, kwEnd]);

  const totalBudget = useMemo(() => {
    if (budgetMode === 'perParticipant') {
      return (budgetPerParticipant || 0) * estimatedParticipants;
    }
    return totalBudgetInput;
  }, [budgetMode, budgetPerParticipant, estimatedParticipants, totalBudgetInput]);

  const fundingProgress = useMemo(() => {
    if (totalBudget <= 0) return 0;
    return Math.min((companyBudget / totalBudget) * 100, 100);
  }, [companyBudget, totalBudget]);

  const handlePreset = (preset: (typeof budgetPresets)[number]) => {
    setBudgetMode('total');
    setTotalBudgetInput(preset.total);
    setCompanyBudget(preset.company);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptCode) return;

    const normalizedStretchGoals: StretchGoal[] = stretchGoals
      .map((goal) => ({
        ...goal,
        reward_description: goal.reward_description.trim(),
        amount_threshold: Math.max(goal.amount_threshold, 0),
        unlocked: false,
      }))
      .filter((goal) => goal.reward_description || goal.amount_threshold > 0);

    setLoading(true);
    try {
      const campaign = await createCampaign({
        name: name.trim() || 'Neues Team Event',
        dept_code: deptCode,
        target_date_range: targetDateRange.trim() || 'Demnächst',
        total_budget_needed: Math.max(totalBudget, 0),
        company_budget_available: Math.max(Math.min(companyBudget, totalBudget), 0),
        budget_per_participant: budgetMode === 'perParticipant' ? budgetPerParticipant : undefined,
        external_sponsors: 0,
        region,
        stretch_goals: normalizedStretchGoals,
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
            <Link to="/">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
            </Link>
            <div>
              <p className="text-xs text-muted-foreground">Raum: {deptCode || '--'}</p>
              <h1 className="font-display font-bold leading-tight">Neues Team-Event</h1>
            </div>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
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
                Name, Zeitraum und Budget festlegen. Wir füllen dir passende Optionen automatisch auf.
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
                  <Label>Zeitraum (Grobe Planung)</Label>
                  <Tabs defaultValue="season" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="season">Jahreszeit</TabsTrigger>
                      <TabsTrigger value="month">Monat</TabsTrigger>
                      <TabsTrigger value="week">KW</TabsTrigger>
                      <TabsTrigger value="text">Freitext</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="season" className="pt-2 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {['Frühling', 'Sommer', 'Herbst', 'Winter'].map((season) => {
                           const year = new Date().getFullYear();
                           const val = `${season} ${year}`;
                           const isSelected = selectedSeasons.includes(val);
                           return (
                             <Button
                               key={season}
                               type="button"
                               variant={isSelected ? 'default' : 'outline'}
                               onClick={() => toggleSeason(season)}
                               className="justify-start"
                             >
                               {season}
                             </Button>
                           );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Beispiel: "Sommer {new Date().getFullYear()}"
                      </p>
                    </TabsContent>

                    <TabsContent value="month" className="pt-2 space-y-3">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {['Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'].map((mon) => {
                           const year = new Date().getFullYear();
                           const fullMon = `${mon} ${year}`;
                           const isSelected = selectedMonths.includes(fullMon);
                           return (
                             <Button
                               key={mon}
                               type="button"
                               size="sm"
                               variant={isSelected ? 'default' : 'outline'}
                               onClick={() => toggleMonth(mon)}
                             >
                               {mon}
                             </Button>
                           );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Wähle mehrere Monate für eine größere Auswahl.
                      </p>
                    </TabsContent>

                    <TabsContent value="week" className="pt-2 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="grid grid-cols-2 gap-2 w-full">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Von KW</Label>
                            <Input
                              type="number"
                              min={1}
                              max={52}
                              placeholder="Start"
                              value={kwStart}
                              onChange={(e) => setKwStart(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Bis KW</Label>
                            <Input
                              type="number"
                              min={1}
                              max={52}
                              placeholder="Ende"
                              value={kwEnd}
                              onChange={(e) => setKwEnd(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {targetDateRange.startsWith('KW') ? targetDateRange : 'Zeitraum festlegen...'}
                      </div>
                    </TabsContent>

                    <TabsContent value="text" className="pt-2">
                      <Input
                        id="range"
                        placeholder="z.B. 15.07 - 31.08"
                        value={targetDateRange}
                        onChange={(e) => setTargetDateRange(e.target.value)}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                <Tabs value={budgetMode} onValueChange={(value) => setBudgetMode(value as 'total' | 'perParticipant')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="total">Gesamt</TabsTrigger>
                    <TabsTrigger value="perParticipant">Pro Teilnehmer</TabsTrigger>
                  </TabsList>
                  <TabsContent value="total" className="pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Gesamtbudget (EUR)</Label>
                      <Input
                        id="budget"
                        type="number"
                        min={0}
                        step="any"
                        value={totalBudgetInput}
                        onChange={(e) => setTotalBudgetInput(Number(e.target.value) || 0)}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="perParticipant" className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="budgetPerParticipant">Budget p.P. (EUR)</Label>
                        <Input
                          id="budgetPerParticipant"
                          type="number"
                          min={0}
                          step="any"
                          placeholder="z.B. 40"
                          value={budgetPerParticipant}
                          onChange={(e) => setBudgetPerParticipant(Number(e.target.value) || undefined)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estimatedParticipants">Anzahl Teilnehmer</Label>
                        <Input
                          id="estimatedParticipants"
                          type="number"
                          min={1}
                          step={1}
                          value={estimatedParticipants}
                          onChange={(e) => setEstimatedParticipants(Number(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="companyBudget">Budget vom Unternehmen</Label>
                  <Input
                    id="companyBudget"
                    type="number"
                    min={0}
                    step="any"
                    value={companyBudget}
                    onChange={(e) => setCompanyBudget(Number(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-3 rounded-xl border border-border p-4 bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Geschätztes Gesamtbudget</p>
                    <p className="font-bold text-xl">EUR {Math.round(totalBudget)}</p>
                  </div>
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
                  <Label>Event Location</Label>
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
                    Wir schlagen automatisch passende Aktivitäten für diese Region vor.
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

                <div className="space-y-3 rounded-xl border border-border p-4 bg-secondary/30">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label>Stretch Goals (optional)</Label>
                      <p className="text-xs text-muted-foreground">
                        Bis zu 3 Ziele für Extras oder Upgrades. Lege Namen und Zielsatz fest.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={stretchGoals.length >= 3}
                      onClick={() =>
                        setStretchGoals((prev) => {
                          if (prev.length >= 3) return prev;
                          return [
                            ...prev,
                            {
                              id: generateId(),
                              reward_description: '',
                              amount_threshold: Math.max(Math.round(totalBudget + 250), 0),
                            },
                          ];
                        })
                      }
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Stretch Goal hinzufügen
                    </Button>
                  </div>

                  {stretchGoals.length === 0 ? (
                    <div className="text-xs text-muted-foreground border border-dashed border-border rounded-lg p-3 bg-background/40">
                      Noch keine Stretch Goals. Klicke auf &quot;Stretch Goal hinzufügen&quot;, um das erste Ziel
                      anzulegen.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stretchGoals.map((goal, index) => (
                        <div key={goal.id} className="rounded-lg border border-border bg-background/50 p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Stretch Goal {index + 1}</p>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                setStretchGoals((prev) => prev.filter((item) => item.id !== goal.id))
                              }
                              aria-label="Stretch Goal entfernen"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <Label>Bezeichnung / Benefit</Label>
                              <Input
                                value={goal.reward_description}
                                placeholder="z.B. Upgrade auf Live-DJ + Cocktails"
                                onChange={(e) =>
                                  setStretchGoals((prev) =>
                                    prev.map((item) =>
                                      item.id === goal.id
                                        ? { ...item, reward_description: e.target.value }
                                        : item
                                    )
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>Zielsatz (EUR)</Label>
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                value={goal.amount_threshold}
                                onChange={(e) =>
                                  setStretchGoals((prev) =>
                                    prev.map((item) =>
                                      item.id === goal.id
                                        ? { ...item, amount_threshold: Number(e.target.value) || 0 }
                                        : item
                                    )
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
