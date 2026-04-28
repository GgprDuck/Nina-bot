import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Recipe } from '@prisma/client';

@Injectable()
export class RecipiesRepository {
  constructor(
    private readonly prisma: PrismaService) {}

  create(
    chatId: number,
    data: Omit<Recipe, 'id' | 'chatId' | 'createdAt' | 'updatedAt'>,
  ): Promise<Recipe> {
    return this.prisma.recipe.create({
      data: { ...data, chatId: BigInt(chatId) },
    });
  }

  findByTitle(chatId: number, title: string): Promise<Recipe | null> {
    return this.prisma.recipe.findFirst({
      where: { chatId: BigInt(chatId), title },
    });
  }

  deleteAll(): Promise<{ count: number }> {
    return this.prisma.recipe.deleteMany();
  }

  findAll(chatId: number): Promise<Recipe[]> {
    return this.prisma.recipe.findMany({
      where: { chatId: BigInt(chatId) },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(chatId: number, id: string): Promise<Recipe | null> {
    return this.prisma.recipe.findFirst({
      where: { id, chatId: BigInt(chatId) },
    });
  }

  update(chatId: number, id: string, data: Partial<Recipe>) {
    return this.prisma.recipe.update({
      where: { id },
      data: { ...data, chatId: BigInt(chatId) },
    });
  }

  delete(chatId: number, id: string) {
    return this.prisma.recipe.deleteMany({
      where: { id, chatId: BigInt(chatId) },
    });
  }
}
