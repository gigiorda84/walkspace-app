
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tour, AudioSettings } from '../types';
import { MOCK_TOURS } from '../constants';

interface TourSettingsScreenProps {
  tour: Tour | null;
  settings: AudioSettings;
  onUpdateSettings: (settings: AudioSettings) => void;
}

const TourSettingsScreen: React.FC<TourSettingsScreenProps> = ({ tour: providedTour, settings, onUpdateSettings }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const tour = providedTour || MOCK_TOURS.find(t => t.id === id) || MOCK_TOURS[0];

  const handleUpdate = (key: keyof AudioSettings, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-brand-purple rounded-3xl border border-white/10 shadow-2xl ring-1 ring-white/5 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-xl font-bold tracking-tight">Before you start...</h2>
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 pt-0 space-y-6">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-brand-muted pl-1">Audio Language</span>
            <div className="relative">
              <select 
                value={settings.language}
                onChange={e => handleUpdate('language', e.target.value)}
                className="w-full h-14 rounded-2xl bg-brand-surface-purple border border-brand-border-purple px-4 appearance-none focus:ring-2 focus:ring-brand-orange outline-none"
              >
                <option value="en">English</option>
                <option value="it">Italiano</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-muted">unfold_more</span>
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-brand-muted pl-1">Subtitles</span>
            <div className="relative">
              <select 
                value={settings.subtitles}
                onChange={e => handleUpdate('subtitles', e.target.value)}
                className="w-full h-14 rounded-2xl bg-brand-surface-purple border border-brand-border-purple px-4 appearance-none focus:ring-2 focus:ring-brand-orange outline-none"
              >
                <option value="Off">Off</option>
                <option value="it">Italiano</option>
                <option value="en">English</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-muted">unfold_more</span>
            </div>
          </label>
        </div>

        <div className="bg-brand-surface-purple/30 p-6 border-t border-brand-border-purple">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-surface-purple flex items-center justify-center border border-white/5">
                <span className="material-symbols-outlined text-brand-yellow">download_for_offline</span>
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-bold">Download for Offline Use</div>
                <div className="text-[10px] text-brand-muted">Recommended for poor connectivity</div>
              </div>
            </div>
            
            <button 
              onClick={() => handleUpdate('offlineMode', !settings.offlineMode)}
              className={`w-12 h-7 rounded-full transition-colors relative flex items-center p-1 ${settings.offlineMode ? 'bg-brand-orange' : 'bg-brand-dark border border-brand-border-purple'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${settings.offlineMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <button 
            onClick={() => navigate(`/player/${tour.id}`)}
            className="w-full h-12 rounded-2xl bg-brand-orange text-white font-bold text-base shadow-lg shadow-orange-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Start Tour
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourSettingsScreen;
