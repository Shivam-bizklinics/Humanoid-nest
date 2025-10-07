import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
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
import { UserRepository } from '../authentication/repositories/user.repository';
import { AuthService } from '../../shared/services/auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission, 
      UserWorkspace, 
      UserWorkspacePermission,
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
  controllers: [UserWorkspacePermissionController, PermissionSeederController],
  providers: [
    UserWorkspacePermissionService,
    UserWorkspacePermissionGuard,
    PermissionSeederService,
    UserRepository,
    AuthService,
  ],
  exports: [
    UserWorkspacePermissionService,
    UserWorkspacePermissionGuard,
    PermissionSeederService,
    UserRepository,
    AuthService,
    JwtModule,
  ],
})
export class RbacModule {}
