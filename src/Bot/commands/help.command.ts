import { Injectable } from '@nestjs/common';
import { Message } from 'node-telegram-bot-api';
import { Command } from '../decorators/command.decorator';
import { BotCommand } from '../interfaces/command.interface';
import { BotService } from '../bot.service';

@Command('/help')
@Injectable()
export class HelpCommand implements BotCommand {
  constructor(private readonly bot: BotService) {}

  execute(msg: Message) {
    return this.bot.sendMessage(
      msg.chat.id,
      [
        'Here is what I can help with:',
        '',
        '🗓 Assistant',
        '• `remind in 30m drink water`',
        '• `remind tomorrow 09:00 buy milk`',
        '• `remind 2026-04-30 18:00 pay rent`',
        '',
        '💸 Spendings',
        '• Use the menu flow or quick input: `food 12.50 eur lunch`',
        '',
        '🛒 Shopping',
        '• Use the menu flow or quick input: `buy milk @ATB discount`',
        '',
        '🍲 Recipes',
        '• Add recipes, browse the list, and open recipe details.',
      ].join('\n'),
      {
        parse_mode: 'Markdown',
        reply_markup: this.bot.getMainMenu(),
      },
    );
  }
}
