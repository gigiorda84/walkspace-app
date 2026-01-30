import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CmsJwtAuthGuard extends AuthGuard('cms-jwt') {}
