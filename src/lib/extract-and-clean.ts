/**
 * @param {string} csvString
 */
export function extractAndClean(
  csvString: string
): { stationsnummer: string; csvString: string } {
  // for some reason someone thought it would be super smart to put additonal meta data in the CSV header
  const meta = csvString.match(/;"Stationsnummer:[^\n]*/m);
  const cleanedString = csvString.replace(/;"Stationsnummer:[^\n]*/m, "");
  if (!meta || meta[0] === null) {
    throw new Error("No meta data found");
  }
  const matches = meta[0].match(/[0-9]+/);
  if (!matches) {
    throw new Error("No meta data found");
  }
  return {
    stationsnummer: matches[0],
    csvString: cleanedString,
  };
}

export function extractAndCleanBwb(csvString: string): { csvString: string } {
  // don't even get me started on the formatting of this file 🤯
  // remove the first line
  let lines = csvString.split("\n");
  lines.splice(0, 1);
  lines = lines.map((line) => line.trim());
  return {
    csvString: "date\tvalue\n" + lines.join("\n"),
  };
}
