import { create } from 'zustand';
import { logger } from './services/logger';
 
interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  token: string;
  mobile_money_num?: string;
  wave_num?: string;
  payout_frequency?: string;
}
 
interface Event {
  id: string | number;
  name: string;
  description: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location: string;
  maps_link?: string;
  dress_code?: string;
  image_url: string;
  slug: string;
  access_code: string;
  primary_color?: string;
  category?: string;
  bg_type?: 'color' | 'image';
  bg_image?: string;
  bg_intensity?: number;
  bg_opacity?: number;
  logo_url_main?: string;
  show_logo_instead_of_name?: boolean;
  support_email?: string;
  support_whatsapp?: string;
  status: 'published' | 'draft' | 'inactive' | 'closed';
  revenue?: number;
  options?: {
    home: boolean;
    ticketing: boolean;
    info: boolean;
    vote: boolean;
    support: boolean;
  };
  info_options?: {
    date_time: boolean;
    location: boolean;
    maps: boolean;
    support: boolean;
    dress_code: boolean;
  };
  info_sections?: { title: string; content: string }[];
  payment_modes?: {
    orange: boolean;
    moov: boolean;
    mtn: boolean;
    wave: boolean;
  };
  welcome_message?: string;
  info_content?: string;
  gallery_title?: string;
  gallery_images?: string[];
  partners?: string[];
  organizer_name?: string;
  ticketTypes?: TicketType[];
  created_at?: string;
  updated_at?: string;
}
 
interface TicketType {
  id: string;
  name: string;
  price: number;
  total_quantity: number;
  available_quantity: number;
}
 
interface CartItem {
  ticketTypeId: string;
  ticketTypeName: string;
  price: number;
  quantity: number;
  eventName: string;
}
 
interface AppState {
  view: 'list' | 'detail' | 'checkout' | 'success' | 'my-tickets' | 'scanner' | 'admin' | 'my-events' | 'create-event' | 'participants' | 'stats' | 'profile' | 'login' | 'register' | 'info' | 'billetterie' | 'admin-events' | 'organizers' | 'moderation' | 'finances' | 'super-admin' | 'sys-settings' | 'client-space' | 'promo-codes';
  user: User | null;
  events: Event[];
  selectedEvent: Event | null;
  cart: CartItem[];
  loading: boolean;
  statsLoading: boolean;
  paymentProcessing: boolean;
  orderResult: any;
  adminStats: any;
  superAdminStats: any;
  superAdminEvents: any[];
  superAdminOrganizers: any[];
  superAdminFinances: any;
  superAdminModeration: any[];
  superAdminClientSpace: any;
  systemSettings: any;
  myTickets: any[];
  scanResult: { status: 'valid' | 'already_used' | 'invalid' | 'wrong_event' | null, message: string, clientName?: string };
  isScannerActive: boolean;
  manualCode: string;
  paymentStep: 'form' | 'summary' | 'processing';
  ticketCache: any[];
  offlineScans: { code: string, validatedAt: string }[];
  isOnline: boolean;
  tenantSlug: string | null;
  staffSession: { eventId: string, eventName: string, accessCode?: string } | null;
  toasts: { id: string, type: 'success' | 'error' | 'info', message: string, duration?: number }[];
  editingEvent: Event | null;
  
