import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CmsAuthService } from '../cms-auth.service';

@Injectable()
export class CmsJwtStrategy extends PassportStrategy(Strategy, 'cms-jwt') {
  constructor(
    private readonly cmsAuthService: CmsAuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-jwt-secret-change-this-in-production',
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'cms') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.cmsAuthService.validateCmsUser(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
