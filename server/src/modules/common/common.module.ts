import { Module } from '@nestjs/common';
import { CommonAlbumController } from './album.controller';
import { AlbumService } from './services/album.service';

@Module({
  controllers: [CommonAlbumController],
  providers: [AlbumService],
})
export class CommonModule {}
