import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  ChevronRight, 
  Ticket, 
  Users, 
  ShieldCheck, 
  Activity,
  Tag
} from 'lucide-react';
import { useStore } from '../store';

export const CheckoutFlow = () => {
  const { 
    cart, 
    user, 
    setView, 
    setCart, 
    setOrderResult, 
    setMyTickets,
    fetchMyTickets,
    fetchStats,
    paymentProcessing,
    setPaymentProcessing,
    addToast,
    selectedEvent,
    applyPromoCode
  } = useStore();

  const [userInfo, setUserInfo] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    operator: '',
    phoneNumber: ''
  });

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = appliedPromo ? Math.floor(subtotal * (appliedPromo.reduction_percent / 100)) : 0;
  const totalAmount = subtotal - discountAmount;

  const [paymentStep, setPaymentStep] = useState<'form' | 'summary' | 'cinetpay' | 'processing' | 'success'>('form');
  const [orderData, setOrderData] = useState<any>(null);

  const handleApplyPromo = async () => {
    if (!promoCode || !selectedEvent) return;
    setIsValidatingPromo(true);
    try {
      const res = await applyPromoCode(selectedEvent.id, promoCode);
      if (res.success) {
        setAppliedPromo(res.promo);
        addToast('success', `Code promo appliqué : -${res.promo.reduction_percent}%`);
      } else {
        addToast('error', res.error || 'Code promo invalide');
        setAppliedPromo(null);
      }
    } catch (err) {
      addToast('error', 'Erreur de validation');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentStep === 'form') {
      setPaymentStep('summary');
      return;
    }
    
    setPaymentProcessing(true);

    try {
      // 1. Create Order (Pending)
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userInfo.name,
          userEmail: userInfo.email,
          userPhone: userInfo.phoneNumber,
          operator: userInfo.operator,
          phoneNumber: userInfo.phoneNumber,
          items: cart,
          totalAmount,
          promoCodeId: appliedPromo?.id || null,
          discountAmount
        })
      });
      
      const data = await orderRes.json();
      if (!orderRes.ok) throw new Error(data.error || 'Erreur lors de la commande');

      setOrderData(data);
      setPaymentStep('cinetpay');
      addToast('info', 'Commande créée, procédez au paiement');
    } catch (err: any) {
      addToast('error', err.message || 'Erreur lors de la commande');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const confirmCinetPay = async () => {
    setPaymentProcessing(true);
    setPaymentStep('processing');

    try {
      // Simulation du délai de traitement CinetPay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Appel du Webhook (Simulation)
      const webhookRes = await fetch('/api/payments/webhook/cinetpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          transactionId: orderData.transactionId,
          status: 'paid'
        })
      });

      const webhookData = await webhookRes.json();
      if (!webhookRes.ok || !webhookData.success) {
        throw new Error(webhookData.message || 'Le paiement a échoué ou a expiré');
      }

      // 4. Succès
      addToast('success', 'Paiement réussi ! Vos billets sont prêts.');
      setOrderResult({ orderId: orderData.orderId, tickets: webhookData.tickets });
      setMyTickets(webhookData.tickets);
      setView('my-tickets');
      setCart([]);
      setPaymentStep('form');
      fetchStats();
      if (user) fetchMyTickets(user.token);

      // Notification navigateur pour l'organisateur (si permission accordée)
      if ('Notification' in window && Notification.permission === 'granted' && selectedEvent) {
        new Notification(`🎟️ Nouveau billet vendu — ${selectedEvent.name}`, {
          body: `Un billet vient d'être acheté. Consulte ton dashboard pour les détails.`,
          icon: selectedEvent.image_url || '/favicon.ico',
          tag: `sale-${orderData.orderId}`,
          requireInteraction: false
        });
      }
    } catch (err: any) {
      addToast('error', err.message);
      setPaymentStep('form');
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Finaliser la commande</h2>
        <p className="text-white/40">Entrez vos informations pour recevoir vos billets</p>
      </div>

      <form onSubmit={handlePayment} className="space-y-6">
        {paymentStep === 'form' && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/60">Nom complet</label>
                <input 
                  required
                  type="text" 
                  value={userInfo.name}
                  onChange={e => setUserInfo({...userInfo, name: e.target.value})}
                  placeholder="Jean Dupont"
                  className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/60">Email</label>
                <input 
                  required
                  type="email" 
                  value={userInfo.email}
                  onChange={e => setUserInfo({...userInfo, email: e.target.value})}
                  placeholder="jean@example.com"
                  className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              
              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <CreditCard className="w-5 h-5" />
                  <h3 className="font-bold">Paiement Mobile Money</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-white/60">Opérateur</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Orange', 'MTN', 'Moov', 'Wave'].map(op => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setUserInfo({...userInfo, operator: op})}
                        className={`p-3 rounded-xl border transition-all font-bold text-sm ${
                          userInfo.operator === op 
                            ? 'bg-primary/20 border-primary text-primary' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white/60">Numéro de paiement</label>
                  <input 
                    required
                    type="tel" 
                    value={userInfo.phoneNumber}
                    onChange={e => setUserInfo({...userInfo, phoneNumber: e.target.value})}
                    placeholder="07 00 00 00 00"
                    className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={!userInfo.operator || !userInfo.name || !userInfo.email || !userInfo.phoneNumber}
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary/80 text-white p-5 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.02] transition-all"
            >
              <ChevronRight className="w-6 h-6" />
              <span>Voir le résumé</span>
            </button>
          </>
        )}

        {paymentStep === 'summary' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-white/80 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  Détails de la commande
                </h3>
                {cart.map(item => (
                  <div key={item.ticketTypeId} className="flex justify-between text-sm">
                    <span className="text-white/40">{item.quantity}x {item.ticketTypeName}</span>
                    <span className="font-bold text-white">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <h3 className="font-bold text-white/80 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Informations client
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-white/20 uppercase font-bold tracking-widest mb-1">Nom</p>
                    <p className="text-white font-medium">{userInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-white/20 uppercase font-bold tracking-widest mb-1">Email</p>
                    <p className="text-white font-medium truncate">{userInfo.email}</p>
                  </div>
                  <div>
                    <p className="text-white/20 uppercase font-bold tracking-widest mb-1">Paiement</p>
                    <p className="text-white font-medium">{userInfo.operator}</p>
                  </div>
                  <div>
                    <p className="text-white/20 uppercase font-bold tracking-widest mb-1">Numéro</p>
                    <p className="text-white font-medium">{userInfo.phoneNumber}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg text-white/60">Total à payer</span>
                  <div className="text-right">
                    {appliedPromo && (
                      <div className="flex flex-col items-end">
                        <span className="text-sm line-through text-white/40">{subtotal.toLocaleString()} FCFA</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-emerald-500 uppercase">-{appliedPromo.reduction_percent}%</span>
                          <span className="font-bold text-3xl text-primary">{totalAmount.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    )}
                    {!appliedPromo && <span className="font-bold text-3xl text-primary">{totalAmount.toLocaleString()} FCFA</span>}
                  </div>
                </div>

                {!appliedPromo && (
                  <div className="flex gap-2 w-full">
                    <input 
                      type="text" 
                      placeholder="Code Promo ?"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white uppercase outline-none focus:border-primary transition-all"
                    />
                    <button 
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={!promoCode || isValidatingPromo}
                      className="flex-shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {isValidatingPromo ? '...' : 'Appliquer'}
                    </button>
                  </div>
                )}
                {appliedPromo && (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{appliedPromo.code} appliqué</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAppliedPromo(null)}
                      className="text-[10px] font-black text-emerald-500/40 hover:text-red-500 uppercase tracking-widest"
                    >
                      Retirer
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setPaymentStep('form')}
                className="flex-1 bg-white/5 text-white/60 p-5 rounded-2xl font-bold border border-white/10 hover:bg-white/10 transition-all"
              >
                Modifier
              </button>
              <button 
                type="submit"
                className="flex-[2] bg-gradient-to-r from-primary to-primary/80 text-white p-5 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
              >
                <ShieldCheck className="w-6 h-6" />
                <span>Confirmer et Payer</span>
              </button>
            </div>
          </motion.div>
        )}

        {paymentStep === 'cinetpay' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-2xl space-y-8 text-slate-900"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#f97316] rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-xs">CP</span>
                </div>
                <span className="font-black text-slate-800 text-lg tracking-tight">CinetPay</span>
                <span className="text-[9px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-black uppercase">Mode Test</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black tracking-tighter text-slate-400">Montant à payer</p>
                <p className="text-xl font-black text-primary">{totalAmount.toLocaleString()} FCFA</p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-100">
                  <span className="font-black text-slate-400 text-xs">{userInfo.operator.substring(0, 3).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400">Mode de paiement</p>
                  <p className="font-bold text-slate-700">{userInfo.operator} Money</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-400">Numéro de téléphone</p>
                <p className="font-mono text-lg font-bold text-slate-700">{userInfo.phoneNumber}</p>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                type="button"
                onClick={confirmCinetPay}
                disabled={paymentProcessing}
                className="w-full bg-slate-900 text-white p-5 rounded-2xl font-bold text-lg shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
              >
                {paymentProcessing ? (
                  <Activity className="w-6 h-6 animate-spin" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
                <span>Valider le paiement</span>
              </button>
              <p className="text-center text-[10px] text-slate-400 font-medium">
                Transaction sécurisée par CinetPay. ID: {orderData?.transactionId}
              </p>
            </div>
          </motion.div>
        )}

        {paymentStep === 'processing' && (
          <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Confirmation en cours</h3>
              <p className="text-white/40">Veuillez confirmer la transaction sur votre téléphone ({userInfo.operator})...</p>
              <p className="text-[10px] text-white/20 italic">Ne fermez pas cette fenêtre</p>
            </div>
          </div>
        )}
      </form>
    </motion.div>
  );
};
