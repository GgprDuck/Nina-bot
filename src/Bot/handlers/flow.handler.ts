import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Message } from 'node-telegram-bot-api';
import { BotService } from '../bot.service';
import { FlowService } from '../flow/flow.service';
import { ShoppingListService } from 'src/shopping-list/shoping-list.service';
import { RecipiesService } from 'src/recipies/recipies.service';
import { SpendingsService } from 'src/spendings/spendings.service';

@Injectable()
export class FlowHandler {
  constructor(
    @Inject(forwardRef(() => BotService)) private bot: BotService,
    private flow: FlowService,
    private shopping: ShoppingListService,
    private recipies: RecipiesService,
    private spendings: SpendingsService,
    private config: ConfigService,
  ) {}

  async handle(msg: Message): Promise<boolean | undefined> {
    if (!msg.text) return false;
  
    const chatId = msg.chat.id;
    const text = msg.text;
  
    const state = this.flow.get(chatId);
    if (!state) return false;
  
    if (text === '❌ Cancel') {
      this.flow.delete(chatId);
  
      await this.bot.sendMessage(chatId, '❎ Action cancelled.', {
        reply_markup: { remove_keyboard: true },
      });
  
      return true;
    }

    console.log('state.step :>> ', state.step);
  
    if (state.step === 'product') {
      state.data.product = text;
      state.step = 'shop';
  
      await this.bot.sendMessage(chatId, '🏪 Enter shop name:');
      return true;
    }
  
    if (state.step === 'shop') {
      state.data.shop = text;
      state.step = 'discount';
  
      await this.bot.sendMessage(chatId, '🏷️ Enter discount (or "-" to skip):');
      return true;
    }
  
    if (state.step === 'discount') {
      await this.shopping.create({
        title: state.data.product,
        shopName: state.data.shop,
        kindOfDiscount: text === '-' ? '' : text,
      });
  
      this.flow.delete(chatId);
  
      await this.bot.sendMessage(chatId, '✅ Product saved!', {
        reply_markup: this.bot.getShoppingMenu(),
      });
  
      return true;
    }
  
    /* =========================
       💸 SPENDINGS FLOW
    ========================= */

    if (state.step === 'spending_category') {
      if (!text.trim()) {
        await this.bot.sendMessage(chatId, '⚠️ Category cannot be empty.');
        return true;
      }

      state.data.category = text.trim();
      state.step = 'spending_amount';

      await this.bot.sendMessage(
        chatId,
        'Step 2/4: Enter amount (use `.` or `,` as decimal separator)',
        {
          reply_markup: {
            keyboard: [[{ text: '❌ Cancel spending' }]],
            resize_keyboard: true,
          },
        },
      );
      return true;
    }

    if (state.step === 'spending_amount') {
      const normalized = text.replace(/\s/g, '').replace(',', '.');
      const n = Number(normalized);

      if (Number.isNaN(n) || n <= 0) {
        await this.bot.sendMessage(chatId, '⚠️ Enter a positive number.');
        return true;
      }

      state.data.amount = n;
      state.step = 'spending_currency';
      const def = this.config.get<string>('SPENDING_DEFAULT_CURRENCY') ?? 'USD';

      await this.bot.sendMessage(
        chatId,
        `Step 3/4: Currency — 3-letter code (e.g. EUR), or \`-\` for default (${def})`,
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

    if (state.step === 'spending_currency') {
      const def = this.config.get<string>('SPENDING_DEFAULT_CURRENCY') ?? 'USD';

      try {
        state.data.currency = this.spendings.parseSpendingCurrencyInput(
          text,
          def,
        );
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Invalid currency code.';
        await this.bot.sendMessage(chatId, `⚠️ ${message}`);
        return true;
      }

      state.step = 'spending_description';

      await this.bot.sendMessage(
        chatId,
        'Step 4/4: Short note (or `-` to skip)',
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

    if (state.step === 'spending_description') {
      const desc = text.trim() === '-' ? null : text.trim();

      await this.spendings.create({
        category: state.data.category,
        amount: state.data.amount,
        currency: state.data.currency,
        description: desc,
      });

      this.flow.delete(chatId);

      await this.bot.sendMessage(chatId, '✅ Spending saved!', {
        reply_markup: this.bot.getSpendingsMenu(),
      });
      return true;
    }

    if (state.step === 'spending_month_query') {
      const m = text.trim().match(/^(\d{4})-(\d{2})$/);

      if (!m) {
        await this.bot.sendMessage(
          chatId,
          '⚠️ Use format YYYY-MM (UTC), e.g. 2026-04',
        );
        return true;
      }

      const year = Number(m[1]);
      const month0 = Number(m[2]) - 1;

      if (month0 < 0 || month0 > 11) {
        await this.bot.sendMessage(chatId, '⚠️ Month must be 01–12.');
        return true;
      }

      this.flow.delete(chatId);

      const reportCc = this.spendings.getReportCurrencyForChat(
        chatId,
        this.config.get<string>('SPENDING_REPORT_CURRENCY') ?? 'EUR',
      );

      try {
        const body = await this.spendings.getMonthlyReportMessage(
          year,
          month0,
          reportCc,
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

      return true;
    }

    if (state.step === 'spending_set_report_currency') {
      try {
        const normalized = this.spendings.setReportCurrencyForChat(
          chatId,
          text,
        );
        this.flow.delete(chatId);
        await this.bot.sendMessage(
          chatId,
          `💱 Monthly reports will convert totals to *${normalized}*.`,
          {
            parse_mode: 'Markdown',
            reply_markup: this.bot.getSpendingsMenu(),
          },
        );
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Invalid currency code.';
        await this.bot.sendMessage(chatId, `⚠️ ${message}`);
      }

      return true;
    }
  
    /* =========================
       🍲 RECIPE FLOW
    ========================= */
  
    if (state.step === 'recipe_name') {
        if (!text.trim()) {
          await this.bot.sendMessage(chatId, '⚠️ Name cannot be empty.');
          return true;
        }
      
        state.data.name = text;
        state.step = 'recipe_ingredients';
      
        await this.bot.sendMessage(chatId, '🧂 Enter ingredients (comma separated):');
        return true;
      }
      
      if (state.step === 'recipe_ingredients') {
        const ingredients = text
          .split(',')
          .map(i => i.trim())
          .filter(Boolean);
      
        if (!ingredients.length) {
          await this.bot.sendMessage(chatId, '⚠️ Please enter at least one ingredient.');
          return true;
        }
      
        state.data.ingredients = ingredients;
        state.step = 'recipe_instructions';
      
        await this.bot.sendMessage(chatId, '📖 Enter cooking instructions:');
        return true;
      }
      
      if (state.step === 'recipe_instructions') {
        if (!text.trim()) {
          await this.bot.sendMessage(chatId, '⚠️ Instructions cannot be empty.');
          return true;
        }
      
        state.data.instructions = text;
        state.step = 'recipe_confirm';
      
        const { name, ingredients, instructions } = state.data;
      
        await this.bot.sendMessage(
          chatId,
          `✅ Confirm recipe:\n\n` +
            `*${name}*\n\n` +
            `🧂 Ingredients:\n- ${ingredients.join('\n- ')}\n\n` +
            `📖 Instructions:\n${instructions}`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              keyboard: [[{ text: '💾 Save' }, { text: '❌ Cancel recipe' }]],
              resize_keyboard: true,
            },
          },
        );
      
        return true;
      }
      
      if (state.step === 'recipe_confirm') {
        if (text === '💾 Save') {
          const { name, ingredients, instructions } = state.data;
      
          await this.recipies.create({
            title: name,
            ingredients,
            instructions,
          });
      
          this.flow.delete(chatId);
      
          await this.bot.sendMessage(chatId, '🎉 Recipe saved!', {
            reply_markup: this.bot.getRecipiesMenu(),
          });
      
          return true;
        }
      
        if (text === '❌ Cancel') {
          this.flow.delete(chatId);
      
          await this.bot.sendMessage(chatId, '❌ Cancelled.', {
            reply_markup: this.bot.getRecipiesMenu(),
          });
      
          return true;
        }
      }
  }
}