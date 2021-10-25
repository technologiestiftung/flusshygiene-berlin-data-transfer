import { rest } from "msw";
import fs from "fs";
import path from "path";
const bwbTxt = fs.readFileSync(path.resolve(__dirname, "../bwb.txt"), "utf8");
const csvTxt = fs.readFileSync(path.resolve(__dirname, "../test.csv"), "utf8");
export const handlers = [
  rest.get("https://example.com/__tests__/bwb.txt", (req, res, ctx) => {
    return res(ctx.status(200), ctx.text(bwbTxt));
  }),
  rest.get("https://example.com/__tests__/test.csv", (req, res, ctx) => {
    return res(ctx.status(200), ctx.text(csvTxt));
  }),
  rest.get(
    "http://*.technologiestiftung-berlin.de/Altarm_RUH_*_0040.txt",
    (req, res, ctx) => {
      return res(ctx.status(200), ctx.text(bwbTxt));
    }
  ),
];
