import { Controller, Get } from '@nestjs/common';
import { ok, ApiResult } from '../../common/result';
import { RedisService } from '../../redis/redis.service';
import serverUtil from '../../common/utils/server.util';

@Controller('api/monitor')
export class MonitorController {
  constructor(private readonly redis: RedisService) {}

  @Get('server')
  async server(): Promise<ApiResult> {
    const cpu = await serverUtil.getCpuInfo();
    const mem = await serverUtil.getMemInfo();
    const sys = await serverUtil.getSysInfo();
    const disk = await serverUtil.getDiskInfo();
    const node = await serverUtil.getNodeInfo();

    return ok({ cpu, mem, sys, disk, node });
  }

  @Get('cache')
  async cache(): Promise<ApiResult> {
    const cmdStatsMap = await this.redis.info('commandstats');
    const stats: any[] = [];

    for (const [k, v] of Object.entries(cmdStatsMap)) {
      stats.push({
        name: k.split('_')[1],
        value: v.slice(v.indexOf('=') + 1, v.indexOf(',')),
      });
    }

    const info = await this.redis.info();
    const dbSize = await this.redis.dbSize();

    return ok({ info, commandStats: stats, dbSize });
  }
}
