import { Injectable } from '@nestjs/common';
import { SubscriptionFrequency } from '@prisma/client';
import { formatDateKey } from '../common/utils/date.util';

@Injectable()
export class SubscriptionScheduleService {
  getDeliveryDates(
    frequency: SubscriptionFrequency,
    startDate: Date,
    from: Date,
    to: Date,
  ): Date[] {
    const dates: Date[] = [];
    const start = this.startOfDay(startDate);
    const rangeStart = this.startOfDay(from);
    const rangeEnd = this.startOfDay(to);

    if (rangeEnd < rangeStart) {
      return dates;
    }

    switch (frequency) {
      case SubscriptionFrequency.DAILY:
        this.collectDaily(start, rangeStart, rangeEnd, dates);
        break;
      case SubscriptionFrequency.ALTERNATE_DAY:
        this.collectAlternateDay(start, rangeStart, rangeEnd, dates);
        break;
      case SubscriptionFrequency.WEEKDAYS:
        this.collectWeekdays(start, rangeStart, rangeEnd, dates);
        break;
      case SubscriptionFrequency.WEEKLY:
        this.collectWeekly(start, rangeStart, rangeEnd, dates);
        break;
      case SubscriptionFrequency.MONTHLY:
        this.collectMonthly(start, rangeStart, rangeEnd, dates);
        break;
    }

    return dates;
  }

  private startOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private collectDaily(
    start: Date,
    rangeStart: Date,
    rangeEnd: Date,
    dates: Date[],
  ) {
    const cursor = new Date(Math.max(start.getTime(), rangeStart.getTime()));
    while (cursor <= rangeEnd) {
      if (cursor >= start) {
        dates.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  private collectAlternateDay(
    start: Date,
    rangeStart: Date,
    rangeEnd: Date,
    dates: Date[],
  ) {
    const cursor = new Date(start);
    while (cursor < rangeStart) {
      cursor.setDate(cursor.getDate() + 2);
    }
    while (cursor <= rangeEnd) {
      if (cursor >= start) {
        dates.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 2);
    }
  }

  private collectWeekdays(
    start: Date,
    rangeStart: Date,
    rangeEnd: Date,
    dates: Date[],
  ) {
    const cursor = new Date(Math.max(start.getTime(), rangeStart.getTime()));
    while (cursor <= rangeEnd) {
      const day = cursor.getDay();
      if (cursor >= start && day >= 1 && day <= 5) {
        dates.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  private collectWeekly(
    start: Date,
    rangeStart: Date,
    rangeEnd: Date,
    dates: Date[],
  ) {
    const targetWeekday = start.getDay();
    const cursor = new Date(Math.max(start.getTime(), rangeStart.getTime()));
    const dayOffset = (targetWeekday - cursor.getDay() + 7) % 7;
    cursor.setDate(cursor.getDate() + dayOffset);

    while (cursor <= rangeEnd) {
      if (cursor >= start) {
        dates.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 7);
    }
  }

  private collectMonthly(
    start: Date,
    rangeStart: Date,
    rangeEnd: Date,
    dates: Date[],
  ) {
    const targetDay = start.getDate();
    let year = rangeStart.getFullYear();
    let month = rangeStart.getMonth();

    if (rangeStart < start) {
      year = start.getFullYear();
      month = start.getMonth();
    }

    while (true) {
      const candidate = this.clampMonthDay(year, month, targetDay);
      if (candidate > rangeEnd) {
        break;
      }
      if (candidate >= start && candidate >= rangeStart) {
        dates.push(new Date(candidate));
      }
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      if (year > rangeEnd.getFullYear() + 1) {
        break;
      }
    }
  }

  private clampMonthDay(year: number, month: number, day: number): Date {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const clampedDay = Math.min(day, lastDay);
    return new Date(year, month, clampedDay);
  }

  expandPausedDatesInRange(
    pauses: { startDate: Date; endDate: Date }[],
    from: Date,
    to: Date,
  ): string[] {
    const paused = new Set<string>();
    const rangeStart = this.startOfDay(from);
    const rangeEnd = this.startOfDay(to);

    for (const pause of pauses) {
      const cursor = this.startOfDay(
        new Date(Math.max(pause.startDate.getTime(), rangeStart.getTime())),
      );
      const end = this.startOfDay(
        new Date(Math.min(pause.endDate.getTime(), rangeEnd.getTime())),
      );
      while (cursor <= end) {
        paused.add(formatDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return Array.from(paused).sort();
  }
}
