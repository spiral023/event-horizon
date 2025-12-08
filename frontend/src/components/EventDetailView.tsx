import React from 'react';
import {
  MapPin,
  Clock,
  Users,
  Sun,
  CloudRain,
  Snowflake,
  Gamepad2,
  Zap,
  Coffee,
  PartyPopper,
  Info,
  ExternalLink,
  Phone,
  Mail,
  Star,
  CheckCircle2,
  AlertTriangle,
  Heart,
  CalendarDays,
} from 'lucide-react';
import { EventOption } from '@/types/domain';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EventDetailViewProps {
  event: EventOption;
  onClose: () => void;
  onVote: (event: EventOption) => void;
  onWatchlist?: (event: EventOption) => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({
  event,
  onClose,
  onVote,
  onWatchlist,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Action': return <Zap className="w-4 h-4" />;
      case 'Food': return <Coffee className="w-4 h-4" />;
      case 'Relax': return <Sun className="w-4 h-4" />;
      case 'Party': return <PartyPopper className="w-4 h-4" />;
      default: return <Gamepad2 className="w-4 h-4" />;
    }
  };

  const getIntensityColor = (level: number) => {
    if (level >= 4) return 'bg-destructive'; // High intensity
    if (level === 3) return 'bg-orange-500';
    return 'bg-success'; // Low/Easy
  };

  const formatSeason = (season?: string) => {
    switch (season) {
      case 'summer': return { icon: <Sun className="w-4 h-4" />, text: 'Sommer' };
      case 'winter': return { icon: <Snowflake className="w-4 h-4" />, text: 'Winter' };
      default: return { icon: <Sun className="w-4 h-4" />, text: 'Ganzjährig' };
    }
  };

  const seasonInfo = formatSeason(event.season);

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto custom-scrollbar">
      {/* 1. Hero-Bereich */}
      <div className="relative w-full h-[300px] md:h-[400px] shrink-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: event.image_url
              ? `url(${event.image_url})`
              : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col gap-4 max-w-5xl mx-auto w-full">
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="backdrop-blur-md bg-background/50 border-white/20 text-foreground flex items-center gap-1.5 px-3 py-1 text-sm font-medium">
                    {getCategoryIcon(event.category)}
                    {event.category}
                </Badge>
                <Badge variant="secondary" className="backdrop-blur-md bg-background/50 border-white/20 text-foreground flex items-center gap-1.5 px-3 py-1 text-sm font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.location_region}
                </Badge>
                <Badge variant="secondary" className="backdrop-blur-md bg-background/50 border-white/20 text-foreground flex items-center gap-1.5 px-3 py-1 text-sm font-medium">
                    {event.weather_dependent ? <Sun className="w-3.5 h-3.5" /> : <CloudRain className="w-3.5 h-3.5" />}
                    {event.weather_dependent ? 'Wetterabhängig' : 'Allwetter / Indoor'}
                </Badge>
            </div>

            <div className="space-y-2 max-w-2xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight tracking-tight">
                    {event.title}
                </h1>
                {event.short_description && (
                    <p className="text-lg text-muted-foreground/90 leading-relaxed">
                        {event.short_description}
                    </p>
                )}
            </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-8">
            
             {/* 2. Auf einen Blick */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-secondary/20 border-border/50 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                         <div className="p-3 rounded-full bg-primary/10 text-primary">
                            {seasonInfo.icon}
                         </div>
                         <div>
                             <p className="text-sm text-muted-foreground">Wetter & Saison</p>
                             <p className="font-medium text-foreground">
                                {event.weather_dependent ? 'Outdoor' : 'Indoor'} • {seasonInfo.text}
                             </p>
                         </div>
                    </CardContent>
                </Card>
                 <Card className="bg-secondary/20 border-border/50 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                         <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Clock className="w-4 h-4" />
                         </div>
                         <div>
                             <p className="text-sm text-muted-foreground">Anreise vom Office</p>
                             <p className="font-medium text-foreground">
                                {event.travel_time_from_office_minutes !== undefined && event.travel_time_from_office_minutes !== null 
                                  ? `${event.travel_time_from_office_minutes} Min.` 
                                  : 'k.A.'}
                             </p>
                         </div>
                    </CardContent>
                </Card>
            </div>

            {/* Description */}
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground">
                <p>{event.long_description || event.description || "Keine detaillierte Beschreibung verfügbar."}</p>
            </div>

            {/* 4. Für welches Team passt das? */}
            <div className="space-y-6">
                <h3 className="text-xl font-display font-semibold">Für welches Team passt das?</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Körperliche Intensität</span>
                            <span className="font-medium">{event.physical_intensity ?? 0}/5</span>
                        </div>
                         <Progress value={(event.physical_intensity ?? 0) * 20} className="h-2" indicatorClassName={getIntensityColor(event.physical_intensity ?? 0)} />
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Mentale Challenge</span>
                            <span className="font-medium">{event.mental_challenge ?? 0}/5</span>
                        </div>
                        <Progress value={(event.mental_challenge ?? 0) * 20} className="h-2" />
                    </div>
                    
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Social Level</span>
                            <span className="font-medium">{event.social_interaction_level ?? 0}/5</span>
                        </div>
                        <Progress value={(event.social_interaction_level ?? 0) * 20} className="h-2" indicatorClassName="bg-indigo-500" />
                        <p className="text-xs text-muted-foreground pt-1">
                            {(event.social_interaction_level ?? 0) > 3 ? 'Stärkt den Zusammenhalt intensiv' : 'Lockerer Austausch möglich'}
                        </p>
                    </div>
                </div>
            </div>

            {/* 5. Planung & Organisation */}
             <div className="space-y-6">
                <h3 className="text-xl font-display font-semibold">Planung & Organisation</h3>
                <Card className="border-border/50">
                    <CardContent className="p-6 grid gap-6 sm:grid-cols-2">
                        <div className="space-y-1">
                             <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                 <CalendarDays className="w-4 h-4" />
                                 Lead Time
                             </div>
                             <p className="font-medium">
                                 {event.lead_time_min_days ? `Mind. ${event.lead_time_min_days} Tage im Voraus` : 'Flexibel'}
                             </p>
                        </div>
                         <div className="space-y-1">
                             <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                 <Users className="w-4 h-4" />
                                 Teilnehmer
                             </div>
                             <p className="font-medium">
                                 {event.min_participants ? `Ab ${event.min_participants} Personen` : 'Keine Mindestanzahl'}
                             </p>
                        </div>
                        {event.price_comment && (
                            <div className="sm:col-span-2 space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                    <Info className="w-4 h-4" />
                                    Preisdetails
                                </div>
                                <p className="text-sm">{event.price_comment}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                 {/* Kontakt Details */}
                {(event.provider || event.website || event.phone || event.email) && (
                     <Card className="border-border/50 bg-secondary/10">
                        <CardContent className="p-6 space-y-4">
                            {event.provider && (
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Anbieter</span>
                                    <p className="font-medium text-lg">{event.provider}</p>
                                </div>
                            )}
                            
                            <div className="flex flex-wrap gap-3">
                                {event.website && (
                                    <Button variant="outline" size="sm" asChild className="gap-2">
                                        <a href={event.website} target="_blank" rel="noopener noreferrer">
                                            Details & Buchung <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </Button>
                                )}
                                {event.phone && (
                                    <Button variant="secondary" size="sm" asChild className="gap-2">
                                        <a href={`tel:${event.phone}`}>
                                            <Phone className="w-3 h-3" /> {event.phone}
                                        </a>
                                    </Button>
                                )}
                                {event.email && (
                                     <Button variant="secondary" size="sm" asChild className="gap-2">
                                        <a href={`mailto:${event.email}`}>
                                            <Mail className="w-3 h-3" /> E-Mail
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                     </Card>
                )}
            </div>

            {/* 6. Location & Anreise */}
            <div className="space-y-6">
                <h3 className="text-xl font-display font-semibold">Location & Anreise</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                     <div className="flex-1 space-y-2">
                         <div className="flex items-start gap-3">
                             <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                             <div>
                                 <p className="font-medium text-foreground">{event.address || event.location_region}</p>
                                 <p className="text-sm text-muted-foreground mt-1">
                                     {event.travel_time_from_office_minutes ? `Ca. ${event.travel_time_from_office_minutes} Minuten vom Office` : ''}
                                 </p>
                             </div>
                         </div>
                         {event.address && (
                            <Button variant="link" className="px-0 h-auto gap-1 text-primary" asChild>
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`} target="_blank" rel="noopener noreferrer">
                                    In Google Maps öffnen <ExternalLink className="w-3 h-3" />
                                </a>
                            </Button>
                         )}
                     </div>
                     {/* Placeholder for Map Thumbnail if we had one */}
                     <div className="w-full sm:w-48 h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                         <MapPin className="w-6 h-6 mb-1 opacity-20" />
                         <span className="sr-only">Karte</span>
                     </div>
                </div>
            </div>

        </div>

        {/* Sidebar / Decision Card (Sticky on Desktop) */}
        <div className="lg:col-span-4 relative">
            <div className="lg:sticky lg:top-8 space-y-4">
                <Card className="border-primary/20 shadow-lg bg-background/80 backdrop-blur-xl">
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-1 text-center lg:text-left">
                            <p className="text-sm text-muted-foreground">Geschätzter Preis</p>
                            <div className="flex items-baseline justify-center lg:justify-start gap-1">
                                <span className="text-4xl font-display font-bold text-foreground">
                                    {Math.round(event.est_price_pp)}€
                                </span>
                                <span className="text-muted-foreground">p. P.</span>
                            </div>
                             {event.price_comment && (
                                <p className="text-xs text-muted-foreground mt-1">{event.price_comment}</p>
                            )}
                        </div>

                         <div className="flex items-center justify-between py-4 border-y border-border/50">
                            <div className="flex items-center gap-1.5">
                                {event.external_rating ? (
                                    <>
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={cn(
                                                        "w-4 h-4",
                                                        i < Math.round(event.external_rating!)
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "fill-muted/20 text-muted"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <span className="font-bold text-lg ml-1">{event.external_rating}</span>
                                        <span className="text-xs text-muted-foreground">/ 5</span>
                                    </>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Neu dabei</span>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">
                                    {event.min_participants ? `Ab ${event.min_participants} Personen` : 'Flexibel'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button size="lg" className="w-full font-semibold shadow-md bg-gradient-to-r from-primary to-primary/80 hover:to-primary" onClick={() => onVote(event)}>
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Für Team-Voting auswählen
                            </Button>
                            {onWatchlist && (
                                <Button variant="outline" size="lg" className="w-full" onClick={() => onWatchlist(event)}>
                                    <Heart className="w-5 h-5 mr-2" />
                                    Auf Watchlist
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

      </div>
    </div>
  );
};
