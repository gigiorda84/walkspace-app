export class TourPointDto {
  id: string;
  order: number;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  triggerRadiusMeters: number;
}
