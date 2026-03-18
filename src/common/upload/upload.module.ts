import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { AWSS3Service } from 'src/common/presign_url/s3-storage.service';
import { PresignUploadInterceptor } from 'src/common/presign_url/presign-upload.interceptor';
import { Token } from 'src/utils/token';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RedisService } from 'src/common/redis/job/cache.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    AWSS3Service,
    PresignUploadInterceptor,
    Token,
    AuthGuard,
    RedisService,
  ],
})
export class UploadModule {}
