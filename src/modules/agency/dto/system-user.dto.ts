import { IsString, IsEnum, IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SystemUserRole, Platform } from '../enums';

export class CreateSystemUserDto {
  @ApiProperty()
  @IsUUID()
  businessManagerId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: SystemUserRole })
  @IsEnum(SystemUserRole)
  role: SystemUserRole;

  @ApiProperty({ enum: Platform, default: Platform.META })
  @IsEnum(Platform)
  platform: Platform;
}

export class GenerateSystemUserTokenDto {
  @ApiProperty()
  @IsUUID()
  systemUserId: string;

  @ApiProperty()
  @IsString()
  appId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  scope: string[];
}

