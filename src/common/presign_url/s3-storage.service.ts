import { CreateBucketCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3({
  region: process.env.AWS_REGION ?? 'ap-northeast-1',
});

@Injectable()
export class AWSS3Service {
  constructor() {}

  async createBucket(bucketName: string): Promise<string> {
    const command = new CreateBucketCommand({ Bucket: bucketName });
    await s3Client.send(command);
    console.log('Bucket created successfully.');
    return bucketName;
  }

  async getPresignedUrl(
    bucketName: string,
    fileKey: string,
    expiresInSeconds = 300,
  ) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return url;
  }

  async getPresignedPutUrl(
    bucketName: string,
    fileKey: string,
    contentType: string,
    expiresInSeconds = 300,
  ) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  publicUrl(bucketName: string, fileKey: string) {
    const region = process.env.AWS_REGION ?? 'ap-northeast-1';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
  }
}
