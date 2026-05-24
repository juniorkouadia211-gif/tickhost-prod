import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight,
  Minus, 
  Plus, 
  ChevronRight, 
  Clock, 
  Shirt, 
  MessageCircle, 
  Mail, 
  ChevronDown,
  ExternalLink,
  Home,
  Info,
  User,
  LogOut,
  Star,
  MessageSquare,
  Flag,
  Smartphone,
  XCircle
} from 'lucide-react';
import { useStore } from '../store';
import { CheckoutFlow } from './CheckoutFlow';
import { AuthPages } from './AuthPages';
import { QRCodeCanvas } from 'qrcode.react';

const Countdown = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-1.5">
      {[
        { label: 'J', value: timeLeft.days },
        { label: 'H', value: timeLeft.hours },
        { label: 'M', value: timeLeft.minutes },
        { label: 'S', value: timeLeft.seconds }
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg w-10 h-11 flex items-center justify-center shadow-xl">
            <span className="text-lg font-black text-white leading-none tracking-tighter">
              {item.value.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="text-[5px] font-black uppercase tracking-widest text-primary leading-none">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-bold text-white/80 group-hover:text-white transition-colors">{question}</span>
        <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-white/50 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper: retourne l'URL image sans altérer les data: URIs (base64)
const getSafeImageSrc = (url: string | null | undefined, fallback: string, cacheBuster?: number): string => {
  if (!url) return fallback;
  // Base64 data URI — ne pas ajouter de paramètres
  if (url.startsWith('data:')) return url;
  // URL externe — ajouter cache-buster
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${cacheBuster || Date.now()}`;
};

export const EventMicrosite = () => {
  const { 
    view, setView, 
    selectedEvent, 
    cart, setCart,
    user,
    myTickets,
    fetchMyTickets,
    loading,
    setLoading,
    addToast
  } = useStore();

  const cacheBuster = useMemo(() => {
    return Date.now();
  }, [selectedEvent?.id, view]);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportContactType, setSupportContactType] = useState<'whatsapp' | 'email'>('whatsapp');
  const [supportContactValue, setSupportContactValue] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [showPwaBanner, setShowPwaBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const timer = setTimeout(() => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && !window.matchMedia('(display-mode: standalone)').matches) {
        setShowPwaBanner(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  // PWA dynamique — manifest unique par événement
  useEffect(() => {
    if (!selectedEvent) return;

    const manifest = {
      name: selectedEvent.name,
      short_name: selectedEvent.name.substring(0, 12),
      description: selectedEvent.description || `Billetterie — ${selectedEvent.name}`,
      start_url: `/?tenant=${selectedEvent.slug}`,
      display: 'standalone',
      background_color: selectedEvent.primary_color || '#000000',
      theme_color: selectedEvent.primary_color || '#000000',
      icons: [
        {
          src: selectedEvent.image_url || 'https://picsum.photos/seed/tickhost/192/192',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: selectedEvent.image_url || 'https://picsum.photos/seed/tickhost/512/512',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };

    // Injecter le manifest dynamiquement
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(blob);
    let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestUrl;

    // Mettre à jour le titre et theme-color
    document.title = selectedEvent.name;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', selectedEvent.primary_color || '#000000');

    return () => URL.revokeObjectURL(manifestUrl);
  }, [selectedEvent?.id, selectedEvent?.primary_color]);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      addToast('success', 'Installation réussie !');
    }
    setDeferredPrompt(null);
    setShowPwaBanner(false);
  };

  useEffect(() => {
    // Force l'affichage de l'accueil par défaut si aucun onglet n'est actif
    if (view === 'list' || !view) {
      setView('detail');
    }
  }, [view, setView]);

  // Luminosité maximale + WakeLock quand l'onglet "Mon Ticket" est actif
  useEffect(() => {
    let wakeLock: any = null;

    const enableBrightness = async () => {
      // WakeLock — empêche l'écran de s'éteindre
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch { /* non supporté ou refusé */ }
      }
      // Luminosité maximale via meta theme et CSS filter
      document.documentElement.style.filter = 'brightness(1)';
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', '#ffffff');
    };

    const disableBrightness = () => {
      if (wakeLock) { wakeLock.release(); wakeLock = null; }
      document.documentElement.style.filter = '';
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', '#000000');
    };

    if (view === 'my-tickets') {
      enableBrightness();
    } else {
      disableBrightness();
    }

    return () => disableBrightness();
  }, [view]);

  useEffect(() => {
    // Initial loading simulation for skeletons
    setLoading(true);
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [selectedEvent?.id, setLoading]);

  const SkeletonItem = () => (
    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="w-24 h-3 bg-white/10 rounded-full" />
          <div className="w-48 h-8 bg-white/20 rounded-xl" />
        </div>
        <div className="w-32 h-10 bg-white/10 rounded-2xl" />
      </div>
    </div>
  );

  // Determine direction based on tab order
  const availableTabs = [
    { id: 'detail', enabled: selectedEvent?.options?.home ?? true },
    { id: 'billetterie', enabled: selectedEvent?.options?.ticketing ?? true },
    { id: 'info', enabled: selectedEvent?.options?.info ?? true },
    { id: 'my-tickets', enabled: true } // Always enabled for user
  ].filter(t => t.enabled).map(t => t.id);

  const [prevView, setPrevView] = React.useState(view);
  const direction = availableTabs.indexOf(view) > availableTabs.indexOf(prevView) ? 1 : -1;

  // Filter tickets for current event
  const eventTickets = selectedEvent ? myTickets.filter((t: any) => t.eventName === selectedEvent.name) : [];

  React.useEffect(() => {
    setPrevView(view);
    if (view === 'my-tickets' && user) {
      fetchMyTickets(user.token);
    }
  }, [view, user, fetchMyTickets]);

  // Gallery Autoplay State
  const [sliderIndex, setSliderIndex] = useState(0);
  useEffect(() => {
    if (selectedEvent?.gallery_images && selectedEvent.gallery_images.length > 0) {
      const interval = setInterval(() => {
        setSliderIndex((prev) => (prev + 1) % selectedEvent.gallery_images!.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedEvent?.gallery_images]);

  // Dynamic Theme Handling
  useEffect(() => {
    if (selectedEvent?.primary_color) {
      document.documentElement.style.setProperty('--primary', selectedEvent.primary_color);
      
      // Convert hex to rgb for animations
      const hex = selectedEvent.primary_color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
    }
  }, [selectedEvent]);

  if (!selectedEvent) {
    // Si encore en chargement — afficher spinner
    if (loading) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-white/30 text-xs font-black uppercase tracking-widest">Chargement...</p>
          </div>
        </div>
      );
    }
    // Chargement terminé mais événement non trouvé
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 text-center">
        <div className="space-y-6 max-w-md">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
            <span className="text-4xl">🎟️</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
              Événement introuvable
            </h1>
            <p className="text-white/40 text-sm leading-relaxed">
              Ce lien ne correspond à aucun événement actif. Il est possible que l'événement soit terminé, que le lien soit incorrect, ou qu'il ait été supprimé.
            </p>
          </div>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="px-8 py-3 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Suspended View
  if ((selectedEvent as any).moderation_status === 'suspended') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-10 text-center">
        <div className="space-y-8 max-w-lg">
           <div className="flex justify-center">
              <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <ShieldCheck className="w-12 h-12" />
              </div>
           </div>
           <div className="space-y-4">
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">Ventes Suspendues</h1>
              <p className="text-white/40 font-bold leading-relaxed">
                L'accès à cet événement a été temporairement suspendu par les administrateurs de TICKHOST pour vérification de sécurité.
              </p>
           </div>
           <button 
             onClick={() => setView('list')}
             className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/60 font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
           >
              Retour à l'accueil
           </button>
        </div>
      </div>
    );
  }

  // Événement terminé ou archivé
  if (selectedEvent.status === 'closed' || selectedEvent.status === 'archived') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 text-center">
        <div className="space-y-8 max-w-lg">
          {/* Affiche en noir et blanc */}
          {selectedEvent.image_url && (
            <div className="relative w-48 h-48 mx-auto rounded-3xl overflow-hidden opacity-40 grayscale">
              <img src={selectedEvent.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Événement terminé</span>
            </div>

            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
              {selectedEvent.name}
            </h1>

            <p className="text-white/40 font-medium leading-relaxed">
              Cet événement s'est tenu le{' '}
              <span className="text-white/60 font-bold">
                {new Date(selectedEvent.event_date).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
              . La billetterie est maintenant fermée.
            </p>

            {selectedEvent.location && (
              <p className="text-white/20 text-sm">📍 {selectedEvent.location}</p>
            )}
          </div>

          {/* Accès aux billets achetés */}
          {user && (
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-3">
              <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Tu as assisté à cet événement ?</p>
              <button
                onClick={() => setView('my-tickets')}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
              >
                Voir mes billets archivés
              </button>
            </div>
          )}

          <button
            onClick={() => setView('list')}
            className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/60 font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = Math.max(0, Math.ceil((new Date(selectedEvent.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const addToCart = (type: any) => {
    const existing = cart.find(item => item.ticketTypeId === type.id);
    if (existing) {
      setCart(cart.map(item => 
        item.ticketTypeId === type.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        ticketTypeId: type.id,
        ticketTypeName: type.name,
        price: type.price,
        quantity: 1,
        eventName: selectedEvent.name
      }]);
    }
  };

  const removeFromCart = (ticketTypeId: string) => {
    const existing = cart.find(item => item.ticketTypeId === ticketTypeId);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(item => 
        item.ticketTypeId === ticketTypeId ? { ...item, quantity: item.quantity - 1 } : item
      ));
    } else {
      setCart(cart.filter(item => item.ticketTypeId !== ticketTypeId));
    }
  };

  const shareOnWhatsApp = () => {
    if (!selectedEvent) return;
    const url = window.location.href;
    const text = `Je serai à la ${selectedEvent.name} ! 🎟️ Prends ton ticket ici : ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const variants = {
    initial: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    }),
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 }
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 }
      }
    })
  };

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white">
      {/* Immersive Fixed Background (Refined Mesh) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Grain Texture */}
        <div className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

        {selectedEvent.bg_type === 'image' ? (
          <>
            <img 
              src={getSafeImageSrc(selectedEvent.bg_image || selectedEvent.image_url, '', cacheBuster)} 
              alt="" 
              className="w-full h-full object-cover grayscale-[0.5] blur-[100px]"
              style={{ opacity: selectedEvent.bg_opacity ?? 0.3 }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/80 to-[#050505]" />
          </>
        ) : (
          <div className="relative w-full h-full bg-[#050505]">
          <div 
            className="absolute inset-x-0 top-0 h-[60vh] pointer-events-none transition-all duration-700"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${selectedEvent.primary_color}44 0%, transparent 70%)`,
              opacity: 1
            }}
          />
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-700 blur-[120px]"
            style={{
              background: `radial-gradient(circle at -10% -10%, ${selectedEvent.primary_color}2b 0%, transparent 60%), radial-gradient(circle at 110% 110%, ${selectedEvent.primary_color}2b 0%, transparent 60%)`,
              opacity: (selectedEvent.bg_intensity ?? 0.5) * 1.5
            }}
          />
            {/* Grain Texture (Inside the mesh for deeper integration) */}
            <div className="absolute inset-0 z-10 opacity-[0.05] pointer-events-none mix-blend-overlay" 
                 style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes custom-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 30px rgba(var(--primary-rgb), 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0); }
        }
        .pulse-btn {
          animation: custom-pulse 2s infinite;
        }
        .glass {
          background: rgba(var(--primary-rgb), 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .organic-glow {
          box-shadow: 0 0 100px -20px rgba(var(--primary-rgb), 0.2);
        }
        .organic-glow-luxe {
          box-shadow: 0 0 120px -10px rgba(var(--primary-rgb), 0.3);
        }
      `}</style>

      <div className="relative z-10 w-full max-w-5xl mx-auto pb-[140px] px-4">
        {/* New Refined Top Bar */}
        <header className="flex items-center justify-between py-4 px-2 border-b border-white/5">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">Tickhost</span>
              <div className="w-px h-3 bg-white/20" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-white/60 truncate max-w-[120px]">
                {selectedEvent.organizer_name || 'Organisateur'}
              </span>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {user ? (
               <button 
               onClick={() => {
                 localStorage.removeItem('token');
                 window.location.reload();
               }}
               className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-red-500 transition-colors"
             >
               <LogOut className="w-3.5 h-3.5" />
               Déconnexion
             </button>
            ) : (
              <button 
                onClick={() => setView('login')}
                className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                Se connecter
              </button>
            )}
          </motion.div>
        </header>

      {/* Floating WhatsApp Share Button */}
      {(view === 'detail' || view === 'my-tickets') && (
        <motion.button
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={shareOnWhatsApp}
          className="fixed bottom-8 right-8 z-[9999] w-16 h-16 bg-emerald-500 text-white rounded-full shadow-[0_12px_40px_rgba(16,185,129,0.6)] flex items-center justify-center border-4 border-white/20 group"
        >
          <MessageCircle className="w-8 h-8 fill-current" />
          <span className="absolute -top-12 right-0 bg-white text-emerald-500 text-[10px] font-black px-3 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">
            Partager l'événement
          </span>
        </motion.button>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        {/* ACCUEIL (Vue Detail Immersive) */}
        {view === 'detail' && (
          <motion.div
            key="detail"
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-8"
          >
            {/* Section Identité Premium - ISOLATED TO HOME ONLY */}
            <div className="py-8 flex flex-col items-center justify-center text-center px-4 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col items-center gap-6"
              >
                {selectedEvent.show_logo_instead_of_name && selectedEvent.logo_url_main ? (
                  <img 
                    src={getSafeImageSrc(selectedEvent.logo_url_main, 'https://picsum.photos/seed/logo/200/200')} 
                    alt={selectedEvent.name} 
                    className="h-16 md:h-24 object-contain filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.8] italic bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent drop-shadow-[0_20px_40px_rgba(var(--primary-rgb),0.4)] px-4">
                      {selectedEvent.name}
                    </h1>
                )}
                
                <div className="flex items-center gap-3 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/30">
                    <span>{selectedEvent.category || 'Événement Exclusif'}</span>
                    <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
                    <span>Lieu d'Exception</span>
                </div>
              </motion.div>
            </div>

              {/* Barre Lieu / Date — juste au-dessus de l'affiche, alignés gauche et droite */}
              <div className="flex items-center justify-between w-full px-1">

                {/* Bloc Lieu — gauche */}
                <div
                  className="flex items-center gap-2 cursor-pointer group/lieu bg-black/40 backdrop-blur-md px-2.5 sm:px-3 py-2 rounded-2xl border border-white/10 hover:border-primary/50 transition-all max-w-[48%]"
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedEvent.location || '')}`, '_blank')}
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 flex-shrink-0">
                    <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                  </div>
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-[5px] sm:text-[6px] font-black uppercase tracking-widest text-white/40 leading-none mb-0.5">Lieu</span>
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white group-hover/lieu:text-primary transition-colors truncate">
                      {selectedEvent.location || 'Lieu'}
                    </span>
                  </div>
                </div>

                {/* Bloc Date — droite */}
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-2.5 sm:px-3 py-2 rounded-2xl border border-white/10 hover:border-primary/50 transition-all max-w-[48%]">
                  <div className="flex flex-col text-right overflow-hidden">
                    <span className="text-[5px] sm:text-[6px] font-black uppercase tracking-widest text-white/40 leading-none mb-0.5">Date</span>
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white truncate">
                      {selectedEvent.event_date
                        ? new Date(selectedEvent.event_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })
                        : 'Date'}
                    </span>
                  </div>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 flex-shrink-0">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                  </div>
                </div>

              </div>

              {/* Affiche — Countdown centré en bas */}
            <div className="relative h-[55vh] sm:h-[60vh] min-h-[400px] sm:min-h-[500px] w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group bg-black organic-glow-luxe">
               {/* Affiche (Poster) */}
               <img 
                 src={getSafeImageSrc(selectedEvent.image_url, 'https://picsum.photos/seed/poster/800/1200', (selectedEvent as any).updated_at || cacheBuster)} 
                 alt={selectedEvent.name}
                 key={(selectedEvent as any).updated_at}
                 className="absolute inset-0 w-full h-full object-cover grayscale-[0.05] contrast-[1.05]"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />

               {/* Countdown — centré en bas de l'affiche */}
               <div className="absolute bottom-4 sm:bottom-5 left-0 right-0 flex justify-center z-20">
                 <Countdown targetDate={selectedEvent.event_date} />
               </div>
            </div>

            {/* Pulsing Buy Button */}
            {(selectedEvent as any).home_options?.buy_button !== false && (
              <div className="flex flex-col items-center gap-4 py-8">
                <button 
                  onClick={() => setView('billetterie')}
                  className="pulse-btn group w-full md:w-auto px-10 sm:px-16 py-6 sm:py-8 bg-primary text-black rounded-[2rem] font-black text-xl sm:text-2xl uppercase tracking-tighter shadow-[0_25px_60px_rgba(var(--primary-rgb),0.5)] border-2 border-white/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-4 sm:gap-6"
                >
                  Prendre mes places
                  <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
                <div className="flex items-center gap-3 text-white/20">
                  <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
                  <span className="text-[9px] font-black uppercase tracking-[0.4em]">Expérience Sécurisée par TICKHOST</span>
                </div>
              </div>
            )}

            {/* Description Experience (Style Épuré) */}
            {(selectedEvent as any).home_options?.description !== false && selectedEvent.description && (
              <div className="py-16 px-8 space-y-12 max-w-4xl mx-auto">
                <div className="flex items-center gap-6 justify-center">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.6em] italic whitespace-nowrap">L'Expérience Magnétique</h3>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
                </div>
                
                <div className="relative group">
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary/20 rounded-full blur-[1px]" />
                  <p className="text-white/80 leading-[2] text-xl md:text-2xl font-medium italic text-center tracking-tight px-4">
                    "{selectedEvent.description}"
                  </p>
                  <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary/20 rounded-full blur-[1px]" />
                </div>

                <div className="flex justify-center">
                  <div className="w-2 h-2 bg-primary/20 rounded-full animate-pulse" />
                </div>
              </div>
            )}

            {/* Slider d'Images (Carousel avec Autoplay) */}
            {Array.isArray(selectedEvent.gallery_images) && selectedEvent.gallery_images.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-black uppercase tracking-tighter italic text-primary">{selectedEvent.gallery_title || 'Photos & Ambiance'}</h3>
                  <div className="h-px flex-1 mx-4 bg-white/5" />
                  <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.3em]">Immersion</p>
                </div>
                
                <div className="relative w-full overflow-hidden rounded-[1.5rem] bg-white/5 border border-white/10 h-[220px]">
                  <motion.div 
                    className="flex h-full"
                    animate={{ 
                      x: `-${sliderIndex * 100}%` 
                    }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  >
                    {selectedEvent.gallery_images.map((img, i) => (
                      <div 
                        key={i} 
                        className="flex-none w-full h-full p-2"
                      >
                        <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl relative group">
                          <img 
                            src={img} 
                            alt={`Gallery ${i}`} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                  
                  {/* Progress Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {selectedEvent.gallery_images.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1 rounded-full transition-all duration-500 ${
                          sliderIndex === i 
                            ? 'w-6 bg-primary' 
                            : 'w-2 bg-white/20'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedEvent.welcome_message && (
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary/20 rounded-full" />
                <p className="text-xl font-medium text-white/90 leading-relaxed italic">
                  "{selectedEvent.welcome_message}"
                </p>
              </div>
            )}

            {/* Bande des Partenaires (Isolée à l'accueil) */}
            {(selectedEvent as any).partners && (selectedEvent as any).partners.length > 0 && (
              <div className="py-12 border-t border-white/5 space-y-8">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Nos Partenaires de Confiance</p>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  {(selectedEvent as any).partners.map((logo: string, i: number) => (
                    <motion.img 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      src={getSafeImageSrc(logo, 'https://picsum.photos/seed/partner/100/100', (selectedEvent as any).updated_at || cacheBuster)} 
                      alt="Partenaire" 
                      className="h-8 md:h-12 w-auto object-contain transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* BILLETTERIE (Sales Psychology Upgrade) */}
        {view === 'billetterie' && (
          <motion.div
            key="billetterie"
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-10"
          >
            <div className="text-center space-y-3">
              <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Prendre mes places</h2>
              <p className="text-white/40 font-medium tracking-wide">Sécurisez votre accès en quelques instants</p>
            </div>

            <div className="grid gap-6 sm:gap-8">
              {loading ? (
                Array(3).fill(0).map((_, i) => <SkeletonItem key={i} />)
              ) : selectedEvent.ticketTypes?.map((type) => {
                const cartItem = cart.find(item => item.ticketTypeId === type.id);
                const soldOut = type.available_quantity === 0;
                const fillingPercent = Math.min(100, Math.round(((type.total_quantity - type.available_quantity) / type.total_quantity) * 100));
                
                return (
                  <motion.div 
                    key={type.id} 
                    className={`glass p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 hover:bg-white/[0.05] transition-all group relative overflow-hidden ${soldOut ? 'grayscale opacity-60' : ''}`}
                  >
                    {/* Shadow Halo */}
                    <div 
                      className="absolute -right-20 -top-20 w-40 h-40 rounded-full blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity"
                      style={{ backgroundColor: 'var(--primary)' }}
                    />

                    <div className="text-center md:text-left space-y-3 sm:space-y-4 flex-1 w-full">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                          <p className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1">Catégorie</p>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter leading-tight">{type.name}</h2>
                      </div>
                      
                      {/* Urgency Messages (Optimisation Psychologique) */}
                      <div className="pt-1 sm:pt-2">
                        {fillingPercent >= 25 && fillingPercent < 50 && (
                          <span className="px-2 sm:px-3 py-1 bg-white/5 border border-white/10 text-[7px] sm:text-[8px] font-black text-white/60 uppercase tracking-widest rounded-full">
                            🔥 Forte demande
                          </span>
                        )}
                        {fillingPercent >= 50 && fillingPercent < 75 && (
                          <span className="px-2 sm:px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-[7px] sm:text-[8px] font-black text-orange-500 uppercase tracking-widest rounded-full animate-pulse">
                            ⚠️ Presque épuisé
                          </span>
                        )}
                        {fillingPercent >= 75 && (
                          <span className="px-2 sm:px-3 py-1 bg-[#10b981]/10 border border-[#10b981]/20 text-[7px] sm:text-[8px] font-black text-[#10b981] uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            ⏳ Plus que quelques billets !
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-4 sm:gap-6 flex-shrink-0 w-full sm:w-auto">
                      <p className="text-4xl sm:text-5xl font-black text-white tracking-tighter drop-shadow-2xl">
                        {type.price.toLocaleString()} <span className="text-[10px] text-white/40 uppercase ml-1">FCFA</span>
                      </p>
                      
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-center">
                        {soldOut ? (
                          <div className="w-full sm:w-auto px-12 py-4 sm:py-5 bg-white/5 text-white/20 rounded-[1.2rem] sm:rounded-[1.5rem] font-black uppercase tracking-widest text-xs border border-white/5 text-center">
                            Épuisé
                          </div>
                        ) : cartItem ? (
                          <div className="flex items-center gap-6 bg-white/5 rounded-[1.2rem] sm:rounded-[1.5rem] p-1.5 sm:p-2 border border-white/10 shadow-2xl">
                            <button onClick={() => removeFromCart(type.id)} className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all"><Minus className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                            <span className="font-black text-xl sm:text-2xl w-8 sm:w-10 text-center text-white">{cartItem.quantity}</span>
                            <button onClick={() => addToCart(type)} className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-black rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-[0_0_20px_var(--primary)]"><Plus className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => addToCart(type)}
                            className="w-full sm:w-auto px-10 sm:px-16 py-4 sm:py-5 bg-primary text-black rounded-[1.2rem] sm:rounded-[1.5rem] font-black uppercase tracking-widest text-xs sm:text-sm shadow-[0_15px_40px_rgba(var(--primary-rgb),0.3)] hover:scale-105 active:scale-95 transition-all"
                          >
                            Réserver
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {cart.length > 0 && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-[90px] lg:bottom-[40px] left-4 right-4 max-w-lg mx-auto z-40"
              >
                <button 
                  onClick={() => setView('checkout')}
                  className="w-full bg-primary text-black p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] font-black text-lg sm:text-xl shadow-[0_25px_60px_rgba(var(--primary-rgb),0.4)] border-4 border-white/20 flex items-center justify-between hover:scale-[1.03] transition-all uppercase tracking-tighter"
                >
                  <span>Mon Panier ({cart.reduce((a,b) => a + b.quantity, 0)})</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-sm font-black bg-black/10 px-3 py-1 rounded-full">
                      {cart.reduce((a,b) => a + (b.price * b.quantity), 0).toLocaleString()} FCFA
                    </span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* INFOS */}
        {view === 'info' && (
          <motion.div
            key="info"
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-12"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Informations Pratiques</h2>
              <p className="text-white/40 font-medium">Tout ce qu'il faut savoir pour profiter de l'événement</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Bloc 1: Date & Horaires */}
              {selectedEvent.info_options?.date_time && (
                <div className="glass organic-glow p-10 rounded-[2.5rem] space-y-4 hover:bg-white/10 transition-all group">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Quand ?</h3>
                    <p className="text-white/60 text-lg font-bold">{formatDate(selectedEvent.event_date)}</p>
                    <div className="flex items-center gap-4 pt-2">
                       <div className="bg-white/5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white/40 italic">Début {selectedEvent.start_time || '20:00'}</div>
                       <div className="bg-white/5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white/40 italic">Fin {selectedEvent.end_time || '04:00'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bloc 2: Lieu */}
              {selectedEvent.info_options?.location && (
                <div className="glass organic-glow p-10 rounded-[2.5rem] space-y-4 hover:bg-white/10 transition-all group lg:col-span-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Où ça ?</h3>
                      <p className="text-white/60 text-lg font-bold">{selectedEvent.location}</p>
                    </div>
                    {selectedEvent.info_options?.maps && selectedEvent.maps_link && (
                      <div className="h-48 w-full rounded-2xl overflow-hidden border border-white/10 opacity-70 hover:opacity-100 transition-opacity">
                        <iframe
                          title="Google Maps"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          marginHeight={0}
                          marginWidth={0}
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedEvent.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                          className="invert brightness-[0.8] contrast-[1.2]"
                        />
                      </div>
                    )}
                    {selectedEvent.maps_link && (
                      <button 
                        onClick={() => window.open(selectedEvent.maps_link, '_blank')}
                        className="w-full py-4 bg-primary text-black rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Itinéraire GPS Premium
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Bloc 3: Dress Code */}
              {selectedEvent.info_options?.dress_code && selectedEvent.dress_code && (
                <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 space-y-4 hover:bg-white/10 transition-all group">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shirt className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Dress Code</h3>
                    <p className="text-white/60 leading-relaxed font-medium">
                      {selectedEvent.dress_code}
                    </p>
                  </div>
                </div>
              )}

              {/* Bloc 4: Contact */}
              {selectedEvent.info_options?.support && (selectedEvent.support_email || selectedEvent.support_whatsapp) && (
                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">Contact & Support</h3>
                    <div className="space-y-2">
                      {selectedEvent.support_whatsapp && (
                        <a href={`https://wa.me/${selectedEvent.support_whatsapp.replace(/\s+/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                          <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20">
                            <MessageCircle className="w-4 h-4 text-green-500" />
                          </div>
                          <span className="text-sm font-medium">WhatsApp Support</span>
                        </a>
                      )}
                      {selectedEvent.support_email && (
                        <a href={`mailto:${selectedEvent.support_email}`} className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20">
                            <Mail className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium">{selectedEvent.support_email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Sections */}
              {selectedEvent.info_sections?.map((section: any, idx: number) => (
                <div key={idx} className="bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">{section.title}</h3>
                    <p className="text-white/60 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="space-y-8 pt-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Questions Fréquentes</h3>
                <p className="text-white/40 font-medium">Besoin d'aide ? Voici les réponses aux questions les plus posées.</p>
              </div>
              <div className="bg-white/5 rounded-[2rem] border border-white/10 px-8">
                <FAQItem 
                  question="Comment recevoir mon billet ?" 
                  answer="Une fois le paiement validé, votre billet est disponible immédiatement dans l'onglet 'Mon Ticket'. Vous recevrez également une confirmation par email." 
                />
                <FAQItem 
                  question="Puis-je me faire rembourser ?" 
                  answer="Les billets ne sont ni échangeables ni remboursables, sauf en cas d'annulation de l'événement par l'organisateur." 
                />
                <FAQItem 
                  question="Faut-il imprimer le billet ?" 
                  answer="Non, il suffit de présenter le QR Code sur votre téléphone à l'entrée de l'événement." 
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* MON TICKET (Refonte Wallet Premium) */}
        {view === 'my-tickets' && (
          <motion.div
            key="my-tickets"
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter text-center">Mes Accès</h2>
              <p className="text-white/40 font-medium tracking-wide">Présentez ce code à l'entrée</p>
            </div>

            {loading ? (
              <div className="text-center py-20 space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Ticket className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <p className="text-white/40 font-black uppercase tracking-[0.2em] text-xs animate-pulse">Sécurisation en cours...</p>
              </div>
            ) : user ? (
              <div className="space-y-12">
                {eventTickets.length > 0 ? (
                  <div className="space-y-12">
                  {eventTickets.map((ticket: any) => (
                    <motion.div 
                      key={ticket.id}
                      whileHover={{ y: -5 }}
                      className="relative"
                    >
                      {/* Decorative elements */}
                      <div className="absolute -inset-1 bg-gradient-to-b from-primary/30 to-transparent blur-2xl opacity-50 -z-10" />
                      
                      <div className="bg-white/5 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
                        {/* Ticket Header */}
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{ticket.eventName}</p>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{ticket.ticketTypeName}</h3>
                          </div>
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            ticket.status === 'used' 
                              ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          }`}>
                            {ticket.status === 'used' ? 'Scanné' : 'Valide'}
                          </div>
                        </div>

                        {/* QR Code Section (High Contrast) */}
                        <div className="p-10 bg-white relative">
                          {/* Cut-outs */}
                          <div className="absolute top-1/2 -left-4 w-8 h-8 bg-[#050505] rounded-full" />
                          <div className="absolute top-1/2 -right-4 w-8 h-8 bg-[#050505] rounded-full" />
                          
                          <div className="flex flex-col items-center justify-center gap-8">
                            <div className="p-4 bg-white rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.1)] border-4 border-slate-50">
                              <QRCodeCanvas 
                                value={ticket.qr_code_data || ticket.unique_code} 
                                size={280} 
                                level="H" 
                                includeMargin={false} 
                                fgColor="#000000"
                              />
                            </div>

                            <div className="text-center space-y-4">
                              <div className="space-y-1">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Code Unique</p>
                                <p className="text-black text-2xl font-black font-mono tracking-[0.2em]">{ticket.unique_code}</p>
                              </div>
                              
                              <div className="flex items-center gap-2 justify-center text-slate-300">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Validé par TICKHOST</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ticket Footer */}
                        <div className="p-6 bg-white/[0.02] border-t border-white/5 grid grid-cols-2 gap-4">
                           <div className="text-center">
                              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Passager</p>
                              <p className="text-sm font-bold text-white uppercase tracking-tight truncate">{ticket.userName || user.fullName}</p>
                           </div>
                           <div className="text-center border-l border-white/10">
                              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Achat le</p>
                              <p className="text-sm font-bold text-white italic">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-white/10 space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/10 border border-white/10">
                    <Ticket className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Aucun billet trouvé</h2>
                    <p className="text-white/40 font-medium max-w-[240px] mx-auto">Vos accès apparaîtront ici dès que vous aurez complété un achat.</p>
                  </div>
                  <button 
                    onClick={() => setView('billetterie')}
                    className="px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
                  >
                    Aller à la boutique
                  </button>
                </div>
                )}

                {/* Rating & Feedback Section */}
                <div className="space-y-6 pt-12 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">Votre avis compte</h3>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Notez l'événement</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 space-y-6">
                    <div className="flex justify-center gap-4">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button 
                          key={s} 
                          onClick={() => setRating(s)}
                          className="group transition-transform active:scale-90"
                        >
                           <Star className={`w-8 h-8 transition-colors ${rating >= s ? 'text-primary fill-primary' : 'text-white/10 group-hover:text-primary/40'}`} />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm font-medium text-white/60 outline-none focus:border-primary transition-colors min-h-[100px] resize-none"
                      placeholder="Qu'avez-vous pensé de l'événement ?"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <button 
                      disabled={isSubmittingFeedback || rating === 0}
                      onClick={async () => {
                        if (rating === 0) return;
                        setIsSubmittingFeedback(true);
                        try {
                          const res = await fetch(`/api/events/${selectedEvent.id}/feedback`, {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${user?.token}`
                            },
                            body: JSON.stringify({ rating, comment })
                          });
                          if (res.ok) {
                            addToast('success', 'Merci pour votre avis !');
                            setRating(0);
                            setComment('');
                          }
                        } catch (err) {
                          addToast('error', 'Impossible d\'envoyer l\'avis');
                        } finally {
                          setIsSubmittingFeedback(false);
                        }
                      }}
                      className="w-full py-4 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                    >
                      {isSubmittingFeedback ? 'Envoi...' : 'Envoyer mon avis'}
                    </button>
                  </div>

                  <div className="flex justify-center pt-4">
                    <button 
                      onClick={() => setIsSupportModalOpen(true)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-red-500 transition-colors"
                    >
                      <Flag className="w-3 h-3" />
                      Signaler un problème à TICKHOST
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-white/10 space-y-6">
                <p className="text-white/40 font-bold">Connectez-vous pour accéder à vos billets</p>
                <button 
                  onClick={() => setView('login')} 
                  className="bg-primary text-black px-12 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
                >
                  Authentification
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* AUTH (Login/Register) */}
        {(view === 'login' || view === 'register') && <AuthPages />}
        
        {/* CHECKOUT */}
        {view === 'checkout' && <CheckoutFlow />}
      </AnimatePresence>

      {/* SUPPORT MODAL (Signaler un problème - Redesigned) */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSupportModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-8 shadow-2xl space-y-8"
            >
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Signaler un Problème</h3>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Support direct TickHost</p>
              </div>

              {/* Contact Method Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setSupportContactType('whatsapp')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${supportContactType === 'whatsapp' ? 'border-[#25D366] bg-[#25D366]/5 shadow-[0_0_20px_rgba(37,211,102,0.1)]' : 'border-white/5 bg-white/5 opacity-40 hover:opacity-100'}`}
                >
                  <MessageCircle className={`w-8 h-8 ${supportContactType === 'whatsapp' ? 'text-[#25D366]' : 'text-white'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
                </button>
                <button 
                  onClick={() => setSupportContactType('email')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${supportContactType === 'email' ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-white/5 bg-white/5 opacity-40 hover:opacity-100'}`}
                >
                  <Mail className={`w-8 h-8 ${supportContactType === 'email' ? 'text-blue-500' : 'text-white'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Email</span>
                </button>
              </div>

              {/* Contact Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">
                    {supportContactType === 'whatsapp' ? 'Votre Numéro WhatsApp' : 'Votre Adresse Email'}
                  </label>
                  <input 
                    type={supportContactType === 'whatsapp' ? 'tel' : 'email'}
                    placeholder={supportContactType === 'whatsapp' ? '07 00 00 00 00' : 'votre@email.com'}
                    value={supportContactValue}
                    onChange={(e) => setSupportContactValue(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-primary transition-all outline-none font-bold placeholder:text-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Description du problème</label>
                  <textarea 
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Détaillez ici votre souci..."
                    className="w-full bg-black border border-white/10 rounded-2xl p-6 text-sm font-medium text-white outline-none focus:border-red-500 transition-colors min-h-[150px] resize-none"
                  />
                </div>
              </div>

              <button 
                onClick={async () => {
                  if (!supportContactValue.trim() || !supportMessage.trim()) {
                    addToast('error', 'Veuillez remplir tous les champs');
                    return;
                  }
                  setIsSubmittingSupport(true);
                  try {
                    const res = await fetch(`/api/events/${selectedEvent.id}/support`, {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user?.token}`
                      },
                      body: JSON.stringify({ 
                        email_whatsapp: supportContactValue, 
                        message: supportMessage 
                      })
                    });
                    if (res.ok) {
                      addToast('success', 'Signalement envoyé à TICKHOST');
                      setSupportMessage('');
                      setSupportContactValue('');
                      setIsSupportModalOpen(false);
                    }
                  } catch (err) {
                    addToast('error', 'Échec de l\'envoi');
                  } finally {
                    setIsSubmittingSupport(false);
                  }
                }}
                disabled={isSubmittingSupport || !supportMessage.trim()}
                className="w-full py-6 bg-red-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-red-600/30 disabled:opacity-50 active:scale-95 transition-all"
              >
                {isSubmittingSupport ? 'Enregistrement...' : 'Envoyer le signalement'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPwaBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-[1000] md:left-1/2 md:-translate-x-1/2 md:max-w-sm"
          >
            <div className="bg-black/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">TICKHOST EXPERIENCE</h4>
                  <p className="text-xs font-medium text-white/70 leading-tight">Accès rapide via votre écran</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                   onClick={handleInstallPwa}
                   className="bg-primary text-black px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Go
                </button>
              </div>
              <button 
                onClick={() => setShowPwaBanner(false)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-black rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-xs bg-black/50 backdrop-blur-[32px] border border-white/10 rounded-[2rem] p-1.5 flex items-center justify-between shadow-[0_24px_50px_-12px_rgba(0,0,0,0.9)]">
        {[
          { id: 'detail', label: 'Accueil', icon: Home, enabled: selectedEvent.options?.home ?? true },
          { id: 'billetterie', label: 'Billeterie', icon: Ticket, enabled: selectedEvent.options?.ticketing ?? true },
          { id: 'info', label: 'Infos', icon: Info, enabled: selectedEvent.options?.info ?? true },
          { id: 'my-tickets', label: 'Mon Ticket', icon: User, enabled: true },
        ].filter(tab => tab.enabled).map((tab) => {
          const isActive = view === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                const element = document.getElementById('microsite-content');
                if (element) element.scrollTo({ top: 0, behavior: 'smooth' });
                setView(tab.id as any);
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-3 overflow-hidden rounded-[1.5rem] transition-all relative ${
                isActive ? 'text-black' : 'text-white/30 hover:text-white'
              }`}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div 
                    layoutId="active-tab"
                    className="absolute inset-0 bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              <tab.icon className={`w-4 h-4 relative z-10 transition-transform ${isActive ? 'fill-black scale-110' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-widest relative z-10 leading-none">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  </div>
);
};
