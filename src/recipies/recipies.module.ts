import { Module } from '@nestjs/common';
import { RecipiesService } from './recipies.service';
import { RecipiesRepository } from './recipies.repository';

@Module({
  providers: [
    RecipiesService, 
    RecipiesRepository
  ],
  exports: [RecipiesService],
})
export class RecipiesModule {}