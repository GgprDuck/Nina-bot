import { Module } from '@nestjs/common';
import { SharedSpaceRepository } from './shared-space.repository';
import { SharedSpaceService } from './shared-space.service';

@Module({
  providers: [SharedSpaceService, SharedSpaceRepository],
  exports: [SharedSpaceService],
})
export class SharedSpaceModule {}
