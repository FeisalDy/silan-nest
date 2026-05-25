import { SetMetadata } from '@nestjs/common';

export const IS_INTERNAL_TOKEN_KEY = 'isInternalToken';
export const InternalToken = () => SetMetadata(IS_INTERNAL_TOKEN_KEY, true);
