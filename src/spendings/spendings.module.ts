import { Module } from '@nestjs/common';
import { SpendingsService } from './spendings.service';
import { SpendingsRepository } from './spendings.repository';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [CurrencyModule],
  providers: [SpendingsService, SpendingsRepository],
  exports: [SpendingsService],
})
export class SpendingsModule {}
