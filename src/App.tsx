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
    setTenantSlug,
    tenantSlug
  } = useStore();

  const isDashboardView = (user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && !tenantSlug;

  const params = new URLSearchParams(window.location.search);
  const tenant = params.get('tenant');
  const path = window.location.pathname;

  // 1. Synchronisation de l'état initial via l'URL (Sans boucles de redirection)
  useEffect(() => {
    if (tenant) {
      setTenantSlug(tenant);
      fetchTenantEvent(tenant);
      return;
    }
    
    if (path === '/login') {
      setView('login');
    } else if (path === '/scan') {
      setView('scanner');
    } else if (path === '/dashboard') {
      if (user?.role === 'ADMIN') setView('super-admin');
      else if (user?.role === 'ORGANIZER') setView('stats');
      else setView('login');
    } else if (path === '/') {
      setTenantSlug(null);
      setView('list');
    }
  }, [tenant, path, setView, setTenantSlug, fetchTenantEvent, user?.role]);

  const initialized = useRef(false);

  // 2. Initialisation Globale (Auth & Données)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Chargement de l'utilisateur
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        if (parsedUser.token) {
          localStorage.setItem('token', parsedUser.token);
          fetchMyTickets(parsedUser.token);
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    // Chargement des événements (si pas en mode microsite)
    if (!tenant) {
      fetchEvents();
    }

    const handleOnline = () => {
      setIsOnline(true);
      if (localStorage.getItem('token')) syncOfflineScans();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tenant, fetchEvents, fetchMyTickets, setUser, setIsOnline, syncOfflineScans]);

  // 3. Logic de Protection des Vues
  useEffect(() => {
    if (view === 'my-tickets' && user) {
      fetchMyTickets(user.token);
    }
    
    const protectedViews = ['admin', 'stats', 'my-events', 'promo-codes', 'moderation', 'finances', 'admin-events', 'organizers', 'super-admin', 'sys-settings', 'client-space', 'create-event', 'profile', 'participants'];
    if (protectedViews.includes(view) && !user) {
      setView('login');
    }

    if (view === 'scanner') {
      if (user || useStore.getState().staffSession) {
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
          !['super-admin', 'admin-events', 'organizers', 'moderation', 'finances', 'sys-settings', 'client-space'].includes(view) && <Header />
        ) : <Header />}
        
        <main className={`flex-1 w-full max-w-full overflow-x-hidden pb-28 ${isDashboardView ? (['super-admin', 'admin-events', 'organizers', 'moderation', 'finances', 'sys-settings', 'client-space'].includes(view) ? 'pt-0' : 'pt-8 px-4 md:px-8 lg:px-12') : 'pt-20 px-4 md:px-8 lg:px-12'}`}>
          <AnimatePresence mode="wait">
              {view === 'login' && <AuthPages key="login" />}
              {view === 'register' && <AuthPages key="register" />}
              {view === 'detail' && selectedEvent && (
                <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-4xl mx-auto space-y-8">
                  {/* ... Contenu du détail ... */}
                </motion.div>
              )}
              {view === 'checkout' && <CheckoutFlow key="checkout" />}
              {view === 'my-tickets' && <div key="my-tickets">...</div>}
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
          </AnimatePresence>
        </main>
      </div>
      <Nav />
    </div>
  );
}
