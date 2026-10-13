import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomBytes } from 'crypto';
import md5 from 'md5';
import config from '../../../common/config';
import * as util from '../../../common/utils';
import urlUtil from '../../../common/utils/url.util';
import { getRequestContext } from '../../../common/request-context';
import { BusinessException, ValidateException } from '../../../common/exceptions/business.exception';
import { CommonService } from '../../system/services/common.service';
import { RedisService } from '../../../redis/redis.service';
import { User } from '../../../models/user.model';

const { redisPrefix, clientTokenKey, clientTokenSet, clientTokenTtl } = config;

// 客户端类型：与 lm_user.channel 的枚举一致
const CLIENT_CHANNELS = [1, 2, 3, 4, 5, 6];

// 限流窗口
const REGISTER_LIMIT_PER_HOUR = 10; // 每 IP
const LOGIN_FAIL_LIMIT = 10; // 每用户名 / 15 分钟
const LOGIN_FAIL_LIMIT_IP = 30; // 每 IP / 15 分钟
const LIMIT_WINDOW_SEC = 15 * 60;

/** 生成随机 salt。不用 util.randomString()（基于 Math.random，可预测） */
function makeSalt(): string {
  return randomBytes(8).toString('hex');
}

@Injectable()
export class ClientAuthService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly common: CommonService,
    private readonly redis: RedisService,
  ) {}

  // ---------------- token ----------------

  /** 签发不透明随机 token，并登记到「用户 -> 全部 token」集合 */
  async issueToken(userId: number): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.set(clientTokenKey + token, String(userId), clientTokenTtl);
    await this.redis.sSet(clientTokenSet + userId, token);
    // 集合自身也要过期，否则每次登录都会永久多一个成员（sAdd 不刷新 TTL）
    await this.redis.client.expire(redisPrefix + clientTokenSet + userId, clientTokenTtl);
    return token;
  }

  /** 吊销单个 token（退出登录），幂等 */
  async revokeToken(userId: number, token: string) {
    if (!token) {
      return;
    }
    await this.redis.del(clientTokenKey + token);
    await this.redis.client.srem(redisPrefix + clientTokenSet + userId, token);
  }

  /** 吊销某用户的全部 token（改密码后调用） */
  async revokeAllTokens(userId: number) {
    const tokens = await this.redis.sGet(clientTokenSet + userId);
    if (tokens && tokens.length > 0) {
      await this.redis.del(tokens.map(t => clientTokenKey + t));
    }
    await this.redis.del(redisPrefix + clientTokenSet + userId);
  }

  // ---------------- 限流 ----------------

  /** 计数器自增；首次自增时设置过期（RedisService 没有 incr 封装，且 set 会 JSON 序列化做不了计数器） */
  private async bumpCounter(key: string, windowSec: number): Promise<number> {
    const count = await this.redis.client.incr(key);
    if (count === 1) {
      await this.redis.client.expire(key, windowSec);
    }
    return count;
  }

  // ---------------- 注册 ----------------

  async register(body: any) {
    const ctx = getRequestContext();

    // 限流：同 IP 每小时最多 10 次
    if (ctx?.ip) {
      const count = await this.bumpCounter(`client:register:ip:${ctx.ip}`, 60 * 60);
      if (count > REGISTER_LIMIT_PER_HOUR) {
        throw new BusinessException('注册过于频繁，请稍后再试');
      }
    }

    const username = String(body?.username ?? '').trim();
    const password = String(body?.password ?? '');
    const mobile = String(body?.mobile ?? '').trim();
    const nickname = String(body?.nickname ?? '').trim();

    // 手写校验，与后台登录同一风格
    if (username.length < 2 || username.length > 20) {
      throw new ValidateException('username should be between 2 and 20 characters');
    }
    if (password.length < 6 || password.length > 20) {
      throw new ValidateException('password should be between 6 and 20 characters');
    }
    if (mobile && !/^1[3-9]\d{9}$/.test(mobile)) {
      throw new ValidateException('手机号格式不正确');
    }
    if (nickname && nickname.length > 32) {
      throw new ValidateException('nickname should be at most 32 characters');
    }

    let channel = 0;
    if (body?.channel !== undefined && body?.channel !== null && body?.channel !== '') {
      channel = parseInt(body.channel, 10);
      if (isNaN(channel) || !CLIENT_CHANNELS.includes(channel)) {
        throw new ValidateException('channel should be one of 1,2,3,4,5,6');
      }
    }

    // 唯一性：先查后插（表上无唯一索引，软删后应允许同名重新注册）
    const sameName = await this.userModel.findOne({ where: { username, isDelete: 0 } });
    if (sameName) {
      throw new BusinessException('账号已存在换一个吧！');
    }
    if (mobile) {
      const sameMobile = await this.userModel.findOne({ where: { mobile, isDelete: 0 } });
      if (sameMobile) {
        throw new BusinessException('手机号已注册');
      }
    }

    // 默认头像来自配置；存相对值（配置若配成绝对地址也能正确落库）
    const defaultAvatar = String(
      await this.common.getVal('user', 'defaultAvatar', '/public/static/default_avatar.png'),
    );
    const avatar = urlUtil.toRelativeUrl(defaultAvatar);

    const salt = makeSalt();
    const now = util.unixNow();

    const user = await this.userModel.create({
      username,
      password: md5(password + salt),
      salt,
      mobile,
      nickname: nickname || username,
      avatar,
      sex: 0,
      channel,
      isDisable: 0,
      isDelete: 0,
      lastLoginIp: '',
      lastLoginTime: 0,
      createTime: now,
      updateTime: now,
      deleteTime: 0,
    } as any);

    // 用户编号由自增主键派生，天然唯一、无需重试
    await this.userModel.update({ sn: 10000000 + user.id } as any, { where: { id: user.id } });

    return { id: user.id };
  }

  // ---------------- 登录 ----------------

  async login(body: any) {
    const ctx = getRequestContext();

    const username = String(body?.username ?? '').trim();
    const password = String(body?.password ?? '');

    if (username.length < 2 || username.length > 20) {
      throw new ValidateException('username should be between 2 and 20 characters');
    }
    if (password.length < 6 || password.length > 20) {
      throw new ValidateException('password should be between 6 and 20 characters');
    }

    // 后台「登录注册设置」里可以关掉账号密码登录（loginWay: 1=账号密码, 2=手机验证码）
    const loginWay = String(await this.common.getVal('login', 'loginWay', '1,2'));
    if (loginWay && !loginWay.split(',').map(s => s.trim()).includes('1')) {
      throw new BusinessException('账号密码登录暂未开放');
    }

    // 限流：同一用户名的失败次数
    const failKey = `client:login:fail:${username}`;
    const ipFailKey = ctx?.ip ? `client:login:fail:ip:${ctx.ip}` : '';
    const failCount = parseInt(String((await this.redis.client.get(failKey)) ?? '0'), 10) || 0;
    if (failCount >= LOGIN_FAIL_LIMIT) {
      throw new BusinessException('失败次数过多，请稍后再试');
    }
    if (ipFailKey) {
      const ipFailCount = parseInt(String((await this.redis.client.get(ipFailKey)) ?? '0'), 10) || 0;
      if (ipFailCount >= LOGIN_FAIL_LIMIT_IP) {
        throw new BusinessException('失败次数过多，请稍后再试');
      }
    }

    const bumpFail = async () => {
      await this.bumpCounter(failKey, LIMIT_WINDOW_SEC);
      if (ipFailKey) {
        await this.bumpCounter(ipFailKey, LIMIT_WINDOW_SEC);
      }
    };

    // 不带 isDelete 过滤，才能区分「不存在」与「已删除」（与后台登录一致）
    const user = await this.userModel.findOne({ where: { username } });
    if (!user) {
      await bumpFail();
      throw new BusinessException('没有找到该用户', 330);
    }
    if (user.isDelete === 1) {
      await bumpFail();
      throw new BusinessException('该账户已被删除', 330);
    }
    if (user.isDisable === 1) {
      throw new BusinessException('该账户已被禁用', 331);
    }
    if (user.password !== md5(password + user.salt)) {
      await bumpFail();
      throw new BusinessException('密码错误', 330);
    }

    // 登录成功：清掉失败计数
    await this.redis.client.del(failKey);

    const token = await this.issueToken(user.id);

    const now = util.unixNow();
    await this.userModel.update(
      { lastLoginIp: ctx?.ip || '', lastLoginTime: now, updateTime: now } as any,
      { where: { id: user.id } },
    );

    return { token };
  }
}
