const { csv, extractAndClean, get, transform } = require("./src/index");

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
  return csv('Datum;Einzelwert\n"08.07.2019 00:00";7,40\n"08.07.2019 00:15";7,80\n').then((data) => {
    expect(data).toStrictEqual([ { Datum: '08.07.2019 00:00', Einzelwert: '7,40' }, { Datum: '08.07.2019 00:15', Einzelwert: '7,80' } ])
  })
})

test('transform csv values', () => {
  expect(transform([ { Datum: '08.07.2019 00:00', Einzelwert: '7,40' }, { Datum: '08.07.2019 00:15', Einzelwert: '7,80' } ]))
    .toStrictEqual([ { Datum: 1562536800, Einzelwert: 7.4 }, { Datum: 1562537700, Einzelwert: 7.8 } ])
})
