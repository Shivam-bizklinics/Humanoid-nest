import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { PermissionGeneratorService } from '../../../shared/services/permission-generator.service';

@Injectable()
export class PermissionSeederService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly permissionGeneratorService: PermissionGeneratorService,
  ) {}

  /**
   * Seed all permissions into the database
   */
  async seedAllPermissions(): Promise<void> {
    const allPermissionsData = this.permissionGeneratorService.generateAllPermissions();

    for (const permData of allPermissionsData) {
      let permission = await this.permissionRepository.findOne({
        where: { name: permData.name },
      });

      if (!permission) {
        permission = this.permissionRepository.create({
          name: permData.name,
          description: permData.description,
          resource: permData.resource,
          action: permData.action,
          isActive: true,
        });
        await this.permissionRepository.save(permission);
      }
    }
  }

  /**
   * Seed permissions for a specific resource
   */
  async seedResourcePermissions(resource: string): Promise<void> {
    const resourcePermissions = this.permissionGeneratorService.generateResourcePermissions(resource as any);

    for (const permData of resourcePermissions) {
      let permission = await this.permissionRepository.findOne({
        where: { name: permData.name },
      });

      if (!permission) {
        permission = this.permissionRepository.create({
          name: permData.name,
          description: permData.description,
          resource: permData.resource,
          action: permData.action,
          isActive: true,
        });
        await this.permissionRepository.save(permission);
      }
    }
  }

  /**
   * Get all permissions from database
   */
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { isActive: true },
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  /**
   * Get permissions by resource
   */
  async getPermissionsByResource(resource: string): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { resource, isActive: true },
      order: { action: 'ASC' },
    });
  }

  /**
   * Get permissions by action
   */
  async getPermissionsByAction(action: string): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { action, isActive: true },
      order: { resource: 'ASC' },
    });
  }

  /**
   * Check if permission exists
   */
  async permissionExists(name: string): Promise<boolean> {
    const permission = await this.permissionRepository.findOne({
      where: { name },
    });
    return !!permission;
  }

  /**
   * Create a specific permission
   */
  async createPermission(
    name: string,
    description: string,
    resource: string,
    action: string,
  ): Promise<Permission> {
    const permission = this.permissionRepository.create({
      name,
      description,
      resource,
      action,
      isActive: true,
    });

    return this.permissionRepository.save(permission);
  }
}
