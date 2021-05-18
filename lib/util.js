// @ts-check
const https = require("https");
const http = require("http");
const parse = require("csv-parse");
const moment = require("moment-timezone");
const AWS = require("aws-sdk");

/**
 * @param {string} url
 */
const get = (url) =>
  new Promise((resolve, reject) => {
    let protocol = https;
    if (url.substring(0, 5).toLowerCase() !== "https") {
      // @ts-ignore
      protocol = http;
    }
    protocol
      .get(url, (response) => {
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => resolve(body));
      })
      .on("error", reject);
  });

/**
 * @param {string | Buffer} csvString
 * @param {any} delimiter
 */
const csv = (csvString, delimiter) =>
  new Promise((resolve, reject) => {
    parse(
      csvString,
      {
        trim: true,
        skip_empty_lines: true,
        delimiter: delimiter,
        columns: true,
      },
      (err, output) => {
        if (err) {
          reject(err);
        } else {
          resolve(output);
        }
      }
    );
  });

const transform = (csvObj, sreihe) => {
  csvObj.forEach((row) => {
    /*
     * according to the original R-Script this was supplied as a unix timestamp
     * row.Datum = moment(row.Datum, 'DD.MM.YYYY hh:mm').tz('Europe/Berlin', true).unix()
     * now changed according to issue #6, https://github.com/technologiestiftung/flusshygiene-berlin-data-transfer/issues/6
     */
    const key = sreihe === "m" ? "Tagesmittelwert" : "Einzelwert";
    row.Datum = moment(row.Datum, "DD.MM.YYYY hh:mm")
      .tz("Europe/Berlin", true)
      .format("YYYY-MM-DD hh:mm:ss");
    if (row[key]) {
      row.Einzelwert = parseFloat(row[key].replace(",", "."));
      if (key !== "Einzelwert") delete row[key];
    }
  });
  // in the original R-Script null values/-777 were transformed to NA, now we remove empty values
  csvObj = csvObj.filter(
    (row) => row.Einzelwert && row.Einzelwert !== -777 && !isNaN(row.Einzelwert)
  );
  return csvObj;
};

/**
 * @param {any[]} csvObj
 */
const transformBwb = (csvObj) => {
  csvObj.forEach((row) => {
    row.date = moment(row.date, "DD.MM.YYYY").format("YYYY-MM-DD hh:mm:ss");
    if (typeof row.value === "string") {
      row.value = parseFloat(row.value.replace(",", "."));
    }
  });
  return csvObj;
};

/**
 * @param {string} csvString
 */
const extractAndClean = (csvString) => {
  // for some reason someone thought it would be super smart to put additonal meta data in the CSV header
  const meta = csvString.match(/;"Stationsnummer:[^\n]*/m);
  const cleanedString = csvString.replace(/;"Stationsnummer:[^\n]*/m, "");
  return {
    stationsnummer: meta[0].match(/[0-9]+/)[0],
    csvString: cleanedString,
  };
};

/**
 * @param {string} csvString
 */
const extractAndCleanBwb = (csvString) => {
  // don't even get me started on the formatting of this file 🤯
  // remove the first line
  let lines = csvString.split("\n");
  lines.splice(0, 1);
  lines = lines.map((line) => line.trim());
  return {
    csvString: "date\tvalue\n" + lines.join("\n"),
  };
};

const setupAWS = () => {
  if (process.env.NODE_ENV !== "test") {
    if (
      !("AWS_ACCESS_KEY_ID" in process.env) ||
      !("AWS_SECRET_ACCESS_KEY" in process.env)
    ) {
      throw Error(
        "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required as environmental variables"
      );
    }
  }

  return new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
};

/**
 * @param {any[]} csvObj
 */
const csv2buffer = (csvObj) => {
  const columns = Object.keys(csvObj[0]);
  let csvString = columns.join(",");
  csvObj.forEach((row) => {
    const values = [];
    columns.forEach((column) => {
      values.push(row[column]);
    });
    csvString += "\n" + values.join(",");
  });
  return Buffer.from(csvString, "utf8");
};

/**
 * @param {any[]} csvObj
 */
const csv2json = (csvObj) => {
  const json = { data: [] };

  const columns = Object.keys(csvObj[0]);
  csvObj.forEach((row) => {
    const data = {};
    columns.forEach((column) => {
      if (column === "date" || column === "Datum") {
        data.date = row[column];
      } else {
        data.value = row[column];
      }
    });
    json.data.push(data);
  });

  return json;
};

// date needs to be provided in the format YYYY-MM-DD
/**
 * @param {any[]} data
 * @param {any} date
 * @param {string | number} dateKey
 */
const filterByDate = (data, date, dateKey) => {
  return data.filter((d) => d[dateKey].split(" ")[0] === date);
};
/**
 * @param {any} jsonObj
 */
const json2buffer = (jsonObj) => {
  return Buffer.from(JSON.stringify(jsonObj), "utf8");
};

const uploadAWS = async (s3, fileContent, target) => {
  try {
    if (!("S3_BUCKET" in process.env)) {
      throw new Error("S3_BUCKET is required as an environmental variable");
    }

    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: target,
      Body: fileContent,
    };
    const data = await s3.upload(params).promise();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  csv,
  csv2buffer,
  extractAndClean,
  extractAndCleanBwb,
  filterByDate,
  get,
  csv2json,
  json2buffer,
  setupAWS,
  transform,
  transformBwb,
  uploadAWS,
};
