import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { BrandQuestion } from './entities/brand-question.entity';
import { BrandQuestionResponse } from './entities/brand-question-response.entity';
import { WorkspaceController } from './controllers/workspace.controller';
import { BrandQuestionController } from './controllers/brand-question.controller';
import { WorkspaceService } from './services/workspace.service';
import { BrandQuestionService } from './services/brand-question.service';
import { UserWorkspace } from '../rbac/entities/user-workspace.entity';
import { User } from '../authentication/entities/user.entity';
import { RbacModule } from '../rbac/rbac.module';
import { FileUploadModule } from '../file-upload/file-upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace, 
      UserWorkspace, 
      User,
      BrandQuestion,
      BrandQuestionResponse
    ]),
    RbacModule,
    FileUploadModule
  ],
  controllers: [WorkspaceController, BrandQuestionController],
  providers: [WorkspaceService, BrandQuestionService],
  exports: [WorkspaceService, BrandQuestionService],
})
export class WorkspacesModule {}
