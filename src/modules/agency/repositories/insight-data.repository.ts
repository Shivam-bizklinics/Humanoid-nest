import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Between } from 'typeorm';
import { InsightData } from '../entities';

@Injectable()
export class InsightDataRepository extends Repository<InsightData> {
  constructor(private dataSource: DataSource) {
    super(InsightData, dataSource.createEntityManager());
  }

  /**
   * Find insights by workspace and date range
   */
  async findByWorkspaceAndDateRange(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
    level?: string,
  ): Promise<InsightData[]> {
    const query = this.createQueryBuilder('insight')
      .where('insight.workspaceId = :workspaceId', { workspaceId })
      .andWhere('insight.reportDate BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (level) {
      query.andWhere('insight.insightLevel = :level', { level });
    }

    return query
      .orderBy('insight.reportDate', 'DESC')
      .getMany();
  }

  /**
   * Get aggregated metrics for workspace
   */
  async getAggregatedMetrics(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    return this.createQueryBuilder('insight')
      .select('SUM(insight.spend)', 'totalSpend')
      .addSelect('SUM(insight.impressions)', 'totalImpressions')
      .addSelect('SUM(insight.clicks)', 'totalClicks')
      .addSelect('SUM(insight.reach)', 'totalReach')
      .addSelect('SUM(insight.conversions)', 'totalConversions')
      .where('insight.workspaceId = :workspaceId', { workspaceId })
      .andWhere('insight.reportDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();
  }

  /**
   * Find insights by campaign
   */
  async findByCampaign(
    campaignPlatformId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<InsightData[]> {
    return this.find({
      where: {
        platformEntityId: campaignPlatformId,
        insightLevel: 'campaign',
        reportDate: Between(startDate, endDate),
      },
      order: { reportDate: 'DESC' },
    });
  }
}

