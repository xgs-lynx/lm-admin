import * as path from 'path';
import config from '../config';
import { getStorageRuntime } from '../storage-context';

const { publicPrefix, publicUrl } = config;

/** 已是完整 URL（含协议相对写法 //host/x） */
const ABSOLUTE_RE = /^(https?:)?\/\//i;
/** 本地静态目录前缀，对应 main.ts 的 useStaticAssets(public, { prefix: '/public/' }) */
const LOCAL_PUBLIC_PREFIX = '/public/';

function withLocalPublic(u: string): string {
  const parsedUrl = new URL(publicUrl);
  parsedUrl.pathname = path.join(parsedUrl.pathname, u);
  return parsedUrl.toString();
}

// 定义转换绝对路径的方法
export function toAbsoluteUrl(u: string): string {
  if (!u) {
    return '';
  }

  // (1) 已是完整地址（历史数据、外部链接、七牛完整 URL）原样返回。
  //     原实现会把它当相对路径再拼一次，得到 http://host/http:/x/y.png 这种坏值。
  if (ABSOLUTE_RE.test(u)) {
    return u;
  }

  // (2) /public/... 是本地静态资源目录，无论当前引擎是什么都按本地解析。
  //     这是有意保留的性质：切到七牛云后，历史的本地素材依然能显示。
  if (u.indexOf(LOCAL_PUBLIC_PREFIX) === 0) {
    return withLocalPublic(u);
  }

  // (3) 其余是「无域名的相对标识」，七牛云引擎下即对象 key
  const { engine, qiniuDomain } = getStorageRuntime();
  if (engine === 'qiniu' && qiniuDomain) {
    return qiniuDomain + '/' + u.replace(/^\/+/, '');
  }

  // (4) 本地引擎兜底，行为与原实现逐字一致
  const parsedUrl = new URL(publicUrl);
  parsedUrl.pathname = path.join(parsedUrl.pathname, publicPrefix, u);
  return parsedUrl.toString();
}

export function toRelativeUrl(u: string): string {
  if (u === '') {
    return '';
  }

  // (1) 非绝对地址：本身就是相对标识（七牛对象 key、/public/... 路径），原样返回。
  //     原实现无条件 new URL(u)，传入相对值会抛 Invalid URL 而打断整个保存流程。
  if (!/^https?:\/\//i.test(u)) {
    return u;
  }

  let full: string;
  try {
    full = new URL(u).toString();
  } catch (err) {
    return u;
  }

  // (2) 本地资源：按边界剥掉 publicUrl（避免 8001 与 80010 这种前缀误伤）与 publicPrefix
  if (full === publicUrl || full.startsWith(publicUrl + '/')) {
    return full.slice(publicUrl.length).replace(publicPrefix, '');
  }

  // (3) 七牛资源：剥掉空间域名还原成对象 key。
  //     这里不依赖当前引擎，这样「引擎为 local 时保存了一张七牛图」也能正确落库
  const { qiniuDomain } = getStorageRuntime();
  if (qiniuDomain && (full === qiniuDomain || full.startsWith(qiniuDomain + '/'))) {
    return full.slice(qiniuDomain.length).replace(/^\/+/, '');
  }

  // (4) 外部链接原样保留
  return u;
}

export default {
  toAbsoluteUrl,
  toRelativeUrl,
};
