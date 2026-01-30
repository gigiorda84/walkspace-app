
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tour, AudioSettings } from '../types';
import { MOCK_TOURS } from '../constants';

interface TourPlayerScreenProps {
  tour: Tour | null;
  settings: AudioSettings;
}

const TourPlayerScreen: React.FC<TourPlayerScreenProps> = ({ tour: providedTour, settings }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const tour = providedTour || MOCK_TOURS.find(t => t.id === id) || MOCK_TOURS[0];

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(15); // Start of the tour
  const [currentTime, setCurrentTime] = useState(24); 
  const totalTime = 320; 

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Montgenèvre high-quality mountainous map URL
  const montgenevreMapUrl = "https://images.unsplash.com/photo-1549633030-89d074392e02?auto=format&fit=crop&q=80&w=2000";

  // Mock markers for the mountainous trail at Montgenèvre
  const markers = [
    { id: 1, top: '75%', left: '25%', active: true, label: 'Village de Montgenèvre' },
    { id: 2, top: '60%', left: '45%', active: false, label: 'Lac des Anges' },
    { id: 3, top: '45%', left: '35%', active: false, label: 'Crête de l\'Alp' },
    { id: 4, top: '30%', left: '60%', active: false, label: 'Sommet du Chaberton' },
  ];

  return (
    <div className="relative h-screen w-full flex flex-col bg-brand-dark overflow-hidden">
      {/* FULL SCREEN MAP BACKGROUND */}
      <div 
        className="absolute inset-0 h-full w-full bg-cover bg-center transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${montgenevreMapUrl})` }}
      >
        {/* Subtle Darkening Overlay for readability */}
        <div className="absolute inset-0 bg-brand-dark/20 mix-blend-multiply" />
        
        {/* TOP GRADIENT FADE */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand-dark via-brand-dark/60 to-transparent pointer-events-none z-10" />

        {/* BOTTOM GRADIENT FADE - Sfumatura per i comandi */}
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent pointer-events-none z-10" />

        {/* SVG Trail Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50 z-0">
          <path 
            d="M 120 580 Q 250 500 200 400 T 350 250" 
            fill="none" 
            stroke="#F5B400" 
            strokeWidth="5" 
            strokeDasharray="12,12"
            strokeLinecap="round"
            className="animate-[dash_30s_linear_infinite]"
          />
        </svg>

        {/* Trail Markers */}
        <div className="absolute inset-0 z-0">
          {markers.map((m) => (
            <div 
              key={m.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ top: m.top, left: m.left }}
            >
              <div className={`relative flex items-center justify-center w-7 h-7 rounded-full border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-700 ${m.active ? 'bg-brand-orange scale-125' : 'bg-brand-dark/90 scale-100'}`}>
                {m.active && (
                  <div className="absolute inset-0 rounded-full bg-brand-orange animate-ping opacity-75"></div>
                )}
                {m.active && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
              </div>
              <div className={`absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-brand-purple/80 backdrop-blur-md border border-white/10 shadow-xl transition-all ${m.active ? 'text-brand-orange opacity-100' : 'text-brand-muted opacity-40 translate-y-2'}`}>
                {m.label}
              </div>
            </div>
          ))}

          {/* User Location Indicator */}
          <div className="absolute top-[75%] left-[25%] -translate-x-1/2 -translate-y-1/2">
             <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center animate-pulse">
                <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center border border-blue-400/50">
                   <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_15px_rgba(59,130,246,1)]"></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Header Overlay */}
      <header className="relative z-20 flex items-center p-4 pt-12">
        <button 
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-brand-purple/40 backdrop-blur-xl border border-white/10 text-white shadow-lg active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
        </button>
        <div className="flex-1 text-center px-4">
          <h2 className="text-lg font-bold truncate tracking-tight text-brand-cream">{tour.title}</h2>
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse"></span>
            <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-brand-orange shadow-black/20 text-shadow">Tappa 1: Prologo</p>
          </div>
        </div>
        <button className="w-11 h-11 flex items-center justify-center rounded-2xl bg-brand-purple/40 backdrop-blur-xl border border-white/10 text-brand-yellow shadow-lg active:scale-90 transition-all">
          <span className="material-symbols-outlined text-2xl">my_location</span>
        </button>
      </header>

      <div className="flex-grow" />

      {/* Controls & Subtitles Section */}
      <footer className="relative z-20 p-6 pb-14 flex flex-col items-center gap-8">
        {/* Subtitle / Narrative Box with "Sfumi" (Fade/Blur) Integration */}
        <div className="w-full max-w-sm p-7 rounded-[2.5rem] bg-brand-purple/40 backdrop-blur-[24px] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] transform transition-all duration-700">
          <div className="flex items-center justify-center gap-3 mb-4">
             <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-brand-muted/30"></div>
             <span className="text-[9px] uppercase tracking-[0.3em] font-black text-brand-muted/80">Narrazione Immersiva</span>
             <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-brand-muted/30"></div>
          </div>
          <p className="text-brand-cream/95 text-lg text-center leading-relaxed font-medium italic tracking-tight">
            "Senti il vento che fischia tra i larici di Montgenèvre? Siamo ai piedi della montagna sacra. Respira l'aria pura... la storia dei Banditi sta per iniziare."
          </p>
        </div>

        {/* Player Controls Group */}
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          {/* Progress Bar */}
          <div className="w-full space-y-4">
            <div className="flex justify-between items-end px-1">
              <span className="text-xs font-bold text-brand-cream tracking-widest">{formatTime(currentTime)}</span>
              <span className="text-[10px] font-medium text-brand-muted/80 uppercase tracking-widest">Tempo Rimante: {formatTime(totalTime - currentTime)}</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden cursor-pointer border border-white/5 p-[1.5px]">
              <div 
                className="h-full bg-gradient-to-r from-brand-orange via-brand-yellow to-brand-orange rounded-full transition-all duration-1000 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-brand-orange scale-110" />
              </div>
            </div>
          </div>

          {/* Main Controls Row */}
          <div className="w-full flex items-center justify-between px-4">
            <button className="w-12 h-12 flex items-center justify-center text-brand-muted/50 hover:text-brand-cream transition-colors">
              <span className="material-symbols-outlined text-4xl">skip_previous</span>
            </button>
            
            <div className="flex items-center gap-6">
              <button className="w-14 h-14 flex items-center justify-center text-brand-cream/80 hover:text-brand-orange transition-all active:scale-90">
                <span className="material-symbols-outlined text-4xl">replay_10</span>
              </button>
              
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-24 h-24 flex items-center justify-center rounded-full bg-white text-brand-purple shadow-[0_15px_45px_rgba(0,0,0,0.5),0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all border-[6px] border-brand-purple/20"
              >
                <span className="material-symbols-outlined filled text-6xl">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>

              <button className="w-14 h-14 flex items-center justify-center text-brand-cream/80 hover:text-brand-orange transition-all active:scale-90">
                <span className="material-symbols-outlined text-4xl">forward_10</span>
              </button>
            </div>

            <button className="w-12 h-12 flex items-center justify-center text-brand-muted/50 hover:text-brand-cream transition-colors">
              <span className="material-symbols-outlined text-4xl">skip_next</span>
            </button>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -300;
          }
        }
        .text-shadow {
          text-shadow: 0 2px 10px rgba(0,0,0,0.8);
        }
      `}</style>

      {/* Success Modal */}
      {progress === 100 && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-purple/95 backdrop-blur-2xl transition-all animate-in fade-in duration-500">
            <div className="text-center p-8 space-y-8 max-w-xs scale-100 animate-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-full bg-brand-orange/20 flex items-center justify-center mx-auto relative">
                  <div className="absolute inset-0 bg-brand-orange rounded-full animate-ping opacity-20"></div>
                  <span className="material-symbols-outlined text-brand-orange text-6xl filled">check_circle</span>
                </div>
                <div>
                  <h3 className="text-4xl font-bold tracking-tight mb-3">Capitolo Uno</h3>
                  <p className="text-brand-muted text-lg">Hai completato il prologo a Montgenèvre. La strada dei Banditi ti aspetta.</p>
                </div>
                <button 
                  onClick={() => navigate('/support')}
                  className="w-full h-16 bg-brand-orange text-white rounded-2xl font-black text-xl shadow-[0_10px_30px_rgba(217,88,8,0.4)] active:scale-95 transition-all"
                >
                  Continua la Salita
                </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default TourPlayerScreen;
