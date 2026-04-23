import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, ShieldCheck, Clock, AlertCircle, 
  Loader2, Plus, RefreshCw, Cloud, 
  CloudOff, Smartphone, UserCheck, ShieldAlert,
  ChevronRight, History, CheckCircle2, XCircle
} from 'lucide-react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { useStore } from '../store';
import { logger } from '../services/logger';

export const ScannerView = () => {
  const { 
    isScannerActive, setIsScannerActive, 
    scanResult, setScanResult,
    manualCode, setManualCode,
    validateTicket,
    isOnline, isSyncing, offlineScans,
    loading, setLoading,
    staffSession, validateAccessCode, setStaffSession,
    selectedEvent, regenerateAccessCode,
    adminStats, fetchStats
  } = useStore();

  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [sessionScans, setSessionScans] = useState(0);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScanTimeRef = useRef<number>(0);

  // Fetch stats and scans periodically
  useEffect(() => {
    const eventId = staffSession?.eventId || selectedEvent?.id;
    if (!eventId) return;

    // Use a local ref or state to track current eventId for the effect
    const currentEventId = String(eventId);

    const loadData = async () => {
      fetchStats(currentEventId);
      
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch(`/api/admin/recent-scans?eventId=${currentEventId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setRecentScans(data.scans || []);
          }
        } catch (err) {
          logger.error('Error fetching recent scans', { error: err });
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [staffSession?.eventId, selectedEvent?.id, fetchStats]);

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessError('');
    setIsVerifyingCode(true);
    try {
      const success = await validateAccessCode(accessCode);
      if (!success) {
        setAccessError('Code invalide ou événement introuvable');
      }
    } catch (err) {
      setAccessError('Erreur de connexion, réessayez');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  useEffect(() => {
    if (scanResult.status === 'valid') {
      setSessionScans(prev => prev + 1);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } else if (scanResult.status) {
      if (navigator.vibrate) navigator.vibrate(500);
    }
  }, [scanResult.status]);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (isScannerActive) {
      const timer = setTimeout(() => {
        const element = document.getElementById('reader');
        if (!element) return;

        try {
          scanner = new Html5QrcodeScanner(
            "reader",
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              videoConstraints: { facingMode: "environment" }
            },
            false
          );

          scanner.render(async (decodedText) => {
            const now = Date.now();
            if (now - lastScanTimeRef.current < 1500) return;
            lastScanTimeRef.current = now;

            let code = decodedText;
            try {
              const data = JSON.parse(decodedText);
              if (data.code) code = data.code;
            } catch (e) {}

            if (scannerRef.current) {
              await scannerRef.current.clear();
            }
            setIsScannerActive(false);
            validateTicket(code);
          }, () => {});
          
          scannerRef.current = scanner;
        } catch (err: any) {
          logger.error("Scanner init error", { error: err.message });
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(err => logger.error("Scanner clear error", { error: err.message }));
        }
      };
    }
  }, [isScannerActive, setIsScannerActive, validateTicket]);

  const totalEntries = adminStats?.checkins || 0;
  const totalCapacity = adminStats?.ticketsSold || 0;
  const progress = totalCapacity > 0 ? (totalEntries / totalCapacity) * 100 : 0;

  if (!staffSession && !useStore.getState().user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] space-y-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 via-emerald-500 to-emerald-500/50" />
          
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-inner">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Session Staff</h2>
            <p className="text-white/40 text-sm font-medium leading-relaxed">
              Entrez le code de session fourni par l'organisateur pour commencer le contrôle des accès.
            </p>
          </div>

          <form onSubmit={handleAccessSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 ml-4">Code de l'événement</label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="XXXX-0000"
                className="w-full bg-white/5 p-6 rounded-[2rem] border border-white/10 text-white text-center text-3xl font-mono tracking-[0.3em] placeholder:text-white/10 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all shadow-inner"
                maxLength={12}
              />
              {accessError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs text-center font-bold flex items-center justify-center gap-2 mt-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {accessError}
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              disabled={accessCode.length < 4 || isVerifyingCode}
              className="w-full bg-emerald-500 text-black h-20 rounded-[2rem] font-black text-lg shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {isVerifyingCode ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>Activer la Session</span>
                  <Plus className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-28 px-2 md:px-0 overflow-x-hidden">
      {/* 1. Zone Supérieure: Contrôle & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Bloc Gauche: Code & Activation */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between space-y-8 relative overflow-hidden">
          {/* Logo en haut à gauche */}
          <div className="absolute top-6 left-8 flex items-center gap-2 opacity-20">
            <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-[10px]">T</span>
            </div>
            <span className="text-[10px] font-black text-white tracking-tighter uppercase">TICKHOST</span>
          </div>

          <div className="space-y-6 pt-8">
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Code d'accès Staff</h3>
              <div className="flex items-center gap-4">
                <h2 className="text-3xl md:text-5xl font-black text-[#FFD700] tracking-[0.1em] uppercase">
                  {(staffSession as any)?.accessCode || selectedEvent?.access_code || 'GALA-2026'}
                </h2>
                <button 
                  onClick={() => selectedEvent && regenerateAccessCode(selectedEvent.id)}
                  className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all group"
                  title="Régénérer le code"
                >
                  <RefreshCw className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                </button>
              </div>
              <p className="text-[9px] text-red-500/80 font-black uppercase tracking-widest leading-relaxed max-w-[280px]">
                Ce code est strictement confidentiel. Partagez-le uniquement avec vos agents de sécurité en service.
              </p>
            </div>

            {/* Zone de Prévisualisation (Cadre sombre) */}
            <div className="aspect-video bg-black rounded-3xl border border-white/5 flex flex-col items-center justify-center relative group overflow-hidden shadow-inner">
              <div className="w-16 h-16 bg-emerald-500/5 rounded-full flex items-center justify-center border border-emerald-500/10 group-hover:scale-110 transition-transform">
                <QrCode className="w-8 h-8 text-emerald-500/20" />
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] animate-pulse">PRÊT POUR LE SCAN</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => setIsScannerActive(true)}
              className="w-full py-6 bg-emerald-500 text-black rounded-full font-black uppercase tracking-widest text-sm shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_20px_40px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <QrCode className="w-6 h-6" />
              Démarrer le Scan Caméra
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 bg-black border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-3"
            >
              <Plus className="w-4 h-4" />
              Importer une photo
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
            </button>
          </div>
        </div>

        {/* Bloc Droite: Live Stats */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-tighter">Live - Entrées ce soir</h3>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Mise à jour en temps réel</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">En direct</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                {totalEntries} <span className="text-xl text-white/20">/ {totalCapacity}</span>
              </h2>
              <span className="text-sm font-black text-white/40">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Agents actifs</p>
                <p className="text-lg font-black text-emerald-500">4</p>
              </div>
            </div>
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Doublons refusés</p>
                <p className="text-lg font-black text-red-500">12</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Journal des Scans */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-white/20" />
            <h3 className="text-lg font-black uppercase tracking-tighter">Journal des Scans</h3>
          </div>
          <button className="text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-colors">Voir tout</button>
        </div>
        
        <div className="divide-y divide-white/5">
          {recentScans.length > 0 ? recentScans.map((scan) => (
            <div key={scan.id} className="px-10 py-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  scan.status === 'used' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                }`}>
                  {scan.status === 'used' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-white group-hover:text-emerald-500 transition-colors">{scan.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{scan.type}</span>
                    <div className="w-1 h-1 bg-white/10 rounded-full" />
                    <span className="text-[10px] font-bold text-white/40">
                      {scan.time ? new Date(scan.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                  scan.status === 'used' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  {scan.status === 'used' ? 'Validé' : 'Dupliqué'}
                </div>
              </div>
            </div>
          )) : (
            <div className="px-10 py-20 text-center text-white/20 font-black uppercase tracking-widest">
              Aucun scan récent
            </div>
          )}
        </div>
      </div>

      {/* Scanner Modal (Overlay) */}
      <AnimatePresence>
        {isScannerActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            <div className="p-8 flex items-center justify-between bg-black/50 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tighter">Scanner Actif</h3>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Positionnez le QR Code</p>
                </div>
              </div>
              <button 
                onClick={() => setIsScannerActive(false)}
                className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
              >
                Fermer
              </button>
            </div>

            <div className="flex-1 relative bg-black flex items-center justify-center">
              <div id="reader" className="w-full h-full max-w-md aspect-square rounded-[3rem] overflow-hidden border-4 border-emerald-500/20 shadow-[0_0_100px_rgba(16,185,129,0.1)]"></div>
              
              {/* Scan Result Overlay */}
              {scanResult.status && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`absolute inset-0 flex flex-col items-center justify-center p-10 text-center z-[110] ${
                    scanResult.status === 'valid' ? 'bg-emerald-500'
                    : (scanResult as any).status === 'client_check' ? 'bg-blue-600'
                    : 'bg-red-600'
                  }`}
                >
                  {scanResult.status === 'valid' ? (
                    <CheckCircle2 className="w-32 h-32 text-white mb-6" />
                  ) : (scanResult as any).status === 'client_check' ? (
                    <CheckCircle2 className="w-32 h-32 text-white mb-6" />
                  ) : (
                    <XCircle className="w-32 h-32 text-white mb-6" />
                  )}
                  <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">{scanResult.message}</h2>
                  {(scanResult as any).status === 'client_check' && (scanResult as any).eventName && (
                    <div className="bg-white/20 rounded-2xl px-6 py-4 mb-6 text-left w-full max-w-xs">
                      <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">Événement</p>
                      <p className="text-white text-lg font-black">{(scanResult as any).eventName}</p>
                      {(scanResult as any).ticketType && (
                        <p className="text-white/70 text-sm mt-1">{(scanResult as any).ticketType}</p>
                      )}
                    </div>
                  )}
                  {scanResult.clientName && <p className="text-xl font-bold text-white/80 mb-10">{scanResult.clientName}</p>}

                  <button
                    onClick={() => setScanResult({ status: null, message: '' })}
                    className="px-12 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all"
                  >
                    {(scanResult as any).status === 'client_check' ? 'Fermer' : 'Continuer le scan'}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
