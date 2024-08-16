import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NewsDocument = News & Document;

@Schema({ timestamps: true })
export class News {
  // @Prop()
  // oldTitle: string;

  @Prop()
  title: string;

  @Prop()
  newTitle: string;

  @Prop()
  link: string;

  @Prop()
  keywords: string[];

  @Prop()
  creator: string[];

  @Prop()
  video_url: string;

  @Prop()
  description: string;

  @Prop()
  newDescription: string;

  @Prop()
  content: string;

  @Prop()
  newContent: string;

  @Prop()
  pubDate: string;

  @Prop()
  image_url: string;

  @Prop()
  source_id: string;

  @Prop({ index: true })
  category: string[];

  @Prop({ index: true })
  country: string[];

  @Prop()
  language: string;

  @Prop({ index: true })
  slugid: string;
}
export const NewsSchema = SchemaFactory.createForClass(News);
@Schema({ timestamps: true })
export class Page {
  @Prop()
  pageNumber: string;
}
export const PageSchema = SchemaFactory.createForClass(Page);
// export const OffenceModel = model('OffenceModel', OffenceSchema)
