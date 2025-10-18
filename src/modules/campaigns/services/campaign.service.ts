import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { SystemContentPillar, SYSTEM_CONTENT_PILLAR_DISPLAY } from '../../../shared/enums/campaign.enum';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
  ) {}

  /**
   * Get all available system content pillars
   */
  async getSystemContentPillars(): Promise<SystemContentPillar[]> {
    return Object.values(SystemContentPillar);
  }

  /**
   * Get system content pillars with display names
   */
  async getSystemContentPillarsWithDisplayNames(): Promise<Array<{value: string, label: string}>> {
    return Object.values(SystemContentPillar).map(pillar => ({
      value: pillar,
      label: SYSTEM_CONTENT_PILLAR_DISPLAY[pillar] || pillar
    }));
  }

  /**
   * Get campaign by ID with enhanced pillar information
   */
  async getCampaignWithPillars(campaignId: string): Promise<{
    campaign: Campaign;
    selectedContentPillars: string[];
    availableSystemPillars: SystemContentPillar[];
  }> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId }
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const availableSystemPillars = await this.getSystemContentPillars();

    return {
      campaign,
      selectedContentPillars: campaign.contentPillars || [],
      availableSystemPillars
    };
  }

  /**
   * Create a new campaign
   */
  async createCampaign(campaignData: Partial<Campaign>): Promise<Campaign> {
    const campaign = this.campaignRepository.create(campaignData);
    return this.campaignRepository.save(campaign);
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, updateData: Partial<Campaign>): Promise<Campaign> {
    await this.campaignRepository.update(campaignId, updateData);
    return this.getCampaignById(campaignId);
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId }
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  /**
   * Get all campaigns for a workspace
   */
  async getWorkspaceCampaigns(workspaceId: string): Promise<Campaign[]> {
    return this.campaignRepository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Delete campaign (soft delete)
   */
  async deleteCampaign(campaignId: string): Promise<boolean> {
    const result = await this.campaignRepository.softDelete(campaignId);
    return result.affected > 0;
  }
}
