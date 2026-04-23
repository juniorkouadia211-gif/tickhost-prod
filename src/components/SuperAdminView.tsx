import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, Users, Globe, Shield, CreditCard, 
  Settings, Activity, AlertTriangle, TrendingUp,
  CheckCircle, XCircle, MoreVertical, Search,
  Filter, Download, Server, Cpu, Plus, 
  Eye, Pause, Play, RefreshCw, Mail, Lock,
  ChevronRight, Smartphone, UserPlus, Zap, DollarSign,
  ArrowRight, ShieldCheck, PieChart as PieChartIcon,
  Calendar, Star, MessageSquare, MessageCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell 
} from 'recharts';
import { useStore } from '../store';

// --- STYLED KPI CARD (OLED LOOK) ---
const KPIBlock = ({ title, value, detail, trend, color = "emerald" }: any) => {
  const isPositive = trend > 0;
  return (
    <div className="bg-black border border-white/5 rounded-3xl p-6 relative overflow-hidden group shadow-2xl">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color === 'emerald' ? 'emerald' : color}-500/10 blur-[80px] -mr-16 -mt-16 transition-all group-hover:bg-opacity-20`} />
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{title}</p>
          {trend !== undefined && (
            <div className={`px-2 py-1 rounded-lg text-[9px] font-black flex items-center gap-1 ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
              {isPositive ? '+' : ''}{trend}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-4xl font-black tracking-tighter text-white uppercase italic">{value}</h3>
          <p className="text-[11px] font-bold text-white/20 mt-1 uppercase tracking-tight">{detail}</p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

// --- MAIN SUPER ADMIN VIEW ---
export const SuperAdminView = () => {
  const { 
    user, view, setView, addToast,
    superAdminStats, fetchGlobalStats,
    superAdminEvents, fetchEventsSupervision,
    superAdminOrganizers, fetchOrganizers,
    superAdminFinances, fetchFinances,
    superAdminModeration, fetchModeration,
    superAdminClientSpace, fetchClientSpace,
    systemSettings, fetchSystemSettings,
    moderateEvent, updateSystemSettings, updatePayoutStatus,
    setSelectedEvent
  } = useStore();

  const handleSuspendOrganizer = async (id: string) => {
    try {
      const token = user?.token;
      const res = await fetch(`/api/admin/organizers/${id}/suspend`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        fetchOrganizers();
      } else {
        addToast('error', data.error || 'Erreur lors de la suspension');
      }
    } catch {
      addToast('error', 'Erreur réseau');
    }
  };

  const handleDeleteOrganizer = async (id: string) => {
    try {
      const token = user?.token;
      const res = await fetch(`/api/admin/organizers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        fetchOrganizers();
      } else {
        addToast('error', data.error || 'Erreur lors de la suppression');
      }
    } catch {
      addToast('error', 'Erreur réseau');
    }
  };

  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;

    // Fetch data based on view
    switch (view) {
      case 'super-admin': fetchGlobalStats(); break;
      case 'admin-events': fetchEventsSupervision(); break;
      case 'organizers': fetchOrganizers(); break;
      case 'moderation': fetchModeration(); break;
      case 'finances': fetchFinances(); break;
      case 'client-space': fetchClientSpace(); break;
      case 'sys-settings': fetchSystemSettings(); break;
    }
  }, [view, user]);

  const handleVoirStats = (event: any) => {
    setSelectedEvent(event);
    setView('stats');
    addToast('info', `Surveillance de : ${event.name}`);
  };

  const currentTabName = () => {
    switch(view) {
      case 'super-admin': return 'Vue Globale';
      case 'admin-events': return 'Supervision Événements';
      case 'organizers': return 'Gestion Organisateurs';
      case 'moderation': return 'Centre de Modération';
      case 'finances': return 'Monitoring Financier';
      case 'client-space': return 'Espace Client';
      case 'sys-settings': return 'Système & Config';
      default: return 'Super Admin';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* Platform Header */}
      <header className="h-16 md:h-20 border-b border-white/5 px-4 md:px-10 flex items-center justify-between sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-xl overflow-x-hidden">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-2 h-8 bg-emerald-500 rounded-full" />
             <h2 className="text-lg md:text-2xl font-black uppercase tracking-tighter italic truncate max-w-[160px] md:max-w-none">{currentTabName()}</h2>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 group cursor-default">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-emerald-500 transition-colors">Système Operational</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block pr-6 border-r border-white/5">
             <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">Administrateur</p>
             <p className="text-xs font-black text-white uppercase">{user?.fullName}</p>
          </div>
          <button 
            onClick={() => setIsMaintenance(!isMaintenance)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                isMaintenance 
                ? 'bg-red-600 text-white shadow-red-600/30' 
                : 'bg-white/5 border border-white/10 text-white/40 hover:bg-red-600/10 hover:text-red-600 hover:border-red-600/30'
            }`}
          >
            {isMaintenance ? 'Mode Maintenance Actif' : 'Activer Maintenance'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[2000px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full h-full"
          >
            {view === 'super-admin' && <VueGlobale stats={superAdminStats} />}
            {view === 'admin-events' && <EventsSupervision events={superAdminEvents} onModerate={moderateEvent} onVoirStats={handleVoirStats} />}
            {view === 'organizers' && <OrganizersTable organizers={superAdminOrganizers} onSuspend={handleSuspendOrganizer} onDelete={handleDeleteOrganizer} />}
            {view === 'finances' && <FinancesBlock data={superAdminFinances} onUpdatePayout={updatePayoutStatus} />}
            {view === 'moderation' && <ModerationCenter data={superAdminModeration} onModerate={moderateEvent} />}
            {view === 'client-space' && <ClientSpace data={superAdminClientSpace} />}
            {view === 'sys-settings' && <SystemSettings settings={systemSettings} onSave={updateSystemSettings} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- SUB-VIEWS IMPLEMENTATIONS ---

const VueGlobale = ({ stats }: any) => {
  if (!stats) return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl" />)}
    </div>
  );

  return (
    <div className="space-y-12">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIBlock 
          title="Volume d'affaires (24h)" 
          value={`${stats.kpis.revenue24h.value.toLocaleString()} FCFA`} 
          detail={`CA Brut des dernières 24h`}
          trend={stats.kpis.revenue24h.trend}
          color="emerald"
        />
        <KPIBlock 
          title="Tickets en circulation" 
          value={stats.kpis.tickets} 
          detail="Total QR Codes actifs"
          detailColor="emerald"
        />
        <KPIBlock 
          title="Taux d'occupation" 
          value={`${stats.kpis.occupationRate}%`} 
          detail="Moyenne de remplissage"
        />
        <KPIBlock 
          title="Alertes Critiques" 
          value={stats.kpis.alerts} 
          detail="Signalements à traiter"
          color="red"
          detailColor="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Platform Growth Chart */}
        <div className="lg:col-span-2 bg-black border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] -mr-64 -mt-64" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <h3 className="text-lg md:text-2xl font-black uppercase tracking-tighter italic truncate max-w-[160px] md:max-w-none">Croissance Global</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Évolution du Chiffre d'Affaires Mensuel</p>
              </div>
              <div className="flex gap-2">
                 <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black border border-emerald-500/20">ANNUEL</div>
              </div>
            </div>
            
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.growthChart}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.1)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontWeight: 'bold' }}
                      dy={10}
                  />
                  <YAxis 
                      stroke="rgba(255,255,255,0.1)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `${val/1000}k`}
                      dx={-10}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '4 4' }}
                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '15px' }}
                    itemStyle={{ color: '#10b981', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px' }}
                    labelStyle={{ color: 'white', marginBottom: '5px', fontWeight: 900 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="Chiffre d'Affaires"
                    stroke="#10b981" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Side Panel: Health & Activity */}
        <div className="space-y-10">
          <div className="bg-black border border-white/5 rounded-[3rem] p-10 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Server className="w-5 h-5 text-emerald-500" />
              <h3 className="text-xl font-black uppercase tracking-tighter italic">Infrastructure</h3>
            </div>
            <div className="space-y-8">
               <ServerHealthBar label="Charge API" value={78} />
               <ServerHealthBar label="Base de Données" value={34} />
               <ServerHealthBar label="Stockage Images" value={62} />
               <ServerHealthBar label="Surcharge Transactionnelle" value={12} color="red" />
            </div>
          </div>

          <div className="bg-black border border-white/5 rounded-[3rem] p-10 shadow-2xl flex-1">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black uppercase tracking-tighter italic">Dernières Actions</h3>
               <span className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-widest">LIVE</span>
             </div>
             <div className="space-y-6">
                {stats.recentActivity.map((act: any, idx: number) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="w-1 h-8 bg-emerald-500/10 group-hover:bg-emerald-500 transition-all rounded-full" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-tight text-white/80">{act.title}</p>
                      <p className="text-[10px] font-bold text-white/30">{act.details}</p>
                      <p className="text-[8px] font-black text-emerald-500/40 uppercase tracking-widest mt-1">il y a {idx + 1} min</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ServerHealthBar = ({ label, value, color = "emerald" }: any) => {
  const isAlert = value > 90 || color === 'red';
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
        <span>{label}</span>
        <span className={isAlert ? 'text-red-500' : 'text-emerald-500'}>{value}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${isAlert ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'} transition-all duration-1000`} 
        />
      </div>
    </div>
  );
};

const EventsSupervision = ({ events, onModerate, onVoirStats }: any) => (
    <div className="space-y-8">
       <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h2 className="text-lg md:text-2xl font-black uppercase tracking-tighter italic truncate max-w-[160px] md:max-w-none">Catalogue des Événements</h2>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Surveillance et Contrôle de la Plateforme</p>
          </div>
          <div className="flex gap-4">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input type="text" placeholder="RECHERCHER UN ÉVÉNEMENT..." className="bg-black border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-emerald-500 transition-all w-72" />
             </div>
          </div>
       </div>

       <div className="bg-black border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left order-separate border-spacing-0">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-10 py-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5">Détails Événement</th>
                <th className="px-10 py-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5">Propriétaire</th>
                <th className="px-10 py-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 text-center">Trafic & Ventes</th>
                <th className="px-10 py-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5">Statut</th>
                <th className="px-10 py-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 text-right">Contrôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {events.map((ev: any) => (
                 <tr key={ev.id} className="hover:bg-emerald-500/[0.03] transition-all group">
                   <td className="px-10 py-6">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <img src={ev.image_url} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/5 group-hover:border-emerald-500/50 transition-all" />
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-black border border-white/10 rounded-lg flex items-center justify-center">
                             <Zap className="w-4 h-4 text-emerald-500" />
                          </div>
                        </div>
                        <div>
                           <p className="text-sm font-black uppercase tracking-tight text-white group-hover:text-emerald-500 transition-colors">{ev.name}</p>
                           <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1 italic">ID-{ev.id.substring(0,8)}</p>
                        </div>
                      </div>
                   </td>
                   <td className="px-10 py-6">
                      <p className="text-[12px] font-black uppercase text-white/60">{ev.organizer_name}</p>
                      <p className="text-[10px] text-white/20 font-bold lowercase mt-1">{ev.organizer_email}</p>
                   </td>
                   <td className="px-10 py-6">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex justify-between w-full text-[10px] font-black uppercase mb-1">
                           <span className="text-white/40">Vendu</span>
                           <span className="text-emerald-500">{Math.round((ev.sold/ev.capacity)*100)}%</span>
                        </div>
                        <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${(ev.sold/ev.capacity)*100}%` }} />
                        </div>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{ev.sold} / {ev.capacity}</p>
                      </div>
                   </td>
                   <td className="px-10 py-6">
                      <StatusBadge status={ev.moderation_status === 'suspended' ? 'suspended' : ev.status} />
                   </td>
                   <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <button 
                          onClick={() => onVoirStats(ev)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                        >
                           <BarChart3 className="w-4 h-4" />
                           Voir Stats
                        </button>
                        <div className="h-8 w-px bg-white/10 mx-1" />
                        {ev.moderation_status === 'suspended' ? (
                            <button 
                                onClick={() => onModerate(ev.id, 'approve', 'Relance Manuelle')}
                                className="p-3 bg-white/5 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-black transition-all border border-emerald-500/30"
                            >
                                <Play className="w-4 h-4" />
                            </button>
                        ) : (
                            <button 
                                onClick={() => onModerate(ev.id, 'suspend', 'Audit Obligatoire')}
                                className="p-3 bg-red-600/10 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-600/20"
                            >
                                <Pause className="w-4 h-4" />
                            </button>
                        )}
                        <button className="p-3 bg-white/5 text-white/30 rounded-xl hover:bg-white/10 hover:text-white transition-all">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
          {events.length === 0 && (
             <div className="py-32 text-center space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                   <Calendar className="w-10 h-10 text-white/10" />
                </div>
                <p className="text-xs font-black text-white/20 uppercase tracking-[0.5em]">Aucun événement actif</p>
             </div>
          )}
       </div>
    </div>
);

const OrganizersTable = ({ organizers, onSuspend, onDelete }: any) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-lg md:text-2xl font-black uppercase tracking-tighter italic truncate max-w-[160px] md:max-w-none">Réseau d'Organisateurs</h2>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Contrôle des Partenaires Plateforme</p>
      </div>
      <div className="bg-black border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-white/[0.02]">
              <th className="px-10 py-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5">Profil</th>
              <th className="px-10 py-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5">Activité</th>
              <th className="px-10 py-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5">Volume (Cash)</th>
              <th className="px-10 py-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5">Statut</th>
              <th className="px-10 py-8 text-[11px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {organizers.map((org: any) => (
              <tr key={org.id} className="hover:bg-white/[0.03] transition-all group">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-none w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-900 flex items-center justify-center text-black font-black text-xl shadow-lg">
                      {org.full_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight text-white group-hover:text-emerald-500 transition-colors">{org.full_name}</p>
                      <p className="text-[10px] text-white/20 font-bold lowercase">{org.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/20" />
                    <p className="font-black text-xs uppercase text-white/60">{org.events_count} Événements</p>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className="space-y-0.5">
                    <p className="font-black text-emerald-500 italic text-sm">{(org.total_revenue || 0).toLocaleString()} FCFA</p>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Revenu Total Généré</p>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className={`px-4 py-1.5 ${org.is_banned ? 'bg-red-600/10 border-red-600/20 text-red-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'} border rounded-xl inline-flex items-center gap-2`}>
                    {org.is_banned ? <XCircle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    <span className="text-[9px] font-black tracking-widest uppercase">{org.is_banned ? 'Suspendu' : 'Actif'}</span>
                  </div>
                </td>
                <td className="px-10 py-6 text-right">
                  {confirmDelete === org.id ? (
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-[10px] font-black text-red-500 uppercase">Confirmer ?</span>
                      <button onClick={() => { onDelete(org.id); setConfirmDelete(null); }} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-700 transition-all">
                        Oui, supprimer
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-all">
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={() => onSuspend(org.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${org.is_banned ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500 hover:text-black' : 'bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500 hover:text-black'}`}
                      >
                        {org.is_banned ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                        {org.is_banned ? 'Réactiver' : 'Suspendre'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(org.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-600 border border-red-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                      >
                        <XCircle className="w-3 h-3" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {organizers.length === 0 && (
          <div className="py-32 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
              <Users className="w-10 h-10 text-white/10" />
            </div>
            <p className="text-xs font-black text-white/20 uppercase tracking-[0.5em]">Aucun organisateur</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FinancesBlock = ({ data, onUpdatePayout }: any) => {
    if (!data) return <div className="animate-pulse h-96 bg-white/5 rounded-[3rem]" />;
    const commission = data.stats.globalRevenue * (data.stats.commissionRate / 100);

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between mb-8">
               <div className="space-y-1">
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic text-emerald-500">Monitoring Financier</h2>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Transparence et Flux de Trésorerie Plafetorme</p>
               </div>
               <div className="flex gap-4">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                     <Download className="w-4 h-4" />
                     Exporter Ledger
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <KPIBlock title="Tickets Total" value={data.stats.totalTickets} detail="Inscrits sur la Base" />
                <KPIBlock title="CA Brut Total" value={`${data.stats.globalRevenue.toLocaleString()} F`} detail="Total Encaissé" color="emerald" />
                <KPIBlock title="Revenus PUB/LOGO" value={`${data.stats.adRevenue?.toLocaleString() || 0} F`} detail="Vente emplacements" color="blue" />
                <KPIBlock title="Revenus TICKHOST" value={`${commission.toLocaleString()} F`} detail={`Commission fixe ${data.stats.commissionRate}%`} color="blue" />
                <KPIBlock title="Organisateurs Paid" value={data.stats.activeOrganizers} detail="Comptes avec Flux" />
            </div>

            <div className="bg-black border border-white/5 rounded-[3rem] p-10 shadow-2xl space-y-8">
                <h3 className="text-xl font-black uppercase tracking-tighter italic border-b border-white/5 pb-6">Journal des Reversements</h3>
                <div className="grid gap-4">
                    {data.payouts.map((p: any) => (
                        <div key={p.id} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 flex flex-col lg:flex-row items-center justify-between gap-8 hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all group">
                            <div className="flex flex-wrap items-center gap-12 flex-1">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center font-black text-white italic">
                                      {p.organizer_name[0]}
                                   </div>
                                   <div>
                                       <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Organisateur</p>
                                       <p className="font-black text-sm uppercase text-white">{p.organizer_name}</p>
                                   </div>
                                </div>
                                
                                <div className="text-center lg:text-left px-8 border-x border-white/5">
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Net à reverser</p>
                                    <p className="font-black text-2xl text-emerald-500 italic tracking-tighter">{p.amount.toLocaleString()} FCFA</p>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1 text-center">Canaux de paiement</p>
                                    <div className="flex gap-3">
                                        {p.mobile_money_num && (
                                           <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                              <Smartphone className="w-3 h-3 text-yellow-500" />
                                              <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Mobile: {p.mobile_money_num}</span>
                                           </div>
                                        )}
                                        {p.wave_num && (
                                           <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                              <Zap className="w-3 h-3 text-blue-500" />
                                              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Wave: {p.wave_num}</span>
                                           </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 group-hover:scale-105 transition-transform duration-500">
                                <PayoutStatusBadge status={p.status} />
                                {p.status === 'pending' && (
                                    <button 
                                        onClick={() => onUpdatePayout(p.id, 'paid')}
                                        className="bg-emerald-500 text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-emerald-500/20"
                                    >
                                        Confirmer Paiement
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {data.payouts.length === 0 && (
                       <div className="py-20 text-center text-white/10 uppercase font-black text-xs tracking-widest italic animate-pulse">
                          Zéro reversement critique
                       </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const config: any = {
        published: { color: 'emerald', label: 'ACTIF' },
        draft: { color: 'yellow', label: 'BROUILLON' },
        inactive: { color: 'white/20', label: 'OFF' },
        suspended: { color: 'red', label: 'BLOQUÉ' }
    };
    const { color, label } = config[status] || { color: 'white', label: status.toUpperCase() };

    return (
        <div className={`px-4 py-1.5 bg-${color === 'emerald' ? 'emerald' : color === 'red' ? 'red' : 'white'}-500/10 border border-${color === 'emerald' ? 'emerald' : color === 'red' ? 'red' : 'white'}-500/20 rounded-xl inline-flex items-center gap-2`}>
            {status === 'published' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-white/50" />}
            <span className={`text-[9px] font-black tracking-[0.2em] ${color === 'emerald' ? 'text-emerald-500' : 'text-white'}`}>{label}</span>
        </div>
    );
};

const PayoutStatusBadge = ({ status }: { status: string }) => {
    const config: any = {
        paid: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Paiement Effectué' },
        pending: { color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'En attente validation' },
        scheduled: { color: 'text-white/40', bg: 'bg-white/5', label: 'Cycle en cours' }
    };
    const { color, bg, label } = config[status] || config.scheduled;
    return (
        <span className={`px-5 py-2 ${bg} ${color} border border-white/5 text-[9px] font-black rounded-2xl uppercase tracking-[0.2em]`}>
            {label}
        </span>
    );
};

const ModerationCenter = ({ data, onModerate }: any) => {
    const [filter, setFilter] = useState<'reported' | 'pending' | 'suspended'>('reported');

    const filtered = data.filter((ev: any) => {
        if (filter === 'reported') return ev.is_reported === 1;
        if (filter === 'pending') return ev.moderation_status === 'pending';
        if (filter === 'suspended') return ev.moderation_status === 'suspended';
        return true;
    });

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="space-y-1">
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic text-red-500">Unité de Modération</h2>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Interface de Nettoyage et de Signalements</p>
               </div>
               <div className="flex bg-black border border-white/5 p-1 rounded-2xl">
                    {['reported', 'pending', 'suspended'].map((t) => (
                        <button 
                            key={t}
                            onClick={() => setFilter(t as any)}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                filter === t 
                                ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' 
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {t === 'reported' ? 'Canal Rouge' : t === 'pending' ? 'Examen' : 'Purgatoire'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filtered.map((ev: any) => (
                    <motion.div 
                      layout
                      key={ev.id} 
                      className="bg-black border border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl relative group overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-red-600/10 blur-[60px] ${filter === 'reported' ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="flex gap-6 relative z-10">
                            <img src={ev.image_url} alt="" className="w-20 h-20 rounded-3xl object-cover border border-white/10" />
                            <div className="space-y-1">
                                <h4 className="font-black text-lg uppercase tracking-tight italic">{ev.name}</h4>
                                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{ev.organizer_name}</p>
                                <p className="text-[9px] font-black text-red-500/60 uppercase mt-2">ALERTE NIVEAU 2</p>
                            </div>
                        </div>

                        <div className="bg-red-600/10 border border-red-600/20 rounded-[2rem] p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Motif Audit</p>
                            <p className="text-[13px] text-white/60 leading-relaxed font-bold italic">{ev.report_reason || 'Vérification de sécurité périodique requise par l\'administration.'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 relative z-10">
                            <button 
                                onClick={() => onModerate(ev.id, 'approve', 'Rétablit après audit')}
                                className="py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all font-black shadow-xl"
                            >
                                Relaxer
                            </button>
                            <button 
                                onClick={() => onModerate(ev.id, 'suspend', 'Violation CGU')}
                                className="py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:border hover:border-red-600 transition-all shadow-xl shadow-red-600/20"
                            >
                                Suspendre
                            </button>
                        </div>
                    </motion.div>
                ))}
                {filtered.length === 0 && (
                   <div className="col-span-full py-40 border-2 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center justify-center space-y-6 opacity-20">
                      <ShieldCheck className="w-20 h-20 text-emerald-500" />
                      <p className="text-xl font-black uppercase tracking-[0.5em]">Zone de Sécurité Nulle</p>
                   </div>
                )}
            </div>
        </div>
    );
};

const SystemSettings = ({ settings, onSave }: any) => {
    const [localSettings, setLocalSettings] = useState(settings || {});
    
    useEffect(() => {
        if (settings) setLocalSettings(settings);
    }, [settings]);

    const handleSave = () => {
        onSave(localSettings);
    };

    if (!localSettings) return null;

    return (
        <div className="max-w-6xl space-y-12 pb-20">
            <div className="space-y-1 mb-10">
                <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter italic text-white">Configuration Système</h2>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Contrôle du Moteur et Stratégie Opérationnelle</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* General Config */}
              <div className="bg-black border border-white/5 rounded-[3rem] p-12 space-y-12 shadow-2xl">
                  <div className="space-y-8">
                      <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic border-b border-white/5 pb-6">
                        <Globe className="w-8 h-8 text-emerald-500" />
                        Variables Plateforme
                      </h3>
                      <div className="space-y-4">
                          <ToggleSetting 
                              label="Maintenance d'Urgence" 
                              description="Coupe l'accès à la billetterie client pour mise à jour"
                              active={localSettings.maintenance_mode === 'true'}
                              onToggle={(val) => setLocalSettings({...localSettings, maintenance_mode: String(val)})}
                          />
                          <ToggleSetting 
                              label="Protocoles d'Enregistrement" 
                              description="Autorise les inscriptions de nouveaux serveurs organisateurs"
                              active={localSettings.registrations_open !== 'false'}
                              onToggle={(val) => setLocalSettings({...localSettings, registrations_open: String(val)})}
                          />
                          <ToggleSetting 
                              label="Auto-Pilot (Approvals)" 
                              description="Approbation automatique des flux d'événements"
                              active={localSettings.auto_validation === 'true'}
                              onToggle={(val) => setLocalSettings({...localSettings, auto_validation: String(val)})}
                          />
                          <ToggleSetting 
                              label="Monétisation Partenaires" 
                              description="Active la facturation pour l'ajout de logos partenaires"
                              active={localSettings.partner_billing_global !== 'false'}
                              onToggle={(val) => setLocalSettings({...localSettings, partner_billing_global: String(val)})}
                          />
                      </div>
                  </div>

                  <div className="space-y-8">
                      <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic border-b border-white/5 pb-6">
                        <DollarSign className="w-8 h-8 text-emerald-500" />
                        Finances & Engine
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InputSetting 
                              label="Taxe Commission (%)" 
                              value={localSettings.commission_rate}
                              onChange={(val) => setLocalSettings({...localSettings, commission_rate: val})}
                          />
                          <InputSetting 
                              label="Délai Reversement (J)" 
                              value={localSettings.payout_delay_days}
                              onChange={(val) => setLocalSettings({...localSettings, payout_delay_days: val})}
                          />
                          <div className="md:col-span-2">
                            <InputSetting 
                                label="Seuil Trigger (FCFA)" 
                                value={localSettings.min_payout_threshold}
                                onChange={(val) => setLocalSettings({...localSettings, min_payout_threshold: val})}
                            />
                          </div>
                      </div>
                  </div>

                  <div className="space-y-8">
                      <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic border-b border-white/5 pb-6">
                        <Zap className="w-8 h-8 text-primary" />
                        Régie Publicitaire
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InputSetting 
                              label="Nombre de logos gratuits" 
                              value={localSettings.free_partner_logos}
                              onChange={(val) => setLocalSettings({...localSettings, free_partner_logos: val})}
                          />
                          <InputSetting 
                              label="Prix par logo supplémentaire (FCFA)" 
                              value={localSettings.extra_logo_price}
                              onChange={(val) => setLocalSettings({...localSettings, extra_logo_price: val})}
                          />
                      </div>
                  </div>
                  
                  <div className="pt-6">
                     <button 
                        onClick={handleSave}
                        className="w-full py-6 bg-emerald-500 text-black rounded-[2rem] font-black text-lg uppercase tracking-widest hover:bg-white transition-all shadow-2xl shadow-emerald-500/30 active:scale-95"
                      >
                        Sauvegarder les Paramètres
                      </button>
                  </div>
              </div>

              {/* Advanced System Monitor */}
              <div className="space-y-10">
                 <div className="bg-black border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -mr-32 -mt-32" />
                    <div className="relative z-10 space-y-8">
                        <h3 className="text-xl font-black uppercase tracking-tighter italic border-b border-white/5 pb-6">Ressources & CPU</h3>
                        <div className="space-y-8">
                           <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Instances Actives</p>
                                 <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                     <p className="text-2xl font-black italic">08 / 16</p>
                                 </div>
                              </div>
                              <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/60 hover:text-emerald-500 transition-colors">
                                 Add Instance
                              </button>
                           </div>
                           <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-widest">
                                 <span>Charge Moteur Global</span>
                                 <span>52%</span>
                              </div>
                              <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1">
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '52%' }}
                                    className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-yellow-500 rounded-full" 
                                 />
                              </div>
                           </div>
                        </div>
                    </div>
                 </div>

                 <div className="bg-black border border-white/5 rounded-[3rem] p-12 shadow-2xl">
                    <h3 className="text-xl font-black uppercase tracking-tighter italic border-b border-white/5 pb-6">Security Access</h3>
                    <div className="space-y-6 pt-6">
                        <div className="bg-red-600/5 border border-red-600/10 rounded-2xl p-6">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Zone Critique</p>
                            <p className="text-[11px] font-bold text-white/40 leading-relaxed mb-6">
                                La modification des accès privilégiés ou des emails administrateurs nécessite une validation multifacteur TickHost.
                            </p>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Email Master</label>
                                   <input type="email" placeholder="admin@tickhost.com" className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-xs font-black text-white/60 outline-none focus:border-red-600/50" />
                                </div>
                                <button className="w-full py-4 bg-white/5 text-white/40 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600/10 hover:text-red-600 transition-all font-black">
                                   Mettre à Jour les Privilèges
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>
              </div>
            </div>
        </div>
    );
};

const ReviewExpandable = ({ review }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { fetchEventFeedbacks } = useStore();

    const handleToggle = async () => {
        if (!isOpen && feedbacks.length === 0) {
            setLoading(true);
            const data = await fetchEventFeedbacks(review.id);
            setFeedbacks(data);
            setLoading(false);
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className={`bg-white/5 border transition-all rounded-2xl overflow-hidden ${isOpen ? 'border-emerald-500/40 bg-white/[0.08]' : 'border-white/5 hover:border-emerald-500/20'}`}>
            <button 
                onClick={handleToggle}
                className="w-full p-6 flex flex-col gap-4 text-left"
            >
                <div className="flex justify-between items-start w-full">
                    <div className="space-y-1">
                        <p className="font-black text-white uppercase tracking-tight italic">{review.name}</p>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{review.review_count} avis clients</p>
                    </div>
                    <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-black text-yellow-500">{review.avg_rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                </div>
                
                <div className="flex items-center justify-between w-full">
                    <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(review.avg_rating || 0) * 20}%` }}
                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                        />
                    </div>
                    <ChevronRight className={`w-4 h-4 text-white/20 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-90 text-emerald-500' : ''}`} />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/40"
                    >
                        <div className="p-6 space-y-4">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
                                </div>
                            ) : feedbacks.length > 0 ? (
                                feedbacks.map((f: any) => (
                                    <div key={f.id} className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[8px] font-black text-black">
                                                    {f.full_name?.[0] || 'U'}
                                                </div>
                                                <span className="text-[10px] font-bold text-white/40 uppercase">{f.full_name || 'Anonyme'}</span>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-2.5 h-2.5 ${i < f.rating ? 'text-yellow-500 fill-yellow-500' : 'text-white/10'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs text-white/70 leading-relaxed italic">"{f.comment || 'Aucun commentaire laissé.'}"</p>
                                        <p className="text-[8px] font-black text-white/10 uppercase text-right">{new Date(f.created_at).toLocaleDateString()}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 space-y-2">
                                    <MessageSquare className="w-8 h-8 text-white/5 mx-auto" />
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Aucun texte pour ces avis</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ClientSpace = ({ data }: any) => {
    if (!data) return <div className="space-y-12 animate-pulse"><div className="h-20 bg-white/5 rounded-3xl" /><div className="grid grid-cols-2 gap-8"><div className="h-96 bg-white/5 rounded-3xl" /><div className="h-96 bg-white/5 rounded-3xl" /></div></div>;

    return (
        <div className="space-y-12">
            <div className="space-y-1">
                <h2 className="text-lg md:text-2xl font-black uppercase tracking-tighter italic truncate max-w-[160px] md:max-w-none">Espace Client supervision</h2>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Retours d'expérience et Support</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Feedback Section */}
                <div className="bg-black border border-white/5 rounded-[3rem] p-10 space-y-8">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                        <h3 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                            <Activity className="w-6 h-6 text-emerald-500" />
                            Avis Événements
                        </h3>
                        <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full">{data.reviews?.length || 0} Events rated</span>
                    </div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {data.reviews?.map((review: any) => (
                            <ReviewExpandable key={review.id} review={review} />
                        ))}
                    </div>
                </div>

                {/* Support Tickets Section */}
                <div className="bg-black border border-white/5 rounded-[3rem] p-10 space-y-8">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                        <h3 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                            <Mail className="w-6 h-6 text-red-500" />
                            Tickets Support
                        </h3>
                        <span className="text-[10px] font-black bg-red-500/10 text-red-500 px-3 py-1 rounded-full">{data.signalings?.length || 0} Actifs</span>
                    </div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {data.signalings?.map((ticket: any) => (
                            <div key={ticket.id} className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-red-500/20 transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{ticket.event_name}</p>
                                        <p className="font-black text-sm uppercase text-white group-hover:text-red-500 transition-colors">{ticket.subject}</p>
                                    </div>
                                    <span className="text-[9px] font-black bg-white/5 px-2 py-1 rounded text-white/40 uppercase">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-white/60 mb-4 italic">"{ticket.message}"</p>
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-black">
                                                {ticket.user_name[0]}
                                            </div>
                                            <span className="text-[10px] font-black text-white/40">{ticket.user_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 ml-1">
                                             {ticket.email_whatsapp.includes('@') ? <Mail className="w-2.5 h-2.5 text-blue-500" /> : <MessageCircle className="w-2.5 h-2.5 text-emerald-500" />}
                                             <span className="text-[9px] font-bold text-white/40">{ticket.email_whatsapp}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (ticket.email_whatsapp.includes('@')) {
                                                window.location.href = `mailto:${ticket.email_whatsapp}`;
                                            } else {
                                                window.open(`https://wa.me/${ticket.email_whatsapp.replace(/\s+/g, '')}`, '_blank');
                                            }
                                        }}
                                        className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all hover:text-black"
                                    >
                                        Répondre
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToggleSetting = ({ label, description, active, onToggle }: any) => (
    <div className="flex items-center justify-between p-6 bg-black border border-white/5 rounded-3xl group hover:border-emerald-500/20 transition-all">
        <div className="space-y-1">
            <p className="text-sm font-black uppercase tracking-tight text-white group-hover:text-emerald-500 transition-colors">{label}</p>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest max-w-[250px] leading-relaxed">{description}</p>
        </div>
        <button 
            onClick={() => onToggle(!active)}
            className={`w-16 h-8 rounded-full transition-all relative ${active ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/10'}`}
        >
            <motion.div 
               animate={{ x: active ? 32 : 4 }}
               className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-shadow ${active ? 'shadow-lg' : ''}`} 
            />
        </button>
    </div>
);

const InputSetting = ({ label, value, onChange }: any) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.2em] ml-2 italic">{label}</label>
        <div className="relative group">
           <input 
              type="text" 
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-3xl px-8 py-6 text-xl font-black text-white outline-none focus:border-emerald-500 transition-all text-center tracking-tighter" 
           />
           <div className="absolute inset-x-8 bottom-0 h-1 bg-emerald-500 scale-x-0 group-focus-within:scale-x-100 transition-transform origin-center blur-[1px]" />
        </div>
    </div>
);
