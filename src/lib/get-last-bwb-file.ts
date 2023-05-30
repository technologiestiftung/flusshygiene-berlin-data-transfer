//@ts-check

import { format, sub } from "date-fns";
import got, { RequestError } from "got";
import { logger } from "./logging";

function buildUrl(datum: string) {
  const url = `http://${process.env.TSB_SECRET}.technologiestiftung-berlin.de/Altarm_RUH_${datum}_0040.txt`;
  return url;
}
const now = new Date();
export async function getLatestBWBFile() {
  const dates = [];
  // create an array with the dates of the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = format(sub(now, { days: i }), "yyMMdd");
    dates.push(date);
  }
  const urls = dates.map(buildUrl);
  let lastWorkingUrl = undefined;
  for (let i = 0; i < urls.length; i++) {
    try {
      // logger.info(urls[i]);
      const data = await got(urls[i]);
      if (data.statusCode === 200) {
        lastWorkingUrl = urls[i];
        break;
      }
    } catch (err: unknown) {
      logger.error(err);

      if (err instanceof RequestError && err.response?.statusCode === 404) {
        continue;
      }
      throw err;
    }
  }
  if (lastWorkingUrl === undefined) {
    throw new Error("no working url found in the range of 30 days");
  }
  return lastWorkingUrl;
}
