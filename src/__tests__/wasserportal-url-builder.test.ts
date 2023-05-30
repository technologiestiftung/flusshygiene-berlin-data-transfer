import moment from "moment";
import {
	WasserportalUrlBuilderOptions,
	wasserportalUrlBuilder,
} from "../lib/wasserportal-url-builder";

describe("wasserportalUrlBuilder", () => {
	test("should return a valid URL with default options", () => {
		const url = wasserportalUrlBuilder();
		const currentDate = moment().subtract(5, "day").format("DD.MM.YYYY");
		expect(url).toBe(
			`https://wasserportal.berlin.de/station.php?anzeige=d&station=5803200&sreihe=tw&smode=c&sdatum=${currentDate}`,
		);
	});

	test("should return a valid URL with custom options", () => {
		const options: WasserportalUrlBuilderOptions = {
			sreihe: "ew",
			smode: "m",
			sdatum: "01.01.2022",
			station: "1234567",
			anzeige: "g",
		};
		const url = wasserportalUrlBuilder(options);
		expect(url).toBe(
			"https://wasserportal.berlin.de/station.php?anzeige=g&station=1234567&sreihe=ew&smode=m&sdatum=01.01.2022",
		);
	});
});
