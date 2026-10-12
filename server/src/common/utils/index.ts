import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import * as readline from 'readline';

// StructsToMaps 将结构体转换成Map列表
export function structsToMaps(objs: any[]): any[] {
  const objList: any[] = [];
  try {
    for (const obj of objs) {
      objList.push(JSON.parse(JSON.stringify(obj)));
    }
    const data = objList.map(obj => {
      return obj;
    });
    return data;
  } catch (err) {
    throw new Error(`convertUtil.structsToMaps err: err=[${err}]`);
  }
}

// ListToTree 字典列表转树形结构
export function listToTree(arr: any[], id: string, pid: string, child: string): any[] {
  const mapList: any[] = [];
  const idValMap = new Map();

  for (const m of arr) {
    if (m[id]) {
      idValMap.set(m[id], m);
    }
  }

  for (const m of arr) {
    if (m[pid]) {
      const pNode = idValMap.get(m[pid]);
      if (pNode) {
        let cVal = pNode[child];
        if (cVal === null || cVal === undefined) {
          cVal = [m];
        } else {
          cVal.push(m);
        }
        pNode[child] = cVal;
        continue;
      }
    }
    mapList.push(m);
  }

  return mapList;
}

// RandomString 返回随机字符串
export function randomString(length: number): string {
  const allRandomStr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let byteList = '';

  for (let i = 0; i < length; i++) {
    byteList += allRandomStr.charAt(Math.floor(Math.random() * allRandomStr.length));
  }

  return byteList;
}

export function makeUuid(): string {
  return uuidv4().replace(/-/g, '');
}

// GetFmtSize 按照正确的格式缩放字节
export function getFmtSize(data: number): string {
  const factor = 1024;
  let res = data;

  const units = ['', 'K', 'M', 'G', 'T', 'P'];

  for (let i = 0; i < units.length; i++) {
    if (res < factor) {
      return `${res.toFixed(2)}${units[i]}B`;
    }
    res /= factor;
  }

  return `${res.toFixed(2)}P`;
}

// Round float四舍五入
export function round(val: number, n: number): number {
  const base = Math.pow(10, n);
  return Math.round(base * val) / base;
}

export function toCamelCase(s: string): string {
  const words = s.split('_');
  for (let i = 1; i < words.length; i++) {
    words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
  }
  return words.join('');
}

export function toPascalCase(str: string): string {
  const words = str.split('_');
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].slice(1);
  }
  return words.join('');
}

export function contains(src: any, elem: any): boolean {
  if (Array.isArray(src)) {
    return src.includes(elem);
  }
  return false;
}

export async function stringToLines(s: string): Promise<string[]> {
  const lines: string[] = [];
  const stream = new Readable();
  stream.push(s);
  stream.push(null);

  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    lines.push(line);
  }

  return lines;
}

export function promisify(func: Function): (...args: any[]) => Promise<any> {
  return (...args: any[]) => {
    return new Promise((resolve, reject) => {
      func(...args, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
}

// 当前 unix 秒时间戳（原代码中到处使用 Math.floor(Date.now() / 1000)）
export function unixNow(): number {
  return Math.floor(Date.now() / 1000);
}

export default {
  structsToMaps,
  listToTree,
  randomString,
  makeUuid,
  getFmtSize,
  round,
  stringToLines,
  toCamelCase,
  contains,
  toPascalCase,
  promisify,
  unixNow,
};
