import { SubscriptionFrequency } from '@prisma/client';
import { SubscriptionScheduleService } from './subscription-schedule.service';

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('SubscriptionScheduleService', () => {
  const service = new SubscriptionScheduleService();

  it('returns daily deliveries within range', () => {
    const dates = service.getDeliveryDates(
      SubscriptionFrequency.DAILY,
      new Date(2026, 5, 1),
      new Date(2026, 5, 1),
      new Date(2026, 5, 3),
    );
    expect(dates.map(formatLocalDate)).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
    ]);
  });

  it('returns alternate-day deliveries', () => {
    const dates = service.getDeliveryDates(
      SubscriptionFrequency.ALTERNATE_DAY,
      new Date(2026, 5, 1),
      new Date(2026, 5, 1),
      new Date(2026, 5, 7),
    );
    expect(dates.map(formatLocalDate)).toEqual([
      '2026-06-01',
      '2026-06-03',
      '2026-06-05',
      '2026-06-07',
    ]);
  });

  it('returns weekdays only', () => {
    const dates = service.getDeliveryDates(
      SubscriptionFrequency.WEEKDAYS,
      new Date(2026, 5, 1),
      new Date(2026, 5, 1),
      new Date(2026, 5, 7),
    );
    expect(dates.map(formatLocalDate)).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
      '2026-06-04',
      '2026-06-05',
    ]);
  });

  it('clamps monthly delivery to month end', () => {
    const dates = service.getDeliveryDates(
      SubscriptionFrequency.MONTHLY,
      new Date(2026, 0, 31),
      new Date(2026, 0, 1),
      new Date(2026, 2, 31),
    );
    expect(dates.map(formatLocalDate)).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
    ]);
  });
});
