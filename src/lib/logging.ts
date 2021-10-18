import pino from "pino";
export const logger = pino({
  redact: ["[*].value.Location", "[*].value.Bucket", "[*].value.ETag"],
});
