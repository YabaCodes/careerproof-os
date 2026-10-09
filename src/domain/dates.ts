import type { PrecisionDate } from './models.js';
export function isValidLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year,month,day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined || year < 1900 || year > 2200) return false;
  const date = new Date(Date.UTC(year,month-1,day));
  return date.getUTCFullYear()===year && date.getUTCMonth()===month-1 && date.getUTCDate()===day;
}
export function isPrecisionDate(value: unknown): value is PrecisionDate {
  if (value===null || typeof value!=='object' || Array.isArray(value)) return false;
  const v = value as Record<string,unknown>;
  if (Object.keys(v).length!==2 || typeof v.value!=='string') return false;
  const year = Number(v.value.slice(0,4));
  if (year<1900 || year>2200) return false;
  if (v.precision==='year') return /^\d{4}$/.test(v.value);
  if (v.precision==='month') return /^\d{4}-\d{2}$/.test(v.value) && isValidLocalDate(v.value+'-01');
  return v.precision==='day' && isValidLocalDate(v.value);
}
export function precisionDateFromInput(value: string): PrecisionDate | null {
  if (value==='') return null;
  const result: PrecisionDate = {value,precision:value.length===4?'year':value.length===7?'month':'day'};
  if (!isPrecisionDate(result)) throw new Error('Choose a valid year, month, or date (1900–2200).');
  return result;
}
export function dateBounds(date: PrecisionDate): { earliest: string; latest: string } {
  if (date.precision==='year') return {earliest:date.value+'-01-01',latest:date.value+'-12-31'};
  if (date.precision==='day') return {earliest:date.value,latest:date.value};
  const [year,month] = date.value.split('-').map(Number);
  const day = new Date(Date.UTC(year!,month!,0)).getUTCDate();
  return {earliest:date.value+'-01',latest:date.value+'-'+day};
}
export function datesInOrder(start: PrecisionDate | null, end: PrecisionDate | null): boolean {
  return !start || !end || dateBounds(end).latest >= dateBounds(start).earliest;
}
export function formatPrecisionDate(value: string): string {
  if (!value) return 'Date not set';
  if (value.length===4) return value;
  const date = new Date(value+(value.length===7?'-01':'')+'T12:00:00');
  return new Intl.DateTimeFormat(undefined,value.length===7?{month:'short',year:'numeric'}:{month:'short',day:'numeric',year:'numeric'}).format(date);
}
