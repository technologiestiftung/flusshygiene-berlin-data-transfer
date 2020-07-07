const config = require('../config.json')
const https = require('https')
const parse = require("csv-parse")
const moment = require("moment-timezone")

const get = (url) => new Promise((resolve, reject) => {
  https.get(url, (response) => {
    let body = ''
    response.on('data', (chunk) => {
      body += chunk
    })
    response.on('end', () => resolve(body))
  }).on('error', reject)
})

const csv = (csvString) => new Promise((resolve, reject) => {
  parse(csvString, {
    trim: true,
    skip_empty_lines: true,
    delimiter: ';',
    columns: true
  }, (err, output) => {
    if (err) {
      reject(err)
    } else {
      resolve(output)
    }
  })
})

const transform = (csvObj) => {
  csvObj.forEach((row) => {
    row.Datum = moment(row.Datum, 'DD.MM.YYYY hh:mm').tz("Europe/Berlin").unix()
    row.Einzelwert = parseFloat(row.Einzelwert.replace(',', '.'))
  })
  return csvObj
}

const extractAndClean = (csvString) => {
  // for some reason someone thought it would be super smart to put additonal meta data in the CSV header
  const meta = csvString.match(/;"Stationsnummer:[^\n]*/m)
  return {
    stationsnummer: meta[0].match(/[0-9]+/)[0],
    csvString: csvString.replace(/;"Stationsnummer:[^\n]*/m, '')
  }
}

module.exports = { csv, extractAndClean, get, transform }