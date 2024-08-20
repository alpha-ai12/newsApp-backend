import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { NewsService } from 'src/features/news/news.service';

@Module({
  controllers: [CronController],
  providers: [CronService, NewsService],
})
export class CronModule {}
