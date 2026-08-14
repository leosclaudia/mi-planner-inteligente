import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

export const KEY = (d: Date) => format(d, "yyyy-MM-dd");

export function fmt(d: Date, pattern: string) {
  return format(d, pattern, { locale: es });
}

export function weekDays(d: Date) {
  return eachDayOfInterval({
    start: startOfWeek(d, { weekStartsOn: 1 }),
    end: endOfWeek(d, { weekStartsOn: 1 }),
  });
}

export function monthGrid(d: Date) {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(d), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(d), { weekStartsOn: 1 }),
  });
}

export function greeting(d: Date) {
  const h = d.getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export { addDays };
