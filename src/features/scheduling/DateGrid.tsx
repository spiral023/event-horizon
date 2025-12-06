import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sun, Sunset, Moon, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Availability } from '@/types/domain';

interface DateGridProps {
  onSubmit: (availability: Availability[]) => void;
}

const timeSlots = [
  { id: 'morning', label: 'Vormittag', icon: Sun, time: '9-12 Uhr' },
  { id: 'afternoon', label: 'Nachmittag', icon: Sunset, time: '13-17 Uhr' },
  { id: 'evening', label: 'Abend', icon: Moon, time: '18-22 Uhr' },
] as const;

// Generate next 14 days
const generateDates = () => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
};

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const DateGrid = ({ onSubmit }: DateGridProps) => {
  const [selectedSlots, setSelectedSlots] = useState<Map<string, Set<string>>>(new Map());
  const dates = generateDates();

  const toggleSlot = (dateStr: string, slot: string) => {
    setSelectedSlots(prev => {
      const newMap = new Map(prev);
      const dateSlots = newMap.get(dateStr) || new Set();
      
      if (dateSlots.has(slot)) {
        dateSlots.delete(slot);
      } else {
        dateSlots.add(slot);
      }
      
      if (dateSlots.size === 0) {
        newMap.delete(dateStr);
      } else {
        newMap.set(dateStr, dateSlots);
      }
      
      return newMap;
    });
  };

  const handleSubmit = () => {
    const availability: Availability[] = [];
    selectedSlots.forEach((slots, date) => {
      availability.push({
        date,
        slots: Array.from(slots) as Availability['slots'],
      });
    });
    onSubmit(availability);
  };

  const isSlotSelected = (dateStr: string, slot: string) => {
    return selectedSlots.get(dateStr)?.has(slot) ?? false;
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Verfügbarkeit
        </CardTitle>
        <CardDescription>
          Markiere wann du Zeit hast
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time slot legend */}
        <div className="flex gap-2 mb-4">
          {timeSlots.map(slot => (
            <div key={slot.id} className="flex items-center gap-1 text-xs text-muted-foreground">
              <slot.icon className="w-3 h-3" />
              <span>{slot.time}</span>
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {dates.map((date, dateIndex) => {
            const dateStr = date.toISOString().split('T')[0];
            const weekend = isWeekend(date);
            
            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: dateIndex * 0.03 }}
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  weekend ? 'bg-primary/5' : 'bg-secondary/30'
                }`}
              >
                <div className={`w-24 text-sm ${weekend ? 'font-semibold text-primary' : ''}`}>
                  {formatDate(date)}
                </div>
                <div className="flex-1 flex gap-1">
                  {timeSlots.map(slot => {
                    const selected = isSlotSelected(dateStr, slot.id);
                    return (
                      <motion.button
                        key={slot.id}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleSlot(dateStr, slot.id)}
                        className={`flex-1 p-2 rounded-lg flex items-center justify-center transition-colors ${
                          selected
                            ? 'gradient-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {selected ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <slot.icon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={selectedSlots.size === 0}
        >
          <Check className="w-4 h-4" />
          Verfügbarkeit speichern ({selectedSlots.size} Tage)
        </Button>
      </CardContent>
    </Card>
  );
};
