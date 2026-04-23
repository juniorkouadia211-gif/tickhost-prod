import React from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { useStore } from '../store';

export const EventList = () => {
  const { events, loading, fetchEventDetails } = useStore();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const [imageError, setImageError] = React.useState<Record<string | number, boolean>>({});

  const handleImageError = (id: string | number) => {
    setImageError(prev => ({ ...prev, [id]: true }));
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-0">
      <div className="space-y-1 sm:space-y-2 px-2">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase italic">Événements <span className="text-primary">Live</span></h2>
        <p className="text-[10px] sm:text-xs font-black text-white/30 uppercase tracking-widest">Découvrez les meilleures expériences à Abidjan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {events.map((event) => (
          <motion.div
            key={event.id}
            whileHover={{ y: -5 }}
            onClick={() => fetchEventDetails(event.id)}
            className="bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-white/10 group cursor-pointer hover:border-primary/30 transition-all"
          >
            <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
              {!imageError[event.id] && event.image_url ? (
                <img 
                  src={event.image_url} 
                  alt={event.name}
                  onError={() => handleImageError(event.id)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10 italic">TICKHOST</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                <div className="flex items-center gap-2 text-primary/80 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg w-fit">
                  <Calendar className="w-3 h-3" />
                  {formatDate(event.event_date)}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter group-hover:text-primary transition-colors italic">{event.name}</h3>
              </div>
            </div>
            <div className="p-5 sm:p-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/30 text-[10px] sm:text-xs">
                <MapPin className="w-3.5 h-3.5 sm:w-4 h-4 text-primary/40 text-primary" />
                <span className="font-black uppercase tracking-widest">{event.location}</span>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-primary group-hover:text-black group-hover:scale-110 transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0)] group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
