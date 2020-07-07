const https = require('https')
const parse = require('csv-parse')
const moment = require('moment-timezone')
const AWS = require('aws-sdk')

const get = (url) => new Promise((resolve, reject) => {
  https.get(url, (response) => {
    let body = ''
    response.on('data', (chunk) => {
      body += chunk
    })
    response.on('end', () => resolve(body))
  }).on('error', reject)
})

const csv = (csvString, delimiter) => new Promise((resolve, reject) => {
  parse(csvString, {
    trim: true,
    skip_empty_lines: true,
    delimiter: delimiter,
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
    row.Datum = moment(row.Datum, 'DD.MM.YYYY hh:mm').tz('Europe/Berlin').unix()
    row.Einzelwert = parseFloat(row.Einzelwert.replace(',', '.'))
    if (row.Einzelwert === -777) {
      row.Einzelwert = 'NA'
    }
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

const setupAWS = () => {
  if (!('AWS_ACCESS_KEY_ID' in process.env) || !('AWS_SECRET_ACCESS_KEY' in process.env)) {
    throw Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required as environmental variables')
  }

  return new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })
}

const csv2buffer = (csvObj) => {
  const columns = Object.keys(csvObj[0])
  let csvString = columns.join(',')
  csvObj.forEach((row) => {
    const values = []
    columns.forEach((column) => {
      values.push(row[column])
    })
    csvString += '\n' + values.join(',')
  })
  return Buffer.from(csvString, 'utf8')
}

const uploadAWS = (s3, fileContent, target) => new Promise((resolve, reject) => {
  if (!('S3_BUCKET' in process.env)) {
    reject(Error('S3_BUCKET is required as an environmental variable'))
  }

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: target,
    Body: fileContent
  }

  s3.upload(params, (err, data) => {
    if (err) {
      reject(err)
    } else {
      resolve(data)
    }
  })
})

module.exports = { csv, csv2buffer, extractAndClean, get, setupAWS, transform, uploadAWS }
