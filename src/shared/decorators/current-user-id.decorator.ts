import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Decorator to extract user ID from request
 * This works with the UserWorkspacePermissionGuard which attaches user to request.user
 * Usage: @CurrentUserId() userId: string
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    
    if (!request.user || !request.user.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    
    return request.user.id;
  },
);

/**
 * Decorator to extract full user object from request
 * This works with the UserWorkspacePermissionGuard which attaches user to request.user
 * Usage: @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    
    return request.user;
  },
);
