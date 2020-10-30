if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

if (!('TSB_SECRET' in process.env)) {
  throw Error('TSB_SECRET is required as environmental variable')
}

const config = require('./config.json')
const moment = require('moment')
const { csv, csv2buffer, extractAndClean, extractAndCleanBwb, get, setupAWS, transform, transformBwb, uploadAWS, csv2json, json2buffer } = require('./src/index')

const s3 = setupAWS()

Promise.all(config.stations.map((station) => {
  return get(`https://wasserportal.berlin.de/station.php?anzeige=dd&sstation=${station}&sreihe=w&smode=c&sdatum=`)
    .then((data) => {
      return csv(extractAndClean(data).csvString, ';')
    })
    .then(async (data) => {
      const csvBuff = csv2buffer(transform(data))
      await Promise.all([
        uploadAWS(s3, csvBuff, `stations/${station}/${moment().format('YYYY-MM-DD_hh-mm-ss')}.csv`),
        uploadAWS(s3, csvBuff, `stations/${station}/latest.csv`)
      ])
      const jsonBuff = json2buffer(csv2json(data))
      await Promise.all([
        uploadAWS(s3, jsonBuff, `stations/${station}/${moment().format('YYYY-MM-DD_hh-mm-ss')}.json`),
        uploadAWS(s3, jsonBuff, `stations/${station}/latest.json`)
      ])

      return Promise.resolve()
    })
}))
  .then(() => {
    return get(`http://${process.env.TSB_SECRET}.technologiestiftung-berlin.de/Altarm_RUH_${moment().format('YYMMDD')}_0040.txt`)
      .then((data) => {
        return csv(extractAndCleanBwb(data), '\t')
      })
      .then(async (data) => {
        const buff = csv2buffer(transformBwb(data))
        await Promise.all([
          uploadAWS(s3, buff, `wastewater/${moment().format('YYYY-MM-DD_hh-mm-ss')}.csv`),
          uploadAWS(s3, buff, 'wastewater/latest.csv')
        ])

        const jsonBuff = json2buffer(csv2json(transformBwb(data)))
        await Promise.all([
          uploadAWS(s3, buff, `wastewater/${moment().format('YYYY-MM-DD_hh-mm-ss')}.json`),
          uploadAWS(s3, buff, 'wastewater/latest.json')
        ])

        return Promise.resolve()
      })
  })
  .catch((err) => {
    throw err
  })
