import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SpendingsRepository } from './spendings.repository';
import { CurrencyService } from '../currency/currency.service';

@Injectable()
export class SpendingsService {
  constructor(
    private readonly repository: SpendingsRepository,
    private readonly currency: CurrencyService,
  ) {}

  /** Two-decimal rounding aligned with converted amounts from CurrencyService. */
  private roundMoney(n: number): number {
    return Number(Math.round(Number(n + 'e2')) + 'e-2');
  }

  parseSpendingCurrencyInput(raw: string, defaultCode: string): string {
    const trimmed = raw.trim();
    const code = trimmed === '-' ? defaultCode : trimmed;
    return this.currency.normalizeCode(code);
  }

  findRecent(chatId: number, limit = 50) {
    return this.repository.findRecent(chatId, limit);
  }

  findByIdOptional(chatId: number, id: string) {
    return this.repository.findById(chatId, id);
  }

  async findById(chatId: number, id: string) {
    const row = await this.repository.findById(chatId, id);
    if (!row) {
      throw new NotFoundException('Spending not found');
    }
    return row;
  }

  async remove(chatId: number, id: string) {
    await this.findById(chatId, id);
    return this.repository.delete(chatId, id);
  }

  async update(
    chatId: number,
    id: string,
    input: Partial<{
      category: string;
      amount: number;
      currency: string;
      description?: string | null;
    }>,
  ) {
    await this.findById(chatId, id);

    const payload: Partial<{
      category: string;
      amount: number;
      currency: string;
      description: string | null;
    }> = {};

    if (input.category != null) {
      if (!input.category.trim()) {
        throw new BadRequestException('Category is required');
      }
      payload.category = input.category.trim();
    }

    if (input.amount != null) {
      if (Number.isNaN(input.amount) || input.amount <= 0) {
        throw new BadRequestException('Amount must be a positive number');
      }
      payload.amount = input.amount;
    }

    if (input.currency != null) {
      payload.currency = this.currency.normalizeCode(input.currency);
    }

    if (input.description !== undefined) {
      payload.description = input.description?.trim() || null;
    }

    await this.repository.update(chatId, id, payload);
    return this.findById(chatId, id);
  }

  create(chatId: number, input: {
    category: string;
    amount: number;
    currency: string;
    description?: string | null;
  }) {
    if (!input.category?.trim()) {
      throw new BadRequestException('Category is required');
    }
    if (input.amount == null || Number.isNaN(input.amount) || input.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
    const currencyCode = this.currency.normalizeCode(input.currency);

    return this.repository.create(chatId, {
      category: input.category.trim(),
      amount: input.amount,
      currency: currencyCode,
      description: input.description?.trim() || null,
    });
  }

  async findByCalendarMonth(chatId: number, year: number, monthIndex0: number) {
    if (monthIndex0 < 0 || monthIndex0 > 11) {
      throw new BadRequestException('Invalid month');
    }
    const start = new Date(Date.UTC(year, monthIndex0, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, monthIndex0 + 1, 1, 0, 0, 0, 0));
    return this.repository.findBetween(chatId, start, end);
  }

  async summarizeMonthInCurrency(
    chatId: number,
    year: number,
    monthIndex0: number,
    targetCurrency: string,
  ) {
    const to = this.currency.normalizeCode(targetCurrency);
    const rows = await this.findByCalendarMonth(chatId, year, monthIndex0);

    let total = 0;
    const byCategory = new Map<string, number>();
    const rowSummaries: Array<{
      category: string;
      amount: number;
      currency: string;
      description: string | null;
      createdAt: Date;
      converted: number;
    }> = [];

    for (const row of rows) {
      const converted = await this.currency.convert(
        row.amount,
        row.currency,
        to,
      );
      total = this.roundMoney(total + converted);
      const prev = byCategory.get(row.category) ?? 0;
      byCategory.set(row.category, this.roundMoney(prev + converted));
      rowSummaries.push({
        category: row.category,
        amount: row.amount,
        currency: row.currency,
        description: row.description,
        createdAt: row.createdAt,
        converted,
      });
    }

    return {
      targetCurrency: to,
      total,
      byCategory: [...byCategory.entries()].map(([name, amount]) => ({
        name,
        amount,
      })),
      rowSummaries,
    };
  }

  async getMonthlyReportMessage(
    chatId: number,
    year: number,
    monthIndex0: number,
    reportCurrency: string,
  ): Promise<string> {
    const summary = await this.summarizeMonthInCurrency(
      chatId,
      year,
      monthIndex0,
      reportCurrency,
    );
    const heading = new Intl.DateTimeFormat('en', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, monthIndex0, 1)));

    if (!summary.rowSummaries.length) {
      return `📊 *${heading}* (UTC)\n\nNo spendings for this month.`;
    }

    const byCat = summary.byCategory
      .sort((a, b) => b.amount - a.amount)
      .map(
        (c) => `• ${c.name}: ${c.amount.toFixed(2)} ${summary.targetCurrency}`,
      )
      .join('\n');

    const maxLines = 25;
    const lines = summary.rowSummaries.slice(0, maxLines);
    const rest = summary.rowSummaries.length - lines.length;
    const recent = lines
      .map((r) => {
        const note = r.description ? ` — ${r.description}` : '';
        return (
          `• ${r.amount.toFixed(2)} ${r.currency} → ${r.converted.toFixed(2)} ${summary.targetCurrency} | ${r.category}${note}`
        );
      })
      .join('\n');
    const more = rest > 0 ? `\n… and ${rest} more (see totals above).` : '';

    return (
      `📊 *${heading}* (UTC)\n` +
      `Converted to *${summary.targetCurrency}*\n\n` +
      `*By category*\n${byCat}\n\n` +
      `*Total:* ${summary.total.toFixed(2)} ${summary.targetCurrency}\n\n` +
      `*Recent*\n${recent}${more}`
    );
  }
}
