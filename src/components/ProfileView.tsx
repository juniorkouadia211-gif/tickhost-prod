import React, { useState, useEffect } from 'react';
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

  // États changement de mot de passe
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // États notifications navigateur
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    notif_sales: true, notif_daily: false, notif_security: true
  });

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) {
      addToast('error', 'Ton navigateur ne supporte pas les notifications');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      addToast('success', 'Notifications activées !');
      new Notification('🎟️ TICKHOST', { body: 'Tu recevras des alertes ici à chaque vente.' });
    } else {
      addToast('error', 'Notifications refusées — tu peux les activer dans les paramètres du navigateur');
    }
  };

  const handleNotifPrefChange = async (key: string, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch('/api/auth/notification-prefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updated)
      });
    } catch { /* silencieux */ }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast('error', 'Tous les champs sont requis');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      addToast('error', 'Le mot de passe doit faire au moins 8 caractères');
      return;
    }
    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Mot de passe modifié avec succès');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        addToast('error', data.error || 'Erreur lors du changement');
      }
    } catch {
      addToast('error', 'Erreur réseau');
    } finally {
      setIsChangingPassword(false);
    }
  };

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
              {/* Changement de mot de passe */}
              <div className="border-b border-white/5 pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white/40" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Mot de passe</p>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Modifiez votre mot de passe de connexion</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    {showPasswordForm ? 'Annuler' : 'Changer'}
                  </button>
                </div>

                {showPasswordForm && (
                  <div className="mt-4 space-y-3">
                    <input
                      type="password"
                      placeholder="Mot de passe actuel"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition-all"
                    />
                    <input
                      type="password"
                      placeholder="Nouveau mot de passe (min. 8 caractères)"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition-all"
                    />
                    <input
                      type="password"
                      placeholder="Confirmer le nouveau mot de passe"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition-all"
                    />
                    <button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      className="w-full py-3 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isChangingPassword ? 'Modification...' : 'Confirmer le changement'}
                    </button>
                  </div>
                )}
              </div>

              {/* Sessions actives — remplace la 2FA */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white/40" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Session active</p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Connecté sur cet appareil</p>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); addToast('success', 'Déconnecté de tous les appareils'); }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </section>

          {/* Section: Notifications navigateur */}
          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-tighter">Notifications</h2>
              {notifPermission === 'default' && (
                <button
                  onClick={requestNotifPermission}
                  className="px-4 py-2 bg-primary text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                >
                  Activer les notifications
                </button>
              )}
              {notifPermission === 'granted' && (
                <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Activées
                </span>
              )}
              {notifPermission === 'denied' && (
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Bloquées par le navigateur</span>
              )}
            </div>
            
            <div className="space-y-6">
              {[
                { key: 'notif_sales', title: 'Alertes de vente', desc: 'Notification instantanée à chaque billet vendu', defaultVal: true },
                { key: 'notif_daily', title: 'Rapport quotidien', desc: 'Résumé de tes performances chaque matin', defaultVal: false },
                { key: 'notif_security', title: 'Alertes de sécurité', desc: 'Notifications sur les connexions suspectes', defaultVal: true }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifPrefs[item.key] ?? item.defaultVal}
                      onChange={e => handleNotifPrefChange(item.key, e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
              ))}
            </div>

            {notifPermission === 'granted' && (
              <button
                onClick={() => {
                  new Notification('🎟️ TICKHOST', {
                    body: 'Les notifications fonctionnent ! Tu seras alerté à chaque vente.',
                    icon: '/favicon.ico'
                  });
                }}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                Tester une notification
              </button>
            )}

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
