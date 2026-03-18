import { Injectable } from '@nestjs/common';
import { CreateRecruiterDto } from './dto/create-recruiter.dto';
import { UpdateRecruiterDto } from './dto/update-recruiter.dto';

@Injectable()
export class RecruiterService {
  create(_createRecruiterDto: CreateRecruiterDto) {
    void _createRecruiterDto;
    return 'This action adds a new recruiter';
  }

  findAll() {
    return `This action returns all recruiter`;
  }

  findOne(id: number) {
    return `This action returns a #${id} recruiter`;
  }

  update(id: number, _updateRecruiterDto: UpdateRecruiterDto) {
    void _updateRecruiterDto;
    return `This action updates a #${id} recruiter`;
  }

  remove(id: number) {
    return `This action removes a #${id} recruiter`;
  }
}
