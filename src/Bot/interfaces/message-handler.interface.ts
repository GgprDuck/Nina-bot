import { Message } from 'node-telegram-bot-api';

export interface MessageHandler {
  handle(msg: Message): any;
}
