import { Module } from '@nestjs/common';
import { MonitorController } from './monitor.controller';

@Module({
  controllers: [MonitorController],
})
export class MonitorModule {}
