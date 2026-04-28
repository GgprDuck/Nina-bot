import { Injectable } from '@nestjs/common';
import { CurrencyService } from '../currency/currency.service';
import { ChatSettingsRepository } from './chat-settings.repository';

@Injectable()
export class ChatSettingsService {
  constructor(
    private readonly repository: ChatSettingsRepository,
    private readonly currency: CurrencyService,
  ) {}

  async ensure(chatId: number) {
    return this.repository.upsert(chatId, {});
  }

  async getReportCurrency(chatId: number, fallback: string) {
    const settings = await this.repository.findByChatId(chatId);
    return settings?.reportCurrency ?? this.currency.normalizeCode(fallback);
  }

  async setReportCurrency(chatId: number, code: string) {
    const normalized = this.currency.normalizeCode(code);
    await this.repository.upsert(chatId, { reportCurrency: normalized });
    return normalized;
  }

  async getDefaultCurrency(chatId: number, fallback: string) {
    const settings = await this.repository.findByChatId(chatId);
    return settings?.defaultCurrency ?? this.currency.normalizeCode(fallback);
  }

  async setDefaultCurrency(chatId: number, code: string) {
    const normalized = this.currency.normalizeCode(code);
    await this.repository.upsert(chatId, { defaultCurrency: normalized });
    return normalized;
  }
}
