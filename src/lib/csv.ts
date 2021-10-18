// import csv from "csvtojson";
import neatCsv from "neat-csv";
import { logger } from "./logging";
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
    logger.error(error);
    throw error;
  }
}
