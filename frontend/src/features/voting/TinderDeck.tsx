import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Heart, X, Star, MapPin, Euro, Users, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { EventOption, Vote } from '@/types/domain';
import { useAppStore } from '@/store/appStore';
import confetti from 'canvas-confetti';

interface TinderDeckProps {
  events: EventOption[];
  onVotesComplete: (votes: Vote[]) => void;
}

const categoryColors: Record<EventOption['category'], string> = {
  Action: 'bg-destructive/20 text-destructive border-destructive/30',
  Food: 'bg-warning/20 text-warning border-warning/30',
  Relax: 'bg-success/20 text-success border-success/30',
  Party: 'bg-accent/20 text-accent border-accent/30',
};

const categoryIcons: Record<EventOption['category'], string> = {
  Action: '⚡',
  Food: '🍽️',
  Relax: '🧘',
  Party: '🎉',
};

export const TinderDeck = ({ events, onVotesComplete }: TinderDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { superLikeUsed, useSuperLike } = useAppStore();

  const currentEvent = events[currentIndex];
  const progress = ((currentIndex) / events.length) * 100;

  useEffect(() => {
    if (currentIndex >= events.length && events.length > 0) {
      onVotesComplete(votes);
    }
  }, [currentIndex, events.length, votes, onVotesComplete]);

  const handleVote = (liked: boolean, isSuperLike: boolean = false) => {
    if (isAnimating || !currentEvent) return;

    setIsAnimating(true);
    setDirection(liked ? 'right' : 'left');

    if (isSuperLike) {
      useSuperLike();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#d97706'],
      });
    }

    const vote: Vote = {
      event_id: currentEvent.id,
      weight: isSuperLike ? 3 : (liked ? 1 : 0),
      is_super_like: isSuperLike,
    };

    setTimeout(() => {
      setVotes(prev => [...prev, vote]);
      setCurrentIndex(prev => prev + 1);
      setDirection(null);
      setIsAnimating(false);
    }, 300);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      handleVote(true);
    } else if (info.offset.x < -threshold) {
      handleVote(false);
    }
  };

  if (!currentEvent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6"
        >
          <Heart className="w-10 h-10 text-primary-foreground" fill="currentColor" />
        </motion.div>
        <h2 className="text-2xl font-display font-bold mb-2">Abstimmung abgeschlossen!</h2>
        <p className="text-muted-foreground">Deine Stimmen wurden gezählt.</p>
      </motion.div>
    );
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* Progress bar */}
      <div className="w-full mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>{currentIndex + 1} von {events.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card stack */}
      <div className="relative w-full max-w-sm h-[420px]">
        <AnimatePresence mode="popLayout">
          {events.slice(currentIndex, currentIndex + 2).reverse().map((event, idx) => {
            const isTop = idx === (Math.min(1, events.length - currentIndex - 1));
            
            return (
              <motion.div
                key={event.id}
                className="absolute inset-0"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ 
                  scale: isTop ? 1 : 0.95, 
                  opacity: 1,
                  y: isTop ? 0 : 10,
                }}
                exit={{
                  x: direction === 'right' ? 300 : direction === 'left' ? -300 : 0,
                  rotate: direction === 'right' ? 20 : direction === 'left' ? -20 : 0,
                  opacity: 0,
                }}
                transition={{ duration: 0.3 }}
                drag={isTop ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={isTop ? handleDragEnd : undefined}
                style={{ zIndex: isTop ? 10 : 5 }}
              >
                <Card variant="elevated" className="h-full overflow-hidden">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    {event.is_mystery ? (
                      <div className="w-full h-full gradient-primary flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <HelpCircle className="w-20 h-20 text-primary-foreground/80" />
                        </motion.div>
                      </div>
                    ) : (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className={categoryColors[event.category]}>
                        {categoryIcons[event.category]} {event.category}
                      </Badge>
                    </div>
                    {event.is_mystery && (
                      <div className="absolute bottom-3 left-3 right-3">
                        <Badge variant="outline" className="bg-background/80 backdrop-blur">
                          🎭 Überraschungsevent
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-xl font-display font-bold leading-tight">
                      {event.is_mystery ? 'Überraschungsevent' : event.title}
                    </h3>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {event.location_region}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Euro className="w-4 h-4" />
                        ~{event.est_price_pp}€/Person
                      </div>
                      {event.min_participants && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          Min. {event.min_participants}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {event.tags.slice(0, 4).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-6">
        <Button
          variant="dislike"
          size="iconLg"
          onClick={() => handleVote(false)}
          disabled={isAnimating}
        >
          <X className="w-6 h-6" />
        </Button>

        <Button
          variant="superlike"
          size="iconXl"
          onClick={() => handleVote(true, true)}
          disabled={isAnimating || superLikeUsed}
          className={superLikeUsed ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <Star className="w-7 h-7" fill={superLikeUsed ? 'none' : 'currentColor'} />
        </Button>

        <Button
          variant="like"
          size="iconLg"
          onClick={() => handleVote(true)}
          disabled={isAnimating}
        >
          <Heart className="w-6 h-6" />
        </Button>
      </div>

      {/* Super like hint */}
      {!superLikeUsed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground mt-3 text-center"
        >
          ⭐ Du hast noch 1 Super-Like (zählt 3x!)
        </motion.p>
      )}
    </div>
  );
};
