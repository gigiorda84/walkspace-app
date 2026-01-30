import { Controller, Post, Body } from '@nestjs/common';
import { CmsAuthService } from './cms-auth.service';
import { CmsLoginDto, CmsAuthResponseDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('admin/auth')
export class CmsAuthController {
  constructor(private readonly cmsAuthService: CmsAuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: CmsLoginDto): Promise<CmsAuthResponseDto> {
    return this.cmsAuthService.login(dto);
  }
}
