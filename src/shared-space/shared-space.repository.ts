import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SharedSpaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  createSpace(ownerChatId: number, name: string, code: string) {
    return this.prisma.sharedSpace.create({
      data: {
        ownerChatId: BigInt(ownerChatId),
        name,
        code,
      },
    });
  }

  findSpaceByCode(code: string) {
    return this.prisma.sharedSpace.findUnique({
      where: { code },
    });
  }

  findSpaceById(id: bigint) {
    return this.prisma.sharedSpace.findUnique({
      where: { id },
    });
  }

  upsertMember(chatId: number, sharedSpaceId: bigint) {
    return this.prisma.sharedSpaceMember.upsert({
      where: { chatId: BigInt(chatId) },
      create: {
        chatId: BigInt(chatId),
        sharedSpaceId,
      },
      update: {
        sharedSpaceId,
      },
    });
  }

  findMemberByChatId(chatId: number) {
    return this.prisma.sharedSpaceMember.findUnique({
      where: { chatId: BigInt(chatId) },
    });
  }

  deleteMember(chatId: number) {
    return this.prisma.sharedSpaceMember.deleteMany({
      where: { chatId: BigInt(chatId) },
    });
  }

  countMembers(sharedSpaceId: bigint) {
    return this.prisma.sharedSpaceMember.count({
      where: { sharedSpaceId },
    });
  }

  findMembersBySharedSpaceId(sharedSpaceId: bigint) {
    return this.prisma.sharedSpaceMember.findMany({
      where: { sharedSpaceId },
    });
  }
}
