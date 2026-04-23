import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Plus, Loader2, User, LogOut, Mail, Phone, Shield } from 'lucide-react';
import { useStore } from '../store';

import { logger } from '../services/logger';

export const AuthPages = () => {
  const { view, setView, user, setUser, fetchMyTickets, loading, setLoading, login, addToast } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('USER');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
      } else {
        addToast('error', data.error || 'Erreur de connexion');
      }
    } catch (err: any) {
      logger.error('Login error', { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, phone, role })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
      } else {
        addToast('error', data.error || 'Erreur d\'inscription');
      }
    } catch (err: any) {
      logger.error('Registration error', { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (view === 'login') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">Connexion</h2>
          <p className="text-white/40">Accédez à votre espace sécurisé</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/60">Email</label>
              <input 
                required
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@eventtick.com"
                className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/60">Mot de passe</label>
              <input 
                required
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-white p-5 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
            <span>Se connecter</span>
          </button>

          <p className="text-center text-white/40 text-sm">
            Pas encore de compte ?{' '}
            <button 
              type="button"
              onClick={() => setView('register')}
              className="text-primary font-bold hover:underline"
            >
              S'inscrire
            </button>
          </p>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Inscription</h2>
        <p className="text-white/40">Créez votre compte EventTick</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/60">Nom complet</label>
            <input 
              required
              type="text" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Jean Dupont"
              className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/60">Email</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jean@example.com"
              className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/60">Mot de passe</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/60">Type de compte</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('USER')}
                className={`p-4 rounded-2xl border font-bold transition-all ${role === 'USER' ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setRole('ORGANIZER')}
                className={`p-4 rounded-2xl border font-bold transition-all ${role === 'ORGANIZER' ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
              >
                Organisateur
              </button>
            </div>
          </div>
        </div>

        <button 
          disabled={loading}
          type="submit"
          className="w-full bg-primary text-white p-5 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
          <span>Créer mon compte</span>
        </button>

        <p className="text-center text-white/40 text-sm">
          Déjà un compte ?{' '}
          <button 
            type="button"
            onClick={() => setView('login')}
            className="text-primary font-bold hover:underline"
          >
            Se connecter
          </button>
        </p>
      </form>
    </motion.div>
  );
};
