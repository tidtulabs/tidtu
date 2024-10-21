import * as cheerio from "cheerio";
import axios from "axios";
import fs from "fs";

const extractEndpoint = (href) => {
	const regex = /\/(.*)/;
	return href.match(regex)[1];
};
const collectData = async (endpoint) => {
	try {
		const website = `https://pdaotao.duytan.edu.vn/${endpoint}`;
		// console.log("website", website);
		const { data } = await axios.get(website);
		return cheerio.load(data);
	} catch (error) {
		throw new Error(`Error fetching page: ${error}`);
	}
};
var R = 0;
async function fetchLinks(endpoint = "", data = []) {
	try {
		const fetch = `EXAM_LIST${endpoint ? `${endpoint}` : ""}`;
		const $ = await collectData(fetch);
		// console.log("Fetching link:", fetch);
		const rows = $(".border_main").find("tr");

		for (let index = 0; index < rows.length; index++) {
			const element = rows[index];

			if (index < 2) continue;

			const links = $(element).find("a");

			for (let linkIndex = 0; linkIndex < links.length; linkIndex++) {
				const linkElement = links[linkIndex];
				const linkText = $(linkElement).text().trim();
				const linkHref = $(linkElement).attr("href");

				if (index < rows.length - 1) {
					const parts = linkText
						.split("\n")
						.map((part) => part.trim())
						.filter((part) => part);

					data.push({
						text: parts[0],
						dateUpload: parts[1],
						href: extractEndpoint(linkHref),
					});
				} else if (
					linkIndex === links.length - 1 &&
					linkText === ">>" /*if >> == next*/ &&
					R < 2
				) {
					R++;
					await fetchLinks(extractEndpoint(linkHref), data);
				}
			}
		}

		return data;
	} catch (error) {
		throw new Error(`Error fetching page: ${error}`);
	}
}

const run = async () => {
	const links = await fetchLinks();
	// console.log(`Total links fetched: ${links.length}`);
	fs.writeFileSync("links.json", JSON.stringify(links, null, 2));
	console.log(JSON.stringify(links, null, 2));
};
run();
