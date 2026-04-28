import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Message } from 'node-telegram-bot-api';
import { ShoppingListService } from 'src/shopping-list/shoping-list.service';
import { BotService } from '../bot.service';
import { FlowService } from '../flow/flow.service';
import { RecipiesService } from 'src/recipies/recipies.service';
import { SpendingsService } from 'src/spendings/spendings.service';
import { buildRecipesListPayload } from '../helpers/recipes-list.keyboard';
import { RemindersService } from 'src/reminders/reminders.service';
import { ChatSettingsService } from 'src/chat-settings/chat-settings.service';
import { SharedSpaceService } from 'src/shared-space/shared-space.service';

@Injectable()
export class MenuHandler {
  constructor(
    @Inject(forwardRef(() => BotService)) private bot: BotService,
    private flow: FlowService,
    private shopping: ShoppingListService,
    private recipies: RecipiesService,
    private spendings: SpendingsService,
    private reminders: RemindersService,
    private settings: ChatSettingsService,
    private sharedSpace: SharedSpaceService,
    private config: ConfigService,
  ) {}

  async handle(msg: Message): Promise<boolean> {
    if (!msg.text) return false;

    const chatId = msg.chat.id;
    const text = msg.text;
    const scopeChatId = await this.sharedSpace.resolveScopeChatId(chatId);

    if (text === '👥 Shared data') {
      this.flow.delete(chatId);
      await this.bot.sendMessage(chatId, '👥 Shared data menu:', {
        reply_markup: this.bot.getSharedDataMenu(),
      });
      return true;
    }

    if (text === '➕ Create shared space') {
      this.flow.set(chatId, { step: 'shared_space_create_name', data: {} });
      await this.bot.sendMessage(chatId, 'Enter shared space name:', {
        reply_markup: {
          keyboard: [[{ text: '⬅️ Back' }]],
          resize_keyboard: true,
        },
      });
      return true;
    }

    if (text === '🔑 Join shared space') {
      this.flow.set(chatId, { step: 'shared_space_join_code', data: {} });
      await this.bot.sendMessage(chatId, 'Send invite code (6 chars):', {
        reply_markup: {
          keyboard: [[{ text: '⬅️ Back' }]],
          resize_keyboard: true,
        },
      });
      return true;
    }

    if (text === 'ℹ️ Shared data status') {
      const status = await this.sharedSpace.getStatus(chatId);
      if (!status) {
        await this.bot.sendMessage(
          chatId,
          'You are using personal data scope. Join or create a shared space.',
          { reply_markup: this.bot.getSharedDataMenu() },
        );
        return true;
      }

      await this.bot.sendMessage(
        chatId,
        `👥 *${status.name}*\nCode: \`${status.code}\`\nMembers: ${status.membersCount}`,
        {
          parse_mode: 'Markdown',
          reply_markup: this.bot.getSharedDataMenu(),
        },
      );
      return true;
    }

    if (text === '🚪 Leave shared space') {
      const left = await this.sharedSpace.leave(chatId);
      await this.bot.sendMessage(
        chatId,
        left ? 'You left shared space. Back to personal data.' : 'You are not in shared space.',
        { reply_markup: this.bot.getSharedDataMenu() },
      );
      return true;
    }

    if (text === '🗓 Assistant') {
      this.flow.delete(chatId);
      await this.bot.sendMessage(chatId, '🗓 Assistant menu:', {
        reply_markup: this.bot.getAssistantMenu(),
      });
      return true;
    }

    if (text === 'ℹ️ Help') {
      await this.bot.sendMessage(
        chatId,
        'Use /help to see all commands and quick input examples.',
        { reply_markup: this.bot.getMainMenu() },
      );
      return true;
    }

    if (text === '➕ Add reminder') {
      this.flow.set(chatId, { step: 'reminder', data: {} });
      await this.bot.sendMessage(
        chatId,
        [
          '🔔 *Create reminder*',
          '',
          'Examples:',
          '`in 30m drink water`',
          '`tomorrow 09:00 buy milk`',
          '`2026-04-30 18:00 pay rent`',
        ].join('\n'),
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '❌ Cancel reminder' }]],
            resize_keyboard: true,
          },
        },
      );
      return true;
    }

    if (text === '⚡ Quick reminder') {
      await this.bot.sendMessage(
        chatId,
        [
          'Type one of these:',
          '`remind in 30m drink water`',
          '`remind tomorrow 09:00 buy milk`',
          '`remind 2026-04-30 18:00 pay rent`',
        ].join('\n'),
        {
          parse_mode: 'Markdown',
          reply_markup: this.bot.getAssistantMenu(),
        },
      );
      return true;
    }

    if (text === '📋 Reminders') {
      const reminders = await this.reminders.findUpcoming(scopeChatId);
      if (!reminders.length) {
        await this.bot.sendMessage(chatId, '🔔 No upcoming reminders.', {
          reply_markup: this.bot.getAssistantMenu(),
        });
        return true;
      }

      const message = reminders
        .map(
          (reminder, index) =>
            `${index + 1}. ${this.reminders.formatReminderTime(reminder.remindAt)} — ${reminder.text}`,
        )
        .join('\n');

      await this.bot.sendMessage(chatId, `🔔 *Upcoming reminders*\n\n${message}`, {
        parse_mode: 'Markdown',
        reply_markup: this.bot.getAssistantMenu(),
      });
      return true;
    }

    if (text === '❌ Delete reminder') {
      const reminders = await this.reminders.findUpcoming(scopeChatId);
      if (!reminders.length) {
        await this.bot.sendMessage(chatId, '🔔 No reminders to delete.', {
          reply_markup: this.bot.getAssistantMenu(),
        });
        return true;
      }

      await this.bot.sendMessage(chatId, '🗑 *Select a reminder to delete:*', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: reminders.map((reminder) => [
            {
              text: `${this.reminders.formatReminderTime(reminder.remindAt)} · ${reminder.text}`.slice(
                0,
                64,
              ),
              callback_data: `delete_reminder_${reminder.id}`,
            },
          ]),
        },
      });
      return true;
    }

    if (text === '✏️ Edit reminder') {
      const reminders = await this.reminders.findUpcoming(scopeChatId);
      if (!reminders.length) {
        await this.bot.sendMessage(chatId, '🔔 No reminders to edit.', {
          reply_markup: this.bot.getAssistantMenu(),
        });
        return true;
      }

      await this.bot.sendMessage(chatId, '✏️ *Select a reminder to edit:*', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: reminders.map((reminder) => [
            {
              text: `${this.reminders.formatReminderTime(reminder.remindAt)} · ${reminder.text}`.slice(
                0,
                64,
              ),
              callback_data: `edit_reminder_${reminder.id}`,
            },
          ]),
        },
      });
      return true;
    }

    if (text === '❌ Cancel reminder') {
      this.flow.delete(chatId);
      await this.bot.sendMessage(chatId, '🔔 Operation cancelled.', {
        reply_markup: this.bot.getAssistantMenu(),
      });
      return true;
    }

    if (text === '🍲 Recipes') {
      this.flow.delete(chatId);
      await this.bot.sendMessage(chatId, '🍲 Recipes menu:', {
        reply_markup: this.bot.getRecipiesMenu(),
      });
      return true;
    }

    if (text === '📋 Recipes list') {
      const recipes = await this.recipies.findAll(scopeChatId);

      if (!recipes.length) {
        await this.bot.sendMessage(chatId, '😕 No recipes yet.\n', {
          reply_markup: this.bot.getRecipiesMenu(),
        });
        return true;
      }

      const payload = buildRecipesListPayload(recipes, 0);

      await this.bot.sendMessage(chatId, payload.text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: payload.inline_keyboard },
      });

      return true;
    }

    if (text === '➕ Add recipe') {
      this.flow.set(chatId, {
        step: 'recipe_name',
        data: {},
      });
    
      await this.bot.sendMessage(
        chatId,
        '🆕 *Create new recipe*\n\n👉 Step 1/3: Enter recipe name',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '❌ Cancel recipe' }]],
            resize_keyboard: true,
          },
        }
      );
    
      return true;
    }

    if (text === '🛒 Shopping List') {
      this.flow.delete(chatId);
      await this.bot.sendMessage(chatId, '🛒 Shopping menu:', {
        reply_markup: this.bot.getShoppingMenu(),
      });
      return true;
    }

    if (text === '💸 Spendings') {
      this.flow.delete(chatId);
      await this.bot.sendMessage(chatId, '💸 Spendings:', {
        reply_markup: this.bot.getSpendingsMenu(),
      });
      return true;
    }

    if (text === '➕ Add spending') {
      this.flow.set(chatId, { step: 'spending_category', data: {} });
      await this.bot.sendMessage(
        chatId,
        '💸 *Add spending*\n\nStep 1/4: Enter category (e.g. Food, Transport)',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '❌ Cancel spending' }]],
            resize_keyboard: true,
          },
        },
      );
      return true;
    }

    if (text === '⚡ Quick add spending') {
      await this.bot.sendMessage(
        chatId,
        [
          'Send spendings in one line:',
          '`food 12.50 eur lunch`',
          '`taxi 180 uah airport`',
          '`coffee 3.20 -`',
        ].join('\n'),
        {
          parse_mode: 'Markdown',
          reply_markup: this.bot.getSpendingsMenu(),
        },
      );
      return true;
    }

    if (text === '📊 This month') {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const reportCc = await this.settings.getReportCurrency(
        scopeChatId,
        this.config.get<string>('SPENDING_REPORT_CURRENCY') ?? 'EUR',
      );
      await this.sendMonthlySpendingsSummary(chatId, scopeChatId, year, month, reportCc);
      return true;
    }

    if (text === '📅 Month (YYYY-MM)') {
      this.flow.set(chatId, { step: 'spending_month_query', data: {} });
      await this.bot.sendMessage(
        chatId,
        'Enter month as *YYYY-MM* (UTC), e.g. `2026-04`',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '❌ Cancel spending' }]],
            resize_keyboard: true,
          },
        },
      );
      return true;
    }

    if (text === '💱 Report currency') {
      this.flow.set(chatId, { step: 'spending_set_report_currency', data: {} });
      const current = await this.settings.getReportCurrency(
        scopeChatId,
        this.config.get<string>('SPENDING_REPORT_CURRENCY') ?? 'EUR',
      );
      await this.bot.sendMessage(
        chatId,
        `Totals for monthly reports are converted to one currency.\n\nCurrent: *${current}*\n\nSend a 3-letter code (e.g. EUR, USD, UAH).`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '❌ Cancel spending' }]],
            resize_keyboard: true,
          },
        },
      );
      return true;
    }

    if (text === '❌ Delete spending') {
      this.flow.delete(chatId);
      const items = await this.spendings.findRecent(scopeChatId, 40);

      if (!items.length) {
        await this.bot.sendMessage(chatId, '😕 No spendings to delete.', {
          reply_markup: this.bot.getSpendingsMenu(),
        });
        return true;
      }

      const inlineKeyboard = items.map((s) => {
        const note = s.description ? ` · ${s.description}` : '';
        const label = `🗑 ${s.amount} ${s.currency} ${s.category}${note}`;
        return [
          {
            text: label.length > 64 ? label.slice(0, 61) + '…' : label,
            callback_data: `delete_spending_${s.id}`,
          },
        ];
      });

      await this.bot.sendMessage(
        chatId,
        '🗑 *Select a spending to delete:*\n\n_Latest 40 entries._',
        {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: inlineKeyboard },
        },
      );
      return true;
    }

    if (text === '✏️ Edit spending') {
      this.flow.delete(chatId);
      const items = await this.spendings.findRecent(scopeChatId, 40);
      if (!items.length) {
        await this.bot.sendMessage(chatId, '😕 No spendings to edit.', {
          reply_markup: this.bot.getSpendingsMenu(),
        });
        return true;
      }

      const inlineKeyboard = items.map((s) => {
        const note = s.description ? ` · ${s.description}` : '';
        const label = `✏️ ${s.amount} ${s.currency} ${s.category}${note}`;
        return [
          {
            text: label.length > 64 ? label.slice(0, 61) + '…' : label,
            callback_data: `edit_spending_${s.id}`,
          },
        ];
      });

      await this.bot.sendMessage(chatId, '✏️ *Select a spending to edit:*', {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: inlineKeyboard },
      });
      return true;
    }

    if (text === '❌ Cancel spending') {
      this.flow.delete(chatId);
      await this.bot.sendMessage(chatId, '💸 Operation cancelled.', {
        reply_markup: this.bot.getSpendingsMenu(),
      });
      return true;
    }

    if (text === '⬅️ Back') {
      this.flow.delete(chatId);
      await this.bot.sendMessage(chatId, 'Main menu:', {
        reply_markup: this.bot.getMainMenu(),
      });
      return true;
    }

    if (text === '➕ Add product') {
      this.flow.set(chatId, { step: 'product', data: {} });
    
      await this.bot.sendMessage(chatId, '🛍️ Enter product name:', {
        reply_markup: {
          keyboard: [
            [{ text: '❌ Cancel product' }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    
      return true;
    }

    if (text === '⚡ Quick add product') {
      await this.bot.sendMessage(
        chatId,
        [
          'Send product in one line:',
          '`buy milk @ATB 20%`',
          '`buy eggs @Silpo`',
          '`buy bread`',
        ].join('\n'),
        {
          parse_mode: 'Markdown',
          reply_markup: this.bot.getShoppingMenu(),
        },
      );
      return true;
    }

    if (text === '❌ Cancel product') {
      this.flow.delete(chatId);
      await this.bot.sendMessage(chatId, '🛍️ Operation cancelled.', {
        reply_markup: this.bot.getShoppingMenu(),
      });
      return true;
    }

    if (text === '❌ Cancel recipe') {
      this.flow.delete(chatId);
      await this.bot.sendMessage(chatId, '🍲 Operation cancelled.', {
        reply_markup: this.bot.getRecipiesMenu(),
      });
      return true;
    }

    if (text === '❌ Delete recipe') {
      const recipes = await this.recipies.findAll(scopeChatId);
    
      if (!recipes.length) {
        await this.bot.sendMessage(chatId, '😕 No recipes to delete.');
        return true;
      }
    
      const inlineKeyboard = recipes.map(r => [
        {
          text: `🗑 ${r.title}`,
          callback_data: `delete_${r.id}`,
        },
      ]);
    
      await this.bot.sendMessage(
        chatId,
        '🗑 *Select a recipe to delete:*',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: inlineKeyboard,
          },
        }
      );
    
      return true;
    }

    if (text === '✏️ Edit recipe') {
      const recipes = await this.recipies.findAll(scopeChatId);

      if (!recipes.length) {
        await this.bot.sendMessage(chatId, '😕 No recipes to edit.');
        return true;
      }

      const inlineKeyboard = recipes.map((r) => [
        {
          text: `✏️ ${r.title}`,
          callback_data: `edit_recipe_${r.id}`,
        },
      ]);

      await this.bot.sendMessage(chatId, '✏️ *Select a recipe to edit:*', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      });

      return true;
    }

    if (text === '❌ Delete all products') {
      this.flow.delete(chatId);
      await this.shopping.removeAll(scopeChatId);
      await this.bot.sendMessage(chatId, '🛒 All products deleted.', {
        reply_markup: this.bot.getShoppingMenu(),
      });
      return true;
    }

    if (text === '❌ Delete product') {
      this.flow.delete(chatId);
      const items = await this.shopping.findAll(scopeChatId);

      if (!items.length) {
        await this.bot.sendMessage(chatId, '🛒 Your shopping list is empty.', {
          reply_markup: this.bot.getShoppingMenu(),
        });
        return true;
      }

      const inlineKeyboard = items.map((item) => {
        const label = `🗑 ${item.title} · ${item.shopName || '—'}`;
        return [
          {
            text: label.length > 64 ? label.slice(0, 61) + '…' : label,
            callback_data: `delete_product_${item.id}`,
          },
        ];
      });

      await this.bot.sendMessage(
        chatId,
        '🗑 *Select a product to delete:*',
        {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: inlineKeyboard },
        },
      );
      return true;
    }

    if (text === '✏️ Edit product') {
      this.flow.delete(chatId);
      const items = await this.shopping.findAll(scopeChatId);

      if (!items.length) {
        await this.bot.sendMessage(chatId, '🛒 Your shopping list is empty.', {
          reply_markup: this.bot.getShoppingMenu(),
        });
        return true;
      }

      const inlineKeyboard = items.map((item) => {
        const label = `✏️ ${item.title} · ${item.shopName || '—'}`;
        return [
          {
            text: label.length > 64 ? label.slice(0, 61) + '…' : label,
            callback_data: `edit_product_${item.id}`,
          },
        ];
      });

      await this.bot.sendMessage(chatId, '✏️ *Select a product to edit:*', {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: inlineKeyboard },
      });
      return true;
    }

    if (text === '📋 Products list') {
      const items = await this.shopping.findAll(scopeChatId);

      if (!items.length) {
        await this.bot.sendMessage(chatId, '🛒 Your shopping list is empty.', {
          reply_markup: this.bot.getShoppingMenu(),
        });
        return true;
      }

      const grouped = items.reduce((acc, item) => {
        const shop = item.shopName || 'No shop';
        if (!acc[shop]) acc[shop] = [];
        acc[shop].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      const message = Object.entries(grouped)
        .map(([shop, items]) => {
          return (
            `🏪 ${shop}\n` +
            items.map(i => `• ${i.title} | ${i.kindOfDiscount || '-'}`).join('\n')
          );
        })
        .join('\n\n');

      await this.bot.sendMessage(chatId, message, {
        reply_markup: this.bot.getShoppingMenu(),
      });
      return true;
    }

    return false;
  }

  private async sendMonthlySpendingsSummary(
    chatId: number,
    scopeChatId: number,
    year: number,
    monthIndex0: number,
    reportCurrency: string,
  ) {
    try {
      const body = await this.spendings.getMonthlyReportMessage(
        scopeChatId,
        year,
        monthIndex0,
        reportCurrency,
      );
      await this.bot.sendMessage(chatId, body, {
        parse_mode: 'Markdown',
        reply_markup: this.bot.getSpendingsMenu(),
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not load spendings summary.';
      await this.bot.sendMessage(chatId, `⚠️ ${message}`, {
        reply_markup: this.bot.getSpendingsMenu(),
      });
    }
  }
}