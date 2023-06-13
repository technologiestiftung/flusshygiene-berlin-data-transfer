import got from "got";
import { logger } from "./logging";

export async function get(url: string): Promise<string> {
	try {
		const response = await got(url);
		return response.body;
	} catch (error) {
		logger.error(`Request Error getting data from ${url}`, error);
		throw error;
	}
}
