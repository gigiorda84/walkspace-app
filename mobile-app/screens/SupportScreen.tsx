import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const SupportScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState('');
  const [subscribeToNewsletter, setSubscribeToNewsletter] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = subscribeToNewsletter || feedback.trim().length > 0;
  const needsEmail = subscribeToNewsletter && !email.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;
    if (needsEmail) {
      setErrorMessage('Email richiesta per iscriversi alla newsletter');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim() || undefined,
          name: name.trim() || undefined,
          feedback: feedback.trim() || undefined,
          subscribeToNewsletter,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Errore durante l\'invio');
      }

      setSubmitStatus('success');
      setEmail('');
      setName('');
      setFeedback('');
      setSubscribeToNewsletter(false);
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Errore durante l\'invio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-purple">
      <header className="flex items-center p-4">
        <button
          onClick={() => navigate('/discovery')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center font-bold text-lg pr-10">Segui le Bandite</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-2">
          <div
            className="w-full aspect-[4/3] rounded-3xl bg-cover bg-center shadow-2xl"
            style={{ backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuA3SNOxWOJu3g3qm20YkFV7oO2pMklBFyNf62MGIUYo_DOIPhmqhkpE-NG4LEV-EYqysDpiEzDbBWNDNQkC2JCjt8FOmgcVYF-Q75f4zhV3gAHnr2OA0pVZdyk70r2R77B4EmUhf_OwShIH8ijqCWg4Nv4v4bXUsIBIid_N3ua7PHfxeZBVaZ8ijpemKJ-tmNJan_WJYA2yRZ2df9rzv4doH7-Z7yIui-WVfjp1BRrUuoLiboRfIc7-O0tS2Atwfh5bUvde549e9ib8)' }}
          >
            <div className="w-full h-full bg-gradient-to-t from-brand-purple/80 via-transparent to-transparent rounded-3xl" />
          </div>
        </div>

        <div className="flex flex-col items-center px-6 text-center">
          <h2 className="text-4xl font-bold leading-tight pt-4">
            Il viaggio non finisce <span className="text-brand-yellow">qui.</span>
          </h2>
          <p className="text-brand-muted text-base leading-relaxed pt-4 pb-6 max-w-sm">
            Unisciti alla ribellione. Segui il nostro progetto, condividi la tua avventura e aiutaci a creare nuove storie.
          </p>

          {/* Newsletter & Feedback Form */}
          <div className="w-full max-w-sm pb-6">
            {submitStatus === 'success' ? (
              <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-4 text-center">
                <span className="material-symbols-outlined text-green-400 text-3xl">check_circle</span>
                <p className="text-green-400 mt-2 font-medium">Grazie per il tuo messaggio!</p>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="mt-3 text-sm text-brand-muted underline"
                >
                  Invia un altro messaggio
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-brand-muted focus:outline-none focus:border-brand-yellow/50"
                />
                <input
                  type="text"
                  placeholder="Nome (opzionale)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-brand-muted focus:outline-none focus:border-brand-yellow/50"
                />
                <textarea
                  placeholder="Il tuo feedback (opzionale)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-brand-muted focus:outline-none focus:border-brand-yellow/50 resize-none"
                />

                <label className="flex items-center gap-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subscribeToNewsletter}
                    onChange={(e) => setSubscribeToNewsletter(e.target.checked)}
                    className="w-5 h-5 rounded border-white/30 bg-white/5 text-brand-yellow focus:ring-brand-yellow/50"
                  />
                  <span className="text-sm text-brand-muted text-left">
                    Iscrivimi alla newsletter per aggiornamenti sui nuovi percorsi
                  </span>
                </label>

                {errorMessage && (
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="w-full h-12 bg-brand-yellow rounded-xl text-brand-purple font-bold shadow-[0_3px_0_0_#b48200] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Invio...' : 'Invia'}
                </button>
              </form>
            )}
          </div>

          {/* Social Links */}
          <div className="w-full max-w-sm space-y-4 pb-12">
            <div className="grid grid-cols-2 gap-4">
              <button className="h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-brand-muted">chat</span>
                WhatsApp
              </button>
              <button className="h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-brand-muted">camera</span>
                Instagram
              </button>
            </div>

            <button className="w-full h-14 border-2 border-brand-orange text-brand-orange rounded-2xl font-bold text-base hover:bg-brand-orange hover:text-white transition-all">
              Fai una donazione
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupportScreen;
