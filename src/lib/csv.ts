// import csv from "csvtojson";
import neatCsv from "neat-csv";
export async function csvParser<CSVData>(
  csvString: string | Buffer,
  separator: string
): Promise<CSVData[]> {
  try {
    const json = await neatCsv<CSVData>(csvString.toString(), {
      separator,
    });
    return json;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
