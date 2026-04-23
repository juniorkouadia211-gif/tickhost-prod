import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, MapPin, Trash2, Edit3, 
  TrendingUp, Users, MoreVertical, 
  ExternalLink, Power, AlertCircle,
  Search, Filter, Download, ChevronRight,
  Image as ImageIcon, Link, CheckSquare, FlagOff
} from 'lucide-react';
import { useStore } from '../store';

export const MyEvents = () => {
  const { events, fetchEvents, deleteEvent, toggleEventStatus, closeEvent, setView, addToast, setSelectedEvent } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [closeConfirm, setCloseConfirm] = useState<string | number | null>(null);
  const [closeEventName, setCloseEventName] = useState('');

  useEffect(() => {
    fetchEvents('mine');
  }, [fetchEvents]);

  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string | number) => {
    const success = await deleteEvent(id);
    if (success) {
      setDeleteConfirm(null);
      addToast('success', 'Événement supprimé avec succès');
    }
  };

  const handleCloseEvent = async (id: string | number) => {
    const success = await closeEvent(id);
    if (success) setCloseConfirm(null);
  };

  const handleToggleStatus = async (id: string | number) => {
    const success = await toggleEventStatus(id);
    if (success) {
      addToast('success', 'Statut mis à jour');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white p-4 md:p-8 overflow-x-hidden">
      {/* Header & Stats */}
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">Mes Événements</h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs mt-1">Gérez vos billetteries et suivez vos performances</p>
          </div>
          <button 
            onClick={() => setView('create-event')}
            className="w-full md:w-auto px-8 py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-emerald-500/20"
          >
            + Créer un événement
          </button>
        </div>

        {/* Barre d'outils */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 border border-white/10 p-4 rounded-[2rem]">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="Rechercher un événement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-5 py-3 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
              <Filter className="w-4 h-4" /> Filtrer
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
              <Download className="w-4 h-4" /> Exporter
            </button>
          </div>
        </div>

        {/* Liste des événements */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Événement</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Date & Lieu</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Chiffre d'affaires</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Statut</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEvents.map((event) => (
                  <motion.tr 
                    key={event.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={(e) => {
                      // Only trigger if not clicking on a button or link
                      if (!(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('a')) {
                        addToast('success', `Chargement du Dashboard pour ${event.name}...`);
                        setSelectedEvent(event);
                        setView('stats');
                      }
                    }}
                    className="group hover:bg-white/[0.02] transition-all cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-20 rounded-xl overflow-hidden border border-white/10 bg-black flex-shrink-0">
                          {event.image_url ? (
                            <img src={event.image_url?.startsWith('data:') ? event.image_url : `${event.image_url}${event.image_url?.includes('?') ? '&' : '?'}t=${Date.now()}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-white/10" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-tighter text-lg group-hover:text-emerald-500 transition-colors">{event.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Link className="w-3 h-3 text-white/20" />
                            <span className="text-[10px] font-mono text-white/40">{event.slug}.tickhost.ci</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white/60">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs font-bold">{event.event_date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/40">
                          <MapPin className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px]">{event.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-xl font-black text-emerald-500">{(event.revenue || 0).toLocaleString()} <span className="text-[10px] uppercase">FCFA</span></p>
                        <div className="flex items-center gap-1 text-[10px] font-black text-white/20 uppercase tracking-widest">
                          <TrendingUp className="w-3 h-3" />
                          <span>+12% ce mois</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {event.status === 'closed' ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-orange-500/10 border-orange-500/20 text-orange-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest">TERMINÉ</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(event.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                            event.status === 'published'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              : 'bg-white/5 border-white/10 text-white/40'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${event.status === 'published' ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {event.status === 'published' ? 'ACTIF' : 'INACTIF'}
                          </span>
                        </button>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            useStore.getState().setEditingEvent(event);
                            setView('create-event');
                          }}
                          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-emerald-500 hover:text-black transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(event.id);
                          }}
                          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {event.status !== 'closed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCloseConfirm(event.id);
                              setCloseEventName(event.name);
                            }}
                            className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-black transition-all"
                            title="Terminer l'événement"
                          >
                            <FlagOff className="w-4 h-4" />
                          </button>
                        )}
                        <a 
                          href={`/microsite?tenant=${event.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEvents.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-white/10" />
              </div>
              <div>
                <p className="text-lg font-bold">Aucun événement trouvé</p>
                <p className="text-sm text-white/40">Essayez de modifier vos filtres ou créez-en un nouveau.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation de clôture */}
      <AnimatePresence>
        {closeConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCloseConfirm(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0A0A0A] border border-orange-500/20 rounded-[2.5rem] p-8 space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <FlagOff className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tighter">Terminer l'événement ?</h3>
                <p className="text-sm text-white/60 font-bold">{closeEventName}</p>
                <p className="text-sm text-white/40 leading-relaxed">
                  Tous les billets non encore scannés seront immédiatement invalidés. 
                  Cette action est irréversible.
                </p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                <p className="text-xs text-orange-400 font-bold text-center uppercase tracking-widest">
                  Les billets déjà scannés ne sont pas affectés
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setCloseConfirm(null)}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={() => closeConfirm && handleCloseEvent(closeConfirm)}
                  className="flex-1 py-4 bg-orange-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-400 transition-all shadow-xl shadow-orange-500/20"
                >
                  Oui, terminer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de confirmation de suppression */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tighter">Supprimer l'événement ?</h3>
                <p className="text-sm text-white/40">Cette action est irréversible. Toutes les données associées seront perdues.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
