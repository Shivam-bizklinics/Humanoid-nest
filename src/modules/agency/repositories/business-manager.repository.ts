import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BusinessManager } from '../entities';

@Injectable()
export class BusinessManagerRepository extends Repository<BusinessManager> {
  constructor(private dataSource: DataSource) {
    super(BusinessManager, dataSource.createEntityManager());
  }

  /**
   * Find parent business managers
   */
  async findParentBusinessManagers(platform?: string): Promise<BusinessManager[]> {
    const query = this.createQueryBuilder('bm')
      .where('bm.parentBusinessManagerId IS NULL')
      .andWhere('bm.type = :type', { type: 'parent' });

    if (platform) {
      query.andWhere('bm.platform = :platform', { platform });
    }

    return query.getMany();
  }

  /**
   * Find business managers by user
   */
  async findByUser(userId: string): Promise<BusinessManager[]> {
    return this.find({
      where: { userId },
      relations: ['parentBusinessManager'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find child business managers
   */
  async findChildren(parentBusinessManagerId: string): Promise<BusinessManager[]> {
    return this.find({
      where: { parentBusinessManagerId },
      order: { createdAt: 'DESC' },
    });
  }
}

