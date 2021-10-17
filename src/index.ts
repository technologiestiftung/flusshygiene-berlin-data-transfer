import { getLatestBWBFile } from "./lib/get-last-bwb-file";
import moment from "moment";
import { setupAWS, uploadAWS } from "./lib/aws";
import { filterByDate } from "./lib/filter";
import { extractAndClean, extractAndCleanBwb } from "./lib/extract-and-clean";
import { csvParser } from "./lib/csv";
import {
  csv2buffer,
  csv2json,
  CSVRow,
  json2buffer,
  RawCSVRow,
  transform,
  transformBwb,
} from "./lib/transform";
import { get } from "./lib/requests";
import { readFileSync } from "fs";
import { join } from "path";
const config: { stations: string[] } = JSON.parse(
  readFileSync(join(__dirname, "../config.json"), "utf8")
);
const s3 = setupAWS();
if (!("TSB_SECRET" in process.env)) {
  throw Error("TSB_SECRET is required as environmental variable");
}

async function main() {
  // create filtered data tasks
  const createFilteredDataForStationsTasks = config.stations.map(
    async (station) => {
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
        cleanedData = await csvParser<RawCSVRow>(extractedData.csvString, ";");
      } catch (error) {
        console.error(error);
        throw error;
      }

      const transformedData = transform(cleanedData, sreihe);
      const date = moment().subtract(1, "day").format("YYYY-MM-DD");
      const filteredData = filterByDate(transformedData, date, "Datum");
      return { filteredData, station };
    }
  );
  try {
    const filteredDataSets = await Promise.all(
      createFilteredDataForStationsTasks
    );

    const csvBuffers = filteredDataSets.map(
      ({
        filteredData,
        station,
      }: {
        filteredData: CSVRow[];
        station: string;
      }) => {
        const csvBuff = csv2buffer(filteredData);
        return { buffer: csvBuff, station };
      }
    );
    const jsonBuffers = filteredDataSets.map(
      ({
        filteredData,
        station,
      }: {
        filteredData: CSVRow[];
        station: string;
      }) => {
        const jsonBuff = json2buffer(csv2json(filteredData));
        return { buffer: jsonBuff, station };
      }
    );

    const csvUploadTasks = csvBuffers.map(({ buffer, station }) => {
      const ulDated = uploadAWS(
        s3,
        buffer,
        `stations/${station}/${moment().format("YYYY-MM-DD_hh-mm-ss")}.csv`
      );
      const ulLatest = uploadAWS(s3, buffer, `stations/${station}/latest.csv`);
      return [ulDated, ulLatest];
    });

    const jsonUploadTasks = jsonBuffers.map(({ buffer, station }) => {
      const ulDated = uploadAWS(
        s3,
        buffer,
        `stations/${station}/${moment().format("YYYY-MM-DD_hh-mm-ss")}.json`
      );
      const ulLatest = uploadAWS(s3, buffer, `stations/${station}/latest.json`);
      return [ulDated, ulLatest];
    });

    const csvFlat = csvUploadTasks.flat();
    const jsonFlat = jsonUploadTasks.flat();
    const csvResultWaPo = await Promise.allSettled(csvFlat);
    const jsonResultWaPo = await Promise.allSettled(jsonFlat);
    console.log("Wasserportal csv Upload Report");
    console.log(csvResultWaPo);
    console.log("Wasserportal json Upload Report");
    console.log(jsonResultWaPo);
  } catch (error) {
    console.error(
      error,
      "Error getting data and uploading to s3 from wasserportal"
    );
  }

  let data: string;

  try {
    const url = await getLatestBWBFile();
    data = await get(url);
  } catch (err) {
    console.error(err);
    throw err;
  }
  const extractedAndCleandBWBData = extractAndCleanBwb(data);

  const cleanedData = await csvParser<{ date: string; value: string }>(
    extractedAndCleandBWBData.csvString,
    "\t"
  );
  const transformedData = transformBwb(cleanedData);

  const days = 1;
  const date = moment().subtract(days, "day").format("YYYY-MM-DD");
  const filteredData = filterByDate(transformedData, date, "date");

  if (filteredData.length === 0) {
    console.error(`No bwb data found for the last ${days} days`);
    return;
  }
  const csvBuff = csv2buffer(filteredData);
  const jsonBuff = json2buffer(csv2json(filteredData));

  const csvBWBUploadTasks = () => {
    const ulDated = uploadAWS(
      s3,
      csvBuff,
      `wastewater/${moment().format("YYYY-MM-DD_hh-mm-ss")}.csv`
    );
    const ulLatest = uploadAWS(s3, csvBuff, `wastewater/latest.csv`);
    return [ulDated, ulLatest];
  };
  const jsonBWBUploadTasks = () => {
    const ulDated = uploadAWS(
      s3,
      jsonBuff,
      `wastewater/${moment().format("YYYY-MM-DD_hh-mm-ss")}.json`
    );
    const ulLatest = uploadAWS(s3, jsonBuff, `wastewater/latest.json`);

    return [ulDated, ulLatest];
  };
  try {
    const jsonResultBwb = await Promise.allSettled(jsonBWBUploadTasks());
    const csvResultBwb = await Promise.allSettled(csvBWBUploadTasks());
    console.log("BWB csv Upload Report");
    console.log(csvResultBwb);
    console.log("BWB json Upload Report");
    console.log(jsonResultBwb);
  } catch (error) {
    console.error(error, "Error getting data and uploading to s3 from bwb");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
