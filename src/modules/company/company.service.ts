import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const companies = await this.prisma.company.findMany({
      select: {
        id: true,
        registrationId: true,
        name: true,
        totalEmployee: true,
        users: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            role: true,
            companyId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            salary: true,
            jobType: true,
            isActive: true,
            companyId: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return { data: companies };
  }

  async findOne(registrationId: string) {
    const company = await this.prisma.company.findUnique({
      where: { registrationId },
      select: {
        id: true,
        registrationId: true,
        name: true,
        totalEmployee: true,
        users: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            role: true,
            companyId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            salary: true,
            jobType: true,
            isActive: true,
            companyId: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!company) {
      throw new BadRequestException(
        "Company with the provided registration id does't exist !",
      );
    }

    return { data: company };
  }

  async create(createCompanyDto: CreateCompanyDto) {
    try {
      const company = await this.prisma.company.create({
        data: {
          registrationId: createCompanyDto.registrationId,
          name: createCompanyDto.name,
          totalEmployee: createCompanyDto.totalEmployee,
        },
        select: {
          id: true,
          registrationId: true,
          name: true,
        },
      });

      return {
        message: 'Company has been registered successfully !',
        id: company.id,
        data: company,
      };
    } catch (error) {
      throw new BadRequestException("Couldn't register a company !");
    }
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    try {
      const companyExists = await this.prisma.company.findUnique({
        where: {
          registrationId: id,
        },
        select: { id: true },
      });

      if (!companyExists) {
        throw new BadRequestException(
          "Company with the provided registration id does't exist !",
        );
      }

      const updateCompany = await this.prisma.company.update({
        data: {
          registrationId: updateCompanyDto.registrationId,
          name: updateCompanyDto.name,
          totalEmployee: updateCompanyDto.totalEmployee,
        },
        where: {
          registrationId: id,
        },
        select: {
          id: true,
          registrationId: true,
          name: true,
          totalEmployee: true,
        },
      });

      return {
        message: 'Company has been updated successfully !',
        id: updateCompany.id,
        data: updateCompany,
      };
    } catch (error) {
      throw new BadRequestException("Couldn't update company. Please try again.");
    }
  }

  async remove(id: string) {
    try {
      const deleteCompany = await this.prisma.company.delete({
        where: {
          registrationId: id,
        },
        select: { id: true, registrationId: true, name: true },
      });

      if (!deleteCompany) {
        throw new BadRequestException(
          "Couldn't delete a company! Please try again..",
        );
      }

      return {
        message: 'Company deleted successfully',
        id: deleteCompany.id,
        data: deleteCompany,
      };
    } catch (error) {
      throw new BadRequestException(
        "Couldn't delete a company! Please try again..",
      );
    }
  }
}
