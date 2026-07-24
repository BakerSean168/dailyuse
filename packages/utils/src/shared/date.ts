import { format, parseISO, isValid } from 'date-fns';

export function ensureDate(input: any): Date {
  if (!input) return new Date();
  if (input instanceof Date) return isValid(input) ? input : new Date();
  if (typeof input === 'string') {
    try {
      const parsed = parseISO(input);
      return isValid(parsed) ? parsed : new Date(input);
    } catch {
      return new Date();
    }
  }
  if (typeof input === 'number') {
    const date = new Date(input);
    return isValid(date) ? date : new Date();
  }
  if (typeof input === 'object' && (input as any).timestamp) {
    const date = new Date((input as any).timestamp);
    return isValid(date) ? date : new Date();
  }
  return new Date();
}

export function toDayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function toDayEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/**
 * Residual 1210 keep-boundary: utils formatDateToInput — Date → date-fns yyyy-MM-dd.
 * Shared form input helper; empty/falsy Date-like → ''.
 * Soft residual 1210: app-vue TimeConfigSection formatDateToInput is timestamp→YMD local (no force-merge).
 */
export function formatDateToInput(dateObj: Date): string {
  if (!dateObj) return '';
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Soft residual 1231: utils formatTimeToInput — Date → date-fns HH:mm; falsy → ''.
 * Shared form helper; not epoch timestamp; not force-merged with app-react toTimeInput keep-boundary.
 */
export function formatTimeToInput(dateObj: Date): string {
  if (!dateObj) return '';
  return format(dateObj, 'HH:mm');
}

export function updateDateKeepTime(dateObj: Date, dateStr: string): Date {
  if (!dateObj || !dateStr) return dateObj;
  const [year, month, day] = dateStr.split('-').map(Number);
  const newDate = new Date(dateObj);
  newDate.setFullYear(year, month - 1, day);
  return newDate;
}

export function updateTimeKeepDate(dateObj: Date, timeStr: string): Date {
  if (!dateObj || !timeStr) return dateObj;
  const [hour, minute] = timeStr.split(':').map(Number);
  const newDate = new Date(dateObj);
  newDate.setHours(hour, minute, 0, 0);
  return newDate;
}
