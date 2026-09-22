export function taipeiDayRange(date: string): { start: Date; end: Date } {
  return {
    start: new Date(`${date}T00:00:00+08:00`),
    end: new Date(`${date}T00:00:00+08:00`).addDays(1)
  };
}

export function taipeiMonthRange(month: string): { start: Date; end: Date; days: string[] } {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const taipeiOffsetMs = 8 * 60 * 60 * 1000;
  const startDate = new Date(Date.UTC(year, monthIndex, 1) - taipeiOffsetMs);
  const nextMonthDate = new Date(Date.UTC(year, monthIndex + 1, 1) - taipeiOffsetMs);
  const days: string[] = [];
  for (let date = new Date(startDate); date < nextMonthDate; date = date.addDays(1)) {
    days.push(formatTaipeiDate(date));
  }
  return { start: startDate, end: nextMonthDate, days };
}

export function databaseDateMonthRange(month: string): { start: Date; end: Date } {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  return {
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1))
  };
}

export function formatTaipeiDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

declare global {
  interface Date {
    addDays(days: number): Date;
  }
}

Date.prototype.addDays = function addDays(days: number): Date {
  const next = new Date(this.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};
