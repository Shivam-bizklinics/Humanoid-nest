import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SocialMediaAuthService } from '../services/social-media-auth.service';

@Injectable()
export class SocialMediaAuthGuard implements CanActivate {
  constructor(private readonly authService: SocialMediaAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Extract account ID from request
    const accountId = this.getAccountIdFromRequest(request);
    if (!accountId) {
      throw new UnauthorizedException('Account ID required');
    }

    // Check if account is authenticated
    const isAuthenticated = await this.authService.isAccountAuthenticated(accountId);
    if (!isAuthenticated) {
      throw new UnauthorizedException('Social media account not authenticated');
    }

    return true;
  }

  private getAccountIdFromRequest(request: any): string | null {
    // Try different ways to get account ID from request
    
    // 1. From URL parameters
    if (request.params.accountId) {
      return request.params.accountId;
    }

    // 2. From query parameters
    if (request.query.accountId) {
      return request.query.accountId;
    }

    // 3. From request body
    if (request.body && request.body.accountId) {
      return request.body.accountId;
    }

    // 4. From headers
    if (request.headers['x-account-id']) {
      return request.headers['x-account-id'];
    }

    return null;
  }
}
