import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { OAuthProvider, PreferenceType } from '../entities/user.entity';
import { IsEnum } from 'class-validator';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {

    @Prop()
    name: string;

    @Prop()
    password: string

    @Prop()
    email: string;
    
    @Prop()
    profileImg: string;
    
    @Prop()
    id: string;

    @Prop()
    @IsEnum(OAuthProvider)
    oAuth: string
    
    @Prop()
    resetToken: string

    @Prop()
    preferredCountry: string[]

    @Prop()
    preferredCategory: string[]
    
    @Prop()
    saved_news: string[]
}

@Schema({ timestamps: true })
export class UserPreference {

    @Prop()
    @IsEnum(PreferenceType)
    preferenceType: string
    
    @Prop()
    name: string
}

@Schema({ timestamps: true })
export class HelpCenter {
  @Prop()
  userid: string

  @Prop()
  name: string

  @Prop()
  email: string

  @Prop()
  subject: string

  @Prop()
  description: string
}
export const HelpCenterSchema = SchemaFactory.createForClass(HelpCenter);

@Schema({ timestamps: true })
export class ContactUs {

    @Prop()
    name: string
    
    @Prop()
    email: string

    @Prop()
    message: string
}
export const ContactUsSchema = SchemaFactory.createForClass(ContactUs);

export const UserSchema = SchemaFactory.createForClass(User);
export const UserPreferenceSchema = SchemaFactory.createForClass(UserPreference)
//mongoose pre-hook for encrypting password
UserSchema.pre<UserDocument>('save', async function (next) {
    if (this.isModified('password')) {
        try {
            const hashedPassword = await bcrypt.hash(this.password, 10);
            this.password = hashedPassword;
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});
