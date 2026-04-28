import { Injectable } from '@nestjs/common';
import { CallbackQuery, Message } from 'node-telegram-bot-api';
import { MenuHandler } from './handlers/menu.handler';
import { FlowHandler } from './handlers/flow.handler';
import { CallbackHandler } from './handlers/callback.handler';
import { CommandRegistry } from './registry/command.registry';
import { MessageRegistry } from './registry/message.registry';

@Injectable()
export class BotUpdate {
  constructor(
    private commandRegistry: CommandRegistry,
    private messageRegistry: MessageRegistry,
    private menu: MenuHandler,
    private flow: FlowHandler,
    private callback: CallbackHandler,
  ) {}

  async handleMessage(msg: Message) {
    if (!msg.text) return;

    if (msg.text.startsWith('/')) {
      const commandName = msg.text.split(/\s+/)[0];
      const command = this.commandRegistry.get(commandName);
      if (command) {
        await command.execute(msg);
        return;
      }
    }

    const menuHandled = await this.menu.handle(msg);
    if (menuHandled) return;

    const flowHandled = await this.flow.handle(msg);
    if (flowHandled) return;

    for (const handler of this.messageRegistry.getHandlers()) {
      const handled = await handler.handle(msg);
      if (handled) return;
    }

    const callbackHandled = await this.callback.handle(
      msg as unknown as CallbackQuery,
    );
    if (callbackHandled !== undefined) return;
  }
}