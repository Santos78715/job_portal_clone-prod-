import {
  BadRequestException,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PRESIGN_POLICY_KEY, PresignPolicy } from './presign-policy.decorator';
import { UploadService } from 'src/common/upload/upload.service';

type RequestWithUser = {
  user?: { sub?: number };
  body?: Record<string, unknown>;
  presignResult?: unknown;
};

@Injectable()
export class PresignUploadInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private uploadService: UploadService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const policy = this.reflector.get<PresignPolicy>(
      PRESIGN_POLICY_KEY,
      context.getHandler(),
    );
    if (!policy) return next.handle();

    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Missing user context');

    const fileNameRaw = req.body?.fileName;
    const mimeTypeRaw = req.body?.mimeType;
    const sizeBytesRaw = req.body?.sizeBytes;

    if (typeof fileNameRaw !== 'string') {
      throw new BadRequestException('Invalid fileName');
    }
    if (typeof mimeTypeRaw !== 'string') {
      throw new BadRequestException('Invalid mimeType');
    }

    const fileName = fileNameRaw;
    const mimeType = mimeTypeRaw;
    const sizeBytes = typeof sizeBytesRaw === 'number' ? sizeBytesRaw : Number(sizeBytesRaw);

    if (!fileName || fileName.length > 200) {
      throw new BadRequestException('Invalid fileName');
    }
    if (!mimeType || !policy.allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException('File type is not allowed');
    }
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      throw new BadRequestException('Invalid sizeBytes');
    }
    if (sizeBytes > policy.maxBytes) {
      throw new BadRequestException('File size exceeds limit');
    }

    req.presignResult = await this.uploadService.presignUpload({
      userId,
      fileName,
      mimeType,
      sizeBytes,
      policy,
    });

    return next.handle();
  }
}
