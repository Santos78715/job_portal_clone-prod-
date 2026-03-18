import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PasswordUtils } from 'src/utils/password';
import { Token } from 'src/utils/token';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RedisService } from 'src/common/redis/job/cache.service';
import { RateLimitGuard } from 'src/common/rate_limit/rate_limit.guard';
import { CloudinaryService } from 'src/utils/cloudinary';
import { AWSS3Service } from 'src/common/presign_url/s3-storage.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [
    UserService,
    PasswordUtils,
    Token,
    AuthGuard,
    RedisService,
    RateLimitGuard,
    CloudinaryService,
    AWSS3Service,
  ],
})
export class UserModule {}
