import * as os from 'os';
import * as process from 'process';
import util from './index';

const runtime = process.version;

// 获取本机内网 IP（原实现使用 ip.address()，这里用 os.networkInterfaces 等价实现）
function localIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

export async function getCpuInfo() {
  const cpus = os.cpus();
  let user = 0,
    nice = 0,
    sys = 0,
    idle = 0,
    irq = 0,
    total = 0;
  // 遍历 CPU
  for (const cpu in cpus) {
    const times = cpus[cpu].times;
    user += times.user;
    nice += times.nice;
    sys += times.sys;
    idle += times.idle;
    irq += times.irq;
  }
  total += user + nice + sys + idle + irq;

  return {
    cpu_num: cpus.length,
    total: util.round(total, 2),
    sys: util.round(sys / total, 2),
    used: util.round(user / total, 2),
    // wait: util.round(wait/total, 2),
    free: util.round(idle / total, 2),
  };
}

export async function getMemInfo() {
  const number = Math.pow(1024, 3);
  const total = await os.totalmem();
  const used = process.memoryUsage().rss;
  const free = total - used;
  const usage = (used / total) * 100;

  return {
    total: util.round(total / number, 2),
    used: util.round(used / number, 2),
    free: util.round(free / number, 2),
    usage: util.round(usage, 2),
  };
}

export async function getSysInfo() {
  const computerName = os.hostname();
  const computerIp = localIp();
  const userDir = os.homedir();
  const osName = os.type();
  const osArch = os.arch();

  return {
    computerName,
    computerIp,
    userDir,
    osName,
    osArch,
  };
}

export async function getDiskInfo() {
  const data: any[] = [];

  return data;
}

// getNodeInfo 获取Node环境及服务信息
export async function getNodeInfo() {
  return {
    name: 'Node',
    version: runtime,
    home: process.argv[0],
  };
}

export default {
  getCpuInfo,
  getMemInfo,
  getSysInfo,
  getDiskInfo,
  getNodeInfo,
};
