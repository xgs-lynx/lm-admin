/**
 * 当前生效的存储引擎「进程内快照」。
 *
 * url.util 是同步函数（10+ 处调用点，其中 admin.controller 是在对象字面量里同步取值），
 * 而引擎配置存在数据库（lm_system_config, type='storage'）里。这里用一个模块级可变变量
 * 承载运行时配置：
 *   - 由 StorageService 在启动时（onModuleInit）与每次保存（edit/change）后刷新；
 *   - 读取方（url.util / album.service / common.service）同步零成本读取。
 *
 * 本文件不含任何 Nest 装饰器、不是 provider、不经 DI，读取发生在调用时而非 import 时，
 * 因此与 @Global() 模块的加载顺序无关。
 *
 * 有意接受的失败模式：
 *   - 未初始化时回落 local，行为与本特性引入前完全一致；
 *   - 多进程部署时，其它进程需重启才能感知引擎切换（本仓库为单进程）；
 *   - 直接手改数据库而不走接口，同样需要重启。
 */

export const ENGINE_LOCAL = 'local';
export const ENGINE_QINIU = 'qiniu';

export interface StorageRuntimeConfig {
  /** 生效引擎：只区分 qiniu 与 local，其余取值一律按 local 兜底 */
  engine: string;
  /** 七牛空间域名，形如 https://static.cloud.com（不含末尾斜杠） */
  qiniuDomain: string;
  qiniuBucket: string;
  qiniuAccessKey: string;
  qiniuSecretKey: string;
}

export interface QiniuConfigInput {
  bucket?: string;
  accessKey?: string;
  secretKey?: string;
  domain?: string;
}

const DEFAULT_CONFIG: StorageRuntimeConfig = {
  engine: ENGINE_LOCAL,
  qiniuDomain: '',
  qiniuBucket: '',
  qiniuAccessKey: '',
  qiniuSecretKey: '',
};

let current: StorageRuntimeConfig = { ...DEFAULT_CONFIG };

export function getStorageRuntime(): StorageRuntimeConfig {
  return current;
}

export function setStorageRuntime(next: Partial<StorageRuntimeConfig>): void {
  current = { ...current, ...next };
}

export function resetStorageRuntime(): void {
  current = { ...DEFAULT_CONFIG };
}

/**
 * 去空白 + 去末尾斜杠。
 * 前端装修组件用 `${ossDomain}${path}` 直接拼接，末尾斜杠会拼出双斜杠。
 */
export function normalizeQiniuDomain(domain: any): string {
  return String(domain || '').trim().replace(/\/+$/, '');
}

/** 空间域名必须带协议，否则拼出来的是相对地址，图片会静默失效 */
export function isValidQiniuDomain(domain: any): boolean {
  return /^https?:\/\/[^\s/]+/i.test(normalizeQiniuDomain(domain));
}

/** 七牛配置是否完整（用于判断该引擎是否真的可用） */
export function isQiniuReady(cnf: QiniuConfigInput): boolean {
  return Boolean(
    String(cnf?.bucket || '').trim() &&
      String(cnf?.accessKey || '').trim() &&
      String(cnf?.secretKey || '').trim() &&
      isValidQiniuDomain(cnf?.domain),
  );
}

export default {
  ENGINE_LOCAL,
  ENGINE_QINIU,
  getStorageRuntime,
  setStorageRuntime,
  resetStorageRuntime,
  normalizeQiniuDomain,
  isValidQiniuDomain,
  isQiniuReady,
};
