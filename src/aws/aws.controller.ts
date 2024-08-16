// src/s3/s3.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { AwsService } from './aws.service';

@Controller('s3')
export class AwsController {
  constructor(private readonly s3Service: AwsService) {}

  @Post('create-bucket')
  async createBucket(@Body('bucketName') bucketName: Buffer) {
    try {
      const response = await this.s3Service.uploadFile(bucketName, "");
      return response;
    } catch (error) {
      console.error('Error creating bucket:', error);
      throw error;
    }
  }
}
