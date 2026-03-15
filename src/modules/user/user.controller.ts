import { Controller, Post, Body, Res, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { RateLimitGuard } from 'src/common/rate_limit/rate_limit.guard';
import { CloudinaryService } from 'src/utils/cloudinary';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

type RequestWithCookies = Request & {
  cookies: Record<string, string | undefined>;
};

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private ratelimitGuard: RateLimitGuard,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Post('/register')
  registerUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @UseGuards(RateLimitGuard)
  @Post('/login')
  loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.userService.loginUser(loginUserDto, response);
  }

  @Post('/refresh')
  refreshTokens(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userService.refresh(req, res);
  }

  @Post('/logout')
  logout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userService.logOut(req, res);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('/upload')
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    let upload = await this.cloudinaryService.uploadFile(file);
    return upload;
  }
}
