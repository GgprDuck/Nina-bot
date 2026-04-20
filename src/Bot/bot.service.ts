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

  private restarting = false;

  onModuleInit() {
    const token = this.config.get<string>('BOT_TOKEN');
    if (!token) throw new Error('BOT_TOKEN missing');
  
    this.bot = new TelegramBot(token, {
      polling: {
        autoStart: false,
        params: { timeout: 10 },
      },
    });
  
    this.bot.on('polling_error', async (err) => {
      console.error('Polling error:', err.message);
  
      if (this.restarting) return;
      this.restarting = true;
  
      try {
        await this.bot.stopPolling().catch(() => {});
        await new Promise((r) => setTimeout(r, 2000));
        await this.bot.startPolling();
      } finally {
        this.restarting = false;
      }
    });
  
    this.bot.on('message', async (msg) => {
      try {
        await this.update.handleMessage(msg);
      } catch (e) {
        console.error(e);
      }
    });
  
    this.bot.on('callback_query', async (query) => {
      try {
        await this.callbackHandler.handle(query);
      } catch (e) {
        console.error(e);
      }
    });
  
    this.bot.startPolling();
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