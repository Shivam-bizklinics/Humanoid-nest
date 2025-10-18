import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PlatformAsset } from '../entities';
import { AssetType } from '../enums';

@Injectable()
export class PlatformAssetRepository extends Repository<PlatformAsset> {
  constructor(private dataSource: DataSource) {
    super(PlatformAsset, dataSource.createEntityManager());
  }

  /**
   * Find assets by business manager and type
   */
  async findByBusinessManagerAndType(
    businessManagerId: string,
    assetType?: string,
  ): Promise<PlatformAsset[]> {
    const query = this.createQueryBuilder('asset')
      .where('asset.businessManagerId = :businessManagerId', { businessManagerId });

    if (assetType) {
      query.andWhere('asset.assetType = :assetType', { assetType });
    }

    return query
      .orderBy('asset.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Find assets by workspace
   */
  async findByWorkspace(workspaceId: string): Promise<PlatformAsset[]> {
    return this.find({
      where: { workspaceId },
      relations: ['businessManager'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find ad accounts with workspace
   */
  async findAdAccountsWithWorkspace(workspaceId: string): Promise<PlatformAsset[]> {
    return this.find({
      where: {
        workspaceId,
        assetType: AssetType.AD_ACCOUNT,
      },
      order: { createdAt: 'DESC' },
    });
  }
}

