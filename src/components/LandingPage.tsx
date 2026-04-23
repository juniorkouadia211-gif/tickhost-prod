import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Shield, 
  Globe, 
  BarChart3, 
  Smartphone, 
  Users, 
  ChevronRight, 
  Star, 
  ArrowRight,
  Ticket,
  Layout,
  MousePointerClick,
  QrCode
} from 'lucide-react';
import { useStore } from '../store';

export const LandingPage = () => {
  const { setView, events, fetchEventDetails } = useStore();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 overflow-x-hidden">
      {/* 1. Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
              <Ticket className="text-black w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">TickHost</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-white/40 uppercase tracking-widest">
            <a href="#features" className="hover:text-emerald-500 transition-colors">Features</a>
            <a href="#process" className="hover:text-emerald-500 transition-colors">Process</a>
            <a href="#events" className="hover:text-emerald-500 transition-colors">Événements</a>
            <a href="#demo" className="hover:text-emerald-500 transition-colors">Démo</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('login')}
              className="text-sm font-bold text-white/60 hover:text-white transition-colors uppercase tracking-widest"
            >
              Connexion
            </button>
            <button 
              onClick={() => setView('register')}
              className="bg-emerald-500 text-black px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
            >
              Créer un Event
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full"
          >
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500 text-xs font-black uppercase tracking-[0.2em]">La billetterie nouvelle génération</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9]"
          >
            Vendez vos billets <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">en 60 secondes.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-white/40 text-lg md:text-xl font-medium leading-relaxed"
          >
            Une plateforme ultra-rapide, sécurisée et personnalisable pour vos événements. 
            Pas de frais cachés, juste de la performance.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto bg-white/5 border border-white/10 p-2 rounded-2xl flex items-center gap-4 backdrop-blur-md"
          >
            <div className="flex-1 text-left px-4">
              <span className="text-[10px] text-white/20 font-black uppercase tracking-widest block">Votre URL personnalisée</span>
              <code className="text-emerald-500 font-mono text-lg font-bold">tickhost.com/mon-event</code>
            </div>
            <button 
              onClick={() => setView('register')}
              className="bg-white text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-emerald-500 transition-colors"
            >
              Démarrer
            </button>
          </motion.div>
        </div>
      </section>

      {/* 3. Stats Section */}
      <section className="py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
          {[
            { label: 'Billets Vendus', value: '500K+' },
            { label: 'Événements', value: '1,200+' },
            { label: 'Taux de Scan', value: '99.9%' },
            { label: 'Satisfaction', value: '4.9/5' }
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-2">
              <p className="text-2xl md:text-5xl font-black tracking-tighter text-white">{stat.value}</p>
              <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Process Section */}
      <section id="process" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-6xl font-black uppercase tracking-tighter">Comment ça marche ?</h2>
            <p className="text-white/40 font-medium">Trois étapes simples pour lancer votre billetterie.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Layout, 
                title: 'Créez votre page', 
                desc: 'Personnalisez votre microsite avec vos couleurs, images et informations pratiques.' 
              },
              { 
                icon: MousePointerClick, 
                title: 'Configurez vos billets', 
                desc: 'Définissez vos tarifs, quantités et catégories en quelques clics.' 
              },
              { 
                icon: QrCode, 
                title: 'Scannez et validez', 
                desc: 'Utilisez notre application de scan ultra-rapide pour gérer les entrées le jour J.' 
              }
            ].map((step, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] space-y-6 hover:bg-white/10 transition-colors relative group">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-emerald-500 text-black rounded-full flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20">
                  {i + 1}
                </div>
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <step.icon className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight">{step.title}</h3>
                <p className="text-white/40 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Events Grid Section */}
      <section id="events" className="py-32 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-6xl font-black uppercase tracking-tighter">Événements à la une</h2>
              <p className="text-white/40 font-medium text-lg">Découvrez les meilleures expériences du moment.</p>
            </div>
            <button className="flex items-center gap-2 text-emerald-500 font-black uppercase tracking-widest text-sm hover:translate-x-2 transition-transform">
              Voir tout <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {events.slice(0, 3).map((event) => (
              <div 
                key={event.id} 
                className="group cursor-pointer"
                onClick={() => fetchEventDetails(event.id)}
              >
                <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 mb-6">
                  <img 
                    src={event.image_url || 'https://picsum.photos/seed/event/800/600'} 
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-emerald-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-2">
                      {formatDate(event.event_date)}
                    </div>
                    <h4 className="text-2xl font-black uppercase text-white tracking-tight">{event.name}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-6xl font-black uppercase tracking-tighter">Pourquoi TickHost ?</h2>
            <p className="text-white/40 font-medium">La technologie au service de votre succès.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Sécurité Totale', desc: 'QR Codes cryptés et protection contre la fraude.' },
              { icon: Globe, title: 'Multi-Devises', desc: 'Acceptez les paiements partout dans le monde.' },
              { icon: BarChart3, title: 'Analytics Live', desc: 'Suivez vos ventes et scans en temps réel.' },
              { icon: Smartphone, title: 'Mobile First', desc: 'Une expérience fluide sur tous les supports.' }
            ].map((feat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-4 hover:border-emerald-500/50 transition-colors">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <feat.icon className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight">{feat.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Demo Zone Section */}
      <section id="demo" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[3rem] p-12 md:p-24 relative overflow-hidden shadow-2xl shadow-emerald-500/20">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter leading-none">
                  Prêt à passer <br />au niveau supérieur ?
                </h2>
                <p className="text-black/60 text-lg font-medium leading-relaxed">
                  Rejoignez des centaines d'organisateurs qui nous font confiance pour leurs événements les plus prestigieux.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setView('register')}
                    className="bg-black text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform"
                  >
                    Démarrer maintenant
                  </button>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('events');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-white/20 backdrop-blur-md text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white/30 transition-colors"
                  >
                    Voir les événements
                  </button>
                </div>
              </div>

              <div className="hidden md:block bg-black/10 backdrop-blur-md border border-white/20 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Revenu Total</p>
                      <p className="text-xl font-black text-black tracking-tighter">12,450,000 FCFA</p>
                    </div>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black text-black uppercase tracking-widest">Live</div>
                </div>
                
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black/20 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-black" />
                        </div>
                        <p className="text-sm font-bold text-black/80">Nouvelle vente : VIP</p>
                      </div>
                      <span className="text-xs font-black text-black/40">Il y a 2m</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Testimonials Section */}
      <section className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-6xl font-black uppercase tracking-tighter">Ils nous font confiance</h2>
            <p className="text-white/40 font-medium">Paroles d'organisateurs passionnés.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Koné', role: 'Directrice Event', text: 'TickHost a transformé notre gestion des entrées. Le scan est instantané, même avec une connexion instable.' },
              { name: 'Marc Dubois', role: 'Promoteur Festival', text: 'La personnalisation des microsites est un vrai plus. Nos clients adorent l\'expérience d\'achat fluide.' },
              { name: 'Awa Diop', role: 'Gérante Club', text: 'Le support client est exceptionnel. Une équipe réactive qui comprend les enjeux de l\'événementiel.' }
            ].map((testi, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] space-y-6 relative">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 text-emerald-500 fill-current" />)}
                </div>
                <p className="text-lg text-white/80 leading-relaxed italic">"{testi.text}"</p>
                <div className="flex items-center gap-4 pt-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center font-black text-emerald-500">
                    {testi.name[0]}
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-tight">{testi.name}</p>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">{testi.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Footer Section */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Ticket className="text-black w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase">TickHost</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              La plateforme de billetterie premium pour les événements qui comptent.
            </p>
          </div>

          {[
            { title: 'Produit', links: ['Features', 'Tarifs', 'Sécurité', 'Scan App'] },
            { title: 'Compagnie', links: ['À propos', 'Blog', 'Carrières', 'Contact'] },
            { title: 'Légal', links: ['CGU', 'Confidentialité', 'Cookies', 'Mentions'] }
          ].map((col, i) => (
            <div key={i} className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/20">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a href="#" className="text-sm font-bold text-white/40 hover:text-emerald-500 transition-colors uppercase tracking-widest">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">© 2026 TickHost. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => {
                window.location.href = '/scan';
              }}
              className="text-[10px] text-white/10 hover:text-primary transition-colors font-black uppercase tracking-[0.3em]"
            >
              Espace Staff
            </button>
            <Globe className="w-5 h-5 text-white/20 hover:text-white transition-colors cursor-pointer" />
            <Shield className="w-5 h-5 text-white/20 hover:text-white transition-colors cursor-pointer" />
            <BarChart3 className="w-5 h-5 text-white/20 hover:text-white transition-colors cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
};
