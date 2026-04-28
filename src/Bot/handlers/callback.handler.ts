import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CallbackQuery } from 'node-telegram-bot-api';
import { BotService } from '../bot.service';
import { RecipiesService } from 'src/recipies/recipies.service';
import { SpendingsService } from 'src/spendings/spendings.service';
import { ShoppingListService } from 'src/shopping-list/shoping-list.service';
import { buildRecipesListPayload } from '../helpers/recipes-list.keyboard';
import { RemindersService } from 'src/reminders/reminders.service';
import { FlowService } from '../flow/flow.service';
import { SharedSpaceService } from 'src/shared-space/shared-space.service';

@Injectable()
export class CallbackHandler {
  constructor(
    @Inject(forwardRef(() => BotService)) private readonly bot: BotService,
    private readonly recipies: RecipiesService,
    private readonly spendings: SpendingsService,
    private readonly shopping: ShoppingListService,
    private readonly reminders: RemindersService,
    private readonly flow: FlowService,
    private readonly sharedSpace: SharedSpaceService,
  ) {}

  async handle(query: CallbackQuery) {
    if (!query.data) return;

    const chatId = query.message?.chat.id;
    if (!chatId) return;
    const scopeChatId = await this.sharedSpace.resolveScopeChatId(chatId);

    const ack = () =>
      this.bot.answerCallbackQuery(query.id).catch(() => undefined);

    if (query.data === 'menu_main') {
      await ack();
      await this.bot.sendMessage(chatId, 'Main menu:', {
        reply_markup: this.bot.getMainMenu(),
      });
      return true;
    }

    if (query.data === 'menu_shopping') {
      await ack();
      await this.bot.sendMessage(chatId, '🛒 Shopping menu:', {
        reply_markup: this.bot.getShoppingMenu(),
      });
      return true;
    }

    if (query.data === 'menu_assistant') {
      await ack();
      await this.bot.sendMessage(chatId, '🗓 Assistant menu:', {
        reply_markup: this.bot.getAssistantMenu(),
      });
      return true;
    }

    if (query.data.startsWith('complete_reminder_')) {
      const id = query.data.replace('complete_reminder_', '');
      try {
        await this.reminders.complete(id);
        await this.bot.answerCallbackQuery(query.id, { text: 'Done' });
      } catch {
        await this.bot.answerCallbackQuery(query.id, {
          text: 'Reminder already completed or deleted.',
        });
      }
      return true;
    }

    if (query.data.startsWith('delete_reminder_')) {
      const id = query.data.replace('delete_reminder_', '');
      try {
        await this.reminders.remove(scopeChatId, id);
        await ack();
        await this.bot.sendMessage(chatId, '🗑 Reminder deleted.', {
          reply_markup: this.bot.getAssistantMenu(),
        });
      } catch {
        await ack();
        await this.bot.sendMessage(chatId, '⚠️ Reminder not found.', {
          reply_markup: this.bot.getAssistantMenu(),
        });
      }
      return true;
    }

    if (query.data.startsWith('edit_reminder_')) {
      const id = query.data.replace('edit_reminder_', '');
      const reminder = await this.reminders.findByIdOptional(scopeChatId, id);
      if (!reminder) {
        await ack();
        await this.bot.sendMessage(chatId, '⚠️ Reminder not found.', {
          reply_markup: this.bot.getAssistantMenu(),
        });
        return true;
      }

      this.flow.set(chatId, { step: 'edit_reminder_value', data: { id } });
      await ack();
      await this.bot.sendMessage(
        chatId,
        [
          `Current: ${this.reminders.formatReminderTime(reminder.remindAt)} — ${reminder.text}`,
          '',
          'Send updated reminder as:',
          '`in 45m call mom`',
          '`tomorrow 08:30 gym`',
          '`2026-05-01 09:00 pay rent`',
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

    if (query.data.startsWith('confirm_delete_product_')) {
      const id = query.data.replace('confirm_delete_product_', '');
      try {
        await this.shopping.removeById(scopeChatId, id);
        await ack();
        await this.bot.sendMessage(chatId, '🗑 Product deleted.', {
          reply_markup: this.bot.getShoppingMenu(),
        });
      } catch {
        await ack();
        await this.bot.sendMessage(
          chatId,
          '⚠️ Product not found or already deleted.',
          { reply_markup: this.bot.getShoppingMenu() },
        );
      }
      return true;
    }

    if (query.data.startsWith('delete_product_')) {
      const id = query.data.replace('delete_product_', '');
      const row = await this.shopping.findByIdOptional(scopeChatId, id);
      if (!row) {
        await ack();
        await this.bot.sendMessage(
          chatId,
          '⚠️ Product not found.',
          { reply_markup: this.bot.getShoppingMenu() },
        );
        return true;
      }

      await ack();
      await this.bot.sendMessage(
        chatId,
        `⚠️ Delete this product?\n\n*${row.title}*\n🏪 ${row.shopName || '—'}`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Yes, delete',
                  callback_data: `confirm_delete_product_${id}`,
                },
                { text: '❌ Cancel', callback_data: 'menu_shopping' },
              ],
            ],
          },
        },
      );
      return true;
    }

    if (query.data.startsWith('edit_product_')) {
      const id = query.data.replace('edit_product_', '');
      const row = await this.shopping.findByIdOptional(scopeChatId, id);
      if (!row) {
        await ack();
        await this.bot.sendMessage(chatId, '⚠️ Product not found.', {
          reply_markup: this.bot.getShoppingMenu(),
        });
        return true;
      }

      this.flow.set(chatId, { step: 'edit_product_value', data: { id } });
      await ack();
      await this.bot.sendMessage(
        chatId,
        [
          `Current: ${row.title} | ${row.shopName || '-'} | ${row.kindOfDiscount || '-'}`,
          '',
          'Send updated product as:',
          '`title | shop | discount`',
          'Use `-` to skip shop or discount.',
        ].join('\n'),
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '❌ Cancel product' }]],
            resize_keyboard: true,
          },
        },
      );
      return true;
    }

    if (query.data === 'menu_recipes') {
      await ack();
      await this.bot.sendMessage(chatId, '🍲 Recipes menu:', {
        reply_markup: this.bot.getRecipiesMenu(),
      });
      return true;
    }

    if (query.data === 'recipes_pgnoop') {
      await this.bot
        .answerCallbackQuery(query.id, { text: 'Use Prev / Next to change page.' })
        .catch(() => undefined);
      return true;
    }

    if (query.data.startsWith('recipes_pg_')) {
      const page = Number.parseInt(
        query.data.replace('recipes_pg_', ''),
        10,
      );
      if (Number.isNaN(page) || page < 0) {
        await ack();
        return true;
      }

      const recipes = await this.recipies.findAll(scopeChatId);
      if (!recipes.length) {
        await ack();
        await this.bot.sendMessage(chatId, '😕 No recipes yet.', {
          reply_markup: this.bot.getRecipiesMenu(),
        });
        return true;
      }

      const payload = buildRecipesListPayload(recipes, page);
      const messageId = query.message?.message_id;

      await ack();

      if (messageId != null) {
        try {
          await this.bot.editMessageText(chatId, messageId, payload.text, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: payload.inline_keyboard },
          });
        } catch {
          await this.bot.sendMessage(chatId, payload.text, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: payload.inline_keyboard },
          });
        }
      } else {
        await this.bot.sendMessage(chatId, payload.text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: payload.inline_keyboard },
        });
      }
      return true;
    }

    if (query.data === 'menu_spendings') {
      await ack();
      await this.bot.sendMessage(chatId, '💸 Spendings:', {
        reply_markup: this.bot.getSpendingsMenu(),
      });
      return true;
    }

    if (query.data.startsWith('confirm_delete_spending_')) {
      const id = query.data.replace('confirm_delete_spending_', '');
      try {
        await this.spendings.remove(scopeChatId, id);
        await ack();
        await this.bot.sendMessage(chatId, '🗑 Spending deleted.', {
          reply_markup: this.bot.getSpendingsMenu(),
        });
      } catch {
        await ack();
        await this.bot.sendMessage(
          chatId,
          '⚠️ Spending not found or already deleted.',
          { reply_markup: this.bot.getSpendingsMenu() },
        );
      }
      return true;
    }

    if (query.data.startsWith('delete_spending_')) {
      const id = query.data.replace('delete_spending_', '');
      const row = await this.spendings.findByIdOptional(scopeChatId, id);
      if (!row) {
        await ack();
        await this.bot.sendMessage(
          chatId,
          '⚠️ Spending not found.',
          { reply_markup: this.bot.getSpendingsMenu() },
        );
        return true;
      }

      await ack();
      const note = row.description ? `\n_${row.description}_` : '';
      await this.bot.sendMessage(
        chatId,
        `⚠️ Delete this spending?\n\n${row.amount} ${row.currency} · ${row.category}${note}`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Yes, delete',
                  callback_data: `confirm_delete_spending_${id}`,
                },
                { text: '❌ Cancel', callback_data: 'menu_spendings' },
              ],
            ],
          },
        },
      );
      return true;
    }

    if (query.data.startsWith('edit_spending_')) {
      const id = query.data.replace('edit_spending_', '');
      const row = await this.spendings.findByIdOptional(scopeChatId, id);
      if (!row) {
        await ack();
        await this.bot.sendMessage(chatId, '⚠️ Spending not found.', {
          reply_markup: this.bot.getSpendingsMenu(),
        });
        return true;
      }

      this.flow.set(chatId, { step: 'edit_spending_value', data: { id } });
      await ack();
      await this.bot.sendMessage(
        chatId,
        [
          `Current: ${row.category} | ${row.amount} | ${row.currency} | ${row.description || '-'}`,
          '',
          'Send updated spending as:',
          '`category | amount | currency | note`',
          'Use `-` to skip note.',
        ].join('\n'),
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

    if (query.data.startsWith('recipe_')) {
      const id = query.data.replace('recipe_', '');
      const recipe = await this.recipies.findById(scopeChatId, id);

      if (!recipe) return;

      await ack();
      await this.bot.sendMessage(
        chatId,
        `🍲 *${recipe.title}*\n\n` +
          `🧂 Ingredients:\n- ${recipe.ingredients.join('\n- ')}\n\n` +
          `📖 Instructions:\n${recipe.instructions}`,
        { parse_mode: 'Markdown' },
      );
    }

    if (query.data.startsWith('edit_recipe_')) {
      const id = query.data.replace('edit_recipe_', '');
      const recipe = await this.recipies.findById(scopeChatId, id);

      if (!recipe) {
        await ack();
        await this.bot.sendMessage(chatId, '⚠️ Recipe not found.', {
          reply_markup: this.bot.getRecipiesMenu(),
        });
        return true;
      }

      this.flow.set(chatId, { step: 'edit_recipe_value', data: { id } });
      await ack();
      await this.bot.sendMessage(
        chatId,
        [
          `Current: ${recipe.title}`,
          `Ingredients: ${recipe.ingredients.join(', ')}`,
          `Instructions: ${recipe.instructions}`,
          '',
          'Send updated recipe as:',
          '`title | ingredient1, ingredient2 | instructions`',
        ].join('\n'),
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '❌ Cancel recipe' }]],
            resize_keyboard: true,
          },
        },
      );
      return true;
    }

    if (query.data.startsWith('delete_')) {
      const id = query.data.replace('delete_', '');

      await ack();
      await this.bot.sendMessage(chatId, '⚠️ Are you sure?', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Yes, delete',
                callback_data: `confirm_delete_${id}`,
              },
              { text: '❌ Cancel', callback_data: 'menu_main' },
            ],
          ],
        },
      });

      return true;
    }

    if (query.data.startsWith('confirm_delete_')) {
      const id = query.data.replace('confirm_delete_', '');
      const recipe = await this.recipies.findById(scopeChatId, id);

      if (!recipe) return;

      await ack();
      await this.recipies.remove(scopeChatId, id);

      await this.bot.sendMessage(chatId, '🗑 Recipe deleted.', {
        reply_markup: this.bot.getRecipiesMenu(),
      });

      return true;
    }
  }
}
