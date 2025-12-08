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
  Heart,
  CalendarDays,
  X,
  Navigation
} from 'lucide-react';
import { EventOption } from '@/types/domain';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EventDetailViewProps {
  event: EventOption;
  onClose: () => void;
  onVote: (event: EventOption) => void;
  onWatchlist?: (event: EventOption) => void;
}

// Helper Component for Segmented Progress Bars (Game-Stats Style)
const SegmentedMeter = ({ 
  value, 
  max = 5, 
  colorClass = "bg-primary", 
  label 
}: { 
  value: number; 
  max?: number; 
  colorClass?: string; 
  label: string 
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm items-center">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-bold text-foreground">{value}/{max}</span>
      </div>
      <div className="flex gap-1.5 h-2.5">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-full transition-all duration-500",
              i < value ? colorClass : "bg-secondary/60"
            )}
          />
        ))}
      </div>
    </div>
  );
};

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
    if (level >= 4) return 'bg-red-500'; // High intensity
    if (level === 3) return 'bg-orange-500'; // Medium
    return 'bg-emerald-500'; // Low/Easy
  };

  const formatSeason = (season?: string) => {
    switch (season) {
      case 'summer': return { icon: <Sun className="w-5 h-5" />, text: 'Sommer' };
      case 'winter': return { icon: <Snowflake className="w-5 h-5" />, text: 'Winter' };
      default: return { icon: <Sun className="w-5 h-5" />, text: 'Ganzjährig' };
    }
  };

  const seasonInfo = formatSeason(event.season);

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto custom-scrollbar relative">
      
      {/* Close Button (Floating) */}
      <Button 
        variant="secondary" 
        size="icon" 
        className="absolute top-4 right-4 z-20 rounded-full h-10 w-10 shadow-lg bg-background/50 backdrop-blur-md border border-white/10 hover:bg-background/80"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
        <span className="sr-only">Schließen</span>
      </Button>

      {/* 1. Hero-Bereich */}
      <div className="relative w-full h-[350px] md:h-[450px] shrink-0 group">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage: event.image_url
              ? `url(${event.image_url})`
              : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          }}
        >
          {/* Gradient Overlays for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col gap-5 max-w-6xl mx-auto w-full z-10">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Badge variant="outline" className="bg-background/20 backdrop-blur-md border-white/20 text-white flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium">
                    {getCategoryIcon(event.category)}
                    {event.category}
                </Badge>
                <Badge variant="outline" className="bg-background/20 backdrop-blur-md border-white/20 text-white flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.location_region}
                </Badge>
                <Badge variant="outline" className="bg-background/20 backdrop-blur-md border-white/20 text-white flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium">
                    {event.weather_dependent ? <Sun className="w-3.5 h-3.5" /> : <CloudRain className="w-3.5 h-3.5" />}
                    {event.weather_dependent ? 'Wetterabhängig' : 'Allwetter / Indoor'}
                </Badge>
            </div>

            {/* Title & Short Description */}
            <div className="space-y-3 max-w-3xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight drop-shadow-lg">
                    {event.title}
                </h1>
                {event.short_description && (
                    <p className="text-lg md:text-xl text-white/90 leading-relaxed font-medium drop-shadow-md max-w-2xl">
                        {event.short_description}
                    </p>
                )}
            </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-10">
            
             {/* 2. Auf einen Blick Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-secondary/30 border-border/50 shadow-sm hover:bg-secondary/50 transition-colors">
                    <CardContent className="p-5 flex items-center gap-4">
                         <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            {seasonInfo.icon}
                         </div>
                         <div>
                             <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Wetter & Saison</p>
                             <p className="font-semibold text-foreground text-lg leading-tight">
                                {event.weather_dependent ? 'Outdoor' : 'Indoor'} • {seasonInfo.text}
                             </p>
                         </div>
                    </CardContent>
                </Card>
                 <Card className="bg-secondary/30 border-border/50 shadow-sm hover:bg-secondary/50 transition-colors">
                    <CardContent className="p-5 flex items-center gap-4">
                         <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Clock className="w-5 h-5" />
                         </div>
                         <div>
                             <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Anreise (Office)</p>
                             <p className="font-semibold text-foreground text-lg leading-tight">
                                {event.travel_time_from_office_minutes !== undefined && event.travel_time_from_office_minutes !== null 
                                  ? `${event.travel_time_from_office_minutes} Min.` 
                                  : 'k.A.'}
                             </p>
                         </div>
                    </CardContent>
                </Card>
            </div>

            {/* Description Text */}
            <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                <p>{event.long_description || event.description || "Keine detaillierte Beschreibung verfügbar."}</p>
            </div>

            {/* 4. Team Fit (Visual Meters) */}
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-1 rounded-full bg-primary/50" />
                    <h3 className="text-2xl font-display font-bold">Team Fit Analyse</h3>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                    <SegmentedMeter 
                        label="Körperliche Intensität" 
                        value={event.physical_intensity ?? 0} 
                        colorClass={getIntensityColor(event.physical_intensity ?? 0)} 
                    />
                    
                    <SegmentedMeter 
                        label="Mentale Challenge" 
                        value={event.mental_challenge ?? 0} 
                        colorClass="bg-blue-500" 
                    />
                    
                    <div className="space-y-2">
                         <SegmentedMeter 
                            label="Social Interaction Level" 
                            value={event.social_interaction_level ?? 0} 
                            colorClass="bg-violet-500" 
                        />
                        <p className="text-sm text-muted-foreground italic">
                            {(event.social_interaction_level ?? 0) > 3 
                                ? '💡 Fördert aktives Teambuilding & Kommunikation' 
                                : '💡 Lockerer Austausch, weniger gruppendynamisch'}
                        </p>
                    </div>
                </div>
            </div>

            {/* 5. Planung & Organisation */}
             <div className="space-y-6">
                <h3 className="text-2xl font-display font-bold">Planung & Details</h3>
                <Card className="overflow-hidden border-border/60">
                    <CardContent className="p-0">
                        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
                            <div className="p-6 space-y-2">
                                 <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                                     <CalendarDays className="w-4 h-4" />
                                     Vorlaufzeit
                                 </div>
                                 <p className="font-semibold text-xl">
                                     {event.lead_time_min_days ? `Min. ${event.lead_time_min_days} Tage` : 'Flexibel buchbar'}
                                 </p>
                            </div>
                             <div className="p-6 space-y-2">
                                 <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                                     <Users className="w-4 h-4" />
                                     Teilnehmergröße
                                 </div>
                                 <p className="font-semibold text-xl">
                                     {event.min_participants ? `Ab ${event.min_participants} Personen` : 'Keine Mindestanzahl'}
                                 </p>
                            </div>
                        </div>
                        {event.price_comment && (
                            <div className="bg-secondary/20 p-4 border-t border-border/60 flex gap-3">
                                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground">{event.price_comment}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                 {/* Kontakt Details */}
                {(event.provider || event.website || event.phone || event.email) && (
                     <Card className="border-border/60 bg-gradient-to-br from-background to-secondary/20">
                        <CardContent className="p-6 space-y-4">
                            {event.provider && (
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Anbieter</span>
                                    <p className="font-display font-bold text-xl mt-1">{event.provider}</p>
                                </div>
                            )}
                            
                            <div className="flex flex-wrap gap-3 pt-2">
                                {event.website && (
                                    <Button variant="outline" className="gap-2 bg-background/50" asChild>
                                        <a href={event.website} target="_blank" rel="noopener noreferrer">
                                            Webseite <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </Button>
                                )}
                                {event.phone && (
                                    <Button variant="outline" className="gap-2 bg-background/50" asChild>
                                        <a href={`tel:${event.phone}`}>
                                            <Phone className="w-3 h-3" /> Anrufen
                                        </a>
                                    </Button>
                                )}
                                {event.email && (
                                     <Button variant="outline" className="gap-2 bg-background/50" asChild>
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
            <div className="space-y-6 pb-8">
                <h3 className="text-2xl font-display font-bold">Location</h3>
                <div className="bg-secondary/20 rounded-2xl overflow-hidden border border-border/50 flex flex-col sm:flex-row">
                     {/* Map Placeholder */}
                     <div className="w-full sm:w-1/3 min-h-[160px] bg-secondary/50 relative flex items-center justify-center border-b sm:border-b-0 sm:border-r border-border/50 group cursor-pointer overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#888_1px,transparent_1px)] [background-size:16px_16px]"></div>
                        <MapPin className="w-10 h-10 text-muted-foreground/50 z-10" />
                        
                         {event.address && (
                            <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors z-20 flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                                <span className="bg-background px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-border">Karte öffnen</span>
                            </a>
                        )}
                     </div>

                     <div className="flex-1 p-6 flex flex-col justify-center gap-3">
                         <div>
                             <p className="font-semibold text-lg text-foreground mb-1">{event.address || event.location_region}</p>
                             {event.travel_time_from_office_minutes && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Navigation className="w-4 h-4" />
                                    <span className="text-sm">Ca. {event.travel_time_from_office_minutes} Minuten vom Office</span>
                                </div>
                             )}
                         </div>
                         {event.address && (
                            <Button variant="link" className="px-0 h-auto gap-1 text-primary w-fit hover:no-underline hover:opacity-80 transition-opacity" asChild>
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`} target="_blank" rel="noopener noreferrer">
                                    In Google Maps öffnen <ExternalLink className="w-3 h-3" />
                                </a>
                            </Button>
                         )}
                     </div>
                </div>
            </div>

        </div>

        {/* Sidebar / Decision Card (Sticky on Desktop) */}
        <div className="lg:col-span-4 relative">
            <div className="lg:sticky lg:top-8 space-y-6">
                <Card className="border-primary/10 shadow-2xl bg-card/80 backdrop-blur-xl ring-1 ring-border/50">
                    <CardContent className="p-6 md:p-8 space-y-8">
                        {/* Price Section */}
                        <div className="space-y-2 text-center">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Geschätzter Preis</p>
                            <div className="flex items-start justify-center gap-1">
                                <span className="text-5xl font-display font-bold text-foreground tracking-tighter">
                                    {Math.round(event.est_price_pp)}€
                                </span>
                                <span className="text-muted-foreground font-medium mt-2">p. P.</span>
                            </div>
                        </div>

                        {/* Rating Section */}
                         <div className="bg-secondary/30 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                "w-4 h-4",
                                                i < Math.round(event.external_rating ?? 0)
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "fill-muted/30 text-muted/30"
                                            )}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">Google Bewertung</span>
                            </div>
                             <div className="text-right">
                                <span className="text-lg font-bold block leading-none">{event.external_rating ?? "-"}</span>
                                <span className="text-[10px] text-muted-foreground">/ 5.0</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Button size="lg" className="w-full font-bold h-12 text-md shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 hover:to-primary hover:scale-[1.02] transition-all" onClick={() => onVote(event)}>
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Auswählen
                            </Button>
                            {onWatchlist && (
                                <Button variant="outline" size="lg" className="w-full h-12 font-medium hover:bg-secondary/50" onClick={() => onWatchlist(event)}>
                                    <Heart className="w-5 h-5 mr-2" />
                                    Merken
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