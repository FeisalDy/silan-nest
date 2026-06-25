import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class InternalTokenGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();

        const internalToken = request.headers['x-internal-token'];
        const expectedToken =
            this.configService.get<string>('INTERNAL_API_TOKEN');

        if (!expectedToken) {
            throw new UnauthorizedException(
                'Internal API security token is not configured.'
            );
        }

        if (internalToken !== expectedToken) {
            throw new UnauthorizedException(
                'Invalid internal communication token.'
            );
        }

        return true;
    }
}
