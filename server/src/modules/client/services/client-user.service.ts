import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomBytes } from 'crypto';
import md5 from 'md5';
import moment from 'moment';
import config from '../../../common/config';
import * as util from '../../../common/utils';
import urlUtil from '../../../common/utils/url.util';
import { BusinessException, ValidateException } from '../../../common/exceptions/business.exception';
import { AlbumService, UploadFileInput } from '../../common/services/album.service';
import { ClientAuthService } from './client-auth.service';
import { User } from '../../../models/user.model';

const { redisPrefix, clientTokenSet } = config;

function makeSalt(): string {
  return randomBytes(8).toString('hex');
}

@Injectable()
export class ClientUserService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly album: AlbumService,
    private readonly auth: ClientAuthService,
  ) {}

  /** 个人信息：绝不返回 password / salt */
  async info(userId: number) {
    const user = await this.userModel.findOne({
      where: { id: userId },
      attributes: { exclude: ['password', 'salt'] },
    });
    if (!user) {
      throw new BusinessException('用户不存在', 333);
    }

    const data = user.toJSON() as any;
    return {
      id: data.id,
      sn: data.sn,
      username: data.username,
      nickname: data.nickname,
      realName: data.realName,
      avatar: urlUtil.toAbsoluteUrl(data.avatar),
      mobile: data.mobile,
      sex: data.sex,
      channel: data.channel,
      // User 模型的时间列没有 get() 格式化，这里补齐（与其他列表接口一致）
      createTime: data.createTime
        ? moment(data.createTime * 1000).format('YYYY-MM-DD HH:mm:ss')
        : '',
    };
  }

  /** 修改资料：字段白名单，不接受 username / mobile / password */
  async setInfo(userId: number, body: any) {
    const update: any = {};

    if (body?.nickname !== undefined) {
      const nickname = String(body.nickname).trim();
      if (!nickname || nickname.length > 32) {
        throw new ValidateException('nickname should be between 1 and 32 characters');
      }
      update.nickname = nickname;
    }

    if (body?.realName !== undefined) {
      const realName = String(body.realName).trim();
      if (realName.length > 32) {
        throw new ValidateException('realName should be at most 32 characters');
      }
      update.realName = realName;
    }

    if (body?.avatar !== undefined) {
      update.avatar = urlUtil.toRelativeUrl(String(body.avatar));
    }

    if (body?.sex !== undefined && body?.sex !== null && body?.sex !== '') {
      const sex = parseInt(body.sex, 10);
      if (![0, 1, 2].includes(sex)) {
        throw new ValidateException('sex should be 0, 1 or 2');
      }
      update.sex = sex;
    }

    if (Object.keys(update).length === 0) {
      throw new ValidateException('没有需要更新的字段');
    }

    update.updateTime = util.unixNow();
    await this.userModel.update(update, { where: { id: userId } });

    return {};
  }

  /** 修改密码：必须校验旧密码，改后吊销全部会话 */
  async changePassword(userId: number, body: any) {
    const oldPassword = String(body?.oldPassword ?? '');
    const newPassword = String(body?.newPassword ?? '');

    if (newPassword.length < 6 || newPassword.length > 20) {
      throw new ValidateException('newPassword should be between 6 and 20 characters');
    }

    const user = await this.userModel.findOne({ where: { id: userId } });
    if (!user) {
      throw new BusinessException('用户不存在', 333);
    }

    if (user.password !== md5(oldPassword + user.salt)) {
      throw new BusinessException('当前密码不正确!');
    }
    if (oldPassword === newPassword) {
      throw new BusinessException('新密码不能与当前密码相同');
    }

    const salt = makeSalt();
    await this.userModel.update(
      {
        password: md5(newPassword + salt),
        salt,
        updateTime: util.unixNow(),
      } as any,
      { where: { id: userId } },
    );

    // 密码变更的语义就是「其他会话不可信」，不吊销则被盗 token 在有效期内依然可用
    await this.auth.revokeAllTokens(userId);

    return {};
  }

  /**
   * 头像上传。
   * 复用 AlbumService 的上传（它已按当前存储引擎分流本地/七牛云），组合 albumAdd 落素材记录：
   * aid=0（C 端上传没有管理员操作者）、uid=userId（素材归属）。
   */
  async uploadAvatar(userId: number, file: UploadFileInput) {
    const { url, fileName, size } = await this.album.handleUploadFile(file, 10);
    const now = util.unixNow();

    const albumId = await this.album.albumAdd({
      aid: 0,
      uid: userId,
      cid: 0,
      type: 10,
      uri: url,
      name: fileName,
      size,
      createTime: now,
      updateTime: now,
    } as any);

    const absoluteUrl = urlUtil.toAbsoluteUrl(url);
    const relativeUrl = urlUtil.toRelativeUrl(absoluteUrl);

    await this.userModel.update({ avatar: relativeUrl, updateTime: now } as any, {
      where: { id: userId },
    });

    return { id: albumId, uri: absoluteUrl, path: relativeUrl };
  }
}
