import { Module } from '@nestjs/common';
import { DineinService } from './dinein.service';
import { DineinController } from './dinein.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DineinController],
  providers: [DineinService],
  exports: [DineinService],
})
export class DineinModule {}
