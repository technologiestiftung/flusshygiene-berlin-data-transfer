import { transform, transformBwb } from "../lib/transform";

describe("transform function tests", () => {
  test("should transform values of Tagesmittelwert to Einzelwert", () => {
    const actual = transform([
      { Tagesmittelwert: "1", Datum: "01.01.2021 10:45" },
    ]);
    const expected = [
      {
        Datum: "2021-01-01 10:45:00",
        Einzelwert: 1,
      },
    ];
    expect(actual).toStrictEqual(expected);
  });
  test("should transform Einzelwert to Einzelwert", () => {
    const actual = transform([{ Einzelwert: "1", Datum: "01.01.2021 10:45" }]);
    const expected = [
      {
        Datum: "2021-01-01 10:45:00",
        Einzelwert: 1,
      },
    ];
    expect(actual).toStrictEqual(expected);
  });
  test("should transform Einzelwert to and remove -777 values", () => {
    const actual = transform([
      { Einzelwert: "1", Datum: "01.01.2021 10:45" },
      { Einzelwert: "-777", Datum: "01.01.3000 10:45" },
      { Datum: "01.01.3000 10:45" },
      { Datum: "01.01.3000 10:45", Tagesmittelwert: "1" },
      { Datum: "01.01.3000 10:45", Einzelwert: "NA" },
    ]);
    const expected = [
      {
        Datum: "2021-01-01 10:45:00",
        Einzelwert: 1,
      },
    ];
    expect(actual).toStrictEqual(expected);
  });

  test("transform csv values", () => {
    const actual = transform(
      [
        { Datum: "08.07.2019 00:00", Einzelwert: "7,40" },
        { Datum: "09.07.2019 00:15", Einzelwert: "7,80" },
        { Datum: "10.07.2019 00:15", Einzelwert: "-777" },
      ],
      "w"
    );

    expect(actual).toStrictEqual([
      { Datum: "2019-07-08 12:00:00", Einzelwert: 7.4 },
      { Datum: "2019-07-09 12:15:00", Einzelwert: 7.8 },
    ]);
  });
});

describe("transformBWB function tests", () => {
  test("BWB: transform csv values", () => {
    const actual = transformBwb([
      { date: "25.08.2020", value: "935,012621" },
      { date: "26.08.2020", value: "83507,58802" },
      { date: "27.08.2020", value: "9320,413933" },
    ]);
    const expected = [
      { date: "2020-08-25 12:00:00", value: 935.012621 },
      { date: "2020-08-26 12:00:00", value: 83507.58802 },
      { date: "2020-08-27 12:00:00", value: 9320.413933 },
    ];
    expect(actual).toStrictEqual(expected);
  });
});
