import * as cheerio from "cheerio";
import { BASE_URL } from "utils/base-url";

type ScrapingResult = {
	success: boolean;
	data?: cheerio.CheerioAPI;
	message?: string;
  errorType?: "TIMEOUT" | "SERVER_ERROR" 
};

const scrapingData = async (endPoint: string): Promise<ScrapingResult> => {
	try {
		const response = await fetch(`${BASE_URL}/${endPoint}`, {
			signal: AbortSignal.timeout(20000),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.text();
		const status = response.status;

		if (status !== 200 || !data) {
			return {
				success: false,
				message: "Unable to fetch data. Please try again later.",
        errorType: "SERVER_ERROR"
			};
		}

		return {
			success: true,
			data: cheerio.load(data),
		};
	} catch (error: any) {
		if (error.name === "AbortError") {
			return {
				success: false,
				message: "Request timeout. Please try again later.",
        errorType: "TIMEOUT"
			};
		}
		return {
			success: false,
			message: "An unexpected error occurred. Please try again later.",
      errorType: "SERVER_ERROR"
		};
	}
};

export { scrapingData };