  // Actions
  setView: (view: AppState['view']) => void;
  setEditingEvent: (event: Event | null) => void;
  setTenantSlug: (slug: string | null) => void;
  setStaffSession: (session: AppState['staffSession']) => void;
  setUser: (user: User | null) => void;
  setEvents: (events: Event[]) => void;
  setSelectedEvent: (event: Event | null) => void;
  setCart: (cart: CartItem[]) => void;
  setLoading: (loading: boolean) => void;
  setStatsLoading: (loading: boolean) => void;
  setPaymentProcessing: (processing: boolean) => void;
  setOrderResult: (result: any) => void;
  setAdminStats: (stats: any) => void;
  setMyTickets: (tickets: any[]) => void;
  setScanResult: (result: AppState['scanResult']) => void;
  setIsScannerActive: (active: boolean) => void;
  setManualCode: (code: string) => void;
  setPaymentStep: (step: AppState['paymentStep']) => void;
  setIsOnline: (isOnline: boolean) => void;
  addToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  
  // Async Actions
  fetchEvents: (filter?: string) => Promise<void>;
  fetchTenantEvent: (slug: string) => Promise<void>;
  fetchMyTickets: (token: string) => Promise<void>;
  fetchStats: (eventId?: string | number) => Promise<void>;
  fetchGlobalStats: () => Promise<void>;
  fetchEventsSupervision: () => Promise<void>;
  fetchOrganizers: () => Promise<void>;
  fetchFinances: () => Promise<void>;
  fetchModeration: () => Promise<void>;
  fetchClientSpace: () => Promise<void>;
  fetchEventFeedbacks: (eventId: number | string) => Promise<any[]>;
  fetchSystemSettings: () => Promise<void>;
  moderateEvent: (eventId: string, action: 'approve' | 'suspend', reason: string) => Promise<boolean>;
  updateSystemSettings: (settings: any) => Promise<boolean>;
  updatePayoutStatus: (id: string, status: string) => Promise<boolean>;
  fetchEventDetails: (id: string | number) => Promise<void>;
  fetchTicketCache: () => Promise<void>;
  exportParticipants: () => Promise<void>;
  syncOfflineScans: () => Promise<void>;
  validateTicket: (code: string) => Promise<void>;
  validateAccessCode: (code: string) => Promise<boolean>;
  createEvent: (eventData: any) => Promise<boolean>;
  updateEvent: (id: string | number, eventData: any) => Promise<boolean>;
  deleteEvent: (id: string | number) => Promise<boolean>;
  toggleEventStatus: (id: string | number) => Promise<boolean>;
  closeEvent: (id: string | number) => Promise<boolean>;
  regenerateAccessCode: (eventId: string | number) => Promise<string | null>;
  updatePaymentInfo: (paymentData: any) => Promise<boolean>;
  fetchPromoCodes: (eventId: string | number) => Promise<void>;
  createPromoCode: (eventId: string | number, data: any) => Promise<boolean>;
  deletePromoCode: (eventId: string | number, codeId: string) => Promise<boolean>;
  togglePromoCode: (eventId: string | number, codeId: string) => Promise<boolean>;
  applyPromoCode: (eventId: string | number, code: string) => Promise<any>;
  promoCodes: any[];
  setPromoCodes: (codes: any[]) => void;
  login: (userData: any, token: string) => void;
  logout: () => void;
  isSyncing: boolean;
  setIsSyncing: (isSyncing: boolean) => void;
}
 
