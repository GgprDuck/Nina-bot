import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ShoppingListRepository } from './shopping-list.repository';

@Injectable()
export class ShoppingListService {
  constructor(private readonly repository: ShoppingListRepository) {}

  async create(input: {
    title: string;
    shopName: string;
    kindOfDiscount: string;
  }) {
    if (!input.title) {
      throw new BadRequestException('Title is required');
    }

    return this.repository.create(input);
  }

  findAll() {
    return this.repository.findAll();
  }

  removeAll() {
    return this.repository.deleteAll();
  }

  async findOne(title: string) {
    const list = await this.repository.findByTitle(title);

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    return list;
  }

  findOneByTitle(title: string) {
    return this.repository.findByTitle(title);
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      shopName: string;
      kindOfDiscount: string;
    }>,
  ) {
    await this.findOne(id);
    return this.repository.update(id, data);
  }

  async remove(title: string) {
    const product = await this.findOneByTitle(title);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.repository.delete(product.id);
  }
}