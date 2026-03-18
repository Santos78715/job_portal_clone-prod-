import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  Req,
  Param,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { PresignPolicy } from 'src/common/presign_url/presign-policy.decorator';
import { PresignUploadInterceptor } from 'src/common/presign_url/presign-upload.interceptor';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { UploadService } from './upload.service';

type RequestWithUser = Request & {
  user?: { sub?: number };
  presignResult?: unknown;
};

@Controller('uploads')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  // Resume uploads (S3 URL stored in DB, then use that URL in JobApplication.resumeUrl)
  @UseGuards(AuthGuard)
  @UseInterceptors(PresignUploadInterceptor)
  @PresignPolicy({
    folder: 'resumes',
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    expiresInSeconds: 300,
  })
  @Post('presign/resume')
  presignResume(@Body() _body: PresignUploadDto, @Req() req: RequestWithUser) {
    return req.presignResult;
  }

  @UseGuards(AuthGuard)
  @Post('complete/:id')
  complete(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Missing user context');
    return this.uploadService.markUploaded(id, userId);
  }
}
