import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { DataController } from './data.controller';
import { DatabaseService } from '../database/database.service';

@Module({
  controllers: [DataController],
  providers: [DataService, DatabaseService],
})
export class DataModule {}
