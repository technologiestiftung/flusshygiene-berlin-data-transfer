const server = require("./mocks/server");
if (process.env.S3_BUCKET === undefined) {
  process.env.S3_BUCKET = "";
}
if (process.env.AWS_SECRET_ACCESS_KEY === undefined) {
  process.env.AWS_SECRET_ACCESS_KEY = "";
}
if (process.env.AWS_ACCESS_KEY_ID === undefined) {
  process.env.AWS_ACCESS_KEY_ID = "";
}
if (process.env.TSB_SECRET === undefined) {
  process.env.TSB_SECRET = "";
}
jest.useFakeTimers();

beforeAll(() => {
  // Enable the mocking in tests.
  server.listen();
});

afterEach(() => {
  // Reset any runtime handlers tests may use.
  server.resetHandlers();
});

afterAll(() => {
  // Clean up once the tests are done.
  server.close();
});
