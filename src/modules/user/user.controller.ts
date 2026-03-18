import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { RateLimitGuard } from 'src/common/rate_limit/rate_limit.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/admin.decorator';
import { Role } from '@prisma/client';
import { AWSS3Service } from 'src/common/presign_url/s3-storage.service';

type RequestWithCookies = Request & {
  cookies: Record<string, string | undefined>;
};

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private awsService: AWSS3Service,
  ) {}

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Get()
  listUsers(@Query() query: ListUsersDto) {
    return this.userService.findAll(query);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

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

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Patch('/update')
  updateUser(@Body() updateUser: UpdateUserDto) {
    return this.userService.updateUser(updateUser);
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

  @Post('/upload/url')
  async uploadImage() {
    const bucketName = process.env.AWS_USER_BUCKET_NAME;
    const url = await this.awsService.getPresignedUrl(
      bucketName!,
      'users/125/resume.pdf',
    );
    return url;
  }
}
