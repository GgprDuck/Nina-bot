import { Injectable } from '@nestjs/common';
import { Reminder } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RemindersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Pick<Reminder, 'chatId' | 'text' | 'remindAt'>) {
    return this.prisma.reminder.create({ data });
  }

  findUpcoming(chatId: number, limit = 20) {
    return this.prisma.reminder.findMany({
      where: {
        chatId: BigInt(chatId),
        completedAt: null,
      },
      orderBy: { remindAt: 'asc' },
      take: limit,
    });
  }

  findDue(now: Date, limit = 50) {
    return this.prisma.reminder.findMany({
      where: {
        completedAt: null,
        remindAt: { lte: now },
      },
      orderBy: { remindAt: 'asc' },
      take: limit,
    });
  }

  findById(id: string) {
    return this.prisma.reminder.findUnique({ where: { id } });
  }

  complete(id: string) {
    return this.prisma.reminder.update({
      where: { id },
      data: { completedAt: new Date() },
    });
  }

  delete(id: string) {
    return this.prisma.reminder.delete({ where: { id } });
  }

  update(id: string, data: Partial<Pick<Reminder, 'text' | 'remindAt' | 'completedAt'>>) {
    return this.prisma.reminder.update({
      where: { id },
      data,
    });
  }
}
