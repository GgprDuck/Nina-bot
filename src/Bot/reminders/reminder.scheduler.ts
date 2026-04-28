import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { BotService } from '../bot.service';
import { RemindersService } from '../../reminders/reminders.service';
import { SharedSpaceService } from '../../shared-space/shared-space.service';

@Injectable()
export class ReminderScheduler implements OnModuleInit {
  private readonly intervalMs = 30_000;

  constructor(
    @Inject(forwardRef(() => BotService)) private readonly bot: BotService,
    private readonly reminders: RemindersService,
    private readonly sharedSpaces: SharedSpaceService,
  ) {}

  onModuleInit() {
    setInterval(() => {
      void this.sendDueReminders();
    }, this.intervalMs);
  }

  private async sendDueReminders() {
    const due = await this.reminders.findDue();

    for (const reminder of due) {
      try {
        const recipients = await this.sharedSpaces.resolveRecipientChatIds(
          Number(reminder.chatId),
        );
        for (const chatId of recipients) {
          await this.bot.sendMessage(chatId, `🔔 Reminder\n\n${reminder.text}`, {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '✅ Done',
                    callback_data: `complete_reminder_${reminder.id}`,
                  },
                ],
              ],
            },
          });
        }
        await this.reminders.complete(reminder.id);
      } catch (e) {
        console.error('Reminder delivery failed:', e);
      }
    }
  }
}
