import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RecipiesRepository } from './recipies.repository';

@Injectable()
export class RecipiesService {
  constructor(private readonly repository: RecipiesRepository) {}

  async create(chatId: number, input: {
    title: string;
    ingredients: string[];
    instructions: string;
  }) {
    if (!input.title) {
      throw new BadRequestException('Title is required');
    }

    return this.repository.create(chatId, input);
  }

  findAll(chatId: number) {
    return this.repository.findAll(chatId);
  }

  async findOne(chatId: number, title: string) {
    const list = await this.repository.findByTitle(chatId, title);

    if (!list) {
      throw new NotFoundException('Recipe not found');
    }

    return list;
  }

  findById(chatId: number, id: string) {
    return this.repository.findById(chatId, id);
  }

  findOneByTitle(chatId: number, title: string) {
    return this.repository.findByTitle(chatId, title);
  }

  async update(
    chatId: number,
    id: string,
    data: Partial<{
      title: string;
      ingredients: string[];
      instructions: string;
    }>,
  ) {
    const recipe = await this.repository.findById(chatId, id);
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    return this.repository.update(chatId, id, data);
  }

  async remove(chatId: number, id: string) {
    return this.repository.delete(chatId, id);
  }
}