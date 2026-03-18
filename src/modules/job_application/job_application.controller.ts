import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JobApplicationService } from './job_application.service';
import { CreateJobApplicationDto } from './dto/create-job_application.dto';
import { UpdateJobApplicationDto } from './dto/update-job_application.dto';
import type { Request } from 'express';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/admin.decorator';
import { Role } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

type RequestWithUser = Request & { user?: { sub?: number; role?: Role } };

@Controller('job-application')
export class JobApplicationController {
  constructor(
    private readonly jobApplicationService: JobApplicationService,
  ) {}

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.CANDIDATE)
  @Post('apply')
  async apply(
    @Body() dto: CreateJobApplicationDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Missing user context');
    return this.jobApplicationService.apply(dto, userId);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.CANDIDATE)
  @Get('my')
  myApplications(@Req() req: RequestWithUser) {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Missing user context');
    return this.jobApplicationService.listMyApplications(userId);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Get('job/:jobId')
  applicationsForJob(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.sub;
    const role = req.user?.role;
    if (!userId || !role)
      throw new UnauthorizedException('Missing user context');
    return this.jobApplicationService.listApplicationsForJob(
      jobId,
      userId,
      role,
    );
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const userId = req.user?.sub;
    const role = req.user?.role;
    if (!userId || !role)
      throw new UnauthorizedException('Missing user context');
    return this.jobApplicationService.findOne(id, userId, role);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobApplicationDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.sub;
    const role = req.user?.role;
    if (!userId || !role)
      throw new UnauthorizedException('Missing user context');
    return this.jobApplicationService.updateStatus(id, dto, userId, role);
  }
}
