// if (process.env.NODE_ENV !== 'production') {
//   require('dotenv').config()
// }
// @ts-check

const config = require("./config.json");
const moment = require("moment");
const {
  csv,
  csv2buffer,
  extractAndClean,
  extractAndCleanBwb,
  get,
  filterByDate,
  setupAWS,
  transform,
  transformBwb,
  uploadAWS,
  csv2json,
  json2buffer,
} = require("./lib/util");

async function main() {
  if (!("TSB_SECRET" in process.env)) {
    throw Error("TSB_SECRET is required as environmental variable");
  }
  const s3 = setupAWS();

  Promise.all(
    config.stations.map(async (station) => {
      const data = await get(
        `https://wasserportal.berlin.de/station.php?anzeige=dd&sstation=${station}&sreihe=w&smode=c&sdatum=`
      );
      let cleanedData = await csv(extractAndClean(data).csvString, ";");
      const transformedData = transform(cleanedData);
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
      const data = await get(
        `http://${
          process.env.TSB_SECRET
        }.technologiestiftung-berlin.de/Altarm_RUH_${moment().format(
          "YYMMDD"
        )}_0040.txt`
      );
      let cleanedData = await csv(extractAndCleanBwb(data).csvString, "\t");
      const transformedData = transformBwb(cleanedData);
      const date = moment().subtract(1, "day").format("YYYY-MM-DD");
      const filteredData = filterByDate(transformedData, date, "date");
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
