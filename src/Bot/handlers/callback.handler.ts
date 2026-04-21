import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CallbackQuery } from 'node-telegram-bot-api';
import { BotService } from '../bot.service';
import { RecipiesService } from 'src/recipies/recipies.service';
import { SpendingsService } from 'src/spendings/spendings.service';
import { ShoppingListService } from 'src/shopping-list/shoping-list.service';
import { buildRecipesListPayload } from '../helpers/recipes-list.keyboard';

@Injectable()
export class CallbackHandler {
  constructor(
    @Inject(forwardRef(() => BotService)) private readonly bot: BotService,
    private readonly recipies: RecipiesService,
    private readonly spendings: SpendingsService,
    private readonly shopping: ShoppingListService,
  ) {}

  async handle(query: CallbackQuery) {
    if (!query.data) return;

    const chatId = query.message?.chat.id;
    if (!chatId) return;

    const ack = () =>
      this.bot.answerCallbackQuery(query.id).catch(() => undefined);

    if (query.data === 'menu_shopping') {
      await ack();
      await this.bot.sendMessage(chatId, '🛒 Shopping menu:', {
        reply_markup: this.bot.getShoppingMenu(),
      });
      return true;
    }

    if (query.data.startsWith('confirm_delete_product_')) {
      const id = query.data.replace('confirm_delete_product_', '');
      try {
        await this.shopping.removeById(id);
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
      const row = await this.shopping.findByIdOptional(id);
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

      const recipes = await this.recipies.findAll();
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
        await this.spendings.remove(id);
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
      const row = await this.spendings.findByIdOptional(id);
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

    if (query.data.startsWith('recipe_')) {
      const id = query.data.replace('recipe_', '');
      const recipe = await this.recipies.findById(id);

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
      const recipe = await this.recipies.findById(id);

      if (!recipe) return;

      await ack();
      await this.recipies.remove(id);

      await this.bot.sendMessage(chatId, '🗑 Recipe deleted.', {
        reply_markup: this.bot.getRecipiesMenu(),
      });

      return true;
    }
  }
}
