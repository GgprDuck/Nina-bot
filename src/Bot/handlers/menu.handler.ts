import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Message } from 'node-telegram-bot-api';
import { ShoppingListService } from 'src/shopping-list/shoping-list.service';
import { BotService } from '../bot.service';
import { FlowService } from '../flow/flow.service';
import { RecipiesService } from 'src/recipies/recipies.service';

@Injectable()
export class MenuHandler {
  constructor(
    @Inject(forwardRef(() => BotService)) private bot: BotService,
    private flow: FlowService,
    private shopping: ShoppingListService,
    private recipies: RecipiesService,
  ) {}

  async handle(msg: Message): Promise<boolean> {
    if (!msg.text) return false;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '🍲 Recipes') {
      this.flow.delete(chatId);
      await this.bot.sendMessage(chatId, '🍲 Recipes menu:', {
        reply_markup: this.bot.getRecipiesMenu(),
      });
      return true;
    }

    if (text === '📋 Recipes list') {
      const recipes = await this.recipies.findAll();
    
      if (!recipes.length) {
        await this.bot.sendMessage(chatId, '😕 No recipes yet.\n', {
        });
        return true;
      }
    
      const inlineKeyboard = [];
    
      for (let i = 0; i < recipes.length; i += 2) {
        inlineKeyboard.push([
          {
            text: `🍲 ${recipes[i].title}`,
            callback_data: `recipe_${recipes[i].id}`,
          },
          recipes[i + 1]
            ? {
                text: `🍲 ${recipes[i + 1].title}`,
                callback_data: `recipe_${recipes[i + 1].id}`,
              }
            : undefined,
        ].filter(Boolean));
      }
    
      await this.bot.sendMessage(
        chatId,
        `🍲 *Recipes Menu*\n\nFound: *${recipes.length}* recipes\n\nChoose one below 👇`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: inlineKeyboard,
          },
        }
      );
    
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
      await this.bot.sendMessage(chatId, '💸 Coming soon...', {
        reply_markup: this.bot.getMainMenu(),
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
      const recipes = await this.recipies.findAll();
    
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
    
      inlineKeyboard.push([
        { text: '⬅️ Back', callback_data: 'menu_main' }
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

    if (text === '❌ Delete all products') {
      this.flow.delete(chatId);
      await this.shopping.removeAll();
      await this.bot.sendMessage(chatId, '🛒 All products deleted.', {
        reply_markup: this.bot.getShoppingMenu(),
      });
      return true;
    }

    if (text === '❌ Delete product') {
      const items = await this.shopping.findAll();

      if (!items.length) {
        await this.bot.sendMessage(chatId, '🛒 Your shopping list is empty.', {
          reply_markup: this.bot.getShoppingMenu(),
        });
        return true;
      }

      const list = items.map(i => `• ${i.title}`).join('\n');
      this.flow.set(chatId, { step: 'delete', data: {} });
      await this.bot.sendMessage(
        chatId,
        `🗑️ Enter the product name to delete:\n\n${list}`,
      );
      return true;
    }

    if (text === '📋 Products list') {
      const items = await this.shopping.findAll();

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
}