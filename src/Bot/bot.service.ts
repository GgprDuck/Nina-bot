import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot = require('node-telegram-bot-api');
import { BotUpdate } from './bot.update';
import { CallbackHandler } from './handlers/callback.handler';

@Injectable()
export class BotService implements OnModuleInit {
  private bot!: TelegramBot;

  constructor(
    private config: ConfigService,
    @Inject(forwardRef(() => BotUpdate)) private update: BotUpdate,
    private callbackHandler: CallbackHandler,
  ) {}

  onModuleInit() {
    const token = this.config.get<string>('BOT_TOKEN');
    if (!token) throw new Error('BOT_TOKEN missing');

    this.bot = new TelegramBot(token, { polling: true });

    this.bot.on('message', (msg) => {
      this.update.handleMessage(msg);
    });

    this.bot.on('callback_query', (query) => {
      this.callbackHandler.handle(query);
    });
  }

  sendMessage(chatId: number | string, text: string, options?: any) {
    return this.bot.sendMessage(chatId, text, options);
  }

  getMainMenu() {
    return {
      keyboard: [
        [{ text: '🍲 Recipes' }],
        [{ text: '🛒 Shopping List' }],
        [{ text: '💸 Spendings' }],
      ],
      resize_keyboard: true,
    };
  }

  getShoppingMenu() {
    return {
      keyboard: [
        [{ text: '➕ Add product' }],
        [{ text: '📋 Products list' }],
        [{ text: '❌ Delete product' }],
        [{ text: '❌ Delete all products' }],
        [{ text: '⬅️ Back' }],
      ],
      resize_keyboard: true,
    };
  }

  getRecipiesMenu() {
    return {
      keyboard: [
        [{ text: '➕ Add recipe' }],
        [{ text: '📋 Recipes list' }],
        [{ text: '❌ Delete recipe' }],
        [{ text: '⬅️ Back' }],
      ],
      resize_keyboard: true,
    };
  }
}