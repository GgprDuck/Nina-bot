import { Injectable } from '@nestjs/common';
import { OnMessage } from '../decorators/message.decorator';
import { Message } from 'node-telegram-bot-api';
import { BotService } from '../bot.service';

@OnMessage()
@Injectable()
export class PingHandler {
  constructor(private readonly bot: BotService) {}

  handle(msg: Message) {
    if (!msg.text) return;

    if (msg.text.toLowerCase() === 'ping') {
      return this.bot.sendMessage(msg.chat.id, 'pong 🏓');
    }
  }
}
