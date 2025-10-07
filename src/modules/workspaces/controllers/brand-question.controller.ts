import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserWorkspacePermissionGuard } from '../../rbac/guards/user-workspace-permission.guard';
import { RequirePermission } from '../../../shared/decorators/permission.decorator';
import { CurrentUserId } from '../../../shared/decorators/current-user-id.decorator';
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';
import { BrandQuestionService } from '../services/brand-question.service';
import { 
  CreateBrandQuestionDto, 
  UpdateBrandQuestionDto, 
  SubmitBrandQuestionnaireDto,
  ReorderQuestionsDto,
  QuestionnaireResponseDto
} from '../dto/brand-question.dto';

@ApiTags('Brand Questions')
@ApiBearerAuth()
@Controller('brand-questions')
@UseGuards(UserWorkspacePermissionGuard)
export class BrandQuestionController {
  constructor(private readonly brandQuestionService: BrandQuestionService) {}

  // Admin endpoints for managing questions
  @Post()
  @RequirePermission(Resource.WORKSPACE, Action.CREATE) // Admin only
  @ApiOperation({ summary: 'Create a new brand question' })
  @ApiResponse({ status: 201, description: 'Brand question created successfully' })
  async createQuestion(@Body() createDto: CreateBrandQuestionDto, @CurrentUserId() userId: string) {
    const question = await this.brandQuestionService.createQuestion(createDto, userId);
    return {
      success: true,
      data: question,
      message: 'Brand question created successfully',
    };
  }

  @Put(':questionId')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE) // Admin only
  @ApiOperation({ summary: 'Update a brand question' })
  @ApiResponse({ status: 200, description: 'Brand question updated successfully' })
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() updateDto: UpdateBrandQuestionDto,
    @CurrentUserId() userId: string,
  ) {
    const question = await this.brandQuestionService.updateQuestion(questionId, updateDto, userId);
    return {
      success: true,
      data: question,
      message: 'Brand question updated successfully',
    };
  }

  @Delete(':questionId')
  @RequirePermission(Resource.WORKSPACE, Action.DELETE) // Admin only
  @ApiOperation({ summary: 'Delete a brand question' })
  @ApiResponse({ status: 200, description: 'Brand question deleted successfully' })
  async deleteQuestion(@Param('questionId') questionId: string) {
    const deleted = await this.brandQuestionService.deleteQuestion(questionId);
    return {
      success: deleted,
      message: deleted ? 'Brand question deleted successfully' : 'Question not found',
    };
  }

  @Get()
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get all brand questions' })
  @ApiResponse({ status: 200, description: 'Brand questions retrieved successfully' })
  async getAllQuestions() {
    const questions = await this.brandQuestionService.getAllQuestions();
    return {
      success: true,
      data: questions,
      message: 'Brand questions retrieved successfully',
    };
  }

  @Get(':questionId')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get a specific brand question' })
  @ApiResponse({ status: 200, description: 'Brand question retrieved successfully' })
  async getQuestion(@Param('questionId') questionId: string) {
    const question = await this.brandQuestionService.getQuestionById(questionId);
    return {
      success: true,
      data: question,
      message: 'Brand question retrieved successfully',
    };
  }

  @Put('reorder')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE) // Admin only
  @ApiOperation({ summary: 'Reorder brand questions' })
  @ApiResponse({ status: 200, description: 'Questions reordered successfully' })
  async reorderQuestions(@Body() reorderDto: ReorderQuestionsDto) {
    await this.brandQuestionService.reorderQuestions(reorderDto.questionIds);
    return {
      success: true,
      message: 'Questions reordered successfully',
    };
  }

  // User endpoints for questionnaire
  @Get('workspaces/:workspaceId/questionnaire')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get questionnaire for workspace' })
  @ApiResponse({ status: 200, description: 'Questionnaire retrieved successfully' })
  async getQuestionnaire(@Param('workspaceId') workspaceId: string) {
    const questionnaire = await this.brandQuestionService.getQuestionnaireForWorkspace(workspaceId);
    
    return {
      success: true,
      data: questionnaire,
      message: 'Questionnaire retrieved successfully',
    };
  }

  @Post('workspaces/:workspaceId/questionnaire/submit')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @ApiOperation({ summary: 'Submit questionnaire responses' })
  @ApiResponse({ status: 200, description: 'Questionnaire submitted successfully' })
  async submitQuestionnaire(
    @Param('workspaceId') workspaceId: string,
    @Body() submitDto: SubmitBrandQuestionnaireDto,
    @CurrentUserId() userId: string,
  ) {
    const result = await this.brandQuestionService.submitQuestionnaire(
      workspaceId,
      submitDto.responses,
      userId,
    );

    return {
      success: result.success,
      data: result.completionStatus,
      message: result.success ? 'Questionnaire submitted successfully' : 'Failed to submit questionnaire',
    };
  }

  @Get('workspaces/:workspaceId/responses')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get workspace questionnaire responses' })
  @ApiResponse({ status: 200, description: 'Responses retrieved successfully' })
  async getWorkspaceResponses(@Param('workspaceId') workspaceId: string) {
    const responses = await this.brandQuestionService.getWorkspaceResponses(workspaceId);
    
    return {
      success: true,
      data: responses,
      message: 'Responses retrieved successfully',
    };
  }

  @Put('workspaces/:workspaceId/responses/:questionId')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @ApiOperation({ summary: 'Update response for a specific question' })
  @ApiResponse({ status: 200, description: 'Response updated successfully' })
  async updateResponse(
    @Param('workspaceId') workspaceId: string,
    @Param('questionId') questionId: string,
    @Body() body: { answer: string; metadata?: any },
    @CurrentUserId() userId: string,
  ) {
    const response = await this.brandQuestionService.updateResponse(
      workspaceId,
      questionId,
      body.answer,
      userId,
    );

    return {
      success: true,
      data: response,
      message: 'Response updated successfully',
    };
  }

  @Delete('workspaces/:workspaceId/responses/:questionId')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @ApiOperation({ summary: 'Delete response for a specific question' })
  @ApiResponse({ status: 200, description: 'Response deleted successfully' })
  async deleteResponse(
    @Param('workspaceId') workspaceId: string,
    @Param('questionId') questionId: string,
  ) {
    const deleted = await this.brandQuestionService.deleteResponse(workspaceId, questionId);
    
    return {
      success: deleted,
      message: deleted ? 'Response deleted successfully' : 'Response not found',
    };
  }

  @Get('workspaces/:workspaceId/completion-status')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get questionnaire completion status' })
  @ApiResponse({ status: 200, description: 'Completion status retrieved successfully' })
  async getCompletionStatus(@Param('workspaceId') workspaceId: string) {
    const status = await this.brandQuestionService.validateQuestionnaireCompletion(workspaceId);
    
    return {
      success: true,
      data: status,
      message: 'Completion status retrieved successfully',
    };
  }
}
