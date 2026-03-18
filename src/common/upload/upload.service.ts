import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AWSS3Service } from 'src/common/presign_url/s3-storage.service';
import { PresignPolicy } from 'src/common/presign_url/presign-policy.decorator';
import { UploadStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';

type PresignInput = {
  userId: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  policy: PresignPolicy;
};

@Injectable()
export class UploadService {
  constructor(
    private prisma: PrismaService,
    private s3: AWSS3Service,
  ) {}

  private getBucket(): string {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) throw new Error('AWS_S3_BUCKET is required');
    return bucket;
  }

  private sanitizeName(fileName: string) {
    const base = path.basename(fileName).replace(/[^\w.\-()+ ]/g, '_');
    return base.trim().replace(/\s+/g, '_');
  }

  async presignUpload(input: PresignInput) {
    const bucket = this.getBucket();
    const safeName = this.sanitizeName(input.fileName);
    const key = `${input.policy.folder}/${input.userId}/${randomUUID()}-${safeName}`;

    const presigned = await this.s3.getPresignedPutUrl(
      bucket,
      key,
      input.mimeType,
      input.policy.expiresInSeconds ?? 300,
    );

    const url = this.s3.publicUrl(bucket, key);

    const file = await this.prisma.fileUpload.create({
      data: {
        userId: input.userId,
        bucket,
        key,
        url,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        originalName: input.fileName,
        status: UploadStatus.PRESIGNED,
      },
      select: {
        id: true,
        bucket: true,
        key: true,
        url: true,
        mimeType: true,
        sizeBytes: true,
        originalName: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      uploadId: file.id,
      method: 'PUT',
      url: presigned,
      headers: {
        'Content-Type': input.mimeType,
      },
      file: file,
    };
  }

  async markUploaded(uploadId: number, userId: number) {
    const file = await this.prisma.fileUpload.findUnique({
      where: { id: uploadId },
      select: { id: true, userId: true, status: true },
    });
    if (!file) throw new NotFoundException('Upload not found');
    if (file.userId !== userId) throw new ForbiddenException('Not allowed');

    const updated = await this.prisma.fileUpload.update({
      where: { id: uploadId },
      data: { status: UploadStatus.UPLOADED },
      select: {
        id: true,
        url: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Upload marked as completed',
      id: updated.id,
      data: updated,
    };
  }
}