export const useStore = create<AppState>((set, get) => ({
  view: 'list',
  user: null,
  events: [],
  selectedEvent: null,
  cart: [],
  loading: false,
  statsLoading: false, // ✅ NOUVEAU
  paymentProcessing: false,
  orderResult: null,
  adminStats: null,
  superAdminStats: null,
  superAdminEvents: [],
  superAdminOrganizers: [],
  superAdminFinances: null,
  superAdminModeration: [],
  superAdminClientSpace: null,
  systemSettings: null,
  myTickets: [],
  scanResult: { status: null, message: '' },
  isScannerActive: false,
  manualCode: '',
  paymentStep: 'form',
  ticketCache: JSON.parse(localStorage.getItem('ticketCache') || '[]'),
  offlineScans: JSON.parse(localStorage.getItem('offlineScans') || '[]'),
  isOnline: navigator.onLine,
  tenantSlug: null,
  staffSession: null,
  editingEvent: null,
  promoCodes: [],
 
  isSyncing: false,
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setView: (view) => set({ view }),
  setEditingEvent: (editingEvent) => set({ editingEvent }),
  setTenantSlug: (tenantSlug) => set({ tenantSlug }),
  setStaffSession: (staffSession) => set({ staffSession }),
  setUser: (user) => set({ user }),
  setEvents: (events) => set({ events }),
  setSelectedEvent: (selectedEvent) => set({ selectedEvent }),
  setPromoCodes: (promoCodes) => set({ promoCodes }),
  setCart: (cart) => set({ cart }),
  setLoading: (loading) => set({ loading }),
  setStatsLoading: (statsLoading) => set({ statsLoading }), // ✅ NOUVEAU
  setPaymentProcessing: (paymentProcessing) => set({ paymentProcessing }),
  setOrderResult: (orderResult) => set({ orderResult }),
  setAdminStats: (adminStats) => set({ adminStats }),
  setMyTickets: (myTickets) => set({ myTickets }),
  setScanResult: (scanResult) => set({ scanResult }),
  setIsScannerActive: (isScannerActive) => set({ isScannerActive }),
  setManualCode: (manualCode) => set({ manualCode }),
  setPaymentStep: (paymentStep) => set({ paymentStep }),
  setIsOnline: (isOnline) => set({ isOnline }),
  toasts: [],
  addToast: (type, message, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, type, message, duration }] }));
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
 
  fetchEvents: async (filter?: string) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(window.location.search);
      const tenantParam = params.get('tenant');
      const currentTenant = tenantParam || get().tenantSlug;
 
      let url = '/api/events';
      const urlParams = new URLSearchParams();
      
      if (currentTenant) {
        urlParams.append('tenant', currentTenant);
      }
      if (filter) {
        urlParams.append('filter', filter);
      }
      
      const queryString = urlParams.toString();
      if (queryString) {
        url = `/api/events?${queryString}`;
      }
 
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
 
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const events = Array.isArray(data) ? data : [];
      set({ events });
      
      if (currentTenant && events.length === 1) {
        set({ selectedEvent: events[0] });
      }
    } catch (err: any) {
      logger.error('Error fetching events', { error: err.message });
    } finally {
      set({ loading: false });
    }
  },
 
  fetchTenantEvent: async (slug: string) => {
    set({ loading: true, tenantSlug: slug });
    try {
      const res = await fetch(`/api/events?tenant=${slug}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch tenant event');
      }
      const data = await res.json();
      const events = Array.isArray(data) ? data : [];
      if (events.length > 0) {
        set({ selectedEvent: events[0], events });
      } else {
        throw new Error('Event not found');
      }
    } catch (err: any) {
      if (err.message === 'Event not found') {
        logger.warn('Tenant event not found', { slug });
      } else {
        logger.error('Error fetching tenant event', { error: err.message });
      }
      set({ selectedEvent: null, events: [], tenantSlug: null });
    } finally {
      set({ loading: false });
    }
  },
 
  fetchMyTickets: async (token: string) => {
    if (!token) return;
    const { tenantSlug, addToast } = get();
    set({ loading: true });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
 
    try {
      const url = tenantSlug ? `/api/tickets/my?tenant=${tenantSlug}` : '/api/tickets/my';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (res.status === 401 || res.status === 403) {
        set({ user: null, view: 'list' });
        localStorage.removeItem('user');
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        set({ myTickets: data.tickets });
      } else {
        set({ myTickets: [] });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      logger.error('Error fetching tickets', { error: err.message });
      if (err.name === 'AbortError') {
        addToast('error', 'Impossible de charger les tickets. Vérifiez votre connexion.');
      }
      set({ myTickets: [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchStats: async (eventId?: string | number) => {
    const { user, staffSession, logout } = get();
    const token = localStorage.getItem('token');
    
    // Autoriser les sessions staff (accès par code) et les rôles admin/organiseur/staff
    const isStaff = !!staffSession;
    const isAuthorized = isStaff || (user && ['ADMIN', 'ORGANIZER', 'STAFF'].includes(user.role));
    
    if (!token || !isAuthorized) {
      return;
    }
    
    // En mode staff, forcer l'eventId de la session pour isolation totale
    const resolvedEventId = isStaff ? staffSession!.eventId : eventId;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    set({ statsLoading: true });
    try {
      const url = resolvedEventId ? `/api/admin/stats?eventId=${resolvedEventId}` : '/api/admin/stats';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (res.status === 401 || res.status === 403) {
        if (res.status === 401 && !isStaff) {
          logout();
        }
        return;
      }
      
      const data = await res.json();
      set({ adminStats: data || null });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        logger.warn('Stats fetch timeout', { eventId: resolvedEventId });
      } else {
        logger.error('Error fetching admin stats', { 
          error: err.message,
          url: resolvedEventId ? `/api/admin/stats?eventId=${resolvedEventId}` : '/api/admin/stats'
        });
      }
    } finally {
      set({ statsLoading: false });
    }
  },

  fetchGlobalStats: async () => {
    const { logout } = get();
    const token = localStorage.getItem('token');
    if (!token) return;
    set({ loading: true });
    try {
      const res = await fetch('/api/admin/global-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 403) {
        if (res.status === 401) logout();
        return;
      }
      
      const data = await res.json();
      if (data.success) set({ superAdminStats: data });
    } catch (err) {
      logger.error('Error fetching global stats', { error: err });
    } finally {
      set({ loading: false });
    }
  },
 
  fetchEventsSupervision: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/events-supervision', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) set({ superAdminEvents: data.events });
    } catch (err) {
      logger.error('Error fetching events supervision', { error: err });
    }
  },
 
  fetchOrganizers: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/organizers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) set({ superAdminOrganizers: data.organizers });
    } catch (err) {
      logger.error('Error fetching organizers', { error: err });
    }
  },
 
  fetchFinances: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/finances', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) set({ superAdminFinances: data });
    } catch (err) {
      logger.error('Error fetching finances', { error: err });
    }
  },
 
  fetchModeration: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/moderation', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) set({ superAdminModeration: data.reported });
    } catch (err) {
      logger.error('Error fetching moderation', { error: err });
    }
  },
 
  fetchClientSpace: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/client-space', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      set({ superAdminClientSpace: data });
    } catch (err) {
      logger.error('Error fetching client space', { error: err });
    }
  },
 
  fetchEventFeedbacks: async (eventId) => {
    const token = localStorage.getItem('token');
    if (!token) return [];
    try {
      const res = await fetch(`/api/admin/events/${eventId}/feedbacks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      return data.feedbacks || [];
    } catch (err) {
      logger.error('Error fetching event feedbacks', { error: err });
      return [];
    }
  },
 
  fetchSystemSettings: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) set({ systemSettings: data.settings });
    } catch (err) {
      logger.error('Error fetching system settings', { error: err });
    }
  },
 
  moderateEvent: async (eventId, action, reason) => {
    const token = localStorage.getItem('token');
    const { addToast } = get();
    if (!token) return false;
    try {
      const res = await fetch('/api/admin/moderate-event', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ eventId, action, reason })
      });
      if (res.ok) {
        addToast('success', action === 'approve' ? 'Événement approuvé' : 'Événement suspendu');
        get().fetchModeration();
        get().fetchEventsSupervision();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },
 
  updateSystemSettings: async (settings) => {
    const token = localStorage.getItem('token');
    const { addToast } = get();
    if (!token) return false;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ settings })
      });
      if (res.ok) {
        addToast('success', 'Paramètres système mis à jour');
        get().fetchSystemSettings();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },
 
  updatePayoutStatus: async (id, status) => {
    const token = localStorage.getItem('token');
    const { addToast } = get();
    if (!token) return false;
    try {
      const res = await fetch(`/api/admin/payouts/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        addToast('success', 'Statut du reversement mis à jour');
        get().fetchFinances();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },
 
  fetchEventDetails: async (id: number) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      set({ selectedEvent: data, view: 'detail' });
    } catch (err: any) {
      logger.error('Error fetching event details', { error: err.message });
    } finally {
      set({ loading: false });
    }
  },
 
  fetchTicketCache: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/tickets/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ ticketCache: data });
        localStorage.setItem('ticketCache', JSON.stringify(data));
      }
    } catch (err: any) {
      logger.error('Error fetching ticket cache', { error: err.message });
    }
  },
 
  exportParticipants: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/participants/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'participants.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err: any) {
      logger.error('Error exporting participants', { error: err.message });
    }
  },
 
  syncOfflineScans: async () => {
    const { offlineScans, isOnline } = get();
    const token = localStorage.getItem('token');
    if (!token || !isOnline || offlineScans.length === 0) return;
 
    try {
      const res = await fetch('/api/tickets/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ scans: offlineScans })
      });
      if (res.ok) {
        set({ offlineScans: [] });
        localStorage.setItem('offlineScans', '[]');
        get().fetchStats();
        get().fetchTicketCache();
      }
    } catch (err: any) {
      logger.error('Error syncing offline scans', { error: err.message });
    }
  },
 
  validateTicket: async (code: string) => {
    const { isOnline, ticketCache, offlineScans, staffSession, addToast } = get();
    const token = localStorage.getItem('token');
 
    // 1. Hybrid Validation: Check local cache first for speed
    const ticket = ticketCache.find(t => t.qr_code_data === code || t.unique_code === code);
    
    // Isolation Absolue: Check if ticket belongs to the session event
    if (staffSession && ticket && ticket.event_id !== staffSession.eventId) {
      set({ scanResult: { status: 'wrong_event', message: 'ALERTE : Ce billet appartient à un autre événement. Accès refusé.' } });
      addToast('error', 'Billet d\'un autre événement !');
      return;
    }
 
    const alreadyScannedOffline = offlineScans.some(s => s.code === code);
 
    if (ticket) {
      if (ticket.status === 'used' || alreadyScannedOffline) {
        set({ scanResult: { status: 'already_used', message: `Déjà validé (Local)`, clientName: ticket.client_name } });
        addToast('error', `Déjà utilisé: ${ticket.client_name}`);
        return;
      }
      
      // Valid local scan
      const newScan = { code, validatedAt: new Date().toISOString() };
      const updatedOffline = [...offlineScans, newScan];
      set({ 
        offlineScans: updatedOffline,
        scanResult: { status: 'valid', message: `Validé localement - ${ticket.client_name}`, clientName: ticket.client_name } 
      });
      localStorage.setItem('offlineScans', JSON.stringify(updatedOffline));
      addToast('success', `Validé: ${ticket.client_name}`);
 
      // If online, trigger sync immediately for this scan
      if (isOnline && token) {
        get().syncOfflineScans();
      }
      return;
    }
 
    // 2. If not in cache and online, try server
    if (isOnline) {
      set({ loading: true });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
 
      try {
        const res = await fetch('/api/tickets/validate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({ 
            code,
            eventId: staffSession?.eventId 
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await res.json();
        set({ scanResult: data });
        
        if (data.status === 'valid') {
          addToast('success', `Billet Valide: ${data.clientName}`);
          get().fetchStats();
        } else if (data.status === 'client_check') {
          // Le client scanne son propre billet — message rassurant, pas d'erreur
          set({ scanResult: data });
        } else {
          addToast('error', data.message || 'Billet Invalide');
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        logger.error('Error validating ticket', { error: err.message });
        const message = err.name === 'AbortError' ? 'Délai d\'attente dépassé (Problème de connexion)' : 'Erreur de connexion serveur';
        set({ scanResult: { status: 'invalid', message } });
        addToast('error', message);
      } finally {
        set({ loading: false });
      }
    } else {
      set({ scanResult: { status: 'invalid', message: 'Billet inconnu (Mode Hors-Ligne)' } });
      addToast('error', 'Billet inconnu (Hors-ligne)');
    }
  },
 
  validateAccessCode: async (code: string) => {
    try {
      const res = await fetch('/api/events/validate-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) localStorage.setItem('token', data.token);
        set({ staffSession: { eventId: data.eventId, eventName: data.eventName, accessCode: data.accessCode }, view: 'scanner' });
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },
 
  createEvent: async (eventData: any) => {
    const token = localStorage.getItem('token');
    const { addToast } = get();
    if (!token) return false;
    set({ loading: true });
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(eventData)
      });
      const data = await res.json();
      if (res.ok) {
        addToast('success', 'Événement créé avec succès !');
        await Promise.all([
          get().fetchEvents(),
          get().fetchStats()
        ]);
        return true;
      }
      addToast('error', data.error || 'Erreur lors de la création');
      return false;
    } catch (err: any) {
      logger.error('Error creating event', { error: err.message });
      addToast('error', 'Erreur de connexion');
      return false;
    } finally {
      set({ loading: false });
    }
  },
 
  updateEvent: async (id: string | number, eventData: any) => {
    const token = localStorage.getItem('token');
    const { addToast } = get();
    if (!token) return false;
    set({ loading: true });
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(eventData)
      });
      const data = await res.json();
      if (res.ok) {
        addToast('success', 'Événement mis à jour !');
        await Promise.all([
          get().fetchEvents(),
          get().fetchStats()
        ]);
        return true;
      }
      addToast('error', data.error || 'Erreur lors de la mise à jour');
      return false;
    } catch (err: any) {
      logger.error('Error updating event', { error: err.message });
      addToast('error', 'Erreur de connexion');
      return false;
    } finally {
      set({ loading: false });
    }
  },
 
  deleteEvent: async (id: string | number) => {
    const token = localStorage.getItem('token');
    const { addToast } = get();
    if (!token) return false;
    set({ loading: true });
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('success', 'Événement supprimé');
        get().fetchEvents();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    } finally {
      set({ loading: false });
    }
  },
 
  toggleEventStatus: async (id: string | number) => {
    const token = localStorage.getItem('token');
    const { addToast } = get();
    if (!token) return false;
    try {
      const res = await fetch(`/api/events/${id}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        get().fetchEvents();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },
 
  closeEvent: async (id: string | number) => {
    const token = localStorage.getItem('token');
    const { addToast } = get();
    if (!token) return false;
    try {
      const res = await fetch(`/api/events/${id}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        set(state => ({
          events: state.events.map(e => e.id === id ? { ...e, status: 'closed' } : e)
        }));
        addToast('success', 'Événement terminé — tous les billets ont été invalidés');
        return true;
      }
      addToast('error', data.error || 'Erreur lors de la clôture');
      return false;
    } catch {
      addToast('error', 'Erreur de connexion');
      return false;
    }
  },
 
  regenerateAccessCode: async (eventId: string | number) => {
    const token = localStorage.getItem('token');
    const { addToast } = get();
    if (!token) return null;
    try {
      const res = await fetch(`/api/events/${eventId}/regenerate-access-code`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast('success', 'Code d\'accès régénéré !');
        // Refresh local event state
        set((state) => ({
          events: state.events.map(e => e.id === eventId ? { ...e, access_code: data.access_code } : e),
          selectedEvent: state.selectedEvent?.id === eventId ? { ...state.selectedEvent, access_code: data.access_code } : state.selectedEvent
        }));
        return data.access_code;
      }
      addToast('error', data.error || 'Erreur lors de la régénération');
      return null;
    } catch (err) {
      return null;
    }
  },
 
  updatePaymentInfo: async (paymentData: any) => {
    const token = localStorage.getItem('token');
    const { addToast, user } = get();
    if (!token || !user) return false;
    try {
      const res = await fetch('/api/auth/payment-info', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(paymentData)
      });
      if (res.ok) {
        const updatedUser = { ...user, ...paymentData };
        set({ user: updatedUser });
        localStorage.setItem('user', JSON.stringify(updatedUser));
        addToast('success', 'Paramètres de paiement enregistrés');
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },
 
  fetchPromoCodes: async (eventId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`/api/events/${eventId}/promo-codes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      set({ promoCodes: data });
    } catch (err) {
      logger.error('Error fetching promo codes', { error: err });
    }
  },
 
  createPromoCode: async (eventId, data) => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const res = await fetch(`/api/events/${eventId}/promo-codes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        get().fetchPromoCodes(eventId);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },
 
  deletePromoCode: async (eventId, codeId) => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const res = await fetch(`/api/events/${eventId}/promo-codes/${codeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        get().fetchPromoCodes(eventId);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },
 
  togglePromoCode: async (eventId, codeId) => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const res = await fetch(`/api/events/${eventId}/promo-codes/${codeId}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        get().fetchPromoCodes(eventId);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },
 
  applyPromoCode: async (eventId, code) => {
    try {
      const res = await fetch('/api/events/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, code })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Erreur de connexion' };
    }
  },
 
  login: (userData: any, token: string) => {
    const { addToast } = get();
    const userWithToken = { ...userData, token };
    set({ user: userWithToken });
    localStorage.setItem('user', JSON.stringify(userWithToken));
    localStorage.setItem('token', token);
    
    addToast('success', `Bienvenue, ${userData.fullName}`);
 
    if (userWithToken.role === 'ADMIN') {
      set({ view: 'super-admin' });
      get().fetchGlobalStats();
    } else if (userWithToken.role === 'ORGANIZER') {
      set({ view: 'stats' });
      get().fetchStats();
    } else {
      set({ view: 'list' });
      get().fetchMyTickets(token);
    }
  },
 
  logout: () => {
    const { addToast } = get();
    localStorage.clear();
    set({ 
      user: null, 
      view: 'list', 
      cart: [], 
      adminStats: null, 
      myTickets: [],
      ticketCache: [],
      offlineScans: []
    });
    addToast('info', 'Vous avez été déconnecté');
  }
}));