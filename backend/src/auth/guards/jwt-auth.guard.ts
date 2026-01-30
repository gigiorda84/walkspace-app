import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(@Inject(Reflector) private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip this guard for /admin routes (they have their own CMS guard)
    const request = context.switchToHttp().getRequest();
    if (request.url && request.url.startsWith('/admin')) {
      return true;
    }

    if (isPublic) {
      // For public routes, try to validate JWT if present, but don't require it
      try {
        const result = await super.canActivate(context);
        return true; // Always return true for public routes, even if JWT validation fails
      } catch (error) {
        // JWT validation failed, but that's ok for public routes
        return true;
      }
    }

    // For protected routes, require valid JWT
    return super.canActivate(context) as Promise<boolean>;
  }
}
