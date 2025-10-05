import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/authentication/entities/user.entity';

/**
 * Custom decorator to extract the current user from the request
 * Usage: @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

