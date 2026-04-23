import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Search, Download, Filter, User, 
  ChevronLeft, ChevronRight, MoreHorizontal,
  Eye, Ban, CheckCircle2, Clock
} from 'lucide-react';
import { useStore } from '../store';

export const ParticipantsView = () => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { exportParticipants } = useStore();

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/participants', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setParticipants(data);
      } catch (err) {
        console.error('Error fetching participants:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, []);

  const filteredParticipants = participants.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.event_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParticipants = filteredParticipants.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white pb-28">
      <div className="px-4 md:px-10 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Gestion des Participants</h1>
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-1">Base de données centralisée des acheteurs</p>
          </div>
        </div>

        {/* Barre d'outils supérieure */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="w-full md:w-96 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Rechercher un participant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-primary transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white/60 hover:text-white hover:bg-white/10 transition-all font-bold text-sm">
              <Filter className="w-4 h-4" />
              Filtrer par type
            </button>
            <button 
              onClick={exportParticipants}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-black px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
        </div>

        {/* Tableau ou Liste Mobile (Responsive) */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
          {/* Version Bureau (Tableau) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10">
                  <th className="text-left py-5 px-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Nom complet</th>
                  <th className="text-left py-5 px-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Adresse email</th>
                  <th className="text-left py-5 px-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Type de ticket</th>
                  <th className="text-left py-5 px-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Statut Paiement</th>
                  <th className="text-left py-5 px-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Date d'inscription</th>
                  <th className="text-right py-5 px-8 text-[10px] font-black text-white/40 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                        <p className="text-xs font-black text-white/20 uppercase tracking-widest">Chargement...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedParticipants.length > 0 ? paginatedParticipants.map((p, i) => (
                  <motion.tr key={i} className="group hover:bg-white/[0.03] transition-colors">
                    <td className="py-5 px-8">
                       <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-colors">
                          <User className="w-5 h-5 text-white/20 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="font-bold text-sm text-white">{p.name || 'Anonyme'}</p>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <p className="text-sm text-white/40 font-medium">{p.email}</p>
                    </td>
                    <td className="py-5 px-8">
                      <div className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        p.ticket_type === 'VIP' ? 'bg-gold/10 text-gold border-gold/20' : 'bg-white/5 text-white/40 border-white/10'
                      }`}>
                        {p.ticket_type}
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.payment_status === 'paid' ? 'bg-primary animate-pulse' : 'bg-amber-500'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${p.payment_status === 'paid' ? 'text-primary' : 'text-amber-500'}`}>
                          {p.payment_status === 'paid' ? 'Confirmé' : 'En attente'}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <p className="text-xs text-white/40 font-bold">{new Date(p.purchase_date).toLocaleDateString()}</p>
                    </td>
                    <td className="py-5 px-8 text-right space-x-2">
                      <button className="p-2 bg-white/5 hover:bg-primary/10 text-white/40 hover:text-primary rounded-lg transition-all"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-500 rounded-lg transition-all"><Ban className="w-4 h-4" /></button>
                    </td>
                  </motion.tr>
                )) : (
                  <tr><td colSpan={6} className="py-24 text-center text-white/20">Aucun participant</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Version Mobile (Liste de Cartes) */}
          <div className="lg:hidden divide-y divide-white/5">
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Chargement...</p>
              </div>
            ) : paginatedParticipants.length > 0 ? paginatedParticipants.map((p, i) => (
              <div key={i} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                      <User className="w-5 h-5 text-white/40" />
                    </div>
                    <div>
                      <p className="font-bold text-white uppercase tracking-tight">{p.name || 'Anonyme'}</p>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{p.email}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                    p.ticket_type === 'VIP' ? 'bg-gold/10 text-gold border-gold/20' : 'bg-white/5 text-white/40 border-white/10'
                  }`}>
                    {p.ticket_type}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] text-white/20 uppercase font-black tracking-widest">Paiement</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${p.payment_status === 'paid' ? 'bg-primary' : 'bg-amber-500'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${p.payment_status === 'paid' ? 'text-primary' : 'text-amber-500'}`}>
                          {p.payment_status === 'paid' ? 'Confirmé' : 'Attente'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] text-white/20 uppercase font-black tracking-widest">Date</p>
                      <p className="text-[10px] text-white/40 font-bold">{new Date(p.purchase_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40"><Eye className="w-4 h-4" /></button>
                    <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-red-500/40"><Ban className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center text-white/20 font-black uppercase tracking-widest">Aucun participant</div>
            )}
          </div>

          {/* Pagination (Pied du tableau) */}
          <div className="px-8 py-6 bg-white/[0.02] border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
              Affichage de {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredParticipants.length)} sur {filteredParticipants.length} participants
            </p>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                      currentPage === i + 1 
                        ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
