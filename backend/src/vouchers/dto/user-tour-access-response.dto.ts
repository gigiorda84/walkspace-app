export class UserTourAccessDto {
  tourId: string;
  tourTitle: string;
  tourSlug: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export class UserToursResponseDto {
  tours: UserTourAccessDto[];
}
