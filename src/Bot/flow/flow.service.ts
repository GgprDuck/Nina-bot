import { Injectable } from '@nestjs/common';

export type FlowStep =
  | 'product'
  | 'shop'
  | 'discount'
  | 'recipe'
  | 'recipe_ingredients'
  | 'recipe_name'
  | 'recipe_instructions'
  | 'recipe_confirm'
  | 'spending_category'
  | 'spending_amount'
  | 'spending_currency'
  | 'spending_description'
  | 'spending_month_query'
  | 'spending_set_report_currency'
  | 'reminder'
  | 'edit_product_value'
  | 'edit_recipe_value'
  | 'edit_spending_value'
  | 'edit_reminder_value'
  | 'shared_space_create_name'
  | 'shared_space_join_code';

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