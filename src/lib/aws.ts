import AWS, { S3 } from "aws-sdk";

export function setupAWS() {
  if (process.env.NODE_ENV !== "test") {
    if (
      !("AWS_ACCESS_KEY_ID" in process.env) ||
      !("AWS_SECRET_ACCESS_KEY" in process.env)
    ) {
      throw Error(
        "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required as environmental variables"
      );
    }
  }

  return new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
}

export async function uploadAWS(
  s3: AWS.S3,
  fileContent: string | Buffer,
  target: string
) {
  try {
    if (process.env.S3_BUCKET === undefined) {
      throw new Error("S3_BUCKET is required as an environmental variable");
    }

    const params: S3.Types.PutObjectRequest = {
      Bucket: process.env.S3_BUCKET!,
      Key: target,
      Body: fileContent,
    };
    const data = await s3.upload(params).promise();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
