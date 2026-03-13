import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../common/constants/role.constant';

@Controller('users')
@Roles(Role.EDITOR, Role.READER)
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get()
  findAll() {
    return 'This action returns all users';
  }
}
