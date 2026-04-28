import { Module } from '@nestjs/common';
import { RemindersRepository } from './reminders.repository';
import { RemindersService } from './reminders.service';

@Module({
  providers: [RemindersService, RemindersRepository],
  exports: [RemindersService],
})
export class RemindersModule {}
