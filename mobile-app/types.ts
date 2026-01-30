
export interface Tour {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortSummary: string;
  city: string;
  duration: number; // minutes
  distance: number; // km
  stops: number;
  imageUrl: string;
  mapPreviewUrl: string;
  isProtected: boolean;
  languages: string[];
  startPoint: { lat: number; lng: number };
}

export interface User {
  name: string;
  email: string;
  language: string;
  mailingList: boolean;
  isLoggedIn: boolean;
}

export interface AudioSettings {
  language: string;
  subtitles: string;
  offlineMode: boolean;
}
