import { Module } from '@nestjs/common';
import { ShoppingListService } from './shoping-list.service';
import { ShoppingListRepository } from './shopping-list.repository';

@Module({
  providers: [
    ShoppingListService, 
    ShoppingListRepository
  ],
  exports: [ShoppingListService],
})
export class ShoppingListModule {}