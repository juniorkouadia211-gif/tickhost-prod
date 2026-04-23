import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Tag, Plus, Trash2, Power, BarChart3, Ticket } from 'lucide-react';
import { useStore } from '../store';

export const PromoCodesView = () => {
  const { events, fetchEvents, fetchPromoCodes, promoCodes, createPromoCode, deletePromoCode, togglePromoCode } = useStore();
  const [selectedEventId, setSelectedEventId] = useState<string | number>('');
  const [newCode, setNewCode] = useState({ code: '', reduction_percent: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchEvents('mine');
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEventId) {
      fetchPromoCodes(selectedEventId);
    }
  }, [selectedEventId, fetchPromoCodes]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    const success = await createPromoCode(selectedEventId, {
      code: newCode.code.toUpperCase(),
      reduction_percent: parseInt(newCode.reduction_percent)
    });
    if (success) {
      setNewCode({ code: '', reduction_percent: '' });
      setIsAdding(false);
    }
  };

  const myEvents = events; //.filter(e => e.status !== 'inactive');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white">Codes Promo</h2>
          <p className="text-white/40 text-sm">Gérez les réductions pour vos événements</p>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all min-w-[200px]"
          >
            <option value="">Sélectionner un événement</option>
            {myEvents.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>

          {selectedEventId && (
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> Nouveau Code
            </button>
          )}
        </div>
      </div>

      {!selectedEventId ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
            <Ticket className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40 font-medium">Veuillez sélectionner un événement pour gérer ses codes promo</p>
        </div>
      ) : (
        <div className="space-y-6">
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 p-6 rounded-3xl"
            >
              <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Code (ex: ETE2024)</label>
                  <input 
                    type="text" 
                    required
                    value={newCode.code}
                    onChange={e => setNewCode({...newCode, code: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-emerald-500 outline-none transition-all uppercase placeholder:text-white/10"
                    placeholder="PROMO10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Réduction (%)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    max="100"
                    value={newCode.reduction_percent}
                    onChange={e => setNewCode({...newCode, reduction_percent: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-emerald-500 outline-none transition-all placeholder:text-white/10"
                    placeholder="10"
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                    Enregistrer le code
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="grid gap-4">
            {promoCodes.length > 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Code</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Réduction</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Utilisations</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Économies tot.</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((code) => (
                      <tr key={code.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-emerald-500" />
                            <span className="font-mono font-bold text-white">{code.code}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-emerald-500">-{code.reduction_percent}%</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              code.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {code.is_active ? 'Actif' : 'Désactivé'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-white/60">{code.usage_count || 0}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-white">{(code.total_saved || 0).toLocaleString()} FCFA</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => togglePromoCode(selectedEventId, code.id)}
                              className={`p-2 rounded-xl transition-all ${
                                code.is_active ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                              }`}
                              title={code.is_active ? 'Désactiver' : 'Activer'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm('Supprimer ce code promo ?')) {
                                  deletePromoCode(selectedEventId, code.id);
                                }
                              }}
                              className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                  <Tag className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/40 font-medium">Aucun code promo créé pour cet événement</p>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="text-emerald-500 font-bold hover:underline"
                >
                  Créer votre premier code promo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
