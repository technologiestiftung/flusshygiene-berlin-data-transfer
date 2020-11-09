const https = require('https')
const http = require('http')
const parse = require('csv-parse')
const moment = require('moment-timezone')
const AWS = require('aws-sdk')

const get = (url) => new Promise((resolve, reject) => {
  let protocol = https
  if (url.substring(0, 5).toLowerCase() !== 'https') {
    protocol = http
  }
  protocol.get(url, (response) => {
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
    /*
     * according to the original R-Script this was supplied as a unix timestamp
     * row.Datum = moment(row.Datum, 'DD.MM.YYYY hh:mm').tz('Europe/Berlin', true).unix()
     * now changed according to issue #6, https://github.com/technologiestiftung/flusshygiene-berlin-data-transfer/issues/6
     */
    row.Datum = moment(row.Datum, 'DD.MM.YYYY hh:mm').tz('Europe/Berlin', true).format('YYYY-MM-DD hh:mm:ss')
    if (row.Einzelwert) {
      row.Einzelwert = parseFloat(row.Einzelwert.replace(',', '.'))
    }
  })
  // in the original R-Script null values/-777 were transformed to NA, now we remove empty values
  csvObj = csvObj.filter((row) => (row.Einzelwert && row.Einzelwert !== -777 && !isNaN(row.Einzelwert)))
  return csvObj
}

const transformBwb = (csvObj) => {
  csvObj.forEach((row) => {
    row.date = moment(row.date, 'DD.MM.YYYY').format('YYYY-MM-DD hh:mm:ss')
    if ((typeof row.value) === 'string') {
      row.value = parseFloat(row.value.replace(',', '.'))
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

const extractAndCleanBwb = (csvString) => {
  // don't even get me started on the formatting of this file 🤯
  // remove the first line
  let lines = csvString.split('\n')
  lines.splice(0, 1)
  lines = lines.map((line) => line.trim())
  return {
    csvString: 'date\tvalue\n' + lines.join('\n')
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

const csv2json = (csvObj) => {
  const json = { data: [] }

  const columns = Object.keys(csvObj[0])
  csvObj.forEach((row) => {
    const data = {}
    columns.forEach((column) => {
      if (column === 'date' || column === 'Datum') {
        data.date = row[column]
      } else {
        data.value = row[column]
      }
    })
    json.data.push(data)
  })

  return json
}

const json2buffer = (jsonObj) => {
  return Buffer.from(JSON.stringify(jsonObj), 'utf8')
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

module.exports = { csv, csv2buffer, extractAndClean, extractAndCleanBwb, get, csv2json, json2buffer, setupAWS, transform, transformBwb, uploadAWS }
