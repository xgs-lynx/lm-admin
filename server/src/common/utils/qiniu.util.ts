/**
 * 七牛云上传封装（qiniu v7）。
 *
 * 为什么自己包 Promise 而不用 utils.promisify：
 * 该 SDK 的回调是 (err, respBody, respInfo)，且 HTTP 4xx/5xx 既可能走 err，
 * 也可能 resolve 成一个 ok()===false 的响应包装（官方示例同时判 respErr 与
 * respInfo.statusCode 就是这个原因）。两条路都必须判掉，否则「上传失败」会被
 * 当成成功，往 lm_album 写进一条指向不存在对象的记录。
 */
import * as qiniu from 'qiniu';
import { Logger } from '@nestjs/common';
import { BusinessException } from '../exceptions/business.exception';
import { getStorageRuntime, isQiniuReady } from '../storage-context';

const logger = new Logger('QiniuUpload');

/** 上传单个 Buffer。任何失败都 reject 一个带上下文的 Error */
function putBuffer(
  uploadToken: string,
  key: string,
  buffer: Buffer,
  putExtra: qiniu.form_up.PutExtra,
): Promise<any> {
  // useHttpsDomain 默认为 false，区域查询与上传端点都会走 http，必须显式打开
  const config = new qiniu.conf.Config({ useHttpsDomain: true });
  const formUploader = new qiniu.form_up.FormUploader(config);

  return new Promise((resolve, reject) => {
    formUploader.put(uploadToken, key, buffer, putExtra, (err: any, respBody: any, respInfo: any) => {
      if (err) {
        err.qiniuResp = respInfo;
        reject(err);
        return;
      }
      const statusCode = respInfo && respInfo.statusCode;
      if (statusCode !== 200) {
        const e: any = new Error(
          `qiniu put not ok: status=${statusCode} body=${JSON.stringify(respBody)}`,
        );
        e.qiniuResp = respInfo;
        e.qiniuBody = respBody;
        reject(e);
        return;
      }
      resolve(respBody);
    });
  });
}

/**
 * 把 Buffer 上传到七牛云。
 *
 * @param key      对象 key。调用方须保证：不以 '/' 开头、不包含 'public/uploads/'
 *                 （否则会被 url.util 当成本地路径解析），且长度远小于 lm_album.uri 的 varchar(200)
 * @param buffer   文件内容（控制器用 multer memoryStorage 全量读入，上限 10MB）
 * @param fileName 原始文件名，仅用于七牛控制台展示，调用方需自行截断
 */
export async function uploadBufferToQiniu(key: string, buffer: Buffer, fileName: string) {
  const { qiniuBucket, qiniuAccessKey, qiniuSecretKey, qiniuDomain } = getStorageRuntime();

  if (
    !isQiniuReady({
      bucket: qiniuBucket,
      accessKey: qiniuAccessKey,
      secretKey: qiniuSecretKey,
      domain: qiniuDomain,
    })
  ) {
    throw new BusinessException(
      '七牛云存储配置不完整，请到「系统设置 - 存储设置」补全 Bucket / ACCESS_KEY / SECRET_KEY / 空间域名',
    );
  }

  const mac = new qiniu.auth.digest.Mac(qiniuAccessKey, qiniuSecretKey);
  const putPolicy = new qiniu.rs.PutPolicy({ scope: qiniuBucket, expires: 3600 });
  const uploadToken = putPolicy.uploadToken(mac);

  const putExtra = new qiniu.form_up.PutExtra();
  // SDK 内部会对 fname 调 .replace()，必须是字符串；过长的原始名由调用方截断
  putExtra.fname = fileName || '';

  try {
    await putBuffer(uploadToken, key, buffer, putExtra);
  } catch (err: any) {
    const status = err?.qiniuResp?.statusCode ?? err?.resp?.statusCode ?? '';
    const body = JSON.stringify(err?.qiniuBody ?? err?.qiniuResp?.data ?? '');
    logger.error(
      `qiniu upload failed: key=${key} bucket=${qiniuBucket} status=${status} body=${body} err=${err?.name}: ${err?.message}`,
    );
    throw new BusinessException(`上传到七牛云失败：${err?.message || '未知错误'}`);
  }

  logger.log(`qiniu upload ok: key=${key} size=${buffer.length}`);
  return { key };
}

export default { uploadBufferToQiniu };
