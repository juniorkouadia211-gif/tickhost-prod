import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Ticket, QrCode, LayoutDashboard,
  LogOut, ShieldCheck, User, Scan, BarChart2,
  PlusCircle, Users, Settings, ExternalLink,
  ChevronRight, Shield, CreditCard, Activity, Bell, Globe, Mail,
  Tag, X
} from 'lucide-react';
import { useStore } from '../store';

export const Header = () => {
  const { user, setView, logout, view, tenantSlug, selectedEvent, events } = useStore();
  const [showNotifs, setShowNotifs] = useState(false);

  const isDashboard = user && (user.role === 'ADMIN' || user.role === 'ORGANIZER') && !tenantSlug;

  const getTitle = () => {
    switch (view) {
      case 'stats': return 'Tableau de bord';
      case 'create-event': return 'Créer un événement';
      case 'my-events': return 'Mes Événements';
      case 'admin-events': return 'Gestion Événements';
      case 'organizers': return 'Organisateurs';
      case 'moderation': return 'Modération';
      case 'finances': return 'Finances';
      case 'profile': return 'Paramètres';
      case 'participants': return 'Participants';
      case 'scanner': return 'Scanner Staff';
      default: return 'Tableau de bord';
    }
  };

  if (isDashboard) {
    return (
      <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-[#050505]/50 backdrop-blur-md sticky top-0 z-30">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">{getTitle()}</h2>
        </div>

        <div className="flex items-center gap-6">
          {['create-event', 'stats', 'admin'].includes(view) && (
            <div className="flex items-center gap-3 pr-6 border-r border-white/5">
              <button 
                onClick={() => {
                  if (selectedEvent) {
                    window.open(`/?tenant=${selectedEvent.slug}`, '_blank');
                  } else if (events.length > 0) {
                    window.open(`/?tenant=${events[0].slug}`, '_blank');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#fbbf24] text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#fbbf24]/20"
              >
                Voir mon site <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setView('create-event')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
              >
                <PlusCircle className="w-4 h-4" /> Nouvel événement
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => {
                if ('Notification' in window && Notification.permission === 'default') {
                  Notification.requestPermission().then(perm => {
                    if (perm === 'granted') {
                      new Notification('🎟️ TICKHOST', { body: 'Notifications activées ! Tu seras alerté à chaque vente.' });
                    }
                  });
                } else {
                  setShowNotifs(!showNotifs);
                }
              }}
              className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center border border-white/10 relative hover:bg-white/10 transition-all"
            >
              <Bell className="w-4 h-4 text-white/40" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-[#050505]" />
            </button>

            {/* Panneau notifications */}
            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-12 right-0 w-80 bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <p className="font-black text-sm uppercase tracking-widest">Notifications</p>
                    <button onClick={() => setShowNotifs(false)}>
                      <X className="w-4 h-4 text-white/30 hover:text-white transition-colors" />
                    </button>
                  </div>
                  <div className="p-5 space-y-3">
                    {'Notification' in window && Notification.permission === 'granted' ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-white">Notifications activées</p>
                            <p className="text-[10px] text-white/40 mt-0.5">Tu recevras une alerte à chaque vente de billet.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            new Notification('🎟️ Test TICKHOST', { body: 'Les notifications fonctionnent parfaitement !' });
                            setShowNotifs(false);
                          }}
                          className="w-full py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20 transition-all"
                        >
                          Tester une notification
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-3 py-2">
                        <Bell className="w-8 h-8 text-white/10 mx-auto" />
                        <p className="text-xs text-white/40">Active les notifications pour recevoir des alertes en temps réel à chaque vente.</p>
                        <button
                          onClick={() => {
                            Notification.requestPermission().then(perm => {
                              if (perm === 'granted') {
                                new Notification('🎟️ TICKHOST', { body: 'Notifications activées !' });
                                setShowNotifs(false);
                              }
                            });
                          }}
                          className="w-full py-2.5 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                        >
                          Activer les notifications
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 pl-6 border-l border-white/5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{user?.fullName}</p>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{user?.role === 'ADMIN' ? 'Super Admin' : 'Organisateur'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center text-white font-black shadow-lg">
              {user?.fullName?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-black/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-6 z-40">
      <div className="flex items-center gap-2 md:gap-3 cursor-pointer flex-shrink-0" onClick={() => setView('list')}>
        <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
          <Ticket className="text-black w-4 h-4 md:w-6 md:h-6" />
        </div>
        <h1 className="text-base md:text-xl font-black tracking-tighter text-white uppercase whitespace-nowrap">
          {tenantSlug && selectedEvent ? selectedEvent.name : <>TICK<span className="text-primary">HOST</span></>}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          tenantSlug ? (
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                window.location.reload();
              }} 
              className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-500/20 hover:text-red-500 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          ) : (
            <button onClick={() => setView('stats')} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl font-bold text-xs hover:bg-white/10 transition-all">
              Dashboard
            </button>
          )
        ) : (
          <button onClick={() => setView('login')} className="bg-primary text-black px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            Connexion
          </button>
        )}
      </div>
    </header>
  );
};

export const Sidebar = () => {
  const { view, setView, user, events, logout } = useStore();

  interface MenuItem {
    id: string;
    label: string;
    icon: any;
    badge?: number | string;
  }

  const adminMenuItems: MenuItem[] = [
    { id: 'super-admin', label: 'Vue Globale', icon: Globe },
    { id: 'admin-events', label: 'Événements', icon: BarChart2 },
    { id: 'organizers', label: 'Organisateurs', icon: Users },
    { id: 'client-space', label: 'Espace Client', icon: Mail },
    { id: 'moderation', label: 'Modération', icon: Shield },
    { id: 'finances', label: 'Finances', icon: CreditCard },
    { id: 'sys-settings', label: 'Système', icon: Settings },
  ];

  const organizerMenuItems: MenuItem[] = [
    { id: 'stats', label: 'Dashboard', icon: BarChart2 },
    { id: 'my-events', label: 'Mes Événements', icon: Calendar },
    { id: 'create-event', label: 'Créer un événement', icon: PlusCircle },
    { id: 'promo-codes', label: 'Codes Promo', icon: Tag },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'scanner', label: 'Scanner', icon: Scan },
    { id: 'profile', label: 'Paramètres', icon: Settings },
  ];

  const menuItems = user?.role === 'ADMIN' ? adminMenuItems : organizerMenuItems;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#050505] border-r border-white/5 hidden lg:flex flex-col z-50 shadow-2xl">
      {/* Logo Section */}
      <div className="h-24 flex items-center px-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
             <Ticket className="text-black w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">
              TICK<span className="text-emerald-500">HOST</span>
            </h1>
            {user?.role === 'ADMIN' && (
              <p className="text-[7px] font-black text-red-500 uppercase tracking-[0.3em] -mt-1 leading-none">SUPER ADMIN</p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Section in Sidebar */}
      {user?.role === 'ORGANIZER' && (
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black shadow-lg">
              {user?.fullName?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.fullName}</p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Organisateur</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = view === item.id || (item.id === 'stats' && view === 'admin');
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group relative ${
                isActive 
                  ? 'bg-white/5 text-white shadow-sm' 
                  : 'text-white/30 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-500' : 'group-hover:text-white'}`} />
                <span className="font-bold text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <div className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                  {item.badge}
                </div>
              )}
              {isActive && (
                <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 space-y-4">
        <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div className="absolute inset-0 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
            </div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Événement actif</p>
          </div>
          <p className="text-[10px] text-blue-400/60 leading-relaxed">Votre billetterie est en ligne et reçoit des visites.</p>
        </div>

        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/30 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
};

export const Nav = () => {
  const { view, setView, user, tenantSlug, staffSession } = useStore();

  // Navigation Staff (Portail indépendent /scan)
  const staffNav = [
    { id: 'scanner', label: 'Scan', icon: QrCode },
    { id: 'stats',   label: 'Stats Live', icon: BarChart2 },
  ];

  // Navigation TENANT (site événementiel)
  const tenantNav = [
    { id: 'detail',      label: 'Accueil',          icon: Calendar },
    { id: 'billetterie', label: 'Billetterie',      icon: Ticket },
    { id: 'info',        label: 'Infos Pratiques',  icon: ShieldCheck },
    { id: 'my-tickets',  label: 'Mon Ticket',       icon: QrCode },
  ];

  // Navigation ORGANIZER : stats / mes events / scanner / profil
  const organizerNav = [
    { id: 'stats',     label: 'Dashboard',       icon: BarChart2 },
    { id: 'my-events', label: 'Mes Événements',  icon: Calendar },
    { id: 'promo-codes', label: 'Promo',         icon: Tag },
    { id: 'scanner',   label: 'Scanner',          icon: QrCode },
    { id: 'profile',   label: 'Profil',           icon: User },
  ];

  // Navigation ADMIN : accès tout
  const adminNav = [
    { id: 'super-admin',    label: 'Global', icon: Globe },
    { id: 'admin-events',   label: 'Events',  icon: Calendar },
    { id: 'client-space',   label: 'Client', icon: Mail },
    { id: 'moderation',     label: 'Alertes',    icon: Shield },
    { id: 'finances',       label: 'Cash',      icon: CreditCard },
  ];

  // Navigation USER (client) : events / billets / profil
  const userNav = [
    { id: 'list',       label: 'Événements',  icon: Calendar },
    { id: 'my-tickets', label: 'Mes Billets', icon: Ticket },
    { id: 'scanner',    label: 'Scanner',     icon: QrCode },
    { id: 'profile',    label: 'Profil',      icon: User },
  ];

  const navItems =
    staffSession               ? staffNav :
    tenantSlug                 ? tenantNav :
    user?.role === 'ORGANIZER' ? organizerNav :
    user?.role === 'ADMIN'     ? adminNav :
                                 userNav;

  const isActive = (itemId: string) => {
    if (tenantSlug) {
      if (itemId === 'detail') return view === 'detail';
      return view === itemId;
    }
    if (itemId === 'list') return ['list','detail','checkout','success'].includes(view);
    return view === itemId;
  };

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 border-t border-white/5 lg:hidden z-[999] bg-[#050505]/80 backdrop-blur-xl`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className="relative flex flex-col items-center gap-1.5 px-3 py-1 transition-all"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute -top-1 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className={`w-6 h-6 transition-all ${active ? 'text-primary scale-110' : 'text-white/20'}`} />
              <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${active ? 'text-primary' : 'text-white/20'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
