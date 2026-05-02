import { create } from 'zustand';
import { logger } from './services/logger';

// ... (Interfaces supprimées pour la brièveté, garde les tiennes inchangées)

export const useStore = create<AppState>((set, get) => ({
  view: 'list', // Vue par défaut (Landing Page)
  user: null,
  events: [],
  selectedEvent: null,
  // ... (Initialisations inchangées)

 // Extrait de l'action setView dans store.ts
setView: (view) => {
  const currentPath = window.location.pathname;
  if (view === 'login' && currentPath !== '/login') {
    window.history.pushState({}, '', '/login');
  } else if (view === 'list' && currentPath !== '/') {
    window.history.pushState({}, '', '/');
  } else if (view === 'scanner' && currentPath !== '/scan') {
    window.history.pushState({}, '', '/scan');
  } else if (view === 'super-admin' && currentPath !== '/dashboard') {
    window.history.pushState({}, '', '/dashboard');
  }
  set({ view });
},

  fetchEvents: async (filter?: string) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(window.location.search);
      const tenantParam = params.get('tenant');
      const currentTenant = tenantParam || get().tenantSlug;

      let url = '/api/events';
      const urlParams = new URLSearchParams();
      
      if (currentTenant) urlParams.append('tenant', currentTenant);
      if (filter) urlParams.append('filter', filter); // Support pour filter=mine
      
      const queryString = urlParams.toString();
      if (queryString) url = `/api/events?${queryString}`;

      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      
      // Gestion de l'expiration de session (401)
      if (res.status === 401) {
        get().logout();
        return;
      }
      
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

  // ... (Autres méthodes fetchMyTickets, fetchStats avec gestion 401 déjà en place)

  login: (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: { ...userData, token }, view: userData.role === 'ORGANIZER' ? 'stats' : 'list' });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, view: 'list' });
  }
}));
