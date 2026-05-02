import React, { useEffect, useRef } from 'react';
import { useStore } from './store';
import { LandingPage } from './components/LandingPage';
import { Header, Nav, Sidebar } from './components/Layout';
// ... (Imports de composants inchangés)

export default function App() {
  const { 
    view, setView, 
    user, setUser, 
    events, fetchEvents,
    fetchTenantEvent,
    fetchMyTickets,
    tenantSlug
  } = useStore();

  const isDashboardView = (user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && !tenantSlug;

  // 1. Branchement des routes URL vers les vues du State
  const params = new URLSearchParams(window.location.search);
  const tenant = params.get('tenant');
  const path = window.location.pathname;
  const isScanRoute = path === '/scan';
  const isLoginRoute = path === '/login' || path === '/auth';

  useEffect(() => {
    if (isScanRoute) {
      setView('scanner');
    } else if (isLoginRoute) {
      setView('login');
    }
  }, [isScanRoute, isLoginRoute, setView]);

  // 2. Initialisation et détection du mode de fonctionnement
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Détection forcée via paramètre ?tenant= (Aperçu AI Studio)
    if (tenant && tenant !== 'null') {
      useStore.getState().setTenantSlug(tenant);
      fetchTenantEvent(tenant);
      return;
    }

    // Détection automatique du tenant par domaine (Production)
    const host = window.location.hostname.toLowerCase();
    const parts = host.split('.');
    
    // Sur Cloud Run / Local, on évite la détection par domaine automatique
    const isCloudRunOrLocal = host.includes('run.app') || host === 'localhost' || host.includes('web-center');
    
    if (!isCloudRunOrLocal && parts.length >= 3) {
      const subdomain = parts[0];
      const reserved = ['www', 'api', 'admin', 'dev'];
      if (!reserved.includes(subdomain)) {
        useStore.getState().setTenantSlug(subdomain);
        fetchTenantEvent(subdomain);
        return;
      }
    }

    // Si on arrive ici : Mode Application Principale (Landing Page)
    fetchEvents();
    
    // Reconnexion automatique
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.token) fetchMyTickets(parsedUser.token);
    }
  }, []);

  // 3. Rendu Principal
  
  // Affichage du Microsite (Site Client Dédié)
  if (tenantSlug) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <Header />
        <main className="pt-20 pb-24 px-4">
          <EventMicrosite />
        </main>
      </div>
    );
  }

  // Affichage de la Landing Page (Adresse Racine /)
  if (view === 'list') {
    return (
       <div className="min-h-screen bg-[#050505] text-white">
         <LandingPage />
       </div>
    );
  }

  // Affichage Standard (Dashboard, Auth, etc.)
  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {isDashboardView && <Sidebar />}
      <div className={`flex-1 flex flex-col ${isDashboardView ? 'lg:pl-64' : ''}`}>
        <Header />
        <main className="flex-1 p-4 md:p-8 pt-24">
          {/* Rendu conditionnel des vues admin/user ici... */}
          {/* Ex: {view === 'login' && <AuthPages />} */}
        </main>
      </div>
      <Nav />
    </div>
  );
}
