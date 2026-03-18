import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import type { Request } from 'express';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/admin.decorator';
import { Role } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

type RequestWithUser = Request & { user?: { sub?: number } };

@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Post('create')
  create(@Body() createJobDto: CreateJobDto, @Req() req: RequestWithUser) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Missing user context');
    }
    return this.jobService.create(createJobDto, userId);
  }

  @Get()
  listJobs(@Query() query: ListJobsDto) {
    return this.jobService.list(query);
  }

  @Get('search')
  searchJobs(@Query() query: ListJobsDto) {
    return this.jobService.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobService.findOne(id);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobService.update(id, updateJobDto);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.jobService.remove(id);
  }
}
