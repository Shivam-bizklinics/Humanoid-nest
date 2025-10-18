import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignQuestion } from '../entities/campaign-question.entity';
import { CampaignQuestionResponse } from '../entities/campaign-question-response.entity';
import { Campaign } from '../entities/campaign.entity';
import { QuestionType } from '../entities/campaign-question.entity';

@Injectable()
export class CampaignQuestionService {
  constructor(
    @InjectRepository(CampaignQuestion)
    private readonly campaignQuestionRepository: Repository<CampaignQuestion>,
    @InjectRepository(CampaignQuestionResponse)
    private readonly campaignQuestionResponseRepository: Repository<CampaignQuestionResponse>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
  ) {}

  /**
   * Create a new campaign question
   */
  async createQuestion(questionData: Partial<CampaignQuestion>): Promise<CampaignQuestion> {
    const question = this.campaignQuestionRepository.create(questionData);
    return this.campaignQuestionRepository.save(question);
  }

  /**
   * Update a campaign question
   */
  async updateQuestion(questionId: string, updateData: Partial<CampaignQuestion>): Promise<CampaignQuestion> {
    await this.campaignQuestionRepository.update(questionId, updateData);
    return this.getQuestionById(questionId);
  }

  /**
   * Get question by ID
   */
  async getQuestionById(questionId: string): Promise<CampaignQuestion> {
    const question = await this.campaignQuestionRepository.findOne({
      where: { id: questionId }
    });

    if (!question) {
      throw new NotFoundException('Campaign question not found');
    }

    return question;
  }

  /**
   * Get all campaign questions ordered by displayOrder
   */
  async getAllQuestions(): Promise<CampaignQuestion[]> {
    return this.campaignQuestionRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' }
    });
  }

  /**
   * Delete a campaign question
   */
  async deleteQuestion(questionId: string): Promise<boolean> {
    const result = await this.campaignQuestionRepository.softDelete(questionId);
    return result.affected > 0;
  }

  /**
   * Reorder questions
   */
  async reorderQuestions(order: { id: string; displayOrder: number }[]): Promise<void> {
    for (const item of order) {
      await this.campaignQuestionRepository.update(item.id, { displayOrder: item.displayOrder });
    }
  }

  /**
   * Get questionnaire for a specific campaign (questions with user responses)
   */
  async getQuestionnaireForCampaign(campaignId: string): Promise<any[]> {
    // Verify campaign exists
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId }
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Get all questions
    const questions = await this.getAllQuestions();

    // Get existing responses for this campaign
    const responses = await this.campaignQuestionResponseRepository.find({
      where: { campaignId },
      relations: ['question']
    });

    // Create a map of responses by question ID
    const responseMap = new Map();
    responses.forEach(response => {
      responseMap.set(response.questionId, response);
    });

    // Combine questions with responses
    return questions.map(question => {
      const response = responseMap.get(question.id);
      return {
        ...question,
        userResponse: response?.answer || null,
        responseMetadata: response?.metadata || null,
        responseId: response?.id || null,
        respondedAt: response?.createdAt || null,
      };
    });
  }

  /**
   * Submit questionnaire responses
   */
  async submitQuestionnaire(
    campaignId: string,
    responses: Array<{
      questionId: string;
      answer: string;
      metadata?: any;
    }>,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    // Verify campaign exists
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId }
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Process each response
    for (const responseData of responses) {
      // Check if question exists
      const question = await this.getQuestionById(responseData.questionId);
      
      // Check if response already exists
      const existingResponse = await this.campaignQuestionResponseRepository.findOne({
        where: { campaignId, questionId: responseData.questionId }
      });

      if (existingResponse) {
        // Update existing response
        await this.campaignQuestionResponseRepository.update(existingResponse.id, {
          answer: responseData.answer,
          metadata: responseData.metadata,
          updatedBy: userId,
        });
      } else {
        // Create new response
        const response = this.campaignQuestionResponseRepository.create({
          campaignId,
          questionId: responseData.questionId,
          answer: responseData.answer,
          metadata: responseData.metadata,
          createdBy: userId,
          updatedBy: userId,
        });

        await this.campaignQuestionResponseRepository.save(response);
      }
    }

    return { success: true, message: 'Questionnaire responses saved successfully' };
  }

  /**
   * Update response for a specific question
   */
  async updateResponse(
    campaignId: string,
    questionId: string,
    answer: string,
    metadata: any,
    userId: string
  ): Promise<CampaignQuestionResponse> {
    // Check if response exists
    const existingResponse = await this.campaignQuestionResponseRepository.findOne({
      where: { campaignId, questionId }
    });

    if (existingResponse) {
      // Update existing response
      await this.campaignQuestionResponseRepository.update(existingResponse.id, {
        answer,
        metadata,
        updatedBy: userId,
      });

      return this.campaignQuestionResponseRepository.findOne({
        where: { id: existingResponse.id }
      });
    } else {
      // Create new response
      const response = this.campaignQuestionResponseRepository.create({
        campaignId,
        questionId,
        answer,
        metadata,
        createdBy: userId,
        updatedBy: userId,
      });

      return this.campaignQuestionResponseRepository.save(response);
    }
  }

  /**
   * Validate questionnaire completion
   */
  async validateQuestionnaireCompletion(campaignId: string): Promise<{
    totalQuestions: number;
    answeredQuestions: number;
    requiredQuestions: number;
    answeredRequiredQuestions: number;
    completionPercentage: number;
    canCompleteSetup: boolean;
    missingRequiredQuestions: string[];
  }> {
    // Get all questions
    const questions = await this.getAllQuestions();
    
    // Get existing responses
    const responses = await this.campaignQuestionResponseRepository.find({
      where: { campaignId }
    });

    const responseMap = new Map();
    responses.forEach(response => {
      responseMap.set(response.questionId, response);
    });

    const requiredQuestions = questions.filter(q => q.isRequired);
    const answeredQuestions = questions.filter(q => {
      const response = responseMap.get(q.id);
      return response && response.answer && response.answer.trim() !== '';
    });
    const answeredRequiredQuestions = requiredQuestions.filter(q => {
      const response = responseMap.get(q.id);
      return response && response.answer && response.answer.trim() !== '';
    });

    const completionPercentage = questions.length > 0 
      ? Math.round((answeredQuestions.length / questions.length) * 100) 
      : 100;

    const missingRequiredQuestions = requiredQuestions
      .filter(q => {
        const response = responseMap.get(q.id);
        return !response || !response.answer || response.answer.trim() === '';
      })
      .map(q => q.question);

    const canCompleteSetup = missingRequiredQuestions.length === 0;

    return {
      totalQuestions: questions.length,
      answeredQuestions: answeredQuestions.length,
      requiredQuestions: requiredQuestions.length,
      answeredRequiredQuestions: answeredRequiredQuestions.length,
      completionPercentage,
      canCompleteSetup,
      missingRequiredQuestions,
    };
  }

  /**
   * Get questionnaire progress for a campaign
   */
  async getQuestionnaireProgress(campaignId: string): Promise<any> {
    return this.validateQuestionnaireCompletion(campaignId);
  }

  /**
   * Get all responses for a campaign
   */
  async getCampaignResponses(campaignId: string): Promise<CampaignQuestionResponse[]> {
    return this.campaignQuestionResponseRepository.find({
      where: { campaignId },
      relations: ['question'],
      order: { createdAt: 'DESC' }
    });
  }
}
