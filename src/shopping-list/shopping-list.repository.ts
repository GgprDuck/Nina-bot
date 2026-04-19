import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShoppingList } from '@prisma/client';

@Injectable()
export class ShoppingListRepository {
  constructor(
    private readonly prisma: PrismaService) {}

  create(
    data: Omit<ShoppingList, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ShoppingList> {
    return this.prisma.shoppingList.create({ data: data });
  }

  findByTitle(title: string): Promise<ShoppingList | null> {
    return this.prisma.shoppingList.findFirst({
      where: { title },
    });
  }

  deleteAll(): Promise<{ count: number }> {
    return this.prisma.shoppingList.deleteMany();
  }

  findAll(): Promise<ShoppingList[]> {
    return this.prisma.shoppingList.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<ShoppingList | null> {
    return this.prisma.shoppingList.findUnique({
      where: { id },
    });
  }

  update(id: string, data: Partial<ShoppingList>) {
    return this.prisma.shoppingList.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.prisma.shoppingList.delete({
      where: { id },
    });
  }
}
