import { format, sub } from "date-fns";
import { getLatestBWBFile } from "./lib/get-last-bwb-file";
import { setupAWS, uploadAWS } from "./lib/aws";
import { filterByDateInterval } from "./lib/filter";
import { extractAndClean, extractAndCleanBwb } from "./lib/extract-and-clean";
import { csvParser } from "./lib/csv";
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
import { logger } from "./lib/logging";
const config: { stations: string[] } = JSON.parse(
  readFileSync(join(__dirname, "../config.json"), "utf8")
);
const s3 = setupAWS();
if (!("TSB_SECRET" in process.env)) {
  throw Error("TSB_SECRET is required as environmental variable");
}

const now = new Date();
const uploadTimestamp = format(now, "yyyy-mm-dd_HH-mm-ss");
const interval = {
  start: sub(now, { days: 3 }).toISOString(),
  end: now.toISOString(),
};
async function main() {
  // create filtered data tasks
  const createFilteredDataForStationsTasks = config.stations.map(
    async (station) => {
      const sreihe: "m" | "w" = "m";
      const smode = "c";
      // we want data for the last five days

      const sdatum = format(sub(now, { days: 5 }), "dd.mm.yyyy"); // moment().subtract(5, "day").format("DD.MM.YYYY");
      let data;
      let cleanedData: RawCSVRow[];
      const url = `https://wasserportal.berlin.de/station.php?anzeige=dd&sstation=${station}&sreihe=${sreihe}&smode=${smode}&sdatum=${sdatum}`;
      try {
        data = await get(url);
      } catch (error) {
        logger.error(error);
        throw error;
      }
      try {
        const extractedData = extractAndClean(data);
        cleanedData = await csvParser<RawCSVRow>(extractedData.csvString, ";");
      } catch (error) {
        logger.error(error);
        throw error;
      }

      const transformedData = transform(cleanedData, sreihe);

      // const interval = {
      //   start: sub(now, { days: 3 }).toISOString(),
      //   end: now.toISOString(),
      // };
      // const date = moment().subtract(2, "day").format("YYYY-MM-DD");
      const filteredData = filterByDateInterval({
        data: transformedData,
        interval,
        key: "Datum",
      });
      // const filteredData = filterByDateString(transformedData, date, "Datum");
      return { filteredData, station };
    }
  );
  try {
    const filteredDataSets = await Promise.allSettled(
      createFilteredDataForStationsTasks
    );
    let keepOn = false;
    for (const set of filteredDataSets) {
      if (set.status === "fulfilled" && set.value.filteredData.length > 0) {
        keepOn = true;
      }
    }
    if (!keepOn) {
      throw Error("No data found we can upload after filtering by date");
    }

    const csvBuffers = filteredDataSets
      .map((item) => {
        if (item.status === "fulfilled") {
          const { filteredData, station } = item.value;
          const csvBuffer = json2buffer(filteredData);
          return { buffer: csvBuffer, station };
        }
      })
      .filter((x) => x !== undefined) as NonNullable<{
      buffer: Buffer;
      station: string;
    }>[];
    const jsonBuffers = filteredDataSets
      .map((item) => {
        if (item.status === "fulfilled") {
          const { filteredData, station } = item.value;
          const jsonBuff = json2buffer(csv2json(filteredData));
          return { buffer: jsonBuff, station };
        }
      })
      .filter((x) => x !== undefined) as NonNullable<{
      buffer: Buffer;
      station: string;
    }>[];

    // const uploadTimestamp = format(now,"yyyy-mm-dd_HH-mm-ss");
    const csvUploadTasks = csvBuffers.map(({ buffer, station }) => {
      const ulDated = uploadAWS(
        s3,
        buffer,
        `stations/${station}/${uploadTimestamp}.csv`
      );
      const ulLatest = uploadAWS(s3, buffer, `stations/${station}/latest.csv`);
      return [ulDated, ulLatest];
    });

    const jsonUploadTasks = jsonBuffers.map(({ buffer, station }) => {
      const ulDated = uploadAWS(
        s3,
        buffer,
        `stations/${station}/${uploadTimestamp}.json`
      );
      const ulLatest = uploadAWS(s3, buffer, `stations/${station}/latest.json`);
      return [ulDated, ulLatest];
    });

    const csvFlat = csvUploadTasks.flat();
    const jsonFlat = jsonUploadTasks.flat();
    const csvResultWaPo = await Promise.allSettled(csvFlat);
    const jsonResultWaPo = await Promise.allSettled(jsonFlat);
    logger.info("Wasserportal csv Upload Report");
    logger.info(csvResultWaPo);
    logger.info("Wasserportal json Upload Report");
    logger.info(jsonResultWaPo);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        "Error getting data and uploading to s3 from wasserportal"
      );
    }
  }

  // BWB Collect data section
  let data: string;

  try {
    const url = await getLatestBWBFile();
    data = await get(url);
  } catch (err) {
    logger.error(err);
    throw err;
  }
  const extractedAndCleandBWBData = extractAndCleanBwb(data);

  const cleanedData = await csvParser<{ date: string; value: string }>(
    extractedAndCleandBWBData.csvString,
    "\t"
  );
  const transformedData = transformBwb(cleanedData);

  // const days = 2;
  // const date = moment().subtract(days, "day").format("YYYY-MM-DD");

  const filteredData = filterByDateInterval({
    data: transformedData,
    interval: interval,
    key: "date",
  });

  if (filteredData.length === 0) {
    logger.error(
      `No bwb data found for the interval ${JSON.stringify(interval)} days`
    );
    return;
  }
  const csvBuff = csv2buffer(filteredData);
  const jsonBuff = json2buffer(csv2json(filteredData));

  // const bwbUploadTimestamp = moment().format("YYYY-MM-DD_hh-mm-ss");
  const csvBWBUploadTasks = () => {
    const ulDated = uploadAWS(s3, csvBuff, `wastewater/${uploadTimestamp}.csv`);
    const ulLatest = uploadAWS(s3, csvBuff, `wastewater/latest.csv`);
    return [ulDated, ulLatest];
  };
  const jsonBWBUploadTasks = () => {
    const ulDated = uploadAWS(
      s3,
      jsonBuff,
      `wastewater/${uploadTimestamp}.json`
    );
    const ulLatest = uploadAWS(s3, jsonBuff, `wastewater/latest.json`);

    return [ulDated, ulLatest];
  };
  try {
    const jsonResultBwb = await Promise.allSettled(jsonBWBUploadTasks());
    const csvResultBwb = await Promise.allSettled(csvBWBUploadTasks());
    logger.info("BWB csv Upload Report");
    logger.info(csvResultBwb);
    logger.info("BWB json Upload Report");
    logger.info(jsonResultBwb);
  } catch (error) {
    logger.error(error, "Error getting data and uploading to s3 from bwb");
  }
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
