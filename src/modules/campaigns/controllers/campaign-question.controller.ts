import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserWorkspacePermissionGuard } from '../../rbac/guards/user-workspace-permission.guard';
import { RequirePermission } from '../../../shared/decorators/permission.decorator';
import { CurrentUserId } from '../../../shared/decorators/current-user-id.decorator';
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';
import { CampaignQuestionService } from '../services/campaign-question.service';
import {
  CreateCampaignQuestionDto,
  UpdateCampaignQuestionDto,
  
} from '../dto/campaign-question.dto';
import { SubmitQuestionnaireDto } from '../dto/campaign-question-response.dto';

@ApiTags('Campaign Questionnaire')
@ApiBearerAuth()
@Controller('campaign-questions')
@UseGuards(UserWorkspacePermissionGuard)
export class CampaignQuestionController {
  constructor(private readonly campaignQuestionService: CampaignQuestionService) {}

  // Admin endpoints for managing questions
  @Post()
  @RequirePermission(Resource.CAMPAIGN, Action.CREATE)
  @ApiOperation({ summary: 'Create a new campaign question' })
  @ApiResponse({ status: 201, description: 'Campaign question created successfully' })
  async createQuestion(@Body() createDto: CreateCampaignQuestionDto, @CurrentUserId() userId: string) {
    const question = await this.campaignQuestionService.createQuestion({
      ...createDto,
      createdBy: userId,
    });

    return {
      success: true,
      data: question,
      message: 'Campaign question created successfully',
    };
  }

  @Put(':questionId')
  @RequirePermission(Resource.CAMPAIGN, Action.UPDATE)
  @ApiOperation({ summary: 'Update a campaign question' })
  @ApiResponse({ status: 200, description: 'Campaign question updated successfully' })
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() updateDto: UpdateCampaignQuestionDto,
    @CurrentUserId() userId: string,
  ) {
    const question = await this.campaignQuestionService.updateQuestion(questionId, {
      ...updateDto,
      updatedBy: userId,
    });

    return {
      success: true,
      data: question,
      message: 'Campaign question updated successfully',
    };
  }

  @Delete(':questionId')
  @RequirePermission(Resource.CAMPAIGN, Action.DELETE)
  @ApiOperation({ summary: 'Delete a campaign question' })
  @ApiResponse({ status: 200, description: 'Campaign question deleted successfully' })
  async deleteQuestion(@Param('questionId') questionId: string) {
    const deleted = await this.campaignQuestionService.deleteQuestion(questionId);

    return {
      success: deleted,
      message: deleted ? 'Campaign question deleted successfully' : 'Campaign question not found',
    };
  }

  @Get()
  @RequirePermission(Resource.CAMPAIGN, Action.VIEW)
  @ApiOperation({ summary: 'Get all campaign questions' })
  @ApiResponse({ status: 200, description: 'List of campaign questions' })
  async getAllQuestions() {
    const questions = await this.campaignQuestionService.getAllQuestions();

    return {
      success: true,
      data: questions,
      message: 'Campaign questions retrieved successfully',
    };
  }

  @Get(':questionId')
  @RequirePermission(Resource.CAMPAIGN, Action.VIEW)
  @ApiOperation({ summary: 'Get a specific campaign question by ID' })
  @ApiResponse({ status: 200, description: 'Campaign question details' })
  async getQuestionById(@Param('questionId') questionId: string) {
    const question = await this.campaignQuestionService.getQuestionById(questionId);

    return {
      success: true,
      data: question,
      message: 'Campaign question retrieved successfully',
    };
  }

  @Put('reorder')
  @RequirePermission(Resource.CAMPAIGN, Action.UPDATE)
  @ApiOperation({ summary: 'Reorder campaign questions' })
  @ApiResponse({ status: 200, description: 'Questions reordered successfully' })
  async reorderQuestions(@Body() order: { id: string; displayOrder: number }[]) {
    await this.campaignQuestionService.reorderQuestions(order);

    return {
      success: true,
      message: 'Questions reordered successfully',
    };
  }

  // Campaign-specific endpoints for questionnaire responses
  @Get('campaigns/:campaignId/questionnaire')
  @RequirePermission(Resource.CAMPAIGN, Action.VIEW)
  @ApiOperation({ summary: 'Get campaign questionnaire with user responses' })
  @ApiResponse({ status: 200, description: 'Questionnaire retrieved successfully' })
  async getQuestionnaireForCampaign(@Param('campaignId') campaignId: string) {
    const questionnaire = await this.campaignQuestionService.getQuestionnaireForCampaign(campaignId);

    return {
      success: true,
      data: questionnaire,
      message: 'Questionnaire retrieved successfully',
    };
  }

  @Post('campaigns/:campaignId/questionnaire/submit')
  @RequirePermission(Resource.CAMPAIGN, Action.UPDATE)
  @ApiOperation({ summary: 'Submit questionnaire responses' })
  @ApiResponse({ status: 200, description: 'Questionnaire submitted successfully' })
  async submitQuestionnaire(
    @Param('campaignId') campaignId: string,
    @Body() submitDto: SubmitQuestionnaireDto,
    @CurrentUserId() userId: string,
  ) {
    const result = await this.campaignQuestionService.submitQuestionnaire(
      campaignId,
      submitDto.responses,
      userId,
    );

    return {
      success: result.success,
      message: result.message,
    };
  }

  @Get('campaigns/:campaignId/progress')
  @RequirePermission(Resource.CAMPAIGN, Action.VIEW)
  @ApiOperation({ summary: 'Get questionnaire completion progress' })
  @ApiResponse({ status: 200, description: 'Progress retrieved successfully' })
  async getQuestionnaireProgress(@Param('campaignId') campaignId: string) {
    const progress = await this.campaignQuestionService.getQuestionnaireProgress(campaignId);

    return {
      success: true,
      data: progress,
      message: 'Questionnaire progress retrieved successfully',
    };
  }

  @Put('campaigns/:campaignId/responses/:questionId')
  @RequirePermission(Resource.CAMPAIGN, Action.UPDATE)
  @ApiOperation({ summary: 'Update response for a specific question' })
  @ApiResponse({ status: 200, description: 'Response updated successfully' })
  async updateResponse(
    @Param('campaignId') campaignId: string,
    @Param('questionId') questionId: string,
    @Body() body: { answer: string; metadata?: any },
    @CurrentUserId() userId: string,
  ) {
    const response = await this.campaignQuestionService.updateResponse(
      campaignId,
      questionId,
      body.answer,
      body.metadata,
      userId,
    );

    return {
      success: true,
      data: response,
      message: 'Response updated successfully',
    };
  }

  @Get('campaigns/:campaignId/responses')
  @RequirePermission(Resource.CAMPAIGN, Action.VIEW)
  @ApiOperation({ summary: 'Get all responses for a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign responses retrieved successfully' })
  async getCampaignResponses(@Param('campaignId') campaignId: string) {
    const responses = await this.campaignQuestionService.getCampaignResponses(campaignId);

    return {
      success: true,
      data: responses,
      message: 'Campaign responses retrieved successfully',
    };
  }
}
