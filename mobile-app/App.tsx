
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import WelcomeScreen from './screens/WelcomeScreen';
import DiscoveryScreen from './screens/DiscoveryScreen';
import TourDetailScreen from './screens/TourDetailScreen';
import TourSettingsScreen from './screens/TourSettingsScreen';
import TourPlayerScreen from './screens/TourPlayerScreen';
import SupportScreen from './screens/SupportScreen';
import { User, Tour, AudioSettings } from './types';
import { MOCK_TOURS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sw_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [settings, setSettings] = useState<AudioSettings>({
    language: 'it',
    subtitles: 'Off',
    offlineMode: false
  });

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('sw_user', JSON.stringify(userData));
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-brand-purple relative overflow-hidden flex flex-col">
      <HashRouter>
        <Routes>
          <Route 
            path="/" 
            element={user ? <Navigate to="/discovery" /> : <WelcomeScreen onLogin={handleLogin} />} 
          />
          <Route 
            path="/discovery" 
            element={<DiscoveryScreen onSelectTour={setActiveTour} />} 
          />
          <Route 
            path="/tour/:id" 
            element={<TourDetailScreen tour={activeTour} onStart={() => {}} />} 
          />
          <Route 
            path="/settings/:id" 
            element={<TourSettingsScreen tour={activeTour} settings={settings} onUpdateSettings={setSettings} />} 
          />
          <Route 
            path="/player/:id" 
            element={<TourPlayerScreen tour={activeTour} settings={settings} />} 
          />
          <Route 
            path="/support" 
            element={<SupportScreen />} 
          />
        </Routes>
      </HashRouter>
    </div>
  );
};

export default App;
