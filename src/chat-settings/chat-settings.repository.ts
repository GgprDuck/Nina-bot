import { Injectable } from '@nestjs/common';
import { ChatSettings } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(chatId: number, data: Partial<Omit<ChatSettings, 'chatId'>>) {
    return this.prisma.chatSettings.upsert({
      where: { chatId: BigInt(chatId) },
      create: {
        chatId: BigInt(chatId),
        ...data,
      },
      update: data,
    });
  }

  findByChatId(chatId: number) {
    return this.prisma.chatSettings.findUnique({
      where: { chatId: BigInt(chatId) },
    });
  }
}
