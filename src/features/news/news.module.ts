import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { News, NewsSchema, Page, PageSchema } from './schemas/news.schema';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from 'src/aws/aws.module';
import { AwsService } from 'src/aws/aws.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: News.name, schema: NewsSchema },
      { name: Page.name, schema: PageSchema },
    ]),
    ConfigModule,
  ],
  controllers: [NewsController],
  providers: [NewsService, AwsService],
})
export class NewsModule {}
