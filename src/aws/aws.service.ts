import { S3 } from 'aws-sdk';
import { Logger, Injectable } from '@nestjs/common';
// import * as sharp from 'sharp';
import * as AWS from 'aws-sdk';
const { v4: uuidv4 } = require('uuid'); // Import UUID v4 generator

AWS.config.update({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY,
  secretAccessKey: process.env.AWS_S3_KEY_SECRET,
  region: process.env.AWS_REGION,
});

@Injectable()
export class AwsService {
  private s3: AWS.S3;
  constructor() {
    this.s3 = new AWS.S3();
  }
  async isExist( params ) {
    try{
      await this.s3.headObject(params).promise();
      return true
    } catch (error) {
      if(error?.code === 'NotFound') {
        return false
      }
      else {
        console.log("error while checking image in s3", error)
      }
    }
  }
  async uploadFile(fileBuffer, fileName) {
    /**
     * DESTRUCTURE FILE NAME FROM FILE
     */
    // const { originalname } = file;

    const maxFileSize = 3 * 1024 * 1024; // 3MB in bytes

    /**
     * COMPRESS FILE BUFFER MAX 3MB WITH THE HELP OF SHARP LIBRARY
     */
    // const compressedBuffer = await sharp(fileBuffer)
    //   .resize({ width: 1200 })
    //   .jpeg({ quality: 80 })
    //   .withMetadata() // Preserve the image metadata
    //   .rotate() // Auto-rotate the image based on its metadata
    //   .toBuffer({ limit: maxFileSize, resolveWithObject: true });
 
    /**
     * SET PARAMS FOR S3 BUCKET
     */
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: uuidv4(),
      Body: fileBuffer,
      ContentType: 'image/jpeg',
      ACL: "public-read",
    };

    try {
      /**
       * UPLOAD FILE ON S3 BUCKET || CONFIGURE S3 BUCKET
       */
      // const s3Response = await this.s3.upload(params)
      const s3Response = await new S3({
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_KEY_SECRET,
      })
        .upload(params)
        .promise();

      /**
       * RETURN KEY: NAME, AND URL: LOCATION
       */
      return { success: true, key: s3Response?.Key, url: s3Response?.Location };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  }

  async listBucket(bucketName: string): Promise<any> {
    const response = await this.s3.listBuckets().promise();
    const buckets = response.Buckets;
    return buckets.map((bucket) => bucket.Name);
  }
}
