import { Module } from '@nestjs/common';
import { CurrencyModule } from '../currency/currency.module';
import { ChatSettingsRepository } from './chat-settings.repository';
import { ChatSettingsService } from './chat-settings.service';

@Module({
  imports: [CurrencyModule],
  providers: [ChatSettingsService, ChatSettingsRepository],
  exports: [ChatSettingsService],
})
export class ChatSettingsModule {}
