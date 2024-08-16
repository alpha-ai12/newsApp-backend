import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactUs, ContactUsSchema, HelpCenter, HelpCenterSchema, User, UserPreference, UserPreferenceSchema, UserSchema } from './schemas/user.schema';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { News, NewsSchema } from '../news/schemas/news.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: News.name, schema: NewsSchema },
      { name: UserPreference.name, schema: UserPreferenceSchema },
      { name: HelpCenter.name, schema: HelpCenterSchema },
      { name: ContactUs.name, schema: ContactUsSchema },

    ]),
    MailerModule.forRoot({
      transport: {
        service:"gmail",
        host: process.env.smtpHost,
        port: process.env.smtpPort,
        auth: {
        user: process.env.smtpUser,
        pass: process.env.smtpPassword
        }
      },
      defaults: {
        from: '"nest-modules" <modules@nestjs.com>',
      },
      template: {
        dir: __dirname + '/templates',
        adapter: new PugAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    
  ],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
