import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../auth/entities/role.entity';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async create(createUserDto: CreateUserDto) {
    const readerRole = await this.roleRepository.findOneBy({ name: 'reader' });
    if (!readerRole) {
      throw new InternalServerErrorException('Role "reader" not initialized');
    }

    const userName = createUserDto.email.substring(
      0,
      createUserDto.email.lastIndexOf('@'),
    );

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const newUser = this.usersRepository.create({
      email: createUserDto.email,
      username: userName,
      passwordHash: hashedPassword,
      role: readerRole,
    });

    return await this.usersRepository.save(newUser);
  }
  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
