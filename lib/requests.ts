// const get = (url) =>
//   new Promise((resolve, reject) => {
//     let protocol = https;
//     if (url.substring(0, 5).toLowerCase() !== "https") {
//       // @ts-ignore
//       protocol = http;
//     }
//     protocol
//       .get(url, (response) => {
//         const status = response.statusCode;
//         if (status !== 200) {
//           reject(new Error(`HTTP Status ${status} ${response.statusMessage}`));
//         }
//         let body = "";
//         response.on("data", (chunk) => {
//           body += chunk;
//         });
//         response.on("end", () => resolve(body));
//       })
//       .on("error", reject);
//   });

import got from "got";

export async function get(url: string): Promise<string> {
  // get body using got
  try {
    const response = await got(url);
    return response.body;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
