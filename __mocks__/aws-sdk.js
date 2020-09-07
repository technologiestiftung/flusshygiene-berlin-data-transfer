// taken from https://github.com/badunk/multer-s3/blob/master/test/util/mock-s3.js
const events = require("events");
const concat = require("concat-stream");

function S3(obj) {
  function upload(opts) {
    const ee = new events.EventEmitter();

    ee.send = function send(cb) {
      opts.Body.pipe(
        concat((body) => {
          ee.emit("httpUploadProgress", { total: body.length });
          cb(null, {
            ETag: "mock-etag",
            Location: "mock-location",
          });
        })
      );
    };

    return ee;
  }

  return { upload };
}
function Credentials(obj) {
  return obj;
}
module.exports = { S3, Credentials };
