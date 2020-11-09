if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { csv, csv2buffer, extractAndClean, extractAndCleanBwb, transformBwb, get, setupAWS, transform, uploadAWS, json2buffer, csv2json } = require("./src/index");

// Testing the pipeline for downloading, transforming and uploading data from the Berlin Senate

test('get csv file', () => {
  return get('https://raw.githubusercontent.com/technologiestiftung/flusshygiene-berlin-data-transfer/master/test/test.csv').then((data) => {
    expect(data).toBe(`Datum;Einzelwert;"Stationsnummer: 5803200";"Stationsname: Tiefwerder";"Gew�sser: Havel";"Durchfluss im m�/s";"Fehlwerte: -777"
"08.07.2019 00:00";7,40
"08.07.2019 00:15";7,80
`);
  });
});

test('clean csv string', () => {
  expect(extractAndClean(`Datum;Einzelwert;"Stationsnummer: 5803200";"Stationsname: Tiefwerder";"Gew�sser: Havel";"Durchfluss im m�/s";"Fehlwerte: -777"
"08.07.2019 00:00";7,40
"08.07.2019 00:15";7,80
`)).toStrictEqual({ stationsnummer: '5803200', csvString: 'Datum;Einzelwert\n"08.07.2019 00:00";7,40\n"08.07.2019 00:15";7,80\n' })
})

test('parse csv string', () => {
  return csv('Datum;Einzelwert\n"08.07.2019 00:00";7,40\n"08.07.2019 00:15";7,80\n', ';').then((data) => {
    expect(data).toStrictEqual([ { Datum: '08.07.2019 00:00', Einzelwert: '7,40' }, { Datum: '08.07.2019 00:15', Einzelwert: '7,80' } ])
  })
})

test('transform csv values', () => {
  expect(transform([ { Datum: '08.07.2019 00:00', Einzelwert: '7,40' }, { Datum: '08.07.2019 00:15', Einzelwert: '7,80' }, { Datum: '08.07.2019 00:15', Einzelwert: '-777' }, { Datum: '08.07.2019 00:15', Einzelwert: false }, { Datum: '08.07.2019 00:15', Einzelwert: null }, { Datum: '08.07.2019 00:15' } ]))
    .toStrictEqual([ { Datum: '2019-07-08 12:00:00', Einzelwert: 7.4 }, { Datum: '2019-07-08 12:15:00', Einzelwert: 7.8 } ])
})

test('transform csv to json', () => {
  expect(csv2json([ { Datum: '2019-07-08 12:00:00', Einzelwert: 7.4 }, { Datum: '2019-07-08 12:15:00', Einzelwert: 7.8 }, { Datum: '2019-07-08 12:15:00', Einzelwert: 'NA' } ]))
    .toStrictEqual({ data: [ { date: '2019-07-08 12:00:00', value: 7.4 }, { date: '2019-07-08 12:15:00', value: 7.8 }, { date: '2019-07-08 12:15:00', value: 'NA' } ]})
})

test('setup aws client', () => {
  expect(typeof setupAWS())
    .toBe('object')
})

test('upload to AWS (csv)', () => {
  return uploadAWS(setupAWS(), csv2buffer([ { Datum: '2019-07-08 12:00:00', Einzelwert: 7.4 }, { Datum: '2019-07-08 12:15:00', Einzelwert: 7.8 } ]), "test/test.csv")
    .then((data) => {
      return get(data.Location)
    })
    .then((data) => {
      return csv(data, ',')
    })
    .then((data) => {
      expect(data).toStrictEqual([ { Datum: '2019-07-08 12:00:00', Einzelwert: "7.4" }, { Datum: '2019-07-08 12:15:00', Einzelwert: "7.8" } ])
    })
    .catch((err) => {
      throw err;
    })
})

test('upload to AWS (json)', () => {
  return uploadAWS(setupAWS(), json2buffer(csv2json([ { Datum: '2019-07-08 12:00:00', Einzelwert: 7.4 }, { Datum: '2019-07-08 12:15:00', Einzelwert: 7.8 } ])), "test/test.json")
    .then((data) => {
      return get(data.Location)
    })
    .then((data) => {
      return JSON.parse(data)
    })
    .then((data) => {
      expect(data).toStrictEqual({ data: [ { date: '2019-07-08 12:00:00', value: 7.4 }, { date: '2019-07-08 12:15:00', value: 7.8 } ]})
    })
    .catch((err) => {
      throw err;
    })
})

// Testing the pipeline for downloading, transforming and uploading data from the Berlin Water Service (uploading to AWS is not tested, as there is no difference to the above)

test('BWB: get csv file', () => {
  return get('https://raw.githubusercontent.com/technologiestiftung/flusshygiene-berlin-data-transfer/master/test/bwb.txt').then((data) => {
    expect(data).toBe(`	Altarm Ruhleben m3/d		
25.08.2020	935,012621		
26.08.2020	83507,58802		
27.08.2020	9320,413933		
`);
  });
});

test('BWB: clean csv string', () => {
  expect(extractAndCleanBwb(`	Altarm Ruhleben m3/d		
25.08.2020	935,012621		
26.08.2020	83507,58802		
27.08.2020	9320,413933		  
`)).toStrictEqual({ csvString: `date\tvalue
25.08.2020	935,012621
26.08.2020	83507,58802
27.08.2020	9320,413933
` })
})

test('BWB: parse csv string', () => {
  return csv(`date\tvalue
25.08.2020	935,012621
26.08.2020	83507,58802
27.08.2020	9320,413933
`, '\t').then((data) => {
    expect(data).toStrictEqual([ { date: '25.08.2020', value: '935,012621' }, { date: '26.08.2020', value: '83507,58802' }, { date: '27.08.2020', value: '9320,413933' } ])
  })
})

test('BWB: transform csv values', () => {
  expect(transformBwb([ { date: '25.08.2020', value: '935,012621' }, { date: '26.08.2020', value: '83507,58802' }, { date: '27.08.2020', value: '9320,413933' } ]))
    .toStrictEqual([ { date: '2020-08-25 12:00:00', value: 935.012621 }, { date: '2020-08-26 12:00:00', value: 83507.58802 }, { date: '2020-08-27 12:00:00', value: 9320.413933 } ])
})

test('BWB: transform csv to json', () => {
  expect(csv2json([ { date: '2020-08-25 12:00:00', value: 935.012621 }, { date: '2020-08-26 12:00:00', value: 83507.58802 }, { date: '2020-08-27 12:00:00', value: 9320.413933 } ]))
    .toStrictEqual({ data: [ { date: '2020-08-25 12:00:00', value: 935.012621 }, { date: '2020-08-26 12:00:00', value: 83507.58802 }, { date: '2020-08-27 12:00:00', value: 9320.413933 } ]})
})