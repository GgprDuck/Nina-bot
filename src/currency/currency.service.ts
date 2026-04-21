import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

type RatesResponse = {
  base_code: string;
  conversion_rates: Record<string, number>;
};

@Injectable()
export class CurrencyService {
  private readonly requestTimeoutMs = 5000;

  private readonly SUPPORTED = ['USD', 'PLN', 'UAH', 'EUR'];

  private round(value: number, decimals = 2): number {
    return Number(
      Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals,
    );
  }

  normalizeCode(code: string): string {
    const c = code.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(c) || !this.SUPPORTED.includes(c)) {
      throw new BadRequestException(
        `Supported currencies: ${this.SUPPORTED.join(', ')}`,
      );
    }

    return c;
  }

  async convert(amount: number, from: string, to: string): Promise<number> {
    if (!Number.isFinite(amount)) {
      throw new BadRequestException('Amount must be a valid number.');
    }

    const fromC = this.normalizeCode(from);
    const toC = this.normalizeCode(to);

    if (fromC === toC) {
      return this.round(amount);
    }

    const rates = await this.getRates();

    const fromRate = fromC === 'EUR' ? 1 : rates[fromC];
    const toRate = toC === 'EUR' ? 1 : rates[toC];

    if (!fromRate || !toRate) {
      throw new BadRequestException(
        `Unsupported currency pair ${fromC} → ${toC}`,
      );
    }

    // convert via EUR
    const eurAmount = amount / fromRate;
    const result = eurAmount * toRate;

    return this.round(result);
  }

  private async getRates(): Promise<Record<string, number>> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.requestTimeoutMs,
    );

    const apiKey = process.env.EXCHANGE_RATE_API_KEY;

    if (!apiKey) {
      throw new Error('EXCHANGE_RATE_API_KEY missing');
    }

    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/EUR`;

    let res: Response;

    try {
      res = await fetch(url, { signal: controller.signal });
    } catch {
      throw new ServiceUnavailableException(
        'Could not reach currency rates service.',
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      throw new BadRequestException(
        `Currency rates fetch failed (${res.status})`,
      );
    }

    const data = (await res.json()) as RatesResponse;

    const rates = data?.conversion_rates;

    if (!rates) {
      throw new BadRequestException('Invalid rates response');
    }

    return rates;
  }
}