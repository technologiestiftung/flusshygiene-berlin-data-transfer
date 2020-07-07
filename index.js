const config = require('./config.json')
const https = require('https')
const parse = require("csv-parse")

const gets = (url) => new Promise((resolve, reject) => {
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
    delimiter: ';'
  }, (err, output) => {
    if (err) {
      reject(err)
    } else {
      resolve(output)
    }
  })
})
