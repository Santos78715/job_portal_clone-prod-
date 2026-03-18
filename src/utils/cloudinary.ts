import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import type { Express } from 'express';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

@Injectable()
export class CloudinaryService {
  constructor() {}

  async uploadFile(file: Express.Multer.File) {
    const upload = new Promise<unknown>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            const message =
              error instanceof Error
                ? error.message
                : typeof error === 'string'
                  ? error
                  : 'Upload failed';
            const errObj: Error =
              error instanceof Error ? error : new Error(message);
            reject(errObj);
            return;
          }
          resolve(result);
        },
      );

      stream.end(file.buffer);
    });
    return upload;
  }
}
