import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RecipiesRepository } from './recipies.repository';

@Injectable()
export class RecipiesService {
  constructor(private readonly repository: RecipiesRepository) {}

  async create(input: {
    title: string;
    ingredients: string[];
    instructions: string;
  }) {
    if (!input.title) {
      throw new BadRequestException('Title is required');
    }

    return this.repository.create(input);
  }

  findAll() {
    return this.repository.findAll();
  }

  async findOne(title: string) {
    const list = await this.repository.findByTitle(title);

    if (!list) {
      throw new NotFoundException('Recipe not found');
    }

    return list;
  }

  findById(id: string) {
    return this.repository.findById(id);
  }

  findOneByTitle(title: string) {
    return this.repository.findByTitle(title);
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      ingredients: string[];
      instructions: string;
    }>,
  ) {
    await this.findOne(id);
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    return this.repository.delete(id);
  }
}