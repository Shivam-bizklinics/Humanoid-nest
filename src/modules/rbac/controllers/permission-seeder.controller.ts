import { Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionSeederService } from '../services/permission-seeder.service';

@ApiTags('Permission Seeder')
@ApiBearerAuth()
@Controller('permissions/seeder')
export class PermissionSeederController {
  constructor(
    private readonly permissionSeederService: PermissionSeederService,
  ) {}

  @Post('seed-all')
  @ApiOperation({ summary: 'Seed all permissions' })
  @ApiResponse({ status: 201, description: 'All permissions seeded successfully' })
  async seedAllPermissions() {
    await this.permissionSeederService.seedAllPermissions();
    return {
      success: true,
      message: 'All permissions seeded successfully'
    };
  }

  @Post('seed-resource/:resource')
  @ApiOperation({ summary: 'Seed permissions for specific resource' })
  @ApiResponse({ status: 201, description: 'Resource permissions seeded successfully' })
  async seedResourcePermissions(@Param('resource') resource: string) {
    await this.permissionSeederService.seedResourcePermissions(resource);
    return {
      success: true,
      message: `Permissions for resource '${resource}' seeded successfully`
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'All permissions retrieved successfully' })
  async getAllPermissions() {
    const permissions = await this.permissionSeederService.getAllPermissions();
    return {
      success: true,
      data: permissions,
      message: 'All permissions retrieved successfully'
    };
  }

  @Get('resource/:resource')
  @ApiOperation({ summary: 'Get permissions by resource' })
  @ApiResponse({ status: 200, description: 'Resource permissions retrieved successfully' })
  async getPermissionsByResource(@Param('resource') resource: string) {
    const permissions = await this.permissionSeederService.getPermissionsByResource(resource);
    return {
      success: true,
      data: permissions,
      message: `Permissions for resource '${resource}' retrieved successfully`
    };
  }

  @Get('action/:action')
  @ApiOperation({ summary: 'Get permissions by action' })
  @ApiResponse({ status: 200, description: 'Action permissions retrieved successfully' })
  async getPermissionsByAction(@Param('action') action: string) {
    const permissions = await this.permissionSeederService.getPermissionsByAction(action);
    return {
      success: true,
      data: permissions,
      message: `Permissions for action '${action}' retrieved successfully`
    };
  }
}
