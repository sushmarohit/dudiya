import { Decimal } from '@prisma/client/runtime/library';

export function toDecimal(value: number | string): Decimal {
  return new Decimal(value);
}

export function decimalToNumber(value: Decimal | number): number {
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

export function formatMoney(value: Decimal | number): string {
  return decimalToNumber(value).toFixed(2);
}

export function sumDecimals(values: Decimal[]): Decimal {
  return values.reduce((acc, v) => acc.add(v), new Decimal(0));
}
