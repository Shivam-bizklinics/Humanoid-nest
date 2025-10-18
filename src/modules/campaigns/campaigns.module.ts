import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { Post } from './entities/post.entity';
import { ContentPillar } from './entities/content-pillar.entity';
import { CampaignQuestion } from './entities/campaign-question.entity';
import { CampaignQuestionResponse } from './entities/campaign-question-response.entity';
import { CampaignService } from './services/campaign.service';
import { CampaignQuestionService } from './services/campaign-question.service';
import { CampaignController } from './controllers/campaign.controller';
import { CampaignQuestionController } from './controllers/campaign-question.controller';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, Post, ContentPillar, CampaignQuestion, CampaignQuestionResponse]),
    RbacModule,
  ],
  controllers: [CampaignController, CampaignQuestionController],
  providers: [CampaignService, CampaignQuestionService],
  exports: [CampaignService, CampaignQuestionService],
})
export class CampaignsModule {}
