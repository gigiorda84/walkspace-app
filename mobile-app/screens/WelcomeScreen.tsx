
import React, { useState } from 'react';
import { User } from '../types';

interface WelcomeScreenProps {
  onLogin: (user: User) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('');
  const [mailingList, setMailingList] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      onLogin({ name, email, language, mailingList, isLoggedIn: true });
    }
  };

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center p-6 bg-brand-purple">
      {/* Background with Grid Image */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <img 
          className="h-full w-full object-cover grayscale" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVpSYrPuBCDcghWiWxj89h3HmC_j9yyT9DKCS-mt6-xLZ-szChejIHoi61lguYt6JC03MXABAOi05k672DC_JtC2IrzjbTtjZAGgGNJpBl6Q3qGPwx52hePcBgtzEvOrioA-Zd4ZL9hzIlu17toW-rmT7aO3tRU3BDLNHG5owBuFyvge8imLKu5LtEBYPCjzIGypf577YJt81DBqOeT4R6-svc3WXAKktChDBRWvDW3NfXJ2a8OkGLHEd5IltsbUUjhj-JwIYmd6WH"
          alt="grid"
        />
      </div>

      <main className="relative z-10 w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className="material-symbols-outlined text-brand-yellow text-4xl">headphones</span>
          <h1 className="text-3xl font-bold tracking-tight text-brand-cream">Sonic Walkscape</h1>
        </div>

        <div className="w-full rounded-3xl bg-brand-surface-purple/80 p-8 shadow-2xl backdrop-blur-xl border border-white/5">
          <div className="text-center mb-8">
            <h2 className="text-brand-cream tracking-tight text-2xl font-bold leading-tight">Inizia il tuo viaggio</h2>
            <p className="text-brand-muted text-base pt-2">Prepariamoci per la tua prima passeggiata audio immersiva.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="flex flex-col">
              <span className="text-brand-cream text-xs font-semibold tracking-wide uppercase pb-2 pl-1">Nome</span>
              <input 
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="rounded-xl border border-brand-border-purple bg-brand-dark h-14 placeholder:text-brand-muted/50 p-4 text-base transition-all focus:ring-2 focus:ring-brand-orange focus:outline-none" 
                placeholder="Il tuo nome" 
              />
            </label>

            <label className="flex flex-col">
              <span className="text-brand-cream text-xs font-semibold tracking-wide uppercase pb-2 pl-1">Email</span>
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="rounded-xl border border-brand-border-purple bg-brand-dark h-14 placeholder:text-brand-muted/50 p-4 text-base transition-all focus:ring-2 focus:ring-brand-orange focus:outline-none" 
                placeholder="Il tuo indirizzo email" 
              />
            </label>

            <label className="flex flex-col">
              <span className="text-brand-cream text-xs font-semibold tracking-wide uppercase pb-2 pl-1">Lingua</span>
              <select 
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="rounded-xl border border-brand-border-purple bg-brand-dark h-14 px-4 py-0 text-base transition-all focus:ring-2 focus:ring-brand-orange focus:outline-none appearance-none"
              >
                <option value="" disabled>Seleziona la tua lingua preferita</option>
                <option value="it">Italiano</option>
                <option value="en">Inglese</option>
                <option value="fr">Francese</option>
              </select>
            </label>

            <div className="flex items-start pt-3">
              <input 
                id="mailing"
                type="checkbox"
                checked={mailingList}
                onChange={e => setMailingList(e.target.checked)}
                className="h-5 w-5 rounded border-brand-border-purple bg-brand-dark text-brand-orange focus:ring-brand-orange cursor-pointer"
              />
              <label htmlFor="mailing" className="ml-3 text-sm font-medium text-brand-muted leading-tight">
                Iscriviti alla nostra mailing list per aggiornamenti sui nuovi percorsi.
              </label>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                className="group relative flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-brand-orange to-orange-600 px-6 py-4 text-center text-lg font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Inizia a esplorare</span>
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
        <p className="mt-8 text-xs text-brand-muted/60 text-center">
          Continuando, accetti i nostri Termini di Servizio e la Privacy Policy.
        </p>
      </main>
    </div>
  );
};

export default WelcomeScreen;
