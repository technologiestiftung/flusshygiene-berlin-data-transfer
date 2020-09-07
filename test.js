if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const {
  csv,
  csv2buffer,
  extractAndClean,
  extractAndCleanBwb,
  transformBwb,
  get,
  setupAWS,
  transform,
  uploadAWS,
} = require("./src/index");

// Testing the pipeline for downloading, transforming and uploading data from the Berlin Senate

test("get csv file", async () => {
  const data = await get(
    "https://raw.githubusercontent.com/technologiestiftung/flusshygiene-berlin-data-transfer/master/test/test.csv"
  );
  expect(data).toMatchInlineSnapshot(`
      "Datum;Einzelwert;\\"Stationsnummer: 5803200\\";\\"Stationsname: Tiefwerder\\";\\"Gew�sser: Havel\\";\\"Durchfluss im m�/s\\";\\"Fehlwerte: -777\\"
      \\"08.07.2019 00:00\\";7,40
      \\"08.07.2019 00:15\\";7,80
      "
    `);
});

test("clean csv string", () => {
  expect(
    extractAndClean(`Datum;Einzelwert;"Stationsnummer: 5803200";"Stationsname: Tiefwerder";"Gew�sser: Havel";"Durchfluss im m�/s";"Fehlwerte: -777"
"08.07.2019 00:00";7,40
"08.07.2019 00:15";7,80
`)
  ).toStrictEqual({
    stationsnummer: "5803200",
    csvString:
      'Datum;Einzelwert\n"08.07.2019 00:00";7,40\n"08.07.2019 00:15";7,80\n',
  });
});

test("parse csv string", async () => {
  const data = await csv(
    'Datum;Einzelwert\n"08.07.2019 00:00";7,40\n"08.07.2019 00:15";7,80\n',
    ";"
  );
  expect(data).toStrictEqual([
    { Datum: "08.07.2019 00:00", Einzelwert: "7,40" },
    { Datum: "08.07.2019 00:15", Einzelwert: "7,80" },
  ]);
});

test("transform csv values", () => {
  expect(
    transform([
      { Datum: "08.07.2019 00:00", Einzelwert: "7,40" },
      { Datum: "08.07.2019 00:15", Einzelwert: "7,80" },
      { Datum: "08.07.2019 00:15", Einzelwert: "-777" },
    ])
  ).toStrictEqual([
    { Datum: 1562536800, Einzelwert: 7.4 },
    { Datum: 1562537700, Einzelwert: 7.8 },
    { Datum: 1562537700, Einzelwert: "NA" },
  ]);
});

test("setup aws client", () => {
  expect(typeof setupAWS()).toBe("object");
});

test("upload to AWS", async () => {
  const data = await uploadAWS(
    setupAWS(),
    csv2buffer([
      { Datum: 1562536800, Einzelwert: 7.4 },
      { Datum: 1562537700, Einzelwert: 7.8 },
    ]),
    "test/test.csv"
  );
  const data1 = await get(data.Location);
  const data2 = await csv(data1, ",");
  expect(data2).toStrictEqual([
    { Datum: "1562536800", Einzelwert: "7.4" },
    { Datum: "1562537700", Einzelwert: "7.8" },
  ]);
});

// Testing the pipeline for downloading, transforming and uploading data from the Berlin Water Service (uploading to AWS is not tested)

test("BWB: get csv file", async () => {
  const data = await get(
    "https://raw.githubusercontent.com/technologiestiftung/flusshygiene-berlin-data-transfer/master/test/bwb.txt"
  );
  expect(data).toMatchInlineSnapshot(`
      "	Altarm Ruhleben m3/d
      25.08.2020	935,012621
      26.08.2020	83507,58802
      27.08.2020	9320,413933
      "
    `);
});

test("BWB: clean csv string", () => {
  expect(
    extractAndCleanBwb(`	Altarm Ruhleben m3/d
25.08.2020	935,012621
26.08.2020	83507,58802
27.08.2020	9320,413933
`)
  ).toStrictEqual({
    csvString: `date\tvalue
25.08.2020	935,012621
26.08.2020	83507,58802
27.08.2020	9320,413933
`,
  });
});

test("BWB: parse csv string", async () => {
  const data = await csv(
    `date\tvalue
25.08.2020	935,012621
26.08.2020	83507,58802
27.08.2020	9320,413933
`,
    "\t"
  );
  expect(data).toStrictEqual([
    { date: "25.08.2020", value: "935,012621" },
    { date: "26.08.2020", value: "83507,58802" },
    { date: "27.08.2020", value: "9320,413933" },
  ]);
});

test("BWB: transform csv values", () => {
  expect(
    transformBwb([
      { date: "25.08.2020", value: "935,012621" },
      { date: "26.08.2020", value: "83507,58802" },
      { date: "27.08.2020", value: "9320,413933" },
    ])
  ).toStrictEqual([
    { date: "2020-08-25", value: 935.012621 },
    { date: "2020-08-26", value: 83507.58802 },
    { date: "2020-08-27", value: 9320.413933 },
  ]);
});
