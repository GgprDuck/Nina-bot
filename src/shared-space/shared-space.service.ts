import { BadRequestException, Injectable } from '@nestjs/common';
import { SharedSpaceRepository } from './shared-space.repository';

@Injectable()
export class SharedSpaceService {
  private readonly scopeOffset = 9_000_000_000_000;

  constructor(private readonly repository: SharedSpaceRepository) {}

  async createSpace(chatId: number, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Shared space name is required.');
    }

    const code = await this.generateUniqueCode();
    const space = await this.repository.createSpace(chatId, trimmed, code);
    await this.repository.upsertMember(chatId, space.id);
    return space;
  }

  async joinByCode(chatId: number, rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      throw new BadRequestException('Invite code must be 6 letters/numbers.');
    }

    const space = await this.repository.findSpaceByCode(code);
    if (!space) {
      throw new BadRequestException('Shared space not found.');
    }

    await this.repository.upsertMember(chatId, space.id);
    return space;
  }

  async leave(chatId: number) {
    const member = await this.repository.findMemberByChatId(chatId);
    if (!member) return false;
    await this.repository.deleteMember(chatId);
    return true;
  }

  async resolveScopeChatId(chatId: number): Promise<number> {
    const member = await this.repository.findMemberByChatId(chatId);
    if (!member) return chatId;
    return this.scopeOffset + Number(member.sharedSpaceId);
  }

  isSharedScope(scopeChatId: number) {
    return scopeChatId >= this.scopeOffset;
  }

  toSharedSpaceId(scopeChatId: number) {
    return BigInt(scopeChatId - this.scopeOffset);
  }

  async resolveRecipientChatIds(scopeChatId: number): Promise<string[]> {
    if (!this.isSharedScope(scopeChatId)) {
      return [String(scopeChatId)];
    }

    const sharedSpaceId = this.toSharedSpaceId(scopeChatId);
    const members = await this.repository.findMembersBySharedSpaceId(sharedSpaceId);
    return members.map((member: { chatId: bigint }) => member.chatId.toString());
  }

  async getStatus(chatId: number) {
    const member = await this.repository.findMemberByChatId(chatId);
    if (!member) return null;
    const space = await this.repository.findSpaceById(member.sharedSpaceId);
    if (!space) return null;
    const membersCount = await this.repository.countMembers(space.id);
    return {
      name: space.name,
      code: space.code,
      membersCount,
    };
  }

  private async generateUniqueCode(): Promise<string> {
    for (let i = 0; i < 10; i += 1) {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const existing = await this.repository.findSpaceByCode(code);
      if (!existing) return code;
    }
    throw new BadRequestException('Could not generate invite code. Try again.');
  }
}
