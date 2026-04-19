import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CallbackQuery } from 'node-telegram-bot-api';
import { BotService } from '../bot.service';
import { RecipiesService } from 'src/recipies/recipies.service';

@Injectable()
export class CallbackHandler {
  constructor(
    @Inject(forwardRef(() => BotService)) private readonly bot: BotService,
    private readonly recipies: RecipiesService,
  ) {}

  async handle(query: CallbackQuery) {
    if (!query.data) return;

    const chatId = query.message?.chat.id;
    if (!chatId) return;

    if (query.data.startsWith('recipe_')) {
      const id = query.data.replace('recipe_', '');
      const recipe = await this.recipies.findById(id);

      if (!recipe) return;

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
      
        await this.bot.sendMessage(chatId, '⚠️ Are you sure?', {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Yes, delete', callback_data: `confirm_delete_${id}` },
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

        await this.recipies.remove(id);
      
        await this.bot.sendMessage(chatId, '🗑 Recipe deleted.', {
          reply_markup: this.bot.getRecipiesMenu(),
        });
      
        return true;
      }
  }
}