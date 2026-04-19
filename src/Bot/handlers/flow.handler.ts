import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Message } from 'node-telegram-bot-api';
import { BotService } from '../bot.service';
import { FlowService } from '../flow/flow.service';
import { ShoppingListService } from 'src/shopping-list/shoping-list.service';
import { RecipiesService } from 'src/recipies/recipies.service';

@Injectable()
export class FlowHandler {
  constructor(
    @Inject(forwardRef(() => BotService)) private bot: BotService,
    private flow: FlowService,
    private shopping: ShoppingListService,
    private recipies: RecipiesService,
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
       🗑 DELETE FLOW
    ========================= */
  
    if (state.step === 'delete') {
      const product = await this.shopping.findOneByTitle(text);
  
      if (!product) {
        await this.bot.sendMessage(
          chatId,
          `❌ Product "${text}" not found. Try again or press ⬅️ Back.`,
        );
        return true;
      }
  
      await this.shopping.remove(text);
  
      this.flow.delete(chatId);
  
      await this.bot.sendMessage(chatId, `🗑️ Deleted: ${text}`, {
        reply_markup: this.bot.getShoppingMenu(),
      });
  
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