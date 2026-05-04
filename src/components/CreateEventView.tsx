import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, X, Calendar, MapPin, Image as ImageIcon, 
  Upload, Check, Copy, Link, Palette, Globe, 
  ShieldCheck, Smartphone, CreditCard, Eye, 
  Save, Send, Clock, Trash2, Layout, Type, ChevronRight, Ticket,
  Activity, Shirt, DollarSign
} from 'lucide-react';
import { useStore } from '../store';
import { logger } from '../services/logger';

export const CreateEventView = () => {
  const { createEvent, updateEvent, loading, addToast, user, editingEvent, setEditingEvent, fetchSystemSettings, systemSettings } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [createdEventData, setCreatedEventData] = useState<any>(null);

  const initialForm = {
    name: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    maps_link: '',
    category: 'Concert',
    category_other: '',
    organizer_name: '',
    slug: '',
    primary_color: '#10b981',
    bg_type: 'color' as 'color' | 'image',
    bg_image: '',
    bg_intensity: 0.5,
    bg_opacity: 0.8,
    show_logo_instead_of_name: false,
    logo_url_main: '',
    partner_billing_enabled: false,
    poster_image: '',
    support_email: '',
    support_whatsapp: '',
    dress_code: '',
    gallery_images: [] as string[],
    partners: [] as string[],
    gallery_title: 'Photos & Ambiance',
    options: {
      home: true,
      ticketing: true,
      info: true,
      vote: false,
      support: true
    },
    home_options: {
      countdown: true,
      location: true,
      poster: true,
      description: true,
      buy_button: true
    },
    info_options: {
      date_time: true,
      location: true,
      maps: true,
      support: true,
      dress_code: false
    },
    info_sections: [] as { title: string; content: string }[],
    payment_modes: {
      orange: true,
      moov: true,
      mtn: true,
      wave: true
    }
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchSystemSettings();
  }, [fetchSystemSettings]);

  const extraLogoPrice = systemSettings?.extra_logo_price || '2000';
  const freeLogosLimit = parseInt(systemSettings?.free_partner_logos || '3');

  useEffect(() => {
    if (editingEvent) {
      setForm({
        ...initialForm,
        ...(editingEvent as any),
        name: editingEvent.name || '',
        description: editingEvent.description || '',
        event_date: editingEvent.event_date ? editingEvent.event_date.split('T')[0] : '',
        start_time: (editingEvent as any).start_time || '',
        end_time: (editingEvent as any).end_time || '',
        location: editingEvent.location || '',
        maps_link: (editingEvent as any).maps_link || '',
        organizer_name: (editingEvent as any).organizer_name || '',
        slug: editingEvent.slug || '',
        primary_color: editingEvent.primary_color || '#10b981',
        bg_type: editingEvent.bg_type || 'color',
        bg_image: (editingEvent as any).bg_image || '',
        logo_url_main: (editingEvent as any).logo_url_main || '',
        bg_intensity: (editingEvent as any).bg_intensity ?? 0.5,
        bg_opacity: (editingEvent as any).bg_opacity ?? 0.8,
        support_email: (editingEvent as any).support_email || '',
        support_whatsapp: (editingEvent as any).support_whatsapp || '',
        dress_code: (editingEvent as any).dress_code || '',
        category: (editingEvent as any).category || 'Concert',
        category_other: (editingEvent as any).category_other || '',
        options: { ...initialForm.options, ...(editingEvent.options || {}) },
        info_options: { ...initialForm.info_options, ...(editingEvent.info_options || {}) },
        home_options: (editingEvent as any).home_options ? { ...initialForm.home_options, ...(editingEvent as any).home_options } : initialForm.home_options,
        info_sections: Array.isArray(editingEvent.info_sections) ? editingEvent.info_sections : [],
        gallery_images: Array.isArray(editingEvent.gallery_images) ? editingEvent.gallery_images : [],
        partners: Array.isArray(editingEvent.partners) ? editingEvent.partners : [],
        gallery_title: editingEvent.gallery_title || initialForm.gallery_title,
        payment_modes: { ...initialForm.payment_modes, ...(editingEvent.payment_modes || {}) }
      });
      if (editingEvent.ticketTypes && Array.isArray(editingEvent.ticketTypes)) {
        setTicketTypes(editingEvent.ticketTypes.map(tt => ({
          name: tt.name || 'Pass',
          price: tt.price || 0,
          quantity: tt.total_quantity || tt.available_quantity || 0
        })));
      }
      setPosterPreview(editingEvent.image_url || null);
      setBgPreview(editingEvent.bg_image || null);
      setLogoPreview(editingEvent.logo_url_main || null);
    } else {
      setForm(initialForm);
    }
  }, [editingEvent]);

  const [ticketTypes, setTicketTypes] = useState([
    { name: 'Pass Standard', price: 5000, quantity: 100 }
  ]);

  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [pendingPartnerFile, setPendingPartnerFile] = useState<string | null>(null);
  const [isPartnerPaymentProcessing, setIsPartnerPaymentProcessing] = useState(false);
  const [partnerPaymentStep, setPartnerPaymentStep] = useState<'idle' | 'cinetpay' | 'processing'>('idle');

  // Détection automatique des couleurs dominantes d'une image
  const extractDominantColor = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 50; // Réduire pour performance
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('#10b981');
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Calculer la couleur moyenne en ignorant les pixels trop sombres ou trop clairs
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
          if (brightness > 30 && brightness < 220) { // Ignorer noir et blanc
            r += data[i];
            g += data[i+1];
            b += data[i+2];
            count++;
          }
        }
        if (count === 0) return resolve('#10b981');
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Saturer la couleur pour la rendre plus vive
        const max = Math.max(r, g, b);
        const factor = max > 0 ? Math.min(255 / max, 2.5) : 1;
        r = Math.min(255, Math.round(r * factor));
        g = Math.min(255, Math.round(g * factor));
        b = Math.min(255, Math.round(b * factor));

        resolve(`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`);
      };
      img.onerror = () => resolve('#10b981');
      img.src = dataUrl;
    });
  };

  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('error', 'Image trop lourde — maximum 5 Mo');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setPosterPreview(result); // Aperçu local immédiat

        // Détection automatique de la couleur dominante
        try {
          const detectedColor = await extractDominantColor(result);
          setForm(prev => ({ ...prev, primary_color: detectedColor }));
          addToast('success', `Couleur détectée automatiquement ${detectedColor} — tu peux la modifier`);
        } catch { /* ignorer si échec */ }

        // Upload vers le serveur pour éviter le base64 en DB
        try {
          const uploadRes = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: result, filename: file.name }),
          });
          const uploadData = await uploadRes.json();
          if (uploadData.success) {
            setForm(prev => ({ ...prev, poster_image: uploadData.url, image_url: uploadData.url }));
          } else {
            // Fallback base64 si upload échoue
            setForm(prev => ({ ...prev, poster_image: result }));
          }
        } catch {
          setForm(prev => ({ ...prev, poster_image: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBgPreview(result);
        setForm(prev => ({ ...prev, bg_image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setForm(prev => ({ ...prev, logo_url_main: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({
          ...prev,
          gallery_images: [...prev.gallery_images, reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePartnerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const logoData = reader.result as string;
        if (form.partners.length >= freeLogosLimit) {
          setPendingPartnerFile(logoData);
          setShowPartnerModal(true);
        } else {
          setForm(prev => ({
            ...prev,
            partners: [...prev.partners, logoData]
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processPartnerPayment = async () => {
    if (!editingEvent || !pendingPartnerFile) {
      addToast('error', 'Enregistrez d\'abord l\'événement pour ajouter plus de partenaires.');
      return;
    }

    setIsPartnerPaymentProcessing(true);
    setPartnerPaymentStep('cinetpay');

    try {
      // 1. Create Partner Checkout
      const res = await fetch(`/api/events/${editingEvent.id}/partners/checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: 'Partenaire Premium', logo_url: pendingPartnerFile })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 2. Simulate CinetPay Confirmation
      setPartnerPaymentStep('processing');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const webhookRes = await fetch('/api/events/partners/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: data.partnerId, status: 'paid' })
      });

      if (webhookRes.ok) {
        addToast('success', 'Partenaire ajouté avec succès !');
        setForm(prev => ({ ...prev, partners: [...prev.partners, pendingPartnerFile] }));
        setShowPartnerModal(false);
        setPendingPartnerFile(null);
        setPartnerPaymentStep('idle');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Le paiement a échoué');
      setPartnerPaymentStep('idle');
    } finally {
      setIsPartnerPaymentProcessing(false);
    }
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: 0, quantity: 0 }]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((_, i) => i !== index));
    }
  };

  const updateTicketType = (index: number, field: string, value: any) => {
    setTicketTypes(ticketTypes.map((tt, i) => i === index ? { ...tt, [field]: value } : tt));
  };

  const handleSubmit = async (publish: boolean) => {
    if (!form.name || form.name.length < 3) {
      addToast('error', 'Le nom de l\'événement doit faire au moins 3 caractères');
      return;
    }
    if (!form.organizer_name || form.organizer_name.length < 2) {
      addToast('error', 'Le nom de la structure organisatrice est requis (min 2 car.)');
      return;
    }
    if (!form.description || form.description.length < 10) {
      addToast('error', 'La description doit faire au moins 10 caractères');
      return;
    }
    if (!form.event_date) {
      addToast('error', 'La date de l\'événement est requise');
      return;
    }
    if (!form.location || form.location.length < 3) {
      addToast('error', 'Le lieu de l\'événement est requis');
      return;
    }

    const invalidTicket = ticketTypes.find(t => !t.name || t.quantity <= 0);
    if (invalidTicket) {
      addToast('error', 'Veuillez vérifier vos catégories de billets (nom requis et quantité > 0)');
      return;
    }
    
    const eventPayload = {
      ...form,
      image_url: posterPreview || '',
      bg_image: bgPreview || '',
      logo_url_main: logoPreview || '',
      ticketTypes,
      status: publish ? 'published' : (editingEvent?.status || 'draft')
    };

    let success = false;
    if (editingEvent) {
      success = await updateEvent(editingEvent.id, eventPayload);
    } else {
      success = await createEvent(eventPayload);
    }

    if (success) {
      if (publish && !editingEvent) {
        setCreatedEventData(eventPayload);
        setShowSuccess(true);
      } else {
        addToast('success', editingEvent ? 'Événement mis à jour' : 'Brouillon enregistré');
        if (editingEvent) {
          setEditingEvent(null);
          useStore.getState().setView('my-events');
        }
      }
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setTicketTypes([{ name: 'Pass Standard', price: 5000, quantity: 100 }]);
    setPosterPreview(null);
    setBgPreview(null);
    setLogoPreview(null);
    setShowSuccess(false);
    setCreatedEventData(null);
    setEditingEvent(null);
  };

  if (showSuccess && createdEventData) {
    return (
      <div className="w-full min-h-screen bg-[#050505] flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-[3rem] p-12 text-center space-y-8 shadow-2xl"
        >
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <Check className="w-12 h-12 text-emerald-500" />
            </motion.div>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Événement Publié !</h2>
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Félicitations, votre billetterie est en ligne.</p>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-3xl p-8 space-y-6 text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Événement</p>
                <p className="text-lg font-bold text-white">{createdEventData.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Date</p>
                <p className="text-lg font-bold text-white">{createdEventData.event_date}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Lien de votre site</p>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span className="flex-1 text-sm font-mono text-white/60 truncate">{createdEventData.slug}.tickhost.ci</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${createdEventData.slug}.tickhost.ci`);
                    addToast('success', 'Lien copié !');
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <Copy className="w-4 h-4 text-emerald-500" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col gap-4">
            <button 
              onClick={resetForm}
              className="w-full py-6 bg-emerald-500 text-black rounded-[2rem] font-black text-xl uppercase tracking-tighter shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Plus className="w-6 h-6" /> Créer un nouvel événement
            </button>
            <button 
              onClick={() => useStore.getState().setView('my-events')}
              className="w-full py-4 text-white/40 hover:text-white font-bold uppercase tracking-widest text-xs transition-all"
            >
              Aller à mes événements
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white pb-32">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        
        {/* Partie Haute: Identité | Logistique | Billetterie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bloc 1: Identité */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Type className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tighter">Identité</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Nom de la structure organisatrice <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="Ex: EVENT CREW PRODUCTION"
                  value={form.organizer_name}
                  required
                  onChange={e => setForm({...form, organizer_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Nom de l'événement <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="Ex: Gala de Charité 2024"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Slug URL (Lien personnalisé)</label>
                <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-2xl px-5 py-4 focus-within:border-emerald-500 transition-all">
                  <Globe className="w-4 h-4 text-[#FFD700]" />
                  <input 
                    type="text"
                    value={form.slug}
                    onChange={e => setForm({...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')})}
                    className="bg-transparent border-none outline-none text-xs font-mono text-[#FFD700] flex-1"
                    placeholder="mon-evenement-unique"
                  />
                  <span className="text-[10px] font-bold text-white/20">.tickhost.ci</span>
                </div>
                <p className="text-[8px] text-white/30 italic ml-1 font-medium">Ex: concert-ete-2024 (Pas d'espaces). Ce sera votre lien direct.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Catégorie</label>
                  <select 
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all appearance-none text-white"
                  >
                    {['Concert', 'Culture', 'Formation', 'Soirée', 'Tourisme', 'Sport', 'Festival', 'Science', 'Religieux', 'Gastronomie', 'Business', 'Autre'].map(cat => (
                      <option key={cat} value={cat} className="bg-[#0A0A0A]">{cat}</option>
                    ))}
                  </select>
                </div>
                
                {form.category === 'Autre' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Précisez la catégorie</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Mariage, Anniversaire..."
                      value={form.category_other}
                      onChange={e => setForm({...form, category_other: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all" 
                    />
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Décrivez l'expérience..."
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all resize-none" 
                />
              </div>
            </div>
          </div>

          {/* Bloc 2: Logistique */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tighter">Logistique</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Date de l'événement</label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  <input 
                    type="date" 
                    value={form.event_date}
                    onChange={e => setForm({...form, event_date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all text-white/60 [color-scheme:dark]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Heure Début</label>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    <input 
                      type="time" 
                      value={form.start_time}
                      onChange={e => setForm({...form, start_time: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all text-white/90 [color-scheme:dark]" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Heure Fin</label>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    <input 
                      type="time" 
                      value={form.end_time}
                      onChange={e => setForm({...form, end_time: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all text-white/90 [color-scheme:dark]" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Lieu</label>
                <input 
                  type="text" 
                  placeholder="Ex: Palais de la Culture, Abidjan"
                  value={form.location}
                  onChange={e => setForm({...form, location: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Lien Google Maps</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="url" 
                    placeholder="https://goo.gl/maps/..."
                    value={form.maps_link}
                    onChange={e => setForm({...form, maps_link: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bloc 3: Billetterie */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-tighter">Billetterie</h2>
              </div>
              <button 
                onClick={addTicketType}
                className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {ticketTypes.map((tt, i) => (
                <div key={i} className="space-y-3 bg-white/[0.02] border border-white/5 p-4 rounded-2xl relative group">
                  {ticketTypes.length > 1 && (
                    <button 
                      onClick={() => removeTicketType(i)}
                      className="absolute top-2 right-2 p-1 text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-1">Nom</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Pass VIP"
                      value={tt.name}
                      onChange={e => updateTicketType(i, 'name', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:border-emerald-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-1">Prix</label>
                      <input 
                        type="number" 
                        placeholder="5000"
                        value={tt.price || ''}
                        onChange={e => updateTicketType(i, 'price', Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:border-emerald-500 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-1">Qté</label>
                      <input 
                        type="number" 
                        placeholder="100"
                        value={tt.quantity || ''}
                        onChange={e => updateTicketType(i, 'quantity', Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:border-emerald-500 outline-none transition-all" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Partie Basse: Design & Aperçu */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bloc Design */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-10 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Palette className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tighter">Design & Expérience</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Color Picker */}
              <div className="space-y-6">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Couleur de Marque</label>
                <div className="flex flex-col gap-4">
                  <div className="h-32 w-full rounded-2xl relative overflow-hidden bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500">
                    <input 
                      type="color" 
                      value={form.primary_color}
                      onChange={e => setForm({...form, primary_color: e.target.value})}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                      <div className="w-8 h-8 rounded-full border-2 border-white shadow-xl" style={{ backgroundColor: form.primary_color }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-[#FFD700] uppercase">
                      {form.primary_color}
                    </div>
                  </div>
                </div>
              </div>

              {/* Background */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Arrière-plan</label>
                  <button 
                    onClick={() => setForm({...form, bg_type: form.bg_type === 'color' ? 'image' : 'color'})}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${
                      form.bg_type === 'image' ? 'bg-[#FFD700] text-black border-[#FFD700]' : 'bg-white/5 text-white/40 border-white/10'
                    }`}
                  >
                    {form.bg_type === 'image' ? 'Image' : 'Couleur'}
                  </button>
                </div>

                {form.bg_type === 'color' ? (
                  <div className="h-32 w-full rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
                    <div className="w-10 h-10 rounded-xl shadow-lg" style={{ backgroundColor: form.primary_color }} />
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Couleur HEX</p>
                  </div>
                ) : (
                  <div 
                    onClick={() => bgInputRef.current?.click()}
                    className="h-32 w-full rounded-2xl border-2 border-dashed border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden bg-white/[0.02] flex flex-col items-center justify-center gap-2 group"
                  >
                    {bgPreview ? (
                      <img src={bgPreview} alt="BG" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-white/20 group-hover:text-emerald-500" />
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Uploader</p>
                      </>
                    )}
                    <input type="file" ref={bgInputRef} className="hidden" onChange={handleBgUpload} accept="image/*" />
                  </div>
                )}
              </div>
            </div>

            {/* Poster */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Affiche (Poster)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 rounded-[2rem] border-2 border-dashed border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden bg-white/[0.02] flex flex-col items-center justify-center gap-3 group"
                >
                  {posterPreview ? (
                    <img src={posterPreview} alt="Poster" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-white/20 group-hover:text-emerald-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Portrait (1080x1350)</p>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handlePosterUpload} accept="image/*" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Identité visuelle</label>
                  <div className="flex bg-white/5 p-1 rounded-xl">
                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer ${!form.show_logo_instead_of_name ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:text-white'}`}>
                      <input 
                        type="radio" 
                        name="identity-type" 
                        className="hidden" 
                        checked={!form.show_logo_instead_of_name}
                        onChange={() => setForm({...form, show_logo_instead_of_name: false})}
                      />
                      Nom
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer ${form.show_logo_instead_of_name ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:text-white'}`}>
                      <input 
                        type="radio" 
                        name="identity-type" 
                        className="hidden" 
                        checked={form.show_logo_instead_of_name}
                        onChange={() => setForm({...form, show_logo_instead_of_name: true})}
                      />
                      Logo
                    </label>
                  </div>
                </div>

                {form.show_logo_instead_of_name ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => {
                      const el = document.getElementById('logo-upload');
                      el?.click();
                    }}
                    className="w-full h-48 rounded-[2rem] border-2 border-dashed border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden bg-white/[0.02] flex flex-col items-center justify-center gap-3 group"
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-4" />
                    ) : (
                      <>
                        <ShieldCheck className="w-8 h-8 text-white/20 group-hover:text-emerald-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Logo (Fond transparent)</p>
                      </>
                    )}
                    <input id="logo-upload" type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full h-48 rounded-[2rem] bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center p-8 text-center space-y-3"
                  >
                    <Type className="w-10 h-10 text-emerald-500 opacity-20" />
                    <p className="text-sm font-black uppercase tracking-tighter italic text-white/60">
                      {form.name || 'Nom de l\'événement'}
                    </p>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Affichage textuel activé</p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Intensité & Opacité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Intensité du Halo</label>
                  <span className="text-[10px] font-black text-primary italic">{(form.bg_intensity * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.1"
                  value={form.bg_intensity}
                  onChange={e => setForm({...form, bg_intensity: parseFloat(e.target.value)})}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary" 
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Opacité du fond</label>
                  <span className="text-[10px] font-black text-primary italic">{(form.bg_opacity * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.1"
                  value={form.bg_opacity}
                  onChange={e => setForm({...form, bg_opacity: parseFloat(e.target.value)})}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary" 
                />
              </div>
            </div>

            {/* Modules du site & Expérience Client */}
            <div className="space-y-8">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Configuration des Modules Site Client</label>
              
              <div className="space-y-6">
                {/* Module: Accueil */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <Layout className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-bold text-white/60">Module Accueil</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={form.options.home} 
                        onChange={e => setForm({...form, options: {...form.options, home: e.target.checked}})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <AnimatePresence>
                    {form.options.home && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-6 border-l-2 border-emerald-500/20 space-y-6 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {[
                            { id: 'countdown', label: 'Compte à rebours' },
                            { id: 'location', label: 'Lieu & GPS' },
                            { id: 'poster', label: 'Affichage Affiche' },
                            { id: 'description', label: 'Texte Description' },
                            { id: 'buy_button', label: 'Bouton Acheter (Pulse)' }
                          ].map((sub) => (
                            <label key={sub.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl cursor-pointer group">
                              <span className="text-[10px] font-black text-white/40 group-hover:text-white/60 transition-colors uppercase tracking-widest">{sub.label}</span>
                              <input 
                                type="checkbox" 
                                checked={!!(form.home_options as any)?.[sub.id]}
                                onChange={e => setForm({
                                  ...form, 
                                  home_options: {
                                    ...((form.home_options as any) || {}),
                                    [sub.id]: e.target.checked
                                  }
                                })}
                                className="w-4 h-4 rounded border-white/10 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                              />
                            </label>
                          ))}
                        </div>

                        {/* Slider Images Accueil */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Slider d'images Ambiance</label>
                            <button 
                              onClick={() => galleryInputRef.current?.click()}
                              className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                            >
                              + Ajouter une photo
                            </button>
                            <input type="file" ref={galleryInputRef} className="hidden" onChange={handleGalleryUpload} accept="image/*" />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Titre du Slider</label>
                            <input 
                              type="text" 
                              placeholder="Ex: Photos & Ambiance"
                              value={form.gallery_title}
                              onChange={e => setForm({...form, gallery_title: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold focus:border-emerald-500 outline-none transition-all" 
                            />
                          </div>
                          
                          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {(Array.isArray(form.gallery_images) ? form.gallery_images : []).length === 0 && (
                              <div className="w-full py-10 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/20">
                                <ImageIcon className="w-8 h-8 opacity-20" />
                                <p className="text-[10px] uppercase font-black tracking-widest">Aucune image ajoutée</p>
                              </div>
                            )}
                            {(Array.isArray(form.gallery_images) ? form.gallery_images : []).map((img, i) => (
                              <div key={i} className="relative flex-none w-32 aspect-square rounded-xl overflow-hidden border border-white/10 group">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => setForm(prev => ({ ...prev, gallery_images: prev.gallery_images.filter((_, idx) => idx !== i) }))}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Module: Partenaires */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-emerald-500" />
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Logos Partenaires</label>
                    </div>
                    <button 
                      onClick={() => {
                        const count = form.partners.length;
                        if (count >= freeLogosLimit && !editingEvent) {
                          addToast('info', `Enregistrez votre événement pour pouvoir ajouter des partenaires premium (payants).`);
                          return;
                        }
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => handlePartnerUpload(e);
                        input.click();
                      }}
                      className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all border border-emerald-500/20 flex items-center gap-2 relative overflow-hidden"
                    >
                      <Plus className="w-4 h-4" /> 
                      {form.partners.length >= freeLogosLimit ? 'Débloquer Premium' : 'Ajouter un partenaire'}
                      {form.partners.length >= freeLogosLimit && (
                        <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                      )}
                    </button>
                    {form.partners.length >= freeLogosLimit && (
                      <p className="text-[8px] font-black text-primary uppercase tracking-widest animate-bounce">Option Premium Requise ✨</p>
                    )}
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {form.partners.length === 0 && (
                      <div className="w-full py-6 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/20">
                        <p className="text-[10px] uppercase font-black tracking-widest">Aucun partenaire ajouté</p>
                      </div>
                    )}
                    {form.partners.map((img, i) => (
                      <div key={i} className="relative flex-none w-24 h-16 rounded-xl overflow-hidden border border-white/10 group bg-white/5 p-2">
                        <img src={img} alt="" className="w-full h-full object-contain" />
                        <button 
                          onClick={() => setForm(prev => ({ ...prev, partners: prev.partners.filter((_, idx) => idx !== i) }))}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {i >= 3 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-orange-500 text-[6px] font-black text-center py-0.5 text-black uppercase">Option Payante</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Module: Billetterie */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Ticket className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-white/60">Onglet Billetterie</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.options.ticketing} 
                      onChange={e => setForm({...form, options: {...form.options, ticketing: e.target.checked}})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Module: Infos Pratiques (Hiérarchique) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-bold text-white/60">Infos Pratiques</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={form.options.info} 
                        onChange={e => setForm({...form, options: {...form.options, info: e.target.checked}})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <AnimatePresence>
                    {form.options.info && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-6 border-l-2 border-emerald-500/20 space-y-4 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 gap-3 pt-2">
                          {[
                            { id: 'date_time', label: 'Date et Horaires' },
                            { id: 'location', label: 'Lieu' },
                            { id: 'maps', label: 'Lien Google Maps' },
                            { id: 'dress_code', label: 'Dress Code' }
                          ].map((sub) => (
                            <label key={sub.id} className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={(form.info_options as any)[sub.id]}
                                onChange={e => setForm({...form, info_options: {...form.info_options, [sub.id]: e.target.checked}})}
                                className="w-4 h-4 rounded border-white/10 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span className="text-xs font-bold text-white/40 group-hover:text-white/60 transition-colors">{sub.label}</span>
                            </label>
                          ))}
                        </div>

                        {form.info_options.dress_code && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pt-2"
                          >
                            <input 
                              type="text" 
                              placeholder="Précisez le Dress Code (ex: Tout en Blanc)"
                              value={form.dress_code}
                              onChange={e => setForm({...form, dress_code: e.target.value})}
                              className="w-full bg-black border border-emerald-500/20 rounded-xl px-4 py-2 text-xs font-bold focus:border-emerald-500 outline-none transition-all" 
                            />
                          </motion.div>
                        )}

                        {/* Support Client (Sous-section) */}
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                            <span className="text-xs font-bold text-white/40">Support Client</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={form.info_options.support} 
                                onChange={e => setForm({...form, info_options: {...form.info_options, support: e.target.checked}})}
                                className="sr-only peer" 
                              />
                              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                          </div>
                          
                          {form.info_options.support && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="grid grid-cols-1 gap-3 pl-4"
                            >
                              <input 
                                type="email" 
                                placeholder="Email de support"
                                value={form.support_email}
                                onChange={e => setForm({...form, support_email: e.target.value})}
                                className="w-full bg-black border border-emerald-500/20 rounded-xl px-4 py-2 text-xs font-bold focus:border-emerald-500 outline-none transition-all" 
                              />
                              <input 
                                type="text" 
                                placeholder="WhatsApp (ex: +225...)"
                                value={form.support_whatsapp}
                                onChange={e => setForm({...form, support_whatsapp: e.target.value})}
                                className="w-full bg-black border border-emerald-500/20 rounded-xl px-4 py-2 text-xs font-bold focus:border-emerald-500 outline-none transition-all" 
                              />
                            </motion.div>
                          )}
                        </div>

                        {/* Sections d'infos personnalisées */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Champs Personnalisés</span>
                            <button 
                              onClick={() => setForm(prev => ({ ...prev, info_sections: [...prev.info_sections, { title: '', content: '' }] }))}
                              className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Ajouter une info
                            </button>
                          </div>

                          {form.info_sections?.map((section, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/10 relative group"
                            >
                              <button 
                                onClick={() => setForm(prev => ({ ...prev, info_sections: prev.info_sections.filter((_, i) => i !== idx) }))}
                                className="absolute top-2 right-2 text-white/20 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <input 
                                type="text" 
                                placeholder="Titre (ex: Parking)"
                                value={section.title}
                                onChange={e => {
                                  const newSections = [...form.info_sections];
                                  newSections[idx].title = e.target.value;
                                  setForm({...form, info_sections: newSections});
                                }}
                                className="w-full bg-transparent border-b border-white/10 py-1 text-xs font-bold text-white outline-none focus:border-emerald-500" 
                              />
                              <textarea 
                                placeholder="Contenu de l'information..."
                                value={section.content}
                                onChange={e => {
                                  const newSections = [...form.info_sections];
                                  newSections[idx].content = e.target.value;
                                  setForm({...form, info_sections: newSections});
                                }}
                                className="w-full bg-transparent py-1 text-xs font-medium text-white/60 outline-none resize-none h-16" 
                              />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Module: Vote Live */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-white/60">Module Vote Live</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.options.vote} 
                      onChange={e => setForm({...form, options: {...form.options, vote: e.target.checked}})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Bloc Aperçu */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-emerald-500" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest">Aperçu Client</h2>
            </div>

            <div className="relative w-full aspect-[9/19] max-w-[300px] mx-auto bg-[#0A0A0A] rounded-[3rem] border-[8px] border-[#1A1A1A] shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#1A1A1A] rounded-b-xl z-50" />
              
              <div 
                className="absolute inset-0 flex flex-col transition-all duration-500"
                style={{ 
                  backgroundColor: '#050505',
                  '--primary-glow': form.primary_color,
                  '--halo-intensity': form.bg_intensity,
                  '--bg-opacity': form.bg_opacity
                } as any}
              >
                {/* Immersive radial gradient mesh */}
                <div 
                  className="absolute inset-0 pointer-events-none transition-all duration-700"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${form.primary_color}1a 0%, transparent 100%)`,
                    opacity: form.bg_intensity
                  }}
                />
                <div 
                  className="absolute inset-0 pointer-events-none transition-all duration-700 blur-[100px]"
                  style={{
                    background: `radial-gradient(circle at -10% -10%, ${form.primary_color}2b 0%, transparent 60%), radial-gradient(circle at 110% 110%, ${form.primary_color}2b 0%, transparent 60%)`,
                    opacity: form.bg_intensity
                  }}
                />

                <div className="relative flex-1 flex flex-col p-5 pt-12 space-y-5 overflow-y-auto no-scrollbar">
                  {/* Top Bar / Identity */}
                  <div className="flex items-center justify-center w-full mb-4">
                    {form.show_logo_instead_of_name && logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="h-8 object-contain" />
                    ) : (
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: form.primary_color }}>
                            <Ticket className="w-3 h-3 text-black" />
                          </div>
                          <span className="text-[12px] font-black uppercase tracking-tighter text-white truncate max-w-[120px]">
                            {form.name || 'ÉVÉNEMENT'}
                          </span>
                      </div>
                    )}
                  </div>

                  {/* Countdown Preview */}
                  {form.home_options.countdown && (
                    <div className="flex flex-col items-center gap-2 py-4 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-1/2 bg-white/[0.02]" />
                      <div className="flex items-center gap-3 relative z-10">
                        {form.home_options.location && (
                          <MapPin className="w-2.5 h-2.5 text-primary" />
                        )}
                        <div className="flex items-center gap-1.5">
                          {[32, 14, 25].map((val, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <div className="bg-black border border-white/10 rounded-lg w-7 h-7 flex items-center justify-center">
                                <span className="text-[10px] font-black text-white">{val}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {form.home_options.countdown && (
                          <Calendar className="w-2.5 h-2.5 text-primary" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Poster Preview */}
                  {form.home_options.poster && (
                    <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/5 relative group organic-glow">
                      {posterPreview ? (
                        <img src={posterPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-white/10" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 space-y-2 organic-glow">
                    <h3 className="text-[10px] font-black text-white truncate">{form.name || 'Titre'}</h3>
                    <div className="flex items-center gap-2 text-[8px] text-white/60">
                      <Calendar className="w-2.5 h-2.5 text-primary/60" />
                      <span>{form.event_date || 'À venir'}</span>
                    </div>
                    {form.home_options.description && form.description && (
                      <p className="text-[7px] text-white/30 line-clamp-2 italic font-medium">{form.description}</p>
                    )}
                  </div>

                  {/* Buy Button Preview */}
                  {form.home_options.buy_button && (
                    <button 
                      className="w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg border-2 border-white/10"
                      style={{ backgroundColor: form.primary_color, color: '#000' }}
                    >
                      Prendre mes places
                    </button>
                  )}

                  {/* Partners Preview */}
                  {form.partners.length > 0 && (
                    <div className="py-4 border-t border-white/5 space-y-3">
                      <p className="text-[6px] font-black uppercase text-center text-white/20">Partenaires</p>
                      <div className="flex flex-wrap justify-center gap-4">
                        {form.partners.map((p, i) => (
                          <img key={i} src={p} className="h-4 w-auto object-contain opacity-40" alt="" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Partenaire Premium */}
      <AnimatePresence>
        {showPartnerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPartnerModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-10 overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowPartnerModal(false)} className="text-white/20 hover:text-white transition-colors">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="space-y-8 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] border border-primary/20">
                  <ShieldCheck className="w-10 h-10 text-primary" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">
                    {partnerPaymentStep === 'idle' ? 'Option Premium Pub' : partnerPaymentStep === 'cinetpay' ? 'Paiement CinetPay' : 'Traitement...'}
                  </h2>
                  <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
                    {partnerPaymentStep === 'idle' ? 'Limite atteinte - Offre exclusive' : 'Transaction sécurisée'}
                  </p>
                </div>

                {partnerPaymentStep === 'idle' && (
                  <p className="text-white/60 leading-relaxed font-medium">
                    Les {freeLogosLimit} premiers partenaires sont offerts. Pour en ajouter d'autres, passez à l'option <span className="text-primary font-bold">Premium Publicité</span> ({extraLogoPrice} FCFA/logo supplémentaire) pour une visibilité accrue.
                  </p>
                )}

                {partnerPaymentStep === 'cinetpay' && (
                  <div className="bg-white p-6 rounded-3xl text-slate-900 text-left space-y-4 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                       <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Total à payer</span>
                       <span className="text-xl font-black text-emerald-600">{extraLogoPrice} FCFA</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Article</p>
                      <p className="font-bold text-sm">Logo Partenaire Supplémentaire</p>
                    </div>
                  </div>
                )}

                {partnerPaymentStep === 'processing' && (
                  <div className="py-10 flex flex-col items-center gap-6">
                    <Activity className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-xs font-black text-white animate-pulse uppercase tracking-widest">Confirmation Orange/Wave en cours...</p>
                  </div>
                )}

                <div className="pt-4 flex flex-col gap-3">
                  {partnerPaymentStep === 'idle' && (
                    <button 
                      onClick={processPartnerPayment}
                      disabled={isPartnerPaymentProcessing}
                      className="w-full py-5 bg-primary text-black rounded-2xl font-black uppercase tracking-tighter text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      {isPartnerPaymentProcessing ? <Activity className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      Accepter & Payer ({extraLogoPrice} FCFA)
                    </button>
                  )}
                  {partnerPaymentStep === 'cinetpay' && (
                    <button 
                      onClick={processPartnerPayment}
                      className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl hover:bg-slate-800 transition-all"
                    >
                      Confirmer sur mon téléphone
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setShowPartnerModal(false);
                      setPartnerPaymentStep('idle');
                      setPendingPartnerFile(null);
                    }}
                    className="w-full py-4 text-white/40 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Fixe */}
      <div 
        className="fixed bottom-0 left-0 lg:left-64 right-0 bg-[#050505]/95 backdrop-blur-2xl border-t border-white/10 px-4 lg:px-10 flex flex-col md:flex-row items-center justify-between z-[60] gap-3 py-3 lg:py-0 lg:h-24"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
      >
        <div className="hidden md:flex items-center gap-3">
          <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-pulse" />
          <p className="text-[10px] font-bold text-[#FFD700]/80 uppercase tracking-widest">
            Disponible sur <span className="underline">{form.slug || 'slug'}.tickhost.ci</span>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button 
            onClick={() => handleSubmit(false)}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            <Save className="w-4 h-4" /> Brouillon
          </button>
          <button 
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-emerald-500/30 disabled:opacity-50"
          >
            {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {editingEvent ? 'Mettre à jour' : 'Publier'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
