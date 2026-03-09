import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,

    private readonly usersService: UsersService,
  ) {}

  async login(user: User, ipAddress?: string, userAgent?: string) {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(plainToken)
      .digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = this.sessionRepo.create({
      user,
      tokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    });

    await this.sessionRepo.save(session);

    return {
      accessToken: plainToken,
      user: { id: user.id, username: user.username, email: user.email },
    };
  }
  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (isMatch) {
      return user;
    }
    return null;
  }
  async validateSession(plainToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(plainToken)
      .digest('hex');

    const session = await this.sessionRepo.findOne({
      where: { tokenHash: tokenHash },
      relations: ['user', 'user.role'], // Join user and role for authorization
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) await this.sessionRepo.remove(session); // Cleanup expired
      throw new UnauthorizedException('Invalid or expired session');
    }

    return session.user;
  }

  async logout(plainToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(plainToken)
      .digest('hex');
    await this.sessionRepo.delete({ tokenHash: tokenHash });
    return { message: 'Logged out successfully' };
  }
}
