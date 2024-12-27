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

		//client.on('error', err => console.log('Redis Client Error', err));
		//
		//await client.connect();
		//
		//await client.set('foo5', 'bar');
		//const result = await client.get('foo');
		//console.log(result)  // >>> bar
		//

	
		//redis
		//.on("connect", function () {
		//	console.log("Connected!");
		//})
		//.on("error", function (err) {
		//	console.log("Error " + err);
		//});
		//
		//await redis.connect();
		//  await redis.disconnect();

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
		if (axios.isAxiosError(error)) {
			if (error.code === "ECONNABORTED") {
				return {
					success: false,
					message:
						"Time out! request took too long to complete. Please try again later.",
				};
			} else {
				return {
					success: false,
					message: `An error occurred while connecting to the server DTU. Please try again later! status ${error.code}`,
				};
			}
		}
		return {
			success: false,
			message: "An unexpected error occurred. Please try again later.",
		};
	}
};

export default scrapingData;
