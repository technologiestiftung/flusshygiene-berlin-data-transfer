import { filterByDateInterval, filterByDateString } from "../lib/filter";
describe("filterByDate functions", () => {
  // test should filter a single item out of a list of dates
  test("should filter a single item out of a list of dates", () => {
    const dates = [
      { date: "2019-01-01" },
      { date: "2019-01-02" },
      { date: "2019-01-03" },
      { date: "2019-01-04" },
      { date: "2019-01-05" },
      { date: "2019-01-06" },
    ];
    const actual = filterByDateString(dates, "2019-01-01", "date");
    expect(actual).toEqual([{ date: "2019-01-01" }]);
  });

  test("should find dates in interval of dates", () => {
    const dates = [
      { date: "2019-01-01" },
      { date: "2019-01-02" },
      { date: "2019-01-03" },
      { date: "2019-01-04" },
      { date: "2019-01-05" },
      { date: "2019-01-06" },
    ];
    const actual = filterByDateInterval({
      data: dates,
      interval: { start: "2019-01-01", end: "2019-01-02" },
      key: "date",
    });
    expect(actual).toEqual([{ date: "2019-01-01" }, { date: "2019-01-02" }]);
  });

  test("should return an empty array since he has the wrong key", () => {
    const dates = [
      { date: "2019-01-01" },
      { date: "2019-01-02" },
      { date: "2019-01-03" },
      { date: "2019-01-04" },
      { date: "2019-01-05" },
      { date: "2019-01-06" },
    ];
    const actual = filterByDateInterval({
      data: dates,
      interval: { start: "2019-01-01", end: "2019-01-02" },
      key: "Datum",
    });
    expect(actual).toEqual([]);
  });
});
