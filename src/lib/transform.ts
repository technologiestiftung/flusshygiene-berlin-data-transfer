import moment from "moment-timezone";
import { WapoValueType } from "./common";
import { logger } from "./logging";
import { SReiheType } from "./wasserportal-url-builder";

export interface CSVRow extends Record<string, unknown> {
	date?: string;
	Datum?: string;
	Einzelwert?: number;
	Tagesmittelwert?: number;
}
export interface RawCSVRow {
	Einzelwert?: string;
	Tagesmittelwert?: string;
	date?: string;
	Datum?: string;
}

function createCSVRow({
	value,
	date,
}: {
	value: number;
	date: string;
}): CSVRow {
	return {
		Einzelwert: value,
		Datum: date,
	};
}
export function transform(csvObj: RawCSVRow[], sreihe?: SReiheType): CSVRow[] {
	const parsed: CSVRow[] = [];
	let key: WapoValueType;

	// autodetect if object has property Tagesmittelwert or Einzelwert
	// and garding against malformed values
	if (sreihe === undefined) {
		if (
			csvObj[0]["Einzelwert"] === undefined &&
			csvObj[0]["Tagesmittelwert"] === undefined
		) {
			throw new Error(
				"Could not detect Tagesmittelwert nor Einzelwert property.",
			);
		}
		if (csvObj[0]["Einzelwert"] === undefined) {
			key = "Tagesmittelwert";
		} else if (csvObj[0]["Tagesmittelwert"] === undefined) {
			key = "Einzelwert";
		}
	} else {
		key = sreihe === "tw" ? "Tagesmittelwert" : "Einzelwert";
		if (
			key === "Tagesmittelwert" &&
			csvObj[0]["Tagesmittelwert"] === undefined
		) {
			throw new Error("Could not detect Tagesmittelwert property.");
		}
		if (key === "Einzelwert" && csvObj[0]["Einzelwert"] === undefined) {
			throw new Error("Could not detect Einzelwert property.");
		}
	}

	csvObj.forEach((row: RawCSVRow) => {
		let item: CSVRow;
		/*
		 * according to the original R-Script this was supplied as a unix timestamp
		 * row.Datum = moment(row.Datum, 'DD.MM.YYYY hh:mm').tz('Europe/Berlin', true).unix()
		 * now changed according to issue #6, https://github.com/technologiestiftung/flusshygiene-berlin-data-transfer/issues/6
		 */
		const dt = moment(row.Datum, "DD.MM.YYYY hh:mm")
			.tz("Europe/Berlin", true)
			.format("YYYY-MM-DD hh:mm:ss");
		row.Datum = dt;
		if (row[key] !== undefined) {
			item = createCSVRow({
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				value: parseFloat(row[key]!.replace(",", ".")),
				date: dt,
			});
			parsed.push(item);
		}
	});
	const result = parsed
		.filter((row) => row["Einzelwert"] !== undefined)
		.filter((row) => row["Einzelwert"] !== -777)
		.filter((row) => !isNaN(row["Einzelwert"] as number));

	// in the original R-Script null values/-777 were transformed to NA, now we remove empty values
	// csvObj = csvObj.filter(
	//   (row) => row.Einzelwert && row.Einzelwert !== -777 && !isNaN(row.Einzelwert)
	// );
	logger.info(`Filtered datasets from wasserportal: ${JSON.stringify(result)}`);
	return result;
}

export function transformBwb(
	csvObj: { date: string; value: string }[],
): { date: string; value: number }[] {
	const result: { date: string; value: number }[] = [];
	csvObj.forEach((row) => {
		const date = moment(row.date, "DD.MM.YYYY").format("YYYY-MM-DD hh:mm:ss");
		let value;
		if (typeof row.value === "string") {
			value = parseFloat(row.value.replace(",", "."));
		} else {
			throw new Error("Could not parse csv object");
		}
		result.push({ date, value });
	});
	return result;
}

export function csv2buffer(csvObj: CSVRow[]) {
	if (csvObj.length === 0) {
		throw new Error("No csv data found");
	}
	const columns = Object.keys(csvObj[0]);
	let csvString = columns.join(",");
	csvObj.forEach((row) => {
		const values: unknown[] = [];
		columns.forEach((column) => {
			values.push(row[column]);
		});
		csvString += "\n" + values.join(",");
	});
	return Buffer.from(csvString, "utf8");
}

export function json2buffer(jsonObj: Record<string, any>) {
	return Buffer.from(JSON.stringify(jsonObj), "utf8");
}

export function csv2json(csvObj: CSVRow[]) {
	const json: { data: unknown[] } = { data: [] };

	const columns = Object.keys(csvObj[0]);
	csvObj.forEach((row) => {
		const data: { date?: string; value?: number } = {};
		columns.forEach((column) => {
			if (column === "date" || column === "Datum") {
				data.date = row[column];
			} else {
				data.value = row[column] as number;
			}
		});
		json.data.push(data);
	});

	return json;
}
