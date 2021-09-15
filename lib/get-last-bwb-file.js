//@ts-check

const { default: got } = require("got");
const moment = require("moment");

function buildUrl(datum) {
  const url = `http://${process.env.TSB_SECRET}.technologiestiftung-berlin.de/Altarm_RUH_${datum}_0040.txt`;
  return url;
}

async function getLatestBWBFile() {
  const dates = [];
  // create an array with the dates of the last 30 days
  for (let i = 0; i < 30; i++) {
    dates.push(moment().subtract(i, "days").format("YYMMDD"));
  }
  const urls = dates.map(buildUrl);
  let lastWorkingUrl = undefined;
  for (let i = 0; i < urls.length; i++) {
    try {
      console.log(urls[i]);
      const data = await got(urls[i]);
      if (data.statusCode === 200) {
        lastWorkingUrl = urls[i];
        break;
      }
    } catch (err) {
      console.log(err);
      if (err.response.statusCode === 404) {
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

module.exports = getLatestBWBFile;

if (module === require.main) {
  getLatestBWBFile().then(console.log).catch(console.error);
}
