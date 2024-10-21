import axios from "axios";
import * as cheerio from "cheerio";

const collectData = async (endpoint: string) => {
	try {
		const website = `https://pdaotao.duytan.edu.vn/${endpoint}`;
		// console.log("website", website);
		// console.log("website", website);
		const { data } = await axios.get(website);
		return cheerio.load(data);
	} catch (error) {
		throw new Error(`Error fetching page: ${error}`);
	}
};
export { collectData };
