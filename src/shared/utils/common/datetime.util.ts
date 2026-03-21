export class DateTimeUtils {
  static getUnixTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  static formatRelativeTime(targetDate: Date, referenceDate = new Date()): string {
    const startOfDayUTC = new Date(
      Date.UTC(
        referenceDate.getUTCFullYear(),
        referenceDate.getUTCMonth(),
        referenceDate.getUTCDate(),
      ),
    );

    const diffSeconds = Math.floor((targetDate.getTime() - startOfDayUTC.getTime()) / 1000);
    const absDiff = Math.abs(diffSeconds);

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 },
    ];

    for (const interval of intervals) {
      const amount = Math.floor(absDiff / interval.seconds);
      if (amount > 0) {
        return diffSeconds < 0
          ? `${amount} ${interval.label} before`
          : `${amount} ${interval.label} after`;
      }
    }

    return 'now';
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static getRandomDateBetween(startDate: Date, endDate: Date): Date {
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const randomMs = startMs + Math.random() * (endMs - startMs);
    return new Date(randomMs);
  }
  
  static getStartOfDay(daysAgo = 0): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - daysAgo);
    return date;
  }
}
