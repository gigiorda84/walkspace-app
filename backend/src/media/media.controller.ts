import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Query,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UploadResponseDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';
import type { Response } from 'express';
import { Express } from 'express';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: 'audio' | 'image' | 'subtitle' | 'video',
  ): Promise<UploadResponseDto> {
    if (!type || !['audio', 'image', 'subtitle', 'video'].includes(type)) {
      throw new BadRequestException(
        'Invalid type parameter. Must be one of: audio, image, subtitle, video',
      );
    }

    return this.mediaService.uploadFile(file, type);
  }

  @Public()
  @Get(':id')
  async serveFile(@Param('id') id: string, @Res() res: Response) {
    const filePath = await this.mediaService.getFilePath(id);
    return res.sendFile(filePath);
  }
}
