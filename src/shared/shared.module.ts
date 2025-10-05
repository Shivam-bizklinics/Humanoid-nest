import { Global, Module } from '@nestjs/common';
import { PermissionGeneratorService } from './services/permission-generator.service';

@Global()
@Module({
  providers: [PermissionGeneratorService],
  exports: [PermissionGeneratorService],
})
export class SharedModule {}
