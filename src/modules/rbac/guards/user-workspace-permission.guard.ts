import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserWorkspacePermissionService } from '../services/user-workspace-permission.service';
import { PERMISSION_KEY, PermissionMetadata } from '../../../shared/decorators/permission.decorator';
import { UserRepository } from '../../authentication/repositories/user.repository';

@Injectable()
export class UserWorkspacePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly userWorkspacePermissionService: UserWorkspacePermissionService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<PermissionMetadata>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    if (!permission) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    
    // Extract user from Bearer token
    const user = await this.getUserFromToken(request);

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Attach user to request for later use
    request.user = user;

    // Get workspace ID from request parameters
    const workspaceId = this.getWorkspaceIdFromRequest(request, permission);
    
    // Handle workspace creation scenarios where workspaceId might be null
    if (!workspaceId) {
      // For workspace creation, we need to check if user has global workspace creation permission
      if (permission.resource === 'workspace' && permission.action === 'create') {
        // For now, allow all authenticated users to create workspaces
        // You can implement more specific logic here if needed
        if (user.id === user.createdBy) {
          return true;
        }
        return false;
      }
      
      throw new ForbiddenException('Workspace ID not found in request');
    }

    // Check if user has the required permission in the workspace
    const hasPermission = await this.userWorkspacePermissionService.userHasPermission(
      user.id,
      workspaceId,
      permission.resource,
      permission.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions: ${permission.action} on ${permission.resource} in workspace ${workspaceId}`,
      );
    }

    return true;
  }

  private getWorkspaceIdFromRequest(request: any, permission: PermissionMetadata): string | null {
    // Try different ways to get workspace ID from request
    
    // 1. From URL parameters (e.g., /workspaces/:workspaceId/campaigns)
    if (request.params.workspaceId) {
      return request.params.workspaceId;
    }

    // 2. From query parameters (e.g., ?workspaceId=123)
    if (request.query.workspaceId) {
      return request.query.workspaceId;
    }

    // 3. From request body
    if (request.body && request.body.workspaceId) {
      return request.body.workspaceId;
    }

    // 4. From headers
    if (request.headers['x-workspace-id']) {
      return request.headers['x-workspace-id'];
    }

    // 5. For workspace-specific resources, try to extract from URL
    // e.g., /workspaces/123/campaigns -> workspaceId = 123
    const urlParts = request.url.split('/');
    const workspaceIndex = urlParts.findIndex(part => part === 'workspaces');
    if (workspaceIndex !== -1 && workspaceIndex + 1 < urlParts.length) {
      return urlParts[workspaceIndex + 1];
    }

    return null;
  }

  private async getUserFromToken(request: any): Promise<any> {
    try {
      // Extract token from Authorization header
      const authHeader = request.headers.authorization;
      
      if (!authHeader) {
        throw new UnauthorizedException('Authorization header not found');
      }

      // Check if it's a Bearer token
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new UnauthorizedException('Invalid authorization header format. Expected: Bearer <token>');
      }

      const token = parts[1];

      // Verify and decode the JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
      });

      // Get user from database using the payload
      const user = await this.userRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Remove password from user object for security
      delete user.password;

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
