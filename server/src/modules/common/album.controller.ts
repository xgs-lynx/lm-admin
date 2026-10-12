import { Body, Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as path from 'path';
import { ok, ApiResult } from '../../common/result';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AlbumService } from './services/album.service';

// 对应原 config.multipart 配置
const MULTIPART = {
  fileSize: 10 * 1024 * 1024, // 10mb
  whitelist: [
    '.txt', '.png', '.jpeg', '.jpg', '.zip', '.xls', '.ppt', '.doc', '.docx',
    '.pdf', '.xlsx', '.mp4', '.wmv', '.avi', '.mov', '.flv', '.rmvb',
  ],
};

const uploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MULTIPART.fileSize, files: 10, fields: 10 },
  fileFilter: (req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLocaleLowerCase();
    if (!MULTIPART.whitelist.includes(ext)) {
      cb(new BusinessException(`Invalid file type: ${ext}`), false);
      return;
    }
    cb(null, true);
  },
};

@Controller('api/common')
export class CommonAlbumController {
  constructor(private readonly album: AlbumService) {}

  // -------- 素材分类 --------
  @Get('album/cateList')
  async cateList(@Query() params: any): Promise<ApiResult> {
    return ok(await this.album.cateList(params));
  }

  @Post('album/cateAdd')
  async cateAdd(@Body() addReq: any): Promise<ApiResult> {
    await this.album.cateAdd(addReq);
    return ok({});
  }

  @Post('album/cateRename')
  async cateRename(@Body() body: any): Promise<ApiResult> {
    const { id, name } = body;
    await this.album.cateRename(id, name);
    return ok({});
  }

  @Post('album/cateDel')
  async cateDel(@Body() body: any): Promise<ApiResult> {
    const { id } = body;
    await this.album.cateDel(id);
    return ok({});
  }

  // -------- 素材 --------
  @Get('album/albumList')
  async albumList(@Query() params: any): Promise<ApiResult> {
    return ok(await this.album.albumList(params));
  }

  @Post('album/albumRename')
  async albumRename(@Body() body: any): Promise<ApiResult> {
    const { id, name } = body;
    await this.album.albumRename(id, name);
    return ok({});
  }

  @Post('album/albumMove')
  async albumMove(@Body() body: any): Promise<ApiResult> {
    const { ids, cid } = body;
    await this.album.albumMove(ids, cid);
    return ok({});
  }

  @Post('album/albumAdd')
  async albumAdd(@Body() addReq: any): Promise<ApiResult> {
    const res = await this.album.albumAdd(addReq);
    return ok({ id: res });
  }

  @Post('album/albumDel')
  async albumDel(@Body() body: any): Promise<ApiResult> {
    const { ids } = body;
    await this.album.albumDel(ids);
    return ok({});
  }

  // -------- 上传 --------
  @Post('upload/image')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  async uploadImage(@UploadedFile() file: any, @Body('cid') cid: any): Promise<ApiResult> {
    if (!file) {
      throw new BusinessException('上传文件不能为空');
    }
    const data = await this.album.uploadFile(Number(cid) || 0, file, 10);
    return ok(data);
  }

  @Post('upload/video')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  async uploadVideo(@UploadedFile() file: any, @Body('cid') cid: any): Promise<ApiResult> {
    if (!file) {
      throw new BusinessException('上传文件不能为空');
    }
    const data = await this.album.uploadFile(Number(cid) || 0, file, 20);
    return ok(data);
  }
}
