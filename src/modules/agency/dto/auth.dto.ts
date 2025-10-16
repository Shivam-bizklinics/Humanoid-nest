import { IsString, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Platform } from '../enums';

export class ExchangeTokenDto {
  @ApiProperty()
  @IsString()
  shortLivedToken: string;
}

export class ExchangeCodeDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  redirectUri: string;
}

export class GetAuthorizationUrlDto {
  @ApiProperty()
  @IsString()
  redirectUri: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  scopes: string[];
}

export class DebugTokenDto {
  @ApiProperty()
  @IsString()
  accessToken: string;
}

export class GetUserPermissionsDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  accessToken: string;
}

