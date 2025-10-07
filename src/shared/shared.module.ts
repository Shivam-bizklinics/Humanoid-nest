import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionGeneratorService } from './services/permission-generator.service';
import { AuthService } from './services/auth.service';
import { UserRepository } from '../modules/authentication/repositories/user.repository';
import { User } from '../modules/authentication/entities/user.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    PermissionGeneratorService,
    AuthService,
    UserRepository,
  ],
  exports: [
    PermissionGeneratorService,
    AuthService,
    UserRepository,
    JwtModule,
  ],
})
export class SharedModule {}
