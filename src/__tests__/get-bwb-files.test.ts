import { format } from "date-fns";
import { getLatestBWBFile } from "../lib/get-last-bwb-file";
describe("function getLatestBWBFile tests", () => {
  jest.setTimeout(10000);
  test("should return the latest file", async () => {
    const actual = await getLatestBWBFile();
    expect(actual).toBe(
      `http://${
        process.env.TSB_SECRET
      }.technologiestiftung-berlin.de/Altarm_RUH_${format(
        new Date(),
        "yyMMdd"
      )}_0040.txt`
    );
  });
});
