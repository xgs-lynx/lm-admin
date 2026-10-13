import { Module } from '@nestjs/common';
import { CommonAlbumController } from './album.controller';
import { AlbumService } from './services/album.service';

@Module({
  controllers: [CommonAlbumController],
  providers: [AlbumService],
  // 导出给 C 端模块复用（头像上传按当前存储引擎分流的能力）
  exports: [AlbumService],
})
export class CommonModule {}
