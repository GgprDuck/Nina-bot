import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShoppingList } from '@prisma/client';

@Injectable()
export class ShoppingListRepository {
  constructor(
    private readonly prisma: PrismaService) {}

  create(
    chatId: number,
    data: Omit<ShoppingList, 'id' | 'chatId' | 'createdAt' | 'updatedAt'>,
  ): Promise<ShoppingList> {
    return this.prisma.shoppingList.create({
      data: { ...data, chatId: BigInt(chatId) },
    });
  }

  findByTitle(chatId: number, title: string): Promise<ShoppingList | null> {
    return this.prisma.shoppingList.findFirst({
      where: { chatId: BigInt(chatId), title },
    });
  }

  deleteAll(chatId: number): Promise<{ count: number }> {
    return this.prisma.shoppingList.deleteMany({
      where: { chatId: BigInt(chatId) },
    });
  }

  findAll(chatId: number): Promise<ShoppingList[]> {
    return this.prisma.shoppingList.findMany({
      where: { chatId: BigInt(chatId) },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(chatId: number, id: string): Promise<ShoppingList | null> {
    return this.prisma.shoppingList.findFirst({
      where: { id, chatId: BigInt(chatId) },
    });
  }

  update(chatId: number, id: string, data: Partial<ShoppingList>) {
    return this.prisma.shoppingList.update({
      where: { id },
      data: { ...data, chatId: BigInt(chatId) },
    });
  }

  delete(chatId: number, id: string) {
    return this.prisma.shoppingList.deleteMany({
      where: { id, chatId: BigInt(chatId) },
    });
  }
}
