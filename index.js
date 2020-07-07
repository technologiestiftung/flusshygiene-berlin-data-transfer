if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const config = require('./config.json')
const moment = require('moment')
const { csv, csv2buffer, extractAndClean, get, setupAWS, transform, uploadAWS } = require('./src/index')

const s3 = setupAWS()

Promise.all(config.stations.map((station) => {
  return get(`https://wasserportal.berlin.de/station.php?anzeige=dd&sstation=${station}&sreihe=w&smode=c&sdatum=`)
    .then((data) => {
      return csv(extractAndClean(data).csvString, ';')
    })
    .then((data) => {
      const buff = csv2buffer(transform(data))
      return Promise.all([
        uploadAWS(s3, buff, `stations/${station}/${moment().format('YYYY-MM-DD_hh-mm-ss')}.csv`),
        uploadAWS(s3, buff, `stations/${station}/latest.csv`)
      ])
    })
}))
.catch((err) => {
  throw err
})