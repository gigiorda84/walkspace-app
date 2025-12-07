import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from '../../media/media.service';
import { UploadResponseDto, MediaFileListItemDto, MediaFileResponseDto } from '../../media/dto';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('admin/media')
@Public()
export class AdminMediaController {
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

  @Get()
  async listFiles(@Query('type') type?: string): Promise<MediaFileListItemDto[]> {
    if (type && !['audio', 'image', 'subtitle', 'video'].includes(type)) {
      throw new BadRequestException(
        'Invalid type parameter. Must be one of: audio, image, subtitle, video',
      );
    }

    return this.mediaService.listFiles(type);
  }

  @Get(':id')
  async getFileById(@Param('id') id: string): Promise<MediaFileResponseDto> {
    return this.mediaService.getFileById(id);
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string): Promise<{ message: string }> {
    await this.mediaService.deleteFile(id);
    return { message: 'File deleted successfully' };
  }
}
