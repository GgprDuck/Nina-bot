import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Spendings } from '@prisma/client';

@Injectable()
export class SpendingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Omit<Spendings, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Spendings> {
    return this.prisma.spendings.create({ data });
  }

  findBetween(start: Date, end: Date): Promise<Spendings[]> {
    return this.prisma.spendings.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findRecent(limit: number): Promise<Spendings[]> {
    return this.prisma.spendings.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  findById(id: string): Promise<Spendings | null> {
    return this.prisma.spendings.findUnique({ where: { id } });
  }

  delete(id: string): Promise<Spendings> {
    return this.prisma.spendings.delete({ where: { id } });
  }
}
