import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateJobApplicationDto } from './dto/create-job_application.dto';
import { UpdateJobApplicationDto } from './dto/update-job_application.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplicationStatus, Role } from '@prisma/client';

@Injectable()
export class JobApplicationService {
  constructor(private prisma: PrismaService) {}

  async apply(dto: CreateJobApplicationDto, applicantId: number) {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      select: { id: true, isActive: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (!job.isActive) throw new BadRequestException('Job is not active');

    try {
      const application = await this.prisma.jobApplication.create({
        data: {
          jobId: dto.jobId,
          applicantId,
          resumeUrl: dto.resumeUrl,
          status: ApplicationStatus.PENDING,
        },
        select: {
          id: true,
          jobId: true,
          applicantId: true,
          resumeUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        message: 'Applied successfully',
        id: application.id,
        data: application,
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 'P2002'
      ) {
        throw new BadRequestException('You have already applied to this job');
      }
      throw error;
    }
  }

  async listMyApplications(applicantId: number) {
    const applications = await this.prisma.jobApplication.findMany({
      where: { applicantId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            salary: true,
            jobType: true,
            company: { select: { id: true, name: true, registrationId: true } },
          },
        },
      },
    });

    return { data: applications };
  }

  async listApplicationsForJob(
    jobId: number,
    requesterId: number,
    requesterRole: Role,
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, userId: true },
    });
    if (!job) throw new NotFoundException('Job not found');

    const isAdmin = requesterRole === Role.ADMIN;
    const isOwnerRecruiter = job.userId === requesterId;
    if (!isAdmin && !isOwnerRecruiter) {
      throw new ForbiddenException('Not allowed to view applications for this job');
    }

    const applications = await this.prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            phone: true,
            profileImage: true,
            bio: true,
          },
        },
      },
    });

    return { data: applications };
  }

  async findOne(id: number, requesterId: number, requesterRole: Role) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: {
        job: { select: { id: true, title: true, userId: true } },
        applicant: {
          select: { id: true, email: true, firstname: true, lastname: true },
        },
      },
    });

    if (!application) throw new NotFoundException('Application not found');

    const isAdmin = requesterRole === Role.ADMIN;
    const isApplicant = application.applicantId === requesterId;
    const isJobOwner = application.job.userId === requesterId;

    if (!isAdmin && !isApplicant && !isJobOwner) {
      throw new ForbiddenException('Not allowed to view this application');
    }

    return { data: application };
  }

  async updateStatus(
    id: number,
    dto: UpdateJobApplicationDto,
    requesterId: number,
    requesterRole: Role,
  ) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: { job: { select: { userId: true } } },
    });
    if (!application) throw new NotFoundException('Application not found');

    const isAdmin = requesterRole === Role.ADMIN;
    const isJobOwner = application.job.userId === requesterId;
    if (!isAdmin && !isJobOwner) {
      throw new ForbiddenException('Not allowed to update this application');
    }

    const updated = await this.prisma.jobApplication.update({
      where: { id },
      data: { status: dto.status },
      select: {
        id: true,
        jobId: true,
        applicantId: true,
        resumeUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { message: 'Status updated', id: updated.id, data: updated };
  }
}
