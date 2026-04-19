import { Message } from 'node-telegram-bot-api';

export interface BotCommand {
  execute(msg: Message): any;
}
