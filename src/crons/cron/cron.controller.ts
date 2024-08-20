import { Controller, Get } from '@nestjs/common';
import { NewsService } from 'src/features/news/news.service';

@Controller('cron')
export class CronController {
  constructor(private readonly newService: NewsService) {}

  @Get('feed-news')
  async feedNews() {
    return this.newService.feedWithGptTurbo();
  }
}
