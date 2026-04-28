import {
  forwardRef,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot = require('node-telegram-bot-api');
import { BotUpdate } from './bot.update';
import { CallbackHandler } from './handlers/callback.handler';

@Injectable()
export class BotService implements OnModuleInit {
  private bot!: TelegramBot;

  private restarting = false;
  private lastUpdate = Date.now();

  constructor(
    private config: ConfigService,
    @Inject(forwardRef(() => BotUpdate)) private update: BotUpdate,
    private callbackHandler: CallbackHandler,
  ) {}

  // -------------------------
  // INIT
  // -------------------------
  async onModuleInit() {
    const token = this.config.get<string>('BOT_TOKEN');
    if (!token) throw new Error('BOT_TOKEN missing');

    this.bot = new TelegramBot(token, {
      polling: {
        autoStart: false,
        params: { timeout: 10 },
      },
    });

    this.registerHandlers();

    await this.startPollingSafe();

    this.startWatchdog();
    this.startHeartbeat();

    console.log('🤖 Anti-sleep bot started');
  }

  // -------------------------
  // HANDLERS
  // -------------------------
  private registerHandlers() {
    this.bot.on('message', async (msg) => {
      this.lastUpdate = Date.now();

      try {
        await this.update.handleMessage(msg);
      } catch (e) {
        console.error('Message error:', e);
      }
    });

    this.bot.on('callback_query', async (query) => {
      try {
        await this.callbackHandler.handle(query);
      } catch (e) {
        console.error('Callback error:', e);
      }
    });

    this.bot.on('polling_error', (err) => {
      console.error('Polling error:', err.message);
      this.safeRestart();
    });
  }

  // -------------------------
  // SAFE START / RESTART
  // -------------------------
  private async startPollingSafe() {
    await this.bot.stopPolling().catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));
    await this.bot.startPolling();
  }

  private async safeRestart() {
    if (this.restarting) return;

    this.restarting = true;

    try {
      console.log('🔄 Restarting polling...');

      await this.bot.stopPolling().catch(() => {});
      await new Promise((r) => setTimeout(r, 2000));
      await this.bot.startPolling();

      console.log('✅ Polling restarted');
    } catch (e) {
      console.error('❌ Restart failed:', e);
    } finally {
      this.restarting = false;
    }
  }

  // -------------------------
  // WATCHDOG (ANTI-SLEEP)
  // -------------------------
  private startWatchdog() {
    setInterval(async () => {
      const diff = Date.now() - this.lastUpdate;

      // 2 хв без апдейтів → бот “заснув”
      if (diff > 120000) {
        console.log('⚠️ Watchdog: no updates → restart');
        await this.safeRestart();
      }
    }, 30000);
  }

  // -------------------------
  // HEARTBEAT (Render survival)
  // -------------------------
  private startHeartbeat() {
    setInterval(async () => {
      try {
        await this.bot.getMe();
      } catch (e) {
        console.log('💀 Heartbeat failed → restart');
        await this.safeRestart();
      }
    }, 25000);
  }

  // -------------------------
  // PUBLIC API
  // -------------------------
  sendMessage(chatId: number | string, text: string, options?: any) {
    return this.bot.sendMessage(chatId, text, options);
  }

  answerCallbackQuery(
    callbackQueryId: string,
    options?: { text?: string; show_alert?: boolean },
  ) {
    return this.bot.answerCallbackQuery(callbackQueryId, options);
  }

  editMessageText(
    chatId: number,
    messageId: number,
    text: string,
    options?: { parse_mode?: string; reply_markup?: any },
  ) {
    return this.bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      ...options,
    } as Parameters<TelegramBot['editMessageText']>[1]);
  }

  getMainMenu() {
    return {
      keyboard: [
        [{ text: '🗓 Assistant' }],
        [{ text: '👥 Shared data' }],
        [{ text: '🍲 Recipes' }],
        [{ text: '🛒 Shopping List' }],
        [{ text: '💸 Spendings' }],
        [{ text: 'ℹ️ Help' }],
      ],
      resize_keyboard: true,
    };
  }

  getShoppingMenu() {
    return {
      keyboard: [
        [{ text: '➕ Add product' }],
        [{ text: '⚡ Quick add product' }],
        [{ text: '📋 Products list' }],
        [{ text: '✏️ Edit product' }],
        [{ text: '❌ Delete product' }],
        [{ text: '❌ Delete all products' }],
        [{ text: '⬅️ Back' }],
      ],
      resize_keyboard: true,
    };
  }

  getAssistantMenu() {
    return {
      keyboard: [
        [{ text: '➕ Add reminder' }],
        [{ text: '⚡ Quick reminder' }],
        [{ text: '📋 Reminders' }],
        [{ text: '✏️ Edit reminder' }],
        [{ text: '❌ Delete reminder' }],
        [{ text: '⬅️ Back' }],
      ],
      resize_keyboard: true,
    };
  }

  getSharedDataMenu() {
    return {
      keyboard: [
        [{ text: '➕ Create shared space' }],
        [{ text: '🔑 Join shared space' }],
        [{ text: 'ℹ️ Shared data status' }],
        [{ text: '🚪 Leave shared space' }],
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
        [{ text: '✏️ Edit recipe' }],
        [{ text: '❌ Delete recipe' }],
        [{ text: '⬅️ Back' }],
      ],
      resize_keyboard: true,
    };
  }

  getSpendingsMenu() {
    return {
      keyboard: [
        [{ text: '➕ Add spending' }],
        [{ text: '⚡ Quick add spending' }],
        [{ text: '📊 This month' }],
        [{ text: '📅 Month (YYYY-MM)' }],
        [{ text: '💱 Report currency' }],
        [{ text: '✏️ Edit spending' }],
        [{ text: '❌ Delete spending' }],
        [{ text: '⬅️ Back' }],
      ],
      resize_keyboard: true,
    };
  }
}