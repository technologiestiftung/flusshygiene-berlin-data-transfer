import fs from "fs";
import path from "path";
import { csvParser } from "../lib/csv";
import { extractAndClean } from "../lib/extract-and-clean";
import { RawCSVRow } from "../lib/transform";

// https://wasserportal.berlin.de/station.php?anzeige=dd&sstation=5803200&sreihe=m&smode=c&sdatum=10.10.2021
const rawData = fs.readFileSync(
  path.join(
    __dirname,
    "./wasserportal_berlin_de_station_php_anzeige_dd_sstation_5803200_sreihe_m_smode_c_sdatum_10_10_2021.csv"
  ),
  "utf8"
);
const data = extractAndClean(rawData);
describe("testing csv readings", () => {
  test("should read csv file", async () => {
    const csvData = await csvParser<RawCSVRow>(data.csvString, ";");
    // console.log(csvData);
    expect(data).toBeTruthy();
    expect(csvData).toBeTruthy();
    expect(csvData[0]).toHaveProperty("Datum");
    expect(csvData[0]).toHaveProperty("Tagesmittelwert");
  });
});
