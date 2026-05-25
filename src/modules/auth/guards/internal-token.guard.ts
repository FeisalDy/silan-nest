import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_INTERNAL_TOKEN_KEY } from '../decorators/internal-token.decorator';

@Injectable()
export class InternalTokenGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isInternalRoute = this.reflector.getAllAndOverride<boolean>(
      IS_INTERNAL_TOKEN_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!isInternalRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const internalToken = request.headers['x-internal-token'];
    const expectedToken = this.configService.get<string>('INTERNAL_API_TOKEN');

    if (!expectedToken) {
      throw new UnauthorizedException(
        'Internal API security token is not configured on the server.'
      );
    }

    if (internalToken !== expectedToken) {
      throw new UnauthorizedException('Invalid internal communication token.');
    }

    return true;
  }
}
