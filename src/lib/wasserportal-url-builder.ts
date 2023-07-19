import moment from "moment";
// see https://wasserportal.berlin.de/download/wasserportal_berlin_getting_data.pdf
// or docs/wasserportal_berlin_getting_data.pdf

export type SReiheType = "ew" | "tw" | "mv";
export interface WasserportalUrlBuilderOptions {
	sreihe?: SReiheType;
	smode?: "c" | "m";
	sdatum?: string;
	station?: string;
	anzeige?: "d" | "g";
	thema?: "odf";
}

export function wasserportalUrlBuilder(
	options?: WasserportalUrlBuilderOptions,
) {
	// merge options with default options
	// we need these to be inside the fdunction because we need the current date
	// when no options are provided
	const defaultOptions: WasserportalUrlBuilderOptions = {
		sreihe: "tw",
		smode: "c",
		sdatum: moment().subtract(5, "day").format("DD.MM.YYYY"),
		station: "5803200",
		anzeige: "d",
		thema: "odf",
	};
	const { sreihe, smode, sdatum, station, anzeige, thema } = {
		...defaultOptions,
		...options,
	};

	return `https://wasserportal.berlin.de/station.php?anzeige=${anzeige}&station=${station}&sreihe=${sreihe}&smode=${smode}&thema=${thema}&sdatum=${sdatum}`;
}
