// if (process.env.NODE_ENV !== "production") {
//   require("dotenv").config();
// }
// eslint-disable-next-line no-unused-vars
// @ts-check

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
  json2buffer,
  csv2json,
} = require("../src/index");

// const mS3Instance = {
//   upload: jest.fn().mockReturnThis(),
//   promise: jest.fn(),
// };

jest.mock("aws-sdk", () => {
  return {
    S3: jest.fn(() => {
      return {
        upload: jest.fn().mockReturnThis(),
        promise: jest.fn().mockResolvedValue({
          ETag: "mock-etag",
          Location: "mock-location",
        }),
      };
    }),
  };
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

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
    { Datum: "2019-07-08 12:00:00", Einzelwert: 7.4 },
    { Datum: "2019-07-08 12:15:00", Einzelwert: 7.8 },
    { Datum: "2019-07-08 12:15:00", Einzelwert: "NA" },
  ]);
});

test("transform csv to json", () => {
  expect(
    csv2json([
      { Datum: "2019-07-08 12:00:00", Einzelwert: 7.4 },
      { Datum: "2019-07-08 12:15:00", Einzelwert: 7.8 },
      { Datum: "2019-07-08 12:15:00", Einzelwert: "NA" },
    ])
  ).toStrictEqual({
    data: [
      { date: "2019-07-08 12:00:00", value: 7.4 },
      { date: "2019-07-08 12:15:00", value: 7.8 },
      { date: "2019-07-08 12:15:00", value: "NA" },
    ],
  });
});

test("setup aws client", () => {
  expect(typeof setupAWS()).toBe("object");
});

test.only("upload to AWS (csv)", async () => {
  const s3 = setupAWS();
  const data = [
    { Datum: "2019-07-08 12:00:00", Einzelwert: 7.4 },
    { Datum: "2019-07-08 12:15:00", Einzelwert: 7.8 },
  ];
  const buffer = csv2buffer(data);
  await uploadAWS(s3, buffer, "test/test.csv");
  expect(s3.upload).toHaveBeenCalledTimes(1);
  expect(s3.upload).toHaveBeenCalledWith({
    Bucket: "",
    Body: buffer,
    Key: "test/test.csv",
  });
});

test("upload to AWS (json)", () => {
  return uploadAWS(
    setupAWS(),
    json2buffer(
      csv2json([
        { Datum: "2019-07-08 12:00:00", Einzelwert: 7.4 },
        { Datum: "2019-07-08 12:15:00", Einzelwert: 7.8 },
      ])
    ),
    "test/test.json"
  )
    .then((data) => {
      return get(data.Location);
    })
    .then((data) => {
      return JSON.parse(data);
    })
    .then((data) => {
      expect(data).toStrictEqual({
        data: [
          { date: "2019-07-08 12:00:00", value: 7.4 },
          { date: "2019-07-08 12:15:00", value: 7.8 },
        ],
      });
    })
    .catch((err) => {
      throw err;
    });
});

// Testing the pipeline for downloading, transforming and uploading data from the Berlin Water Service (uploading to AWS is not tested, as there is no difference to the above)

test("BWB: get csv file", async () => {
  const data = await get(
    "https://raw.githubusercontent.com/technologiestiftung/flusshygiene-berlin-data-transfer/master/test/bwb.txt"
  );
  expect(data).toMatchSnapshot();
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
    { date: "2020-08-25 12:00:00", value: 935.012621 },
    { date: "2020-08-26 12:00:00", value: 83507.58802 },
    { date: "2020-08-27 12:00:00", value: 9320.413933 },
  ]);
});

test("BWB: transform csv to json", () => {
  expect(
    csv2json([
      { date: "2020-08-25 12:00:00", value: 935.012621 },
      { date: "2020-08-26 12:00:00", value: 83507.58802 },
      { date: "2020-08-27 12:00:00", value: 9320.413933 },
    ])
  ).toStrictEqual({
    data: [
      { date: "2020-08-25 12:00:00", value: 935.012621 },
      { date: "2020-08-26 12:00:00", value: 83507.58802 },
      { date: "2020-08-27 12:00:00", value: 9320.413933 },
    ],
  });
});
