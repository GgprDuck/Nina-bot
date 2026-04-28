import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ShoppingListRepository } from './shopping-list.repository';

@Injectable()
export class ShoppingListService {
  constructor(private readonly repository: ShoppingListRepository) {}

  async create(chatId: number, input: {
    title: string;
    shopName: string;
    kindOfDiscount: string;
  }) {
    if (!input.title) {
      throw new BadRequestException('Title is required');
    }

    return this.repository.create(chatId, input);
  }

  findAll(chatId: number) {
    return this.repository.findAll(chatId);
  }

  removeAll(chatId: number) {
    return this.repository.deleteAll(chatId);
  }

  async findOne(chatId: number, title: string) {
    const list = await this.repository.findByTitle(chatId, title);

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    return list;
  }

  findOneByTitle(chatId: number, title: string) {
    return this.repository.findByTitle(chatId, title);
  }

  findByIdOptional(chatId: number, id: string) {
    return this.repository.findById(chatId, id);
  }

  async removeById(chatId: number, id: string) {
    const product = await this.repository.findById(chatId, id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.repository.delete(chatId, id);
  }

  async update(
    chatId: number,
    id: string,
    data: Partial<{
      title: string;
      shopName: string;
      kindOfDiscount: string;
    }>,
  ) {
    const product = await this.repository.findById(chatId, id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.repository.update(chatId, id, data);
  }

  async remove(chatId: number, title: string) {
    const product = await this.findOneByTitle(chatId, title);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.repository.delete(chatId, product.id);
  }
}