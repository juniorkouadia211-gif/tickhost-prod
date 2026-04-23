import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  Plus,
  Minus,
  Activity,
  Users,
  ShieldCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from './store';
import { Header, Nav, Sidebar } from './components/Layout';
import { EventList } from './components/EventList';
import { AuthPages } from './components/AuthPages';
import { CheckoutFlow } from './components/CheckoutFlow';
import { AdminDashboard } from './components/AdminDashboard';
import { MyEvents } from './components/MyEvents';
import { ParticipantsView } from './components/ParticipantsView';
import { CreateEventView } from './components/CreateEventView';
import { ScannerView } from './components/ScannerView';
import { ProfileView } from './components/ProfileView';
import { PromoCodesView } from './components/PromoCodesView';
import { SuperAdminView } from './components/SuperAdminView';
import { EventMicrosite } from './components/EventMicrosite';
import { LandingPage } from './components/LandingPage';
import { ToastContainer } from './components/Toast';

export default function App() {
  const { 
    view, setView, 
    user, setUser, 
    events, fetchEvents,
    selectedEvent, fetchEventDetails,
    cart, setCart,
    orderResult,
    myTickets, fetchMyTickets,
    loading,
    isOnline, setIsOnline,
    fetchTicketCache, syncOfflineScans,
    offlineScans,
    isSyncing, setIsSyncing,
    fetchTenantEvent,
    tenantSlug
  } = useStore();

  const isDashboardView = (user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && !tenantSlug;

  // Force Tenant Detection at the very beginning
  const params = new URLSearchParams(window.location.search);
  const tenant = params.get('tenant');
  const isScanRoute = window.location.pathname === '/scan';

  useEffect(() => {
    if (isScanRoute) {
      setView('scanner');
    }
  }, [isScanRoute, setView]);

  useEffect(() => {
    if (tenant && tenant !== 'null' && tenant !== 'undefined' && tenant.trim() !== '') {
      // Priorité absolue au paramètre URL
      useStore.getState().setTenantSlug(tenant);
      fetchTenantEvent(tenant);
    }
  }, [tenant, fetchTenantEvent]);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Si un tenant est déjà détecté via URL, on ne fait rien d'autre
    if (tenant) return;

    // Tenant detection via hostname (fallback)
    const host = window.location.hostname.toLowerCase();
    const parts = host.split('.');
    let detectedTenant = null;

    // Local dev or direct IP
    if (host === 'localhost' || host === '127.0.0.1' || host.includes('run.app')) {
      // On Google Cloud Run or Local, we might still use query params
      // but if we have a subdomain on run.app it could work too
      if (parts.length >= 3 && !host.includes('localhost')) {
         const subdomain = parts[0];
         if (!['www', 'api', 'admin'].includes(subdomain)) {
           detectedTenant = subdomain;
         }
      }
    } else if (parts.length >= 3) {
      // Production: event.tickhost.com
      const subdomain = parts[0];
      const reserved = ['www', 'api', 'admin'];
      if (!reserved.includes(subdomain)) {
        detectedTenant = subdomain;
      }
    }

    if (detectedTenant) {
      useStore.getState().setTenantSlug(detectedTenant);
      fetchTenantEvent(detectedTenant);
    } else {
      fetchEvents();
    }
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.token) {
        localStorage.setItem('token', parsedUser.token);
        fetchMyTickets(parsedUser.token);
      }
    }

    // Online/Offline Detection
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineScans();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (view === 'my-tickets' && user) {
      fetchMyTickets(user.token);
    }
    
    // Protection ORGANIZER : Ne doit pas voir la liste publique ou ses billets (vides)
    if (user?.role === 'ORGANIZER' && (view === 'list' || view === 'my-tickets' || view === 'detail' || view === 'checkout')) {
      setView('stats');
    }
    
    // Protection des vues
    if (view === 'admin' || view === 'stats' || view === 'my-events' || view === 'promo-codes' || view === 'moderation' || view === 'finances' || view === 'admin-events' || view === 'organizers') {
      if (!user) {
        setView('login');
      } else if (user.role !== 'ADMIN' && user.role !== 'ORGANIZER') {
        setView('list');
      } else if (user.role === 'ORGANIZER' && ['moderation', 'finances', 'admin-events', 'organizers'].includes(view)) {
        // Sécurité : Un organisateur ne peut pas accéder aux outils d'administration globale
        setView('stats');
      }
    }

    if (view === 'profile' && !user) {
      setView('login');
    }

    if (view === 'scanner') {
      // Sync and Cache when entering scanner
      // Only sync/cache if user is logged in (staff session uses live validation mostly)
      if (user) {
        syncOfflineScans();
        fetchTicketCache();
      }
    }
  }, [view, user, fetchMyTickets, setView, syncOfflineScans, fetchTicketCache]);

  useEffect(() => {
    if (selectedEvent?.primary_color) {
      document.documentElement.style.setProperty('--primary-color', selectedEvent.primary_color);
    } else {
      document.documentElement.style.setProperty('--primary-color', '#10b981');
    }
  }, [selectedEvent]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const addToCart = (type: any) => {
    if (!selectedEvent) return;
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

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (tenantSlug) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-primary/30 overflow-x-hidden">
        <ToastContainer />
        <Header />
        <main className="w-full pt-20 pb-24 px-4 md:px-8 lg:px-12">
          <EventMicrosite />
        </main>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
        <ToastContainer />
        <LandingPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-primary/30 overflow-x-hidden flex w-full max-w-full">
      <ToastContainer />
      {isDashboardView && <Sidebar />}

      <div className={`flex-1 flex flex-col min-w-0 overflow-x-hidden ${isDashboardView ? 'lg:pl-64' : ''}`}>
        {isDashboardView ? (
          !['super-admin', 'admin-events', 'organizers', 'moderation', 'finances', 'sys-settings'].includes(view) && <Header />
        ) : <Header />}
        
        <main className={`flex-1 w-full max-w-full overflow-x-hidden pb-28 ${isDashboardView ? (['super-admin', 'admin-events', 'organizers', 'moderation', 'finances', 'sys-settings'].includes(view) ? 'pt-0' : 'pt-8 px-4 md:px-8 lg:px-12') : 'pt-20 px-4 md:px-8 lg:px-12'}`}>
          <AnimatePresence mode="wait">
          <React.Fragment key="standard-views">
              {/* Vues Publiques / Client */}

              {view === 'login' && <AuthPages key="login" />}
              {view === 'register' && <AuthPages key="register" />}

              {view === 'detail' && selectedEvent && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <button onClick={() => setView('list')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-widest">Retour</span>
              </button>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold leading-tight text-white">{selectedEvent.name}</h2>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-white/5 text-primary px-3 py-2 rounded-xl border border-white/10">
                    <Calendar className="w-4 h-4" />
                    <span className="font-bold">{formatDate(selectedEvent.event_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 text-white/60 px-3 py-2 rounded-xl border border-white/10">
                    <MapPin className="w-4 h-4" />
                    <span className="font-bold">{selectedEvent.location}</span>
                  </div>
                </div>
                <p className="text-white/50 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white/80">Sélectionnez vos billets</h3>
                <div className="grid gap-4">
                  {selectedEvent.ticketTypes?.map((type) => {
                    const cartItem = cart.find(item => item.ticketTypeId === type.id);
                    return (
                      <div key={type.id} className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center justify-between shadow-xl hover:bg-white/10 transition-all">
                        <div>
                          <p className="font-bold text-lg text-white/90">{type.name}</p>
                          <p className="text-primary font-bold text-lg">{type.price.toLocaleString()} FCFA</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right mr-2">
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${type.available_quantity <= 5 ? 'text-orange-500 animate-pulse' : 'text-white/20'}`}>
                              {type.available_quantity > 0 ? `Plus que ${type.available_quantity} places !` : 'Épuisé'}
                            </p>
                          </div>
                          {cartItem ? (
                            <div className="flex items-center gap-3 bg-white/5 rounded-full p-1 border border-white/10">
                              <button 
                                onClick={() => removeFromCart(type.id)}
                                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center shadow-sm hover:bg-white/20 transition-colors text-white"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-bold w-4 text-center text-white">{cartItem.quantity}</span>
                              <button 
                                onClick={() => addToCart(type)}
                                disabled={type.available_quantity <= (cartItem.quantity || 0)}
                                className="w-8 h-8 bg-primary/80 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-primary transition-colors disabled:opacity-50"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCart(type)}
                              disabled={type.available_quantity <= 0}
                              className={`px-6 py-3 rounded-2xl font-bold shadow-lg transition-all ${
                                type.available_quantity > 0 
                                  ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-primary/20 hover:scale-105' 
                                  : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                              }`}
                            >
                              {type.available_quantity > 0 ? 'Ajouter' : 'Épuisé'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {cart.length > 0 && (
                <motion.div 
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-40"
                >
                  <button 
                    onClick={() => setView('checkout')}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 text-white p-5 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/40 flex items-center justify-between hover:scale-[1.02] transition-all"
                  >
                    <span className="font-bold">Continuer ({totalAmount.toLocaleString()} FCFA)</span>
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {view === 'checkout' && <CheckoutFlow key="checkout" />}

          {view === 'success' && orderResult && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto text-center space-y-8 py-10"
            >
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">Merci pour votre achat !</h2>
                <p className="text-white/40">Vos billets sont prêts. Scannez le QR Code à l'entrée.</p>
              </div>

              <div className="space-y-6">
                {orderResult.tickets.map((ticket: any) => (
                  <div key={ticket.id} className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] shadow-2xl border border-white/10 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/80" />
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#050505] rounded-full border border-white/10" />
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#050505] rounded-full border border-white/10" />
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{ticket.eventName}</p>
                      <p className="text-xl font-bold text-white">{ticket.ticketTypeName}</p>
                    </div>

                    <div className="flex justify-center p-6 bg-white rounded-3xl shadow-inner">
                      <QRCodeSVG 
                        value={ticket.qr_code_data || ticket.unique_code} 
                        size={180}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Code Unique</p>
                        <p className="font-mono text-lg font-bold tracking-[0.3em] text-white/80">{ticket.unique_code}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                        <a 
                          href={`https://wa.me?text=${encodeURIComponent(`Voici mon billet pour ${ticket.eventName} (${ticket.ticketTypeName}) : ${ticket.unique_code}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] p-3 rounded-xl border border-[#25D366]/20 text-xs font-bold hover:bg-[#25D366]/20 transition-all"
                        >
                          <Activity className="w-4 h-4" />
                          WhatsApp
                        </a>
                        <button 
                          onClick={() => {
                            const subject = encodeURIComponent(`Mon Billet pour ${ticket.eventName}`);
                            const body = encodeURIComponent(`Événement: ${ticket.eventName}\nType: ${ticket.ticketTypeName}\nCode: ${ticket.unique_code}`);
                            window.location.href = `mailto:?subject=${subject}&body=${body}`;
                          }}
                          className="flex items-center justify-center gap-2 bg-primary/10 text-primary p-3 rounded-xl border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-all"
                        >
                          <Users className="w-4 h-4" />
                          Email
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setView('list')}
                className="w-full bg-white/5 text-white/60 p-5 rounded-2xl font-bold border border-white/10 hover:bg-white/10 transition-all"
              >
                Retour à l'accueil
              </button>
            </motion.div>
          )}

          {view === 'my-tickets' && (
            <motion.div
              key="my-tickets"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white">Mes Billets</h2>
                <p className="text-white/40">Vos accès pour les événements à venir</p>
              </div>

              {loading ? (
                <div className="text-center py-20 space-y-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Ticket className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <p className="text-white/40 font-medium animate-pulse">Chargement de vos billets...</p>
                </div>
              ) : myTickets.length > 0 ? (
                <div className="space-y-6">
                  {myTickets.map((ticket: any) => (
                    <div key={ticket.id} className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl border border-white/10 space-y-6 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/80 opacity-50 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{ticket.eventName}</p>
                          <p className="text-lg font-bold text-white">{ticket.ticketTypeName}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          ticket.status === 'used' 
                            ? 'bg-white/5 border-white/10 text-white/20' 
                            : 'bg-primary/10 border-primary/20 text-primary'
                        }`}>
                          {ticket.status === 'used' ? 'Utilisé' : 'Valide'}
                        </div>
                      </div>

                      <div className="flex justify-center p-4 bg-white rounded-2xl shadow-inner">
                        <QRCodeSVG 
                          value={ticket.qr_code_data || ticket.unique_code} 
                          size={140}
                          level="H"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Date</p>
                            <p className="text-xs font-bold text-white/80">{formatDate(ticket.eventDate)}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Code</p>
                            <p className="font-mono text-xs font-bold text-white/60">{ticket.unique_code}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                          <a 
                            href={`https://wa.me?text=Voici mon billet pour ${ticket.eventName} (${ticket.ticketTypeName}) : ${ticket.unique_code}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] p-3 rounded-xl border border-[#25D366]/20 text-xs font-bold hover:bg-[#25D366]/20 transition-all"
                          >
                            <Activity className="w-4 h-4" />
                            WhatsApp
                          </a>
                          <button 
                            onClick={() => {
                              const subject = encodeURIComponent(`Mon Billet pour ${ticket.eventName}`);
                              const body = encodeURIComponent(`Événement: ${ticket.eventName}\nType: ${ticket.ticketTypeName}\nCode: ${ticket.unique_code}\nDate: ${formatDate(ticket.eventDate)}`);
                              window.location.href = `mailto:?subject=${subject}&body=${body}`;
                            }}
                            className="flex items-center justify-center gap-2 bg-primary/10 text-primary p-3 rounded-xl border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-all"
                          >
                            <Users className="w-4 h-4" />
                            Email
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 space-y-4">
                  <div className="w-20 h-20 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center mx-auto text-white/20 border border-white/10">
                    <Ticket className="w-10 h-10" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Aucun ticket trouvé pour cet événement</h2>
                  <p className="text-white/40">Vos billets achetés apparaîtront ici.</p>
                  <button 
                    onClick={() => setView('list')}
                    className="bg-gradient-to-r from-primary to-primary/80 px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    Découvrir des événements
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {view === 'scanner' && <ScannerView key="scanner" />}
          {view === 'my-events' && <MyEvents key="my-events" />}
          {view === 'promo-codes' && <PromoCodesView key="promo-codes" />}
          {view === 'create-event' && <CreateEventView key="create-event" />}
          {view === 'super-admin' && <SuperAdminView key="super-admin" />}
          {view === 'admin-events' && <SuperAdminView key="admin-events" />}
          {view === 'organizers' && <SuperAdminView key="organizers" />}
          {view === 'moderation' && <SuperAdminView key="moderation" />}
          {view === 'finances' && <SuperAdminView key="finances" />}
          {view === 'client-space' && <SuperAdminView key="client-space" />}
          {view === 'sys-settings' && <SuperAdminView key="sys-settings" />}
          {(view === 'admin' || view === 'stats') && <AdminDashboard key="dashboard" />}
          {view === 'participants' && <ParticipantsView key="participants" />}
          {view === 'profile' && <ProfileView key="profile" />}
          
          {view === 'info' && selectedEvent && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto space-y-8 py-10"
            >
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-white">Infos Pratiques</h2>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Lieu</h3>
                      <p className="text-white/60 mt-1">{selectedEvent.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Date et Heure</h3>
                      <p className="text-white/60 mt-1">{formatDate(selectedEvent.event_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Sécurité</h3>
                      <p className="text-white/60 mt-1">Accès contrôlé par scan de QR Code. Prévoyez une pièce d'identité.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
            </React.Fragment>
        </AnimatePresence>
      </main>
      </div>

      <Nav />
      <div id="reader-hidden" style={{ visibility: 'hidden', position: 'absolute', width: '1px', height: '1px' }}></div>
    </div>
  );
}
