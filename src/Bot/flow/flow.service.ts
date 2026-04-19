import { Injectable } from '@nestjs/common';

export type FlowStep = 'product' | 'shop' | 'discount' | 'delete' | 'recipe' | 'recipe_ingredients' | 'recipe_name' | 'recipe_instructions' | 'recipe_confirm';

@Injectable()
export class FlowService {
  private flow = new Map<number, { step: FlowStep; data: any }>();

  get(chatId: number) {
    return this.flow.get(chatId);
  }

  set(chatId: number, value: { step: FlowStep; data: any }) {
    this.flow.set(chatId, value);
  }

  delete(chatId: number) {
    this.flow.delete(chatId);
  }
}