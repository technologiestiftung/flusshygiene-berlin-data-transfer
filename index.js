if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

if (!('TSB_SECRET' in process.env)) {
  throw Error('TSB_SECRET is required as environmental variable')
}

const config = require('./config.json')
const moment = require('moment')
const { csv, csv2buffer, extractAndClean, extractAndCleanBwb, get, setupAWS, transform, transformBwb, uploadAWS } = require('./src/index')

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
  .then(() => {
    return get(`http://${process.env.TSB_SECRET}.technologiestiftung-berlin.de/Altarm_RUH_${moment().format('YYMMDD')}_0040.txt`)
      .then((data) => {
        return csv(extractAndCleanBwb(data), '\t')
      })
      .then((data) => {
        const buff = csv2buffer(transformBwb(data))
        return Promise.all([
          uploadAWS(s3, buff, `wastewater/${moment().format('YYYY-MM-DD_hh-mm-ss')}.csv`),
          uploadAWS(s3, buff, 'wastewater/latest.csv')
        ])
      })
  })
  .catch((err) => {
    throw err
  })
