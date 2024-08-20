import { Injectable } from '@nestjs/common';

@Injectable()
export class CronService {
  create(createCronDto) {
    return 'This action adds a new cron';
  }
}
