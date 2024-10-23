import axios from "axios";
import * as cheerio from "cheerio";

type ScrapingResult = {
	success: boolean;
	data?: cheerio.CheerioAPI;
	message?: string;
};

const scrapingData = async (endpoint: string): Promise<ScrapingResult> => {
	try {
		const website = `https://pdaotao.duytan.edu.vn/${endpoint}`;
		const { data, status } = await axios.get(website, { timeout: 5000 });

		if (status !== 200) {
			throw new Error(
				`fetching page at endpoint: "${endpoint}". Status code: ${status}`,
			);
		}

		return {
			success: true,
			data: cheerio.load(data),
		};
	} catch (error: any) {
		if (axios.isAxiosError(error)) {
			if (error.code === "ECONNABORTED") {
				throw new Error(`Timeout error: ${error.message}`);
			}
			throw new Error(
				`Error fetching page at endpoint: "${endpoint}". Status code: ${error.response?.status}`,
			);
		} else {
			return {
				success: false,
				message: `Unexpected error: ${error.message}`,
			};
		}
	}
};

export default scrapingData;
