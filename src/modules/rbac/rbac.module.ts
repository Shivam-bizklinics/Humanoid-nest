import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Permission } from './entities/permission.entity';
import { UserWorkspace } from './entities/user-workspace.entity';
import { UserWorkspacePermission } from './entities/user-workspace-permission.entity';
import { User } from '../authentication/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { UserWorkspacePermissionService } from './services/user-workspace-permission.service';
import { UserWorkspacePermissionGuard } from './guards/user-workspace-permission.guard';
import { UserWorkspacePermissionController } from './controllers/user-workspace-permission.controller';
import { PermissionSeederService } from './services/permission-seeder.service';
import { PermissionSeederController } from './controllers/permission-seeder.controller';
import { ImpersonationSession } from './entities/impersonation-session.entity';
import { ImpersonationService } from './services/impersonation.service';
import { ImpersonationController } from './controllers/impersonation.controller';
import { UserRepository } from '../authentication/repositories/user.repository';
import { AuthService } from '../../shared/services/auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission, 
      UserWorkspace, 
      UserWorkspacePermission,
      ImpersonationSession,
      User,
      Workspace
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserWorkspacePermissionController, PermissionSeederController, ImpersonationController],
  providers: [
    UserWorkspacePermissionService,
    UserWorkspacePermissionGuard,
    PermissionSeederService,
    ImpersonationService,
    UserRepository,
    {
      provide: AuthService,
      useFactory: (
        jwtService: JwtService,
        configService: ConfigService,
        userRepository: UserRepository,
        impersonationService: ImpersonationService,
      ) => {
        const authService = new AuthService(jwtService, configService, userRepository);
        // Inject the impersonation service using the setter method
        authService.setImpersonationService(impersonationService);
        return authService;
      },
      inject: [JwtService, ConfigService, UserRepository, ImpersonationService],
    },
  ],
  exports: [
    UserWorkspacePermissionService,
    UserWorkspacePermissionGuard,
    PermissionSeederService,
    ImpersonationService,
    UserRepository,
    AuthService,
    JwtModule,
  ],
})
export class RbacModule {}
