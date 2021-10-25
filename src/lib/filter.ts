// date needs to be provided in the format YYYY-MM-DD
import { isWithinInterval } from "date-fns";
import { CSVRow } from "./transform";

export function filterByDateString(
  data: CSVRow[],
  date: string,
  dateKey: "Datum" | "date"
) {
  return data.filter((d) => {
    if (d[dateKey] === undefined || d[dateKey] === null) {
      return false;
    }
    return d[dateKey]?.split(" ")[0] === date;
  });
}

export function filterByDateInterval({
  data,
  interval,
  key,
}: {
  data: CSVRow[];
  interval: { start: string; end: string };
  key: "Datum" | "date";
}): CSVRow[] {
  const { start, end } = interval;
  const filtered = data.filter((d) => {
    if (d[key] !== undefined || d[key] !== null) {
      if (
        isWithinInterval(new Date(d[key]!), {
          start: new Date(start),
          end: new Date(end),
        })
      ) {
        return true;
      }
    }
  });
  return filtered;
}
