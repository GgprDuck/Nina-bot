import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Message } from 'node-telegram-bot-api';
import { ChatSettingsService } from 'src/chat-settings/chat-settings.service';
import { RemindersService } from 'src/reminders/reminders.service';
import { ShoppingListService } from 'src/shopping-list/shoping-list.service';
import { SpendingsService } from 'src/spendings/spendings.service';
import { SharedSpaceService } from 'src/shared-space/shared-space.service';
import { OnMessage } from '../decorators/message.decorator';
import { BotService } from '../bot.service';

@OnMessage()
@Injectable()
export class QuickInputHandler {
  constructor(
    private readonly bot: BotService,
    private readonly reminders: RemindersService,
    private readonly shopping: ShoppingListService,
    private readonly spendings: SpendingsService,
    private readonly settings: ChatSettingsService,
    private readonly sharedSpace: SharedSpaceService,
    private readonly config: ConfigService,
  ) {}

  async handle(msg: Message) {
    if (!msg.text) return false;

    const chatId = msg.chat.id;
    const scopeChatId = await this.sharedSpace.resolveScopeChatId(chatId);
    const text = msg.text.trim();

    const reminder = this.reminders.parseQuickReminder(text);
    if (reminder) {
      const saved = await this.reminders.create(scopeChatId, reminder);
      await this.bot.sendMessage(
        chatId,
        `✅ Reminder saved for ${this.reminders.formatReminderTime(saved.remindAt)}.`,
        { reply_markup: this.bot.getAssistantMenu() },
      );
      return true;
    }

    const shopping = this.parseShopping(text);
    if (shopping) {
      await this.shopping.create(scopeChatId, shopping);
      await this.bot.sendMessage(chatId, '✅ Product saved!', {
        reply_markup: this.bot.getShoppingMenu(),
      });
      return true;
    }

    const spending = await this.parseSpending(scopeChatId, text);
    if (spending) {
      await this.spendings.create(scopeChatId, spending);
      await this.bot.sendMessage(chatId, '✅ Spending saved!', {
        reply_markup: this.bot.getSpendingsMenu(),
      });
      return true;
    }

    return false;
  }

  private parseShopping(text: string) {
    const match = text.match(/^buy\s+(.+)$/i);
    if (!match) return null;

    const [, body] = match;
    const [beforeShop, afterShop] = body.split(/\s+@/, 2);
    const [shopName = '', ...discountParts] = (afterShop ?? '').split(/\s+/);

    return {
      title: beforeShop.trim(),
      shopName: shopName.trim(),
      kindOfDiscount: discountParts.join(' ').trim(),
    };
  }

  private async parseSpending(chatId: number, text: string) {
    const match = text.match(/^([a-zа-яіїєґ][\wа-яіїєґ-]*)\s+([\d\s]+(?:[.,]\d{1,2})?)(?:\s+([a-z]{3}|-))?(?:\s+(.+))?$/i);
    if (!match) return null;

    const amount = Number(match[2].replace(/\s/g, '').replace(',', '.'));
    if (Number.isNaN(amount) || amount <= 0) return null;

    const defaultCurrency = await this.settings.getDefaultCurrency(
      chatId,
      this.config.get<string>('SPENDING_DEFAULT_CURRENCY') ?? 'USD',
    );

    return {
      category: match[1],
      amount,
      currency: this.spendings.parseSpendingCurrencyInput(
        match[3] ?? '-',
        defaultCurrency,
      ),
      description: match[4]?.trim() || null,
    };
  }
}
