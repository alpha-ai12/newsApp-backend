import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(compression({
    filter: () => { return true },
    threshold: 0
  }));
  await app.listen(3004);
}
bootstrap();
