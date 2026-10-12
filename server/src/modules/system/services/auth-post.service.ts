import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { SystemAuthPost } from '../../../models/system-auth-post.model';
import { SystemAuthAdmin } from '../../../models/system-auth-admin.model';

@Injectable()
export class AuthPostService {
  constructor(
    @InjectModel(SystemAuthPost) private readonly postModel: typeof SystemAuthPost,
    @InjectModel(SystemAuthAdmin) private readonly adminModel: typeof SystemAuthAdmin,
  ) {}

  async list(listReq: any) {
    try {
      const limit = parseInt(listReq.pageSize, 10);
      const offset = listReq.pageSize * (listReq.pageNo - 1);

      const { name, isStop, code } = listReq;
      const params = { name, isStop, code };
      const where: any = {
        isDelete: 0,
      };
      for (const paramKey in params) {
        if (paramKey === 'isStop' && params[paramKey]) {
          where[paramKey] = params[paramKey];
        } else {
          where[paramKey] = { [Op.like]: `%${params[paramKey]}%` }; // 模糊查找
        }
      }

      const posts = await this.postModel.findAll({
        where: { ...where },
        order: [['id', 'DESC']],
        limit,
        offset,
      });

      const postResps = posts.map(post => post.toJSON());

      const count = await this.postModel.count({ where: { ...where } });

      return {
        pageNo: listReq.pageNo,
        pageSize: listReq.pageSize,
        count,
        lists: postResps,
      };
    } catch (err) {
      throw new BusinessException(`AuthPostService.list error: ${err}`);
    }
  }

  async detail(id: number) {
    try {
      const post = await this.postModel.findOne({
        where: { id, isDelete: 0 },
      });

      if (!post) {
        throw new BusinessException('岗位不存在!');
      }

      return post.toJSON();
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('Get Post Detail error');
    }
  }

  async add(addReq: any) {
    const dateTime = Math.floor(Date.now() / 1000);
    const timeObject = {
      createTime: dateTime,
      updateTime: dateTime,
    };
    delete addReq.id;
    Object.assign(addReq, timeObject);

    try {
      const existingPost = await this.postModel.findOne({
        where: {
          [Op.or]: [{ code: addReq.code }, { name: addReq.name }],
          isDelete: 0,
        },
      });

      if (existingPost) {
        throw new BusinessException('该岗位已存在!');
      }

      const post = this.postModel.build(addReq);
      await post.save();

      return;
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('Add Post error');
    }
  }

  async edit(editReq: any) {
    try {
      const post = await this.postModel.findOne({
        where: { id: editReq.id, isDelete: 0 },
      });

      if (!post) {
        throw new BusinessException('岗位不存在!');
      }

      const existingPost = await this.postModel.findOne({
        where: {
          [Op.or]: [{ code: editReq.code }, { name: editReq.name }],
          id: { [Op.ne]: editReq.id },
          isDelete: 0,
        },
      });

      if (existingPost) {
        throw new BusinessException('该岗位已存在!');
      }

      Object.assign(post, editReq);

      await post.save();

      return;
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('Edit Post error');
    }
  }

  async del(id: number) {
    try {
      const post = await this.postModel.findOne({
        where: { id, isDelete: 0 },
      });

      if (!post) {
        throw new BusinessException('岗位不存在!');
      }

      const admin = await this.adminModel.findOne({
        where: { postId: id, isDelete: 0 },
      });

      if (admin) {
        throw new BusinessException('该岗位已被管理员使用，请先移除!');
      }

      post.isDelete = 1;

      await post.save();

      return;
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('Delete Post error');
    }
  }

  async all() {
    try {
      const posts = await this.postModel.findAll({
        where: { isDelete: 0 },
        order: [
          ['sort', 'DESC'],
          ['id', 'DESC'],
        ],
      });

      return posts.map(post => post.toJSON());
    } catch (err) {
      throw new BusinessException('Get All Posts error');
    }
  }
}
