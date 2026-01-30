
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tour } from '../types';
import { MOCK_TOURS } from '../constants';

interface TourDetailScreenProps {
  tour: Tour | null;
  onStart: () => void;
}

const TourDetailScreen: React.FC<TourDetailScreenProps> = ({ tour: providedTour }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const tour = providedTour || MOCK_TOURS.find(t => t.id === id) || MOCK_TOURS[0];

  return (
    <div className="flex flex-col h-screen bg-brand-purple">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between p-4 bg-brand-purple/95 backdrop-blur-sm">
        <button 
          onClick={() => navigate('/discovery')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">Dettagli del Tour</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-grow overflow-y-auto px-4 pb-32">
        {/* Tour Cover Image */}
        <div className="mt-2 relative">
          <div
            className="w-full aspect-video bg-cover bg-center rounded-2xl shadow-2xl border border-white/10"
            style={{ backgroundImage: `url(${tour.imageUrl || tour.mapPreviewUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-purple via-transparent to-transparent pointer-events-none rounded-2xl"></div>
        </div>

        {/* Content */}
        <div className="mt-8 space-y-6">
          <div className="flex items-start justify-between">
            <h2 className="text-3xl font-bold leading-tight flex-1">{tour.title}</h2>
            <button className="p-2.5 rounded-full bg-white/5 border border-white/10 text-brand-yellow">
              <span className="material-symbols-outlined filled">favorite</span>
            </button>
          </div>

          <p className="text-brand-cream/80 text-base leading-relaxed">
            {tour.description}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-brand-surface-purple border border-brand-border-purple shadow-lg space-y-2">
              <span className="material-symbols-outlined text-brand-orange text-3xl">timer</span>
              <div className="text-center">
                <div className="font-bold text-lg">{tour.duration} min</div>
                <div className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">Duration</div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-brand-surface-purple border border-brand-border-purple shadow-lg space-y-2">
              <span className="material-symbols-outlined text-brand-orange text-3xl">distance</span>
              <div className="text-center">
                <div className="font-bold text-lg">{tour.distance} km</div>
                <div className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">Distance</div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-brand-surface-purple border border-brand-border-purple shadow-lg space-y-2">
              <span className="material-symbols-outlined text-brand-orange text-3xl">flag</span>
              <div className="text-center">
                <div className="font-bold text-lg">{tour.stops} Stops</div>
                <div className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">Total</div>
              </div>
            </div>
          </div>

          {/* Donation / Support Project Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-surface-purple border border-white/5 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                <span className="material-symbols-outlined">volunteer_activism</span>
              </div>
              <div>
                <div className="text-sm font-bold">Support this project</div>
                <div className="text-[10px] text-brand-muted">Help us keep the stories alive</div>
              </div>
            </div>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors">
              Donate
            </button>
          </div>
        </div>
      </main>

      {/* Persistent CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-brand-purple via-brand-purple/90 to-transparent">
        <button 
          onClick={() => navigate(`/settings/${tour.id}`)}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-brand-orange to-brand-yellow text-brand-purple font-bold text-lg shadow-2xl shadow-brand-orange/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined">play_arrow</span>
          Inizia
        </button>
      </div>
    </div>
  );
};

export default TourDetailScreen;
