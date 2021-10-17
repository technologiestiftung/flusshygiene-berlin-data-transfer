// @ts-check

// import config from "./config.json";
import { getLatestBWBFile } from "./lib/get-last-bwb-file";
import moment from "moment";
import { setupAWS, uploadAWS } from "./lib/aws";
import { filterByDate } from "./lib/filter";
import { extractAndClean, extractAndCleanBwb } from "./lib/extract-and-clean";
import { csv } from "./lib/csv";
import {
  csv2buffer,
  csv2json,
  json2buffer,
  RawCSVRow,
  transform,
  transformBwb,
} from "./lib/transform";
import { get } from "./lib/requests";
import { readFileSync } from "fs";
import { join } from "path";
const config: { stations: string[] } = JSON.parse(
  readFileSync(join(__dirname, "./config.json"), "utf8")
);

async function main() {
  if (!("TSB_SECRET" in process.env)) {
    throw Error("TSB_SECRET is required as environmental variable");
  }
  const s3 = setupAWS();

  Promise.all(
    config.stations.map(async (station) => {
      const sreihe: "m" | "w" = "m";
      const smode = "c";
      const sdatum = moment().subtract(5, "day").format("DD.MM.YYYY");
      let data;
      let cleanedData: RawCSVRow[];
      try {
        data = await get(
          `https://wasserportal.berlin.de/station.php?anzeige=dd&sstation=${station}&sreihe=${sreihe}&smode=${smode}&sdatum=${sdatum}`
        );
      } catch (error) {
        console.error(error);
        throw error;
      }
      try {
        const extractedData = extractAndClean(data);
        cleanedData = await csv<RawCSVRow>(extractedData.csvString, ";");
      } catch (error) {
        console.error(error);
        throw error;
      }

      const transformedData = transform(cleanedData, sreihe);
      const date = moment().subtract(1, "day").format("YYYY-MM-DD");
      const filteredData = filterByDate(transformedData, date, "Datum");
      const csvBuff = csv2buffer(filteredData);
      await Promise.all([
        uploadAWS(
          s3,
          csvBuff,
          `stations/${station}/${moment().format("YYYY-MM-DD_hh-mm-ss")}.csv`
        ),
        uploadAWS(s3, csvBuff, `stations/${station}/latest.csv`),
      ]);
      const jsonBuff = json2buffer(csv2json(filteredData));
      await Promise.all([
        uploadAWS(
          s3,
          jsonBuff,
          `stations/${station}/${moment().format("YYYY-MM-DD_hh-mm-ss")}.json`
        ),
        uploadAWS(s3, jsonBuff, `stations/${station}/latest.json`),
      ]);
      return Promise.resolve();
    })
  )
    .then(async () => {
      let data;

      try {
        const url = await getLatestBWBFile();
        data = await get(url);
      } catch (err) {
        console.error(err);
        throw err;
      }

      const cleanedData = await csv<{ date: string; value: string }>(
        extractAndCleanBwb(data).csvString,
        "\t"
      );
      const transformedData = transformBwb(cleanedData);
      const date = moment().subtract(5, "day").format("YYYY-MM-DD");
      const filteredData = filterByDate(transformedData, date, "date");
      if (filteredData.length === 0) {
        console.error("No bwb data found for the last 3 days");
        return;
      }
      const csvBuff = csv2buffer(filteredData);
      await Promise.all([
        uploadAWS(
          s3,
          csvBuff,
          `wastewater/${moment().format("YYYY-MM-DD_hh-mm-ss")}.csv`
        ),
        uploadAWS(s3, csvBuff, "wastewater/latest.csv"),
      ]);
      const jsonBuff = json2buffer(csv2json(filteredData));
      await Promise.all([
        uploadAWS(
          s3,
          jsonBuff,
          `wastewater/${moment().format("YYYY-MM-DD_hh-mm-ss")}.json`
        ),
        uploadAWS(s3, jsonBuff, "wastewater/latest.json"),
      ]);
      return Promise.resolve();
    })
    .catch((err) => {
      throw err;
    });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
