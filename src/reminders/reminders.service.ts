import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RemindersRepository } from './reminders.repository';

type ParsedReminder = {
  text: string;
  remindAt: Date;
};

@Injectable()
export class RemindersService {
  constructor(private readonly repository: RemindersRepository) {}

  create(chatId: number, input: ParsedReminder) {
    if (!input.text.trim()) {
      throw new BadRequestException('Reminder text is required');
    }
    if (input.remindAt.getTime() <= Date.now()) {
      throw new BadRequestException('Reminder time must be in the future');
    }

    return this.repository.create({
      chatId: BigInt(chatId),
      text: input.text.trim(),
      remindAt: input.remindAt,
    });
  }

  findUpcoming(chatId: number, limit?: number) {
    return this.repository.findUpcoming(chatId, limit);
  }

  findDue(now = new Date()) {
    return this.repository.findDue(now);
  }

  async complete(id: string) {
    const reminder = await this.repository.findById(id);
    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }
    return this.repository.complete(id);
  }

  async remove(chatId: number, id: string) {
    const reminder = await this.repository.findById(id);
    if (!reminder || reminder.chatId !== BigInt(chatId)) {
      throw new NotFoundException('Reminder not found');
    }
    return this.repository.delete(id);
  }

  async findByIdOptional(chatId: number, id: string) {
    const reminder = await this.repository.findById(id);
    if (!reminder || reminder.chatId !== BigInt(chatId)) {
      return null;
    }
    return reminder;
  }

  async update(chatId: number, id: string, input: ParsedReminder) {
    const reminder = await this.findByIdOptional(chatId, id);
    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }
    if (!input.text.trim()) {
      throw new BadRequestException('Reminder text is required');
    }
    if (input.remindAt.getTime() <= Date.now()) {
      throw new BadRequestException('Reminder time must be in the future');
    }

    return this.repository.update(id, {
      text: input.text.trim(),
      remindAt: input.remindAt,
      completedAt: null,
    });
  }

  parseQuickReminder(raw: string, now = new Date()): ParsedReminder | null {
    const text = raw.trim();
    const lower = text.toLowerCase();

    if (!lower.startsWith('remind ')) return null;

    const body = text.replace(/^remind(?:\s+me)?\s+/i, '').trim();
    return (
      this.parseRelativeReminder(body, now) ??
      this.parseTomorrowReminder(body, now) ??
      this.parseTodayReminder(body, now) ??
      this.parseDateReminder(body)
    );
  }

  parseReminderFlowInput(raw: string, now = new Date()): ParsedReminder {
    const parsed =
      this.parseRelativeReminder(raw, now) ??
      this.parseTomorrowReminder(raw, now) ??
      this.parseTodayReminder(raw, now) ??
      this.parseDateReminder(raw);

    if (!parsed) {
      throw new BadRequestException(
        'Use examples like `in 30m drink water`, `tomorrow 09:00 buy milk`, or `2026-04-30 18:00 pay rent`.',
      );
    }

    return parsed;
  }

  formatReminderTime(date: Date) {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(date);
  }

  private parseRelativeReminder(body: string, now: Date): ParsedReminder | null {
    const match = body.match(/^in\s+(\d+)\s*(m|min|minute|minutes|h|hour|hours|d|day|days)\s+(.+)$/i);
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const reminderText = match[3].trim();
    const multiplier =
      unit.startsWith('m') ? 60_000 : unit.startsWith('h') ? 3_600_000 : 86_400_000;

    return {
      text: reminderText,
      remindAt: new Date(now.getTime() + amount * multiplier),
    };
  }

  private parseTomorrowReminder(body: string, now: Date): ParsedReminder | null {
    const match = body.match(/^tomorrow\s+(\d{1,2}):(\d{2})\s+(.+)$/i);
    if (!match) return null;

    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() + 1);
    date.setUTCHours(Number(match[1]), Number(match[2]), 0, 0);

    return {
      text: match[3].trim(),
      remindAt: date,
    };
  }

  private parseTodayReminder(body: string, now: Date): ParsedReminder | null {
    const match = body.match(/^today\s+(\d{1,2}):(\d{2})\s+(.+)$/i);
    if (!match) return null;

    const date = new Date(now);
    date.setUTCHours(Number(match[1]), Number(match[2]), 0, 0);

    return {
      text: match[3].trim(),
      remindAt: date,
    };
  }

  private parseDateReminder(body: string): ParsedReminder | null {
    const match = body.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s+(.+)$/);
    if (!match) return null;

    const remindAt = new Date(
      Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        0,
        0,
      ),
    );

    return {
      text: match[6].trim(),
      remindAt,
    };
  }
}
