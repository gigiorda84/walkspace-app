import { Module } from '@nestjs/common';
import { AdminMediaController } from './admin-media.controller';
import { MediaModule } from '../../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [AdminMediaController],
})
export class AdminMediaModule {}
