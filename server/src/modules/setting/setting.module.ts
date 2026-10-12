import { Module } from '@nestjs/common';
import { SettingController } from './setting.controller';
import { SettingDictController } from './dict.controller';
import { WebsiteService } from './services/website.service';
import { ProtocolService } from './services/protocol.service';
import { CopyrightService } from './services/copyright.service';
import { StorageService } from './services/storage.service';
import { DictService } from './services/dict.service';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [SystemModule],
  controllers: [SettingController, SettingDictController],
  providers: [WebsiteService, ProtocolService, CopyrightService, StorageService, DictService],
})
export class SettingModule {}
