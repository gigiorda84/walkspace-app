export class CmsUserDto {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
}

export class CmsAuthResponseDto {
  user: CmsUserDto;
  accessToken: string;
}
