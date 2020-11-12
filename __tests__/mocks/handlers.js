//@ts-check
const { rest } = require("msw");
const fs = require("fs");
const path = require("path");
const bwbTxt = fs.readFileSync(path.resolve(__dirname, "../bwb.txt"), "utf8");
const csvTxt = fs.readFileSync(path.resolve(__dirname, "../test.csv"), "utf8");
const handlers = [
  rest.get("https://example.com/__tests__/bwb.txt", (req, res, ctx) => {
    return res(ctx.status(200), ctx.text(bwbTxt));
  }),
  rest.get("https://example.com/__tests__/test.csv", (req, res, ctx) => {
    return res(ctx.status(200), ctx.text(csvTxt));
  }),
];

module.exports = handlers;
