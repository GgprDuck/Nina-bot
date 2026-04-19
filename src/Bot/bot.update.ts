import { Injectable } from '@nestjs/common';
import { CallbackQuery, Message } from 'node-telegram-bot-api';
import { MenuHandler } from './handlers/menu.handler';
import { FlowHandler } from './handlers/flow.handler';
import { CallbackHandler } from './handlers/callback.handler';

@Injectable()
export class BotUpdate {
  constructor(
    private menu: MenuHandler,
    private flow: FlowHandler,
    private callback: CallbackHandler,
  ) {}

  async handleMessage(msg: Message) {
    if (!msg.text) return;


    const menuHandled = await this.menu.handle(msg);
    if (menuHandled) return;

    const flowHandled = await this.flow.handle(msg);
    if (flowHandled) return;

    const callbackHandled = await this.callback.handle(msg as unknown as CallbackQuery);
    if (callbackHandled !== undefined) return;
  }
}