import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';
import dayjs from 'dayjs';
import config from '../../../common/config';
import * as util from '../../../common/utils';
import urlUtil from '../../../common/utils/url.util';
import { getRequestContext } from '../../../common/request-context';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { Album } from '../../../models/album.model';
import { AlbumCate } from '../../../models/album-cate.model';

const { reqAdminIdKey } = config;

// 项目根目录（dist 的上一级即项目根）
const projectRoot = path.resolve(__dirname, '../../../..');

export interface UploadFileInput {
  originalname: string;
  buffer: Buffer;
  size: number;
}

// lm_album.name 为 varchar(100)，原始文件名超长会导致
// "Data too long for column 'name'" 而整个上传失败。
// 这里按列长度截断并保留扩展名（JS 的 length 按 UTF-16 码元计数，
// 不会少于 MySQL 的字符数，因此截断结果一定不会超长）。
export const MAX_FILE_NAME_LEN = 100;

export function fitFileName(name: string): string {
  if (name.length <= MAX_FILE_NAME_LEN) {
    return name;
  }
  const ext = path.extname(name);
  if (ext.length >= MAX_FILE_NAME_LEN) {
    return name.slice(0, MAX_FILE_NAME_LEN);
  }
  return name.slice(0, MAX_FILE_NAME_LEN - ext.length) + ext;
}

@Injectable()
export class AlbumService {
  private readonly logger = new Logger(AlbumService.name);

  constructor(
    @InjectModel(Album) private readonly albumModel: typeof Album,
    @InjectModel(AlbumCate) private readonly cateModel: typeof AlbumCate,
  ) {}

  async cateList(listReq: any) {
    const { type, name } = listReq;

    const where: any = {
      isDelete: 0,
    };

    if (type > 0) {
      where.type = type;
    }

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    const cates = await this.cateModel.findAll({
      where,
      order: [['id', 'DESC']],
    });

    const cateResps = cates.map(cate => cate.toJSON());

    const mapList = util.listToTree(util.structsToMaps(cateResps as any), 'id', 'pid', 'children');

    return mapList;
  }

  async cateAdd(addReq: any) {
    try {
      const dateTime = Math.floor(Date.now() / 1000);
      const timeObject = {
        createTime: dateTime,
        updateTime: dateTime,
      };

      await this.cateModel.create({ ...addReq, ...timeObject } as any);
    } catch (err) {
      throw new BusinessException('CateAdd Create err');
    }
  }

  async cateRename(id: number, name: string) {
    try {
      const cate = await this.cateModel.findOne({ where: { id, isDelete: 0 } });

      if (!cate) {
        throw new BusinessException('分类已不存在！');
      }

      cate.name = name;

      await cate.save();
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('CateRename Save err');
    }
  }

  async cateDel(id: number) {
    try {
      const cate = await this.cateModel.findOne({ where: { id, isDelete: 0 } });

      if (!cate) {
        throw new BusinessException('分类已不存在！');
      }

      const albumCount = await this.albumModel.count({
        where: { cid: id, isDelete: 0 },
      });

      if (albumCount > 0) {
        throw new BusinessException('当前分类正被使用中，不能删除！');
      }

      cate.isDelete = 1;
      cate.deleteTime = Math.floor(Date.now() / 1000) as any;

      await cate.save();
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('CateDel Save err');
    }
  }

  async albumList(listReq: any) {
    const { cid, name, type, pageSize, pageNo } = listReq;

    const limit = parseInt(pageSize, 10);
    const offset = pageSize * (pageNo - 1);

    const where: any = {
      isDelete: 0,
    };

    if (cid > 0) {
      where.cid = cid;
    }

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    if (type > 0) {
      where.type = type;
    }

    const count = await this.albumModel.count({ where });

    const albums = await this.albumModel.findAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
    });

    const albumResps = albums.map(album => album.toJSON());

    const engine = 'local';

    for (let i = 0; i < albumResps.length; i++) {
      if (engine === 'local') {
        (albumResps[i] as any).path = albums[i].uri;
      } else {
        // TODO: 其他 engine
      }
      (albumResps[i] as any).uri = urlUtil.toAbsoluteUrl(albums[i].uri);
      (albumResps[i] as any).size = util.getFmtSize(albums[i].size);
    }

    return {
      pageNo,
      pageSize,
      count,
      lists: albumResps,
    };
  }

  async albumRename(id: number, name: string) {
    try {
      const album = await this.albumModel.findOne({ where: { id, isDelete: 0 } });

      if (!album) {
        throw new BusinessException('文件丢失！');
      }

      album.name = name;

      await album.save();
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('AlbumRename Save err');
    }
  }

  async albumMove(ids: any, cid: number) {
    try {
      const albums = await this.albumModel.findAll({
        where: { id: ids, isDelete: 0 } as any,
      });

      if (albums.length === 0) {
        throw new BusinessException('文件丢失！');
      }

      if (cid > 0) {
        const cate = await this.cateModel.findOne({
          where: { id: cid, isDelete: 0 },
        });

        if (!cate) {
          throw new BusinessException('类目已不存在！');
        }
      }

      await this.albumModel.update({ cid } as any, { where: { id: ids } as any });
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('AlbumMove UpdateColumn err');
    }
  }

  async albumAdd(addReq: any) {
    try {
      const alb = await this.albumModel.create(addReq);

      return alb.id;
    } catch (err) {
      // 数据库层面的真实原因必须落到日志，否则前端只能看到一句无信息量的提示
      this.logger.error(`albumAdd create failed: ${err?.name}: ${err?.message} | payload=${JSON.stringify(addReq)}`);
      throw new BusinessException('AlbumAdd Create err');
    }
  }

  async albumDel(ids: any) {
    try {
      const albums = await this.albumModel.findAll({
        where: { id: ids, isDelete: 0 } as any,
      });

      if (albums.length === 0) {
        throw new BusinessException('文件丢失！');
      }

      await this.albumModel.update(
        {
          isDelete: 1,
          deleteTime: Math.floor(Date.now() / 1000),
        } as any,
        { where: { id: ids } as any },
      );
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('AlbumDel UpdateColumn err');
    }
  }

  async uploadFile(cid: number, file: UploadFileInput, type = 10) {
    try {
      const { url, fileName, size } = await this.handleUploadFile(file, type);
      const aid = getRequestContext()?.session?.[reqAdminIdKey];

      const addReq = {
        aid,
        cid,
        type,
        uri: url,
        name: fileName,
        size,
        createTime: Math.floor(Date.now() / 1000),
        updateTime: Math.floor(Date.now() / 1000),
      };

      const albumId = await this.albumAdd(addReq);

      return {
        id: albumId,
        path: urlUtil.toAbsoluteUrl(url),
      };
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('uploadImage UpdateColumn err');
    }
  }

  /**
   * 保存上传文件。
   * 原实现写入 <baseDir>/app/public/uploads/{image|video}/YYYY-MM-DD/，
   * 这里写入 <项目根>/public/uploads/{image|video}/YYYY-MM-DD/，对外 URL 保持一致。
   */
  async handleUploadFile(file: UploadFileInput, type = 10) {
    const pathDir = type === 10 ? '/public/uploads/image/' : '/public/uploads/video/';
    const targetDir = pathDir + dayjs().format('YYYY-MM-DD');
    const dir = path.join(projectRoot, targetDir);
    mkdirp.sync(dir);

    // 定义文件名
    const filename = Date.now() + path.extname(file.originalname).toLocaleLowerCase();
    // 目标文件
    const target = path.join(projectRoot, targetDir, filename);

    await fs.promises.writeFile(target, file.buffer);

    return {
      url: `${targetDir}/${filename}`,
      fileName: fitFileName(file.originalname),
      size: file.size,
    };
  }
}
