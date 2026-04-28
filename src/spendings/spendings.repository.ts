import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Spendings } from '@prisma/client';

@Injectable()
export class SpendingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    chatId: number,
    data: Omit<Spendings, 'id' | 'chatId' | 'createdAt' | 'updatedAt'>,
  ): Promise<Spendings> {
    return this.prisma.spendings.create({
      data: { ...data, chatId: BigInt(chatId) },
    });
  }

  findBetween(chatId: number, start: Date, end: Date): Promise<Spendings[]> {
    return this.prisma.spendings.findMany({
      where: {
        chatId: BigInt(chatId),
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findRecent(chatId: number, limit: number): Promise<Spendings[]> {
    return this.prisma.spendings.findMany({
      where: { chatId: BigInt(chatId) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  findById(chatId: number, id: string): Promise<Spendings | null> {
    return this.prisma.spendings.findFirst({
      where: { id, chatId: BigInt(chatId) },
    });
  }

  delete(chatId: number, id: string) {
    return this.prisma.spendings.deleteMany({
      where: { id, chatId: BigInt(chatId) },
    });
  }

  update(
    chatId: number,
    id: string,
    data: Partial<Omit<Spendings, 'id' | 'chatId' | 'createdAt' | 'updatedAt'>>,
  ) {
    return this.prisma.spendings.updateMany({
      where: { id, chatId: BigInt(chatId) },
      data,
    });
  }
}
