
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Tour } from '../types';
import { MOCK_TOURS } from '../constants';

interface DiscoveryScreenProps {
  onSelectTour: (tour: Tour) => void;
}

// Custom yellow marker icon
const createTourIcon = () => {
  return L.divIcon({
    className: 'tour-marker',
    html: `
      <div style="
        width: 12px;
        height: 12px;
        background: #F5B400;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(245, 180, 0, 0.5);
      "></div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const DiscoveryScreen: React.FC<DiscoveryScreenProps> = ({ onSelectTour }) => {
  const navigate = useNavigate();
  const tours = MOCK_TOURS;

  const handleTourClick = (tour: Tour) => {
    onSelectTour(tour);
    navigate(`/tour/${tour.id}`);
  };

  // Calculate map bounds to fit all tours
  const mapCenter = useMemo(() => {
    if (tours.length === 0) return { lat: 45.464203, lng: 9.189982 };

    const lats = tours.map(t => t.startPoint.lat);
    const lngs = tours.map(t => t.startPoint.lng);

    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  }, [tours]);

  const tourIcon = useMemo(() => createTourIcon(), []);

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-brand-dark">
      {/* Full-screen Map */}
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={13}
        className="absolute inset-0 z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {tours.map((tour) => (
          <Marker
            key={tour.id}
            position={[tour.startPoint.lat, tour.startPoint.lng]}
            icon={tourIcon}
            eventHandlers={{
              click: () => handleTourClick(tour),
            }}
          >
            <Popup>
              <div className="text-sm font-bold">{tour.title}</div>
              <div className="text-xs text-gray-600">{tour.city}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Tour Labels Overlay */}
      {tours.map((tour) => (
        <TourLabel key={tour.id} tour={tour} onClick={() => handleTourClick(tour)} />
      ))}

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-8 pb-4">
        {/* Home Button */}
        <button
          onClick={() => navigate('/')}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"
        >
          <span className="material-symbols-outlined text-brand-yellow text-2xl">home</span>
        </button>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white">Discover</h1>

        {/* Settings Button */}
        <button
          onClick={() => navigate('/settings')}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"
        >
          <span className="material-symbols-outlined text-brand-yellow text-2xl">settings</span>
        </button>
      </div>

      {/* Empty State */}
      {tours.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-black/80 rounded-xl p-6 text-center">
            <span className="material-symbols-outlined text-brand-muted text-4xl mb-4">map</span>
            <p className="text-brand-cream font-semibold">No tours found</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Tour label component that appears near markers
const TourLabel: React.FC<{ tour: Tour; onClick: () => void }> = ({ tour, onClick }) => {
  // This is a simplified version - in a real implementation you'd use
  // map projection to position these labels correctly
  return null; // Labels are shown in the Popup for simplicity
};

export default DiscoveryScreen;
