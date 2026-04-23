import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, LogOut, Mail, Phone, Shield, Bell, 
  Upload, Check, X, ChevronRight, Globe,
  Lock, Eye, EyeOff, CreditCard
} from 'lucide-react';
import { useStore } from '../store';

export const ProfileView = () => {
  const { user, logout, addToast, updatePaymentInfo } = useStore();
  const [showPassword, setShowPassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    mobile_money_num: user?.mobile_money_num || '',
    wave_num: user?.wave_num || '',
    payout_frequency: user?.payout_frequency || 'weekly'
  });

  const handleSavePayment = async () => {
    const success = await updatePaymentInfo(paymentForm);
    if (success) {
      setIsEditingPayment(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white pb-28">
      <div className="max-w-4xl mx-auto px-4 md:px-10 py-8 space-y-10">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Paramètres</h1>
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-1">Configuration & Sécurité du compte</p>
        </div>

        {/* Architecture en Sections (Vertical Stack) */}
        <div className="space-y-8 overflow-y-auto">
          
          {/* Section: Profil de l'organisateur */}
          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-tighter">Profil de l'organisateur</h2>
              <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Compte Vérifié</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Zone Importation Logo */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/5 bg-white/5 flex items-center justify-center shadow-2xl">
                    {logoPreview || user.fullName ? (
                      logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /> : 
                      <span className="text-4xl font-black text-primary">{user.fullName?.[0]}</span>
                    ) : <User className="w-12 h-12 text-white/10" />}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                    <Upload className="w-6 h-6 text-white" />
                    <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                  </label>
                </div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Logo de l'agence</p>
              </div>

              {/* Formulaire Profil */}
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Nom complet</label>
                    <input type="text" defaultValue={user.fullName} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Email de contact</label>
                    <input type="email" defaultValue={user.email} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Description de l'agence</label>
                  <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none resize-none" placeholder="Parlez-nous de votre agence..." />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
              <button className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Annuler</button>
              <button onClick={() => addToast('success', 'Profil mis à jour')} className="bg-primary text-black px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20">Enregistrer les modifications</button>
            </div>
          </section>

          {/* Section: Paiement & Reversement */}
          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-tighter">Paiement & Reversement</h2>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Numéro Mobile Money (MTN/Orange)</label>
                <input 
                  type="text" 
                  placeholder="05... / 07... / 01..."
                  value={paymentForm.mobile_money_num}
                  onChange={e => setPaymentForm({...paymentForm, mobile_money_num: e.target.value})}
                  disabled={!isEditingPayment}
                  className={`w-full bg-black border border-emerald-500/30 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 transition-all outline-none ${!isEditingPayment ? 'text-white/40 cursor-not-allowed bg-[#0A0A0A]' : 'text-white'}`} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Numéro Wave</label>
                <input 
                  type="text" 
                  placeholder="05... / 07... / 01..."
                  value={paymentForm.wave_num}
                  onChange={e => setPaymentForm({...paymentForm, wave_num: e.target.value})}
                  disabled={!isEditingPayment}
                  className={`w-full bg-black border border-emerald-500/30 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 transition-all outline-none ${!isEditingPayment ? 'text-white/40 cursor-not-allowed bg-[#0A0A0A]' : 'text-white'}`} 
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Fréquence de reversement</label>
                <select 
                  value={paymentForm.payout_frequency}
                  onChange={e => setPaymentForm({...paymentForm, payout_frequency: e.target.value})}
                  disabled={!isEditingPayment}
                  className={`w-full bg-black border border-emerald-500/30 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 transition-all outline-none appearance-none ${!isEditingPayment ? 'text-white/40 cursor-not-allowed bg-[#0A0A0A]' : 'text-white'}`}
                >
                  <option value="daily">Quotidien (J+1)</option>
                  <option value="weekly">Hebdomadaire (Tous les lundis)</option>
                  <option value="after_event">Après l'événement (Fin + 48h)</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
              {isEditingPayment ? (
                <>
                  <button 
                    onClick={() => {
                      setPaymentForm({
                        mobile_money_num: user?.mobile_money_num || '',
                        wave_num: user?.wave_num || '',
                        payout_frequency: user?.payout_frequency || 'weekly'
                      });
                      setIsEditingPayment(false);
                    }}
                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleSavePayment} 
                    className="bg-emerald-500 text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Enregistrer les paramètres
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditingPayment(true)}
                  className="px-10 py-4 border border-emerald-500 text-emerald-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all"
                >
                  Modifier mes numéros
                </button>
              )}
            </div>
          </section>

          {/* Section: Sécurité */}
          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-xl">
            <h2 className="text-lg font-black uppercase tracking-tighter">Sécurité</h2>
            
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white/40" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Mot de passe</p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Dernière modification il y a 3 mois</p>
                  </div>
                </div>
                <button className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Changer</button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white/40" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Double Authentification (2FA)</p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Protégez votre compte avec un code SMS</p>
                  </div>
                </div>
                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Section: Notifications */}
          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-xl">
            <h2 className="text-lg font-black uppercase tracking-tighter">Notifications</h2>
            
            <div className="space-y-6">
              {[
                { title: 'Alertes de vente', desc: 'Recevoir une notification à chaque billet vendu' },
                { title: 'Rapports quotidiens', desc: 'Résumé des performances par email chaque matin' },
                { title: 'Alertes de sécurité', desc: 'Notifications sur les connexions suspectes' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={i === 0} className="sr-only peer" />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Logout Section */}
          <div className="pt-4">
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all"
            >
              <LogOut className="w-5 h-5" />
              Déconnexion du compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
