import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, TrendingUp, Users, 
  CheckCircle, Ticket, Zap, Bell,
  ChevronRight, Calendar, Plus,
  MoreVertical, Edit3, Trash2,
  Clock, ArrowUpRight, DollarSign,
  Smartphone, ShieldAlert, UserCheck, RefreshCw
} from 'lucide-react';
import { useStore } from '../store';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = {
  primary: '#10b981',
  gold: '#fbbf24',
  danger: '#ef4444',
  info: '#3b82f6',
  warning: '#f59e0b',
};

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-primary text-lg font-black">{(payload[0].value || 0).toLocaleString()} FCFA</p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-white/10 rounded-xl px-4 py-2 shadow-2xl">
        <p className="text-white font-bold text-xs">{payload[0].name}: {payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export const AdminDashboard = () => {
  const { 
    adminStats, fetchStats, user, events, setView, 
    selectedEvent, regenerateAccessCode, setSelectedEvent 
  } = useStore();
  
  useEffect(() => {
    fetchStats(selectedEvent?.id);
    const interval = setInterval(() => fetchStats(selectedEvent?.id), 10000);
    return () => clearInterval(interval);
  }, [selectedEvent?.id]); // eslint-disable-line

  const salesData = adminStats?.salesEvolution || [
    { name: 'Lun', value: 0 },
    { name: 'Mar', value: 0 },
    { name: 'Mer', value: 0 },
    { name: 'Jeu', value: 0 },
    { name: 'Ven', value: 0 },
    { name: 'Sam', value: 0 },
    { name: 'Dim', value: 0 },
  ];

  const paymentData = adminStats?.operatorStats?.map((s: any) => ({
    name: s.name,
    value: s.value,
    color: s.name === 'Wave' ? '#10b981' : (s.name === 'Orange' ? '#f59e0b' : '#ef4444')
  })) || [
    { name: 'Wave', value: 0, color: '#10b981' },
    { name: 'Orange', value: 0, color: '#f59e0b' },
    { name: 'MTN', value: 0, color: '#ef4444' },
  ];

  const ticketStats = adminStats?.ticketTypeStats?.map((s: any) => ({
    name: s.name,
    sold: s.sold,
    total: s.capacity,
    color: s.name === 'VIP' ? '#fbbf24' : (s.name === 'Table' ? '#3b82f6' : '#10b981')
  })) || [
    { name: 'Standard', sold: 0, total: 100, color: '#10b981' },
  ];

  const displayEvent = selectedEvent || events.find(e => new Date(e.event_date) > new Date()) || events[0];
  const daysRemaining = displayEvent 
    ? Math.max(0, Math.ceil((new Date(displayEvent.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const totalCapacity = adminStats?.eventFilling?.[0]?.capacity || 0;
  const totalSold = adminStats?.ticketsSold || 0;
  const fillingRate = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;

  return (
    <div className="space-y-10 pb-20 max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">Performances Live</h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-relaxed">
            {selectedEvent ? `Analyse isolée: ${selectedEvent.name}` : 'Aperçu consolidé de votre organisation'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => {
                setSelectedEvent(null);
                setView('super-admin');
              }}
              className="flex items-center gap-2 bg-emerald-500 text-black px-6 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              Supervision
            </button>
          )}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 h-14 pr-4">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <select 
              value={selectedEvent?.id || ''}
              onChange={(e) => {
                const ev = events.find(ev => ev.id === parseInt(e.target.value));
                setSelectedEvent(ev || null);
              }}
              className="bg-transparent text-xs font-black uppercase tracking-widest outline-none border-none text-white/60 focus:text-white transition-colors min-w-[150px]"
            >
              <option value="" className="bg-[#050505]">Tous mes événements</option>
              {events.map((ev: any) => (
                <option key={ev.id} value={ev.id} className="bg-[#050505]">{ev.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => fetchStats(selectedEvent?.id)}
            className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 group"
          >
            <RefreshCw className="w-5 h-5 text-white/40 group-hover:text-primary transition-colors" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tickets Vendus */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group hover:border-primary/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
            <div className="flex items-center gap-1 text-primary text-xs font-black">
              <TrendingUp className="w-3 h-3" />
              +{adminStats?.ticketGrowth || 0}%
            </div>
          </div>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Tickets Vendus</p>
          <h3 className="text-2xl md:text-4xl font-black tracking-tighter text-white">{(adminStats?.ticketsSold || 0).toLocaleString()}</h3>
          <p className="text-[10px] text-white/40 mt-2 font-medium">Billeterie active</p>
        </div>

        {/* Chiffre d'Affaires */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group hover:border-primary/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-white/10 group-hover:text-white/40 transition-colors" />
          </div>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Chiffre d'Affaires</p>
          <h3 className="text-2xl md:text-4xl font-black tracking-tighter text-white">
            {(adminStats?.totalRevenue || 0).toLocaleString()} <span className="text-sm text-primary uppercase ml-1">FCFA</span>
          </h3>
          <p className="text-[10px] text-white/40 mt-2 font-medium">Revenus billetterie</p>
        </div>

        {/* Taux de Remplissage */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group hover:border-primary/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-black text-white/60">{fillingRate.toFixed(1)}%</span>
          </div>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Taux de Remplissage</p>
          <h3 className="text-2xl md:text-4xl font-black tracking-tighter text-white">{totalSold.toLocaleString()} / {totalCapacity.toLocaleString()}</h3>
          <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${fillingRate}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>
      </div>

      {/* 2. Zone Centrale (Analyse des Ventes) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gauche: Performance (Area Chart) */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-tighter">Performance des Ventes</h3>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">7 derniers jours</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Revenus</span>
              </div>
            </div>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#050505' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Droite: Répartition par type de billet */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-10 flex flex-col">
          <div className="space-y-1 mb-10">
            <h3 className="text-xl font-black uppercase tracking-tighter">Ventes par type</h3>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Répartition des catégories</p>
          </div>
          
          <div className="space-y-8 flex-1">
            {ticketStats.map((stat, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-widest text-white/60">{stat.name}</span>
                  <span className="text-sm font-black text-white">{stat.sold} / {stat.total}</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(stat.sold / stat.total) * 100}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-10 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total Billets</p>
                <p className="text-2xl font-black text-white">{totalSold}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Objectif</p>
                <p className="text-2xl font-black text-primary">{totalCapacity}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Zone Basse (Finances & Terrain) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gauche: Moyens de Paiement (Donut Chart) */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-10">
          <div className="space-y-1 mb-10">
            <h3 className="text-xl font-black uppercase tracking-tighter">Moyens de Paiement</h3>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Répartition des transactions</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div style={{ width: 220, height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-6 w-full">
              {paymentData.map((item, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-white">{item.value}%</span>
                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Droite: Scanner & Accès Staff */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-tighter">Scanner & Accès Staff</h3>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Gestion des entrées</p>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                {Math.ceil((adminStats?.checkins || 0) / 100) + 1} agents actifs
              </span>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-3xl p-8 text-center space-y-4">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Code d'accès Staff</p>
            <div className="flex items-center justify-center gap-4">
              <h2 className="text-3xl md:text-5xl font-black text-[#fbbf24] tracking-[0.1em] md:tracking-[0.2em] uppercase break-all">{displayEvent?.access_code || 'GALA2026'}</h2>
              <button 
                onClick={() => displayEvent && regenerateAccessCode(displayEvent.id)}
                className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all group"
              >
                <RefreshCw className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
              </button>
            </div>
            <p className="text-[9px] text-red-500/80 font-black uppercase tracking-widest leading-relaxed">
              Ce code est strictement confidentiel. Partagez-le uniquement avec vos agents de sécurité en service.
            </p>
            <div className="flex items-center justify-center gap-2 text-white/40 text-xs mt-2">
              <Smartphone className="w-4 h-4" />
              <span>Utilisez ce code sur l'application scanner</span>
            </div>
          </div>

          {/* Lien du site événement */}
          {displayEvent?.slug && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 space-y-3">
              <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.3em]">🔗 Lien de ton site événement</p>
              <div className="flex items-center gap-2 bg-black/40 rounded-2xl px-4 py-3 border border-white/5">
                <span className="flex-1 text-xs font-mono text-white/60 truncate">
                  {window.location.origin}/?tenant={displayEvent.slug}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/?tenant=${displayEvent.slug}`);
                  }}
                  className="flex-shrink-0 px-3 py-1.5 bg-emerald-500 text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                >
                  Copier
                </button>
              </div>
              <button
                onClick={() => window.open(`/?tenant=${displayEvent.slug}`, '_blank')}
                className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
              >
                Ouvrir l'aperçu →
              </button>
            </div>
          )}

          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Tickets Scannés</p>
                <p className="text-3xl font-black text-white">
                  {adminStats?.checkins || 0} 
                  <span className="text-sm text-white/20"> / {adminStats?.ticketsSold || 0}</span>
                </p>
              </div>
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <UserCheck className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <p className="text-xs font-bold text-red-500">Dernier scan : ticket DUPLIQUÉ refusé</p>
            </div>

            <button 
              onClick={() => setView('scanner')}
              className="w-full py-5 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Gérer le scanner
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
