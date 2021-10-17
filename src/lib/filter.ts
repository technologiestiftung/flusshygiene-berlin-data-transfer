// date needs to be provided in the format YYYY-MM-DD

import { CSVRow } from "./transform";

export function filterByDate(
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
