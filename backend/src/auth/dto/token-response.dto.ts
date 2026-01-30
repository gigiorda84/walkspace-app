export class TokenResponseDto {
  accessToken: string;
  refreshToken: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  name?: string;
  preferredLanguage: string;
  mailingListOptIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthResponseDto {
  user: UserResponseDto;
  tokens: TokenResponseDto;
}
