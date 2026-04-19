import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Recipe } from '@prisma/client';

@Injectable()
export class RecipiesRepository {
  constructor(
    private readonly prisma: PrismaService) {}

  create(
    data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Recipe> {
    return this.prisma.recipe.create({ data: data });
  }

  findByTitle(title: string): Promise<Recipe | null> {
    return this.prisma.recipe.findFirst({
      where: { title },
    });
  }

  deleteAll(): Promise<{ count: number }> {
    return this.prisma.recipe.deleteMany();
  }

  findAll(): Promise<Recipe[]> {
    return this.prisma.recipe.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<Recipe | null> {
    return this.prisma.recipe.findUnique({
      where: { id },
    });
  }

  update(id: string, data: Partial<Recipe>) {
    return this.prisma.recipe.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.prisma.recipe.delete({
      where: { id },
    });
  }
}
