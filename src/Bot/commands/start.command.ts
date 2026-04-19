import { Injectable } from '@nestjs/common';
import { Command } from '../decorators/command.decorator';
import { BotCommand } from '../interfaces/command.interface';
import { Message } from 'node-telegram-bot-api';
import { BotService } from '../bot.service';

@Command('/start')
@Injectable()
export class StartCommand implements BotCommand {
  constructor(private readonly bot: BotService) {}

  execute(msg: Message) {
    return this.bot.sendMessage(msg.chat.id, 'Welcome 👋\nChoose an option:', {
      reply_markup: this.bot.getMainMenu(),
    });
  }
}
