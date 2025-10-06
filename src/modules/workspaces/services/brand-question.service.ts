import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BrandQuestion } from '../entities/brand-question.entity';
import { BrandQuestionResponse } from '../entities/brand-question-response.entity';
import { CreateBrandQuestionDto, UpdateBrandQuestionDto, BrandQuestionResponseDto } from '../dto/brand-question.dto';

@Injectable()
export class BrandQuestionService {
  constructor(
    @InjectRepository(BrandQuestion)
    private readonly brandQuestionRepository: Repository<BrandQuestion>,
    @InjectRepository(BrandQuestionResponse)
    private readonly brandQuestionResponseRepository: Repository<BrandQuestionResponse>,
  ) {}

  // Admin methods for managing questions
  async createQuestion(createDto: CreateBrandQuestionDto, createdBy: string): Promise<BrandQuestion> {
    // If no display order is provided, set it to the highest order + 1
    if (createDto.displayOrder === undefined || createDto.displayOrder === null) {
      const maxOrder = await this.brandQuestionRepository
        .createQueryBuilder('q')
        .select('MAX(q.displayOrder)', 'maxOrder')
        .getRawOne();
      
      createDto.displayOrder = (maxOrder.maxOrder || 0) + 1;
    }

    const question = this.brandQuestionRepository.create({
      ...createDto,
      createdBy,
      updatedBy: createdBy,
    });

    return this.brandQuestionRepository.save(question);
  }

  async updateQuestion(id: string, updateDto: UpdateBrandQuestionDto, updatedBy: string): Promise<BrandQuestion> {
    const question = await this.brandQuestionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.brandQuestionRepository.update(id, {
      ...updateDto,
      updatedBy,
    });

    return this.brandQuestionRepository.findOne({ where: { id } });
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const result = await this.brandQuestionRepository.softDelete(id);
    return result.affected > 0;
  }

  async getQuestionById(id: string): Promise<BrandQuestion> {
    const question = await this.brandQuestionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return question;
  }

  async getAllQuestions(): Promise<BrandQuestion[]> {
    return this.brandQuestionRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async reorderQuestions(questionIds: string[]): Promise<void> {
    const updatePromises = questionIds.map((id, index) =>
      this.brandQuestionRepository.update(id, { displayOrder: index + 1 })
    );
    await Promise.all(updatePromises);
  }

  // User methods for questionnaire
  async getQuestionnaireForWorkspace(workspaceId: string): Promise<{
    questions: BrandQuestion[];
    responses: BrandQuestionResponse[];
    completionStatus: {
      totalQuestions: number;
      answeredQuestions: number;
      mandatoryQuestions: number;
      answeredMandatory: number;
      isComplete: boolean;
    };
  }> {
    const questions = await this.getAllQuestions();
    const responses = await this.brandQuestionResponseRepository.find({
      where: { workspaceId },
      relations: ['question'],
    });

    const mandatoryQuestions = questions.filter(q => q.isMandatory);
    const answeredMandatory = responses.filter(r => 
      mandatoryQuestions.some(mq => mq.id === r.questionId)
    );

    return {
      questions,
      responses,
      completionStatus: {
        totalQuestions: questions.length,
        answeredQuestions: responses.length,
        mandatoryQuestions: mandatoryQuestions.length,
        answeredMandatory: answeredMandatory.length,
        isComplete: mandatoryQuestions.length === answeredMandatory.length,
      },
    };
  }

  async submitQuestionnaire(
    workspaceId: string,
    responses: BrandQuestionResponseDto[],
    submittedBy: string,
  ): Promise<{ success: boolean; completionStatus: any }> {
    // Validate all mandatory questions are answered
    const mandatoryQuestions = await this.brandQuestionRepository.find({
      where: { isMandatory: true, isActive: true },
    });

    const mandatoryQuestionIds = mandatoryQuestions.map(q => q.id);
    const answeredMandatoryIds = responses
      .filter(r => mandatoryQuestionIds.includes(r.questionId) && r.answer.trim())
      .map(r => r.questionId);

    if (mandatoryQuestionIds.length !== answeredMandatoryIds.length) {
      const missingQuestions = mandatoryQuestions.filter(
        q => !answeredMandatoryIds.includes(q.id)
      );
      throw new BadRequestException(
        `Missing answers for mandatory questions: ${missingQuestions.map(q => q.questionText).join(', ')}`
      );
    }

    // Save or update responses
    const savePromises = responses.map(response => {
      return this.brandQuestionResponseRepository.upsert(
        {
          workspaceId,
          questionId: response.questionId,
          answer: response.answer,
          createdBy: submittedBy,
          updatedBy: submittedBy,
        },
        ['workspaceId', 'questionId']
      );
    });

    await Promise.all(savePromises);

    // Get updated completion status
    const questionnaire = await this.getQuestionnaireForWorkspace(workspaceId);

    return {
      success: true,
      completionStatus: questionnaire.completionStatus,
    };
  }

  async getWorkspaceResponses(workspaceId: string): Promise<BrandQuestionResponse[]> {
    return this.brandQuestionResponseRepository.find({
      where: { workspaceId },
      relations: ['question'],
      order: { createdAt: 'ASC' },
    });
  }

  async updateResponse(
    workspaceId: string,
    questionId: string,
    answer: string,
    updatedBy: string,
  ): Promise<BrandQuestionResponse> {
    const existingResponse = await this.brandQuestionResponseRepository.findOne({
      where: { workspaceId, questionId },
    });

    if (existingResponse) {
      await this.brandQuestionResponseRepository.update(existingResponse.id, {
        answer, 
        updatedBy,
      });
      return this.brandQuestionResponseRepository.findOne({ where: { id: existingResponse.id } });
    } else {
      const newResponse = this.brandQuestionResponseRepository.create({
        workspaceId,
        questionId,
        answer,
        createdBy: updatedBy,
        updatedBy,
      });
      return this.brandQuestionResponseRepository.save(newResponse);
    }
  }

  async deleteResponse(workspaceId: string, questionId: string): Promise<boolean> {
    const result = await this.brandQuestionResponseRepository.delete({ workspaceId, questionId });
    return result.affected > 0;
  }

  async validateQuestionnaireCompletion(workspaceId: string): Promise<{
    isComplete: boolean;
    missingMandatory: string[];
  }> {
    const questionnaire = await this.getQuestionnaireForWorkspace(workspaceId);
    
    const missingMandatory = questionnaire.questions
      .filter(q => q.isMandatory && !questionnaire.responses.some(r => r.questionId === q.id))
      .map(q => q.questionText);

    return {
      isComplete: questionnaire.completionStatus.isComplete,
      missingMandatory,
    };
  }
}
