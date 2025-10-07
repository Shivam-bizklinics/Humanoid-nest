import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../modules/authentication/repositories/user.repository';

@Injectable()
export class AuthService {
  private impersonationService?: any;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Extract user from Bearer token in request headers
   * @param request - Express request object
   * @returns Promise<User> - User object without password
   */
  async getUserFromToken(request: any): Promise<any> {
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

      // Check for impersonation context
      const impersonationContext = await this.getImpersonationContext(user.id);
      if (impersonationContext) {
        // Return the impersonated user but keep impersonation metadata
        return {
          ...impersonationContext.impersonatedUser,
          _impersonationContext: {
            isImpersonated: true,
            impersonator: impersonationContext.impersonator,
            sessionId: impersonationContext.session.id,
            startedAt: impersonationContext.session.startedAt,
          },
        };
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extract user ID from Bearer token in request headers
   * @param request - Express request object
   * @returns Promise<string> - User ID
   */
  async getUserIdFromToken(request: any): Promise<string> {
    const user = await this.getUserFromToken(request);
    return user.id;
  }

  /**
   * Extract and attach user to request object
   * @param request - Express request object
   * @returns Promise<User> - User object
   */
  async extractAndAttachUser(request: any): Promise<any> {
    const user = await this.getUserFromToken(request);
    request.user = user;
    return user;
  }

  /**
   * Set impersonation service (used by dependency injection)
   * @param impersonationService - The impersonation service instance
   */
  setImpersonationService(impersonationService: any): void {
    this.impersonationService = impersonationService;
  }

  /**
   * Get impersonation context for a user
   * @param userId - User ID to check for impersonation
   * @returns Promise<any> - Impersonation context or null
   */
  private async getImpersonationContext(userId: string): Promise<any> {
    try {
      // Check if impersonation service is available
      if (!this.impersonationService) {
        return null;
      }

      // Get the impersonation context from the service
      const context = await this.impersonationService.getImpersonationContext(userId);
      
      return context;
    } catch (error) {
      // If there's an error getting impersonation context, log it but don't fail
      // This ensures that authentication still works even if impersonation service is unavailable
      console.warn('Failed to get impersonation context:', error.message);
      return null;
    }
  }
}
