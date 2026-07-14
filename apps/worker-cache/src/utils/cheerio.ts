import axios from "axios";
import * as cheerio from "cheerio";

type ScrapingResult = {
	success: boolean;
	data?: cheerio.CheerioAPI;
	message?: string;
};

const BASE_URL = "https://pdaotao.duytan.edu.vn/";
const scrapingData = async (endPoint: string): Promise<ScrapingResult> => {
	try {
		const { data, status } = await axios.get(`${BASE_URL}${endPoint}`, {
			timeout: 20000,
		});

		if (status !== 200 || !data) {
			return {
				success: false,
				message: "Unable to fetch data. Please try again later.",
			};
		}

		return {
			success: true,
			data: cheerio.load(data),
		};
	} catch (error) {
		return {
			success: false,
			message: "An unexpected error occurred. Please try again later.",
		};
	}
};

export { scrapingData };
