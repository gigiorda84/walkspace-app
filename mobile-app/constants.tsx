
import { Tour } from './types';

export const MOCK_TOURS: Tour[] = [
  {
    id: '1',
    slug: 'echoes-of-old-quarter',
    title: 'Echoes of the Old Quarter',
    description: 'Explore the rich history and stunning designs of our city\'s architectural landmarks. This tour will guide you through the evolution of architectural styles, from Victorian-era marvels to modern skyscrapers, revealing the stories behind each iconic building.',
    shortSummary: 'A walk through the historic streets uncovering secrets of the past.',
    city: 'Historic District',
    duration: 60,
    distance: 2.5,
    stops: 12,
    imageUrl: 'https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&q=80&w=800',
    mapPreviewUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3-EZ0QQPHk5FG-7A-I8TiXo5lldMx6nM7wRABeypENi4T_8wRhDCvRK51HSYYF9v625h-bUdvEXOKEKQjZ4EVd3lNGCgtrttylVlmXkiuo0RwQYVhWV6sAK6q9KHH6DuGZINpMcztVOSt77hEUf-HsKZI74qXRYrVop6kcudwUCLNSyMtrmBg1NyrUHwjuKZsI4Ln2sq_7JpBDoHRiy6dwwRDVVmpulReFsQ5pKl7Pyza_rTg3uRngSnLFfaRIPEK7wlLCTM-3F-i',
    isProtected: false,
    languages: ['it', 'en', 'fr', 'es'],
    startPoint: { lat: 45.464203, lng: 9.189982 }
  },
  {
    id: '2',
    slug: 'segui-le-bandite',
    title: 'Segui le Bandite',
    description: 'Un viaggio immersivo attraverso le leggende della ribellione. Scopri i percorsi segreti e le storie mai raccontate dei fuorilegge che hanno segnato queste terre.',
    shortSummary: 'Unisciti alla ribellione in un percorso di suoni e leggende.',
    city: 'Valle Oscura',
    duration: 45,
    distance: 1.8,
    stops: 8,
    imageUrl: 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=800',
    mapPreviewUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQZ1OqZ-s3L2Jic6O70x-5HJGcOIGcp6Ubn_mL0nQTFmHrqwA1BdTJPolNGZ4HcZtvrSUO9t7e5nAAWyWmfXB0TeoUuK7PPMdnJdkzyAVeweqoAksGGjx8ZMLAdvCfE2GAPBmeB1od0C01ab5hVTOwlKgVn0IPqOTzNDh_l4YdFb_R3p-p-tbAVDi6SCCdCYpiNX5Tu88Hol2BFgjZSFfeaJL2pwppz48rlTvVeaKCZl_KuHpROi-isDXOLP-XbUq6ied3a7mzDIhb',
    isProtected: true,
    languages: ['it', 'fr'],
    startPoint: { lat: 45.472000, lng: 9.195000 }
  }
];
