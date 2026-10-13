import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CommonService } from '../../system/services/common.service';
import { BusinessException } from '../../../common/exceptions/business.exception';
import {
  ENGINE_LOCAL,
  ENGINE_QINIU,
  isQiniuReady,
  isValidQiniuDomain,
  normalizeQiniuDomain,
  resetStorageRuntime,
  setStorageRuntime,
} from '../../../common/storage-context';

// 与前端 admin/src/views/setting/storage/edit.vue 的 storageArr 一一对应。
// 注意 alias 必须是原始引擎 key：前端用 storageArr.find(item => item.type == formData.alias) 匹配。
const ENGINE_LIST = [
  { alias: ENGINE_LOCAL, name: '本地存储' },
  { alias: ENGINE_QINIU, name: '七牛云存储' },
  { alias: 'aliyun', name: '阿里云存储' },
  { alias: 'qcloud', name: '腾讯云存储' },
];

// 服务端已实现的引擎。aliyun / qcloud 仅在前端与数据库配置行中存在，保存时明确拒绝。
const SUPPORTED_ENGINES: string[] = [ENGINE_LOCAL, ENGINE_QINIU];

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly common: CommonService) {}

  /**
   * 启动时把生效引擎写入进程内快照。
   * Nest 保证所有 provider 实例化完成后才调用本钩子，且 app.listen() 在其之后，
   * 因此首个请求到达时快照一定已就绪。
   */
  async onModuleInit() {
    await this.refreshRuntime();
  }

  /** 读出 storage 类型下全部配置行并解析成对象 */
  private async loadStorageConfigs() {
    const raw = await this.common.get('storage');
    const parse = (name: string) => {
      const val = raw[name];
      if (!val) {
        return {} as any;
      }
      try {
        return JSON.parse(val);
      } catch (err) {
        this.logger.error(`storage 配置项 ${name} 不是合法 JSON：${val}`);
        return {} as any;
      }
    };
    return {
      rawDefault: String(raw.default || ''),
      local: parse(ENGINE_LOCAL),
      qiniu: parse(ENGINE_QINIU),
      aliyun: parse('aliyun'),
      qcloud: parse('qcloud'),
    };
  }

  /**
   * 当前生效的**云**存储引擎；返回 '' 表示没有任何云存储启用（此时走本地存储）。
   *
   * 语义：本地存储是系统兜底，始终可用、状态恒为「开启」，不作为 default 的候选值。
   * default 为空或 'local' 都表示"未启用任何云存储"。云存储之间天然互斥（只有一个 default）。
   *
   * 两条回落规则：
   *  1) default=qiniu 但配置不完整 → 视为未启用（否则上传会全挂且不说明原因）；
   *  2) default 是 aliyun/qcloud 等未实现的引擎 → 视为未启用。
   */
  private resolveCloudEngine(rawDefault: string, qiniu: any): string {
    if (rawDefault === ENGINE_QINIU) {
      if (!isQiniuReady(qiniu)) {
        this.logger.warn('storage default=qiniu 但七牛云配置不完整，已按未启用处理，回落本地存储');
        return '';
      }
      return ENGINE_QINIU;
    }
    if (rawDefault && rawDefault !== ENGINE_LOCAL) {
      this.logger.warn(`storage default=${rawDefault} 暂不支持，已按未启用处理，回落本地存储`);
    }
    return '';
  }

  /** 实际用于读写的引擎：没有云存储启用时即本地存储 */
  private resolveEngine(rawDefault: string, qiniu: any): string {
    return this.resolveCloudEngine(rawDefault, qiniu) || ENGINE_LOCAL;
  }

  /** 重新读库并刷新进程内快照。失败不抛，回落 local，避免拖垮整个进程启动 */
  async refreshRuntime() {
    try {
      const { rawDefault, qiniu } = await this.loadStorageConfigs();
      const engine = this.resolveEngine(rawDefault, qiniu);
      setStorageRuntime({
        engine,
        qiniuDomain: normalizeQiniuDomain(qiniu.domain),
        qiniuBucket: String(qiniu.bucket || ''),
        qiniuAccessKey: String(qiniu.accessKey || ''),
        qiniuSecretKey: String(qiniu.secretKey || ''),
      });
      this.logger.log(
        `storage engine = ${engine}${engine === ENGINE_QINIU ? ` (${qiniu.domain})` : ''}`,
      );
    } catch (err) {
      this.logger.error(`refresh storage runtime failed: ${err?.name}: ${err?.message}`);
      resetStorageRuntime();
    }
  }

  async list() {
    try {
      const { rawDefault, local, qiniu, aliyun, qcloud } = await this.loadStorageConfigs();
      const engine = this.resolveEngine(rawDefault, qiniu);
      const cnfMap: Record<string, any> = { local, qiniu, aliyun, qcloud };

      // status 以「实际生效引擎」为准（而非 default 的原始字符串），
      // 这样 default 被手改成未实现的引擎、或七牛配置残缺时，列表展示与服务端行为一致。
      // 本地存储是兜底：没有云存储启用时它生效（显示开启），有云存储启用时它显示关闭。
      // 任何时刻至多一行显示开启。
      return ENGINE_LIST.map(item => {
        const cnf = cnfMap[item.alias] || {};
        return {
          name: cnf.name || item.name,
          alias: item.alias,
          describe:
            item.alias === ENGINE_LOCAL
              ? '存储在本地服务器'
              : cnf.domain
                ? String(cnf.domain)
                : '未配置空间域名',
          status: item.alias === engine ? 1 : 0,
        };
      });
    } catch (err) {
      this.logger.error(`storage list failed: ${err?.name}: ${err?.message}`);
      throw new BusinessException('获取存储配置失败');
    }
  }

  async detail(alias: string) {
    try {
      const a = String(alias || '');
      const { rawDefault, qiniu } = await this.loadStorageConfigs();
      const cnf = (await this.common.getMap('storage', a)) as any;
      const engine = this.resolveEngine(rawDefault, qiniu);
      // 前端 edit.vue 的 getDetail() 会把返回对象的每个 key 灌进 formData，
      // 因此 bucket/accessKey/secretKey/domain 必须平铺返回；
      // status 放在展开之后，避免被配置 JSON 内的同名字段覆盖。
      return { ...(cnf || {}), alias: a, status: a === engine ? 1 : 0 };
    } catch (err) {
      this.logger.error(`storage detail failed: alias=${alias} ${err?.name}: ${err?.message}`);
      throw new BusinessException('获取存储配置失败');
    }
  }

  async edit(editReq: any) {
    const alias = String(editReq?.alias || '');
    const status = Number(editReq?.status) === 1 ? 1 : 0;
    try {
      if (!SUPPORTED_ENGINES.includes(alias)) {
        throw new BusinessException(`存储引擎 ${alias} 暂不支持`);
      }

      const cnf: any = { name: alias === ENGINE_LOCAL ? '本地存储' : '七牛云存储' };

      if (alias === ENGINE_QINIU) {
        const bucket = String(editReq.bucket || '').trim();
        const accessKey = String(editReq.accessKey || '').trim();
        const secretKey = String(editReq.secretKey || '').trim();
        const domain = normalizeQiniuDomain(editReq.domain);

        // 前端的 required 规则只在浏览器生效，服务端必须自己校验。
        // 域名不带协议时拼出来的是相对地址，图片会静默失效，所以这里必须拦住。
        if (!bucket) {
          throw new BusinessException('请输入七牛云存储空间名称(Bucket)');
        }
        if (!accessKey) {
          throw new BusinessException('请输入ACCESS_KEY');
        }
        if (!secretKey) {
          throw new BusinessException('请输入SECRET_KEY');
        }
        if (!isValidQiniuDomain(domain)) {
          throw new BusinessException(
            '空间域名需以 http:// 或 https:// 开头，例如 https://static.cloud.com',
          );
        }

        Object.assign(cnf, { bucket, accessKey, secretKey, domain });
      }

      await this.common.set('storage', alias, JSON.stringify(cnf));

      // default 记录「当前生效的云存储引擎」。本地存储是系统兜底，始终可用，
      // 不参与 default 的竞争：
      //   - 保存本地存储的配置不会改变 default（想切回本地，请把当前云存储关掉）；
      //   - 因此 default 为空或 'local' 都表示「未启用任何云存储」。
      //
      // 原实现写成 `else set('default','')` 无条件清空 —— 那会导致：七牛云生效时打开
      // 「本地存储」弹窗（status 被回填为 0）直接保存，就把两个引擎全关掉了。
      if (alias !== ENGINE_LOCAL) {
        const currentDefault = String((await this.common.getVal('storage', 'default', '')) || '');
        if (status === 1) {
          await this.common.set('storage', 'default', alias);
        } else if (currentDefault === alias) {
          await this.common.set('storage', 'default', '');
        }
      }

      await this.refreshRuntime();
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      this.logger.error(`storage edit failed: alias=${alias} ${err?.name}: ${err?.message}`);
      throw new BusinessException('存储配置保存失败');
    }
  }

  async change(alias: string, status: number) {
    const a = String(alias || '');
    try {
      if (!SUPPORTED_ENGINES.includes(a)) {
        throw new BusinessException(`存储引擎 ${a} 暂不支持`);
      }

      // 本地存储是系统兜底，不可关闭，也不参与 default 的竞争
      if (a === ENGINE_LOCAL) {
        throw new BusinessException('本地存储为系统兜底存储，始终可用，不可关闭');
      }

      if (Number(status) === 1) {
        if (a === ENGINE_QINIU) {
          const cfg = (await this.common.getMap('storage', ENGINE_QINIU)) as any;
          if (!isQiniuReady(cfg)) {
            throw new BusinessException(
              '请先补全七牛云存储配置（Bucket / ACCESS_KEY / SECRET_KEY / 空间域名）',
            );
          }
        }
        await this.common.set('storage', 'default', a);
      } else {
        // 与 edit() 同样的修正：只有关掉的正是当前生效引擎时才清空
        const currentDefault = String((await this.common.getVal('storage', 'default', '')) || '');
        if (currentDefault === a) {
          await this.common.set('storage', 'default', '');
        }
      }

      await this.refreshRuntime();
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      this.logger.error(`storage change failed: alias=${a} ${err?.name}: ${err?.message}`);
      throw new BusinessException('存储引擎切换失败');
    }
  }
}
