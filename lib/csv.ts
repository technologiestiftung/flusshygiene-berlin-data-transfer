import csvtojson from "csvtojson";

export async function csv<CSVData>(
  csvString: string | Buffer,
  delimiter: string
): Promise<CSVData[]> {
  const json = await csvtojson({
    trim: true,
    delimiter,
    ignoreEmpty: true,
  }).fromString(csvString.toString());
  return json as CSVData[];
}
