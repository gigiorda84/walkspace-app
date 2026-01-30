export class UserProfileDto {
  id: string;
  email: string | null;
  name: string | null;
  preferredLanguage: string;
  mailingListOptIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}
