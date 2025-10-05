import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Design } from './entities/design.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Design])],
  controllers: [],
  providers: [],
  exports: [],
})
export class DesignerModule {}
