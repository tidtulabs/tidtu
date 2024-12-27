import { aw } from "vitest/dist/chunks/reporters.D7Jzd9GS.js";

async function getExamList(
	endpoint: string = "",
	data: {
		text: string;
		dateUpload: string;
		href: string;
		isNew: boolean;
		pagination?: string;
		row?: number;
	}[] = [],
): Promise<{
	data: typeof data;
	nextPagination: string;
	isNew: boolean;
	currentPagination: string;
}> {
	try {
		let isPageNew: boolean = false;
		let trueNew = false;
		let nextPagination = "";
		let currentPagination = "";
		const fetch = `EXAM_LIST${endpoint ? `${endpoint}` : ""}`;
		const scraping = await scrapingData(fetch);
		if (!scraping.success) {
			throw new Error(scraping.message);
		}

		if (scraping.data && scraping.success) {
			const $ = scraping.data;
			const rows = $(".border_main").find("tr");

			for (let index = 0; index < rows.length; index++) {
				const element = rows[index];

				const ROW_SKIP = 2;

				if (index < ROW_SKIP) continue;

				const links = $(element).find("a");
				const img = $(element).find("img");

				for (let linkIndex = 0; linkIndex < links.length; linkIndex++) {
					const linkElement = links[linkIndex];
					const linkText = $(linkElement).text().trim();
					const linkHref = $(linkElement).attr("href");

					if (index < rows.length - 1) {
						img.each((_, element) => {
							const src = $(element).attr("src");
							if (src && src.includes("news.gif")) {
								isPageNew = true;
							} else {
								isPageNew = false;
							}
						});

						const parts = linkText
							.split("\n")
							.map((part) => part.trim())
							.filter((part) => part);

						data.push({
							text: parts[0],
							dateUpload: parts[1].replaceAll(/[()]/g, ""),
							isNew: isPageNew,
							href: (linkHref && extractEndpoint(linkHref)) || "",
							pagination: fetch,
							row: index - ROW_SKIP + 1, // because we skip 2 rows at the beginning and row array is 0-based
						});
					} else if (linkIndex === links.length - 1 && linkText === ">>") {
						currentPagination = endpoint;
						nextPagination = extractEndpoint(linkHref || "");
						trueNew = isPageNew;
					} else {
						continue;
					}
				}
			}
		}
		return {
			data,
			isNew: trueNew,
			nextPagination: nextPagination,
			currentPagination: currentPagination,
		};
	} catch (error) {
		throw new Error(`${error}`);
	}
}

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	try {
		let endpoint = "";

		if (query.next_pagination) {
			endpoint = extractEndpoint(query.next_pagination as string);
		}
		const data = await getExamList(endpoint);
		setResponseStatus(event, 200);

		let currentData: {
			data: any[];
			isNew: boolean;
			nextPagination: string;
			currentPagination: string;
		} = (await useStorage("tidtu").getItem("cache")) || {
			data: [],
			isNew: false,
			nextPagination: "",
			currentPagination: "",
		};

		//console.log(currentData.data.length);
		if (
			data.data[0]?.text === currentData.data[0]?.text &&
			data.data[0]?.dateUpload === currentData.data[0]?.dateUpload
		) {
			return {
				success: true,
				response: {
					data: currentData.data,
					is_new: currentData.isNew,
					next_pagination: currentData.nextPagination || "",
					current_pagination: currentData.currentPagination || "",
          is_cached: true, 
				},
				message: "Data has been processed successfully. (No new data)",
			};
		} else if (data.data[0].pagination === "EXAM_LIST" && currentData.data.length > 0) {
      //console.log("data pagination is EXAM_LIST");
			await useStorage("tidtu").removeItem("cache");
		} else if (currentData.data.length < 14 * 16) {
			//console.log("data length is less than 14*15");
			if (currentData.data) {
				//console.log("currentData is not empty");
				Array.prototype.push.apply(currentData.data, data.data);
				currentData.isNew = data.isNew;
				currentData.nextPagination = data.nextPagination;
				currentData.currentPagination = data.currentPagination;
			} else {
				currentData.data = data.data;
				currentData.isNew = data.isNew;
				currentData.nextPagination = data.nextPagination;
				currentData.currentPagination = data.currentPagination;
			}
			await useStorage("tidtu").setItem("cache", currentData);
		}

		//await useStorage("tidtu").setItem("cache", currentData);
		return {
			success: true,
			response: {
				data: data.data,
				is_new: data.isNew,
				next_pagination: data.nextPagination || "",
				current_pagination: data.currentPagination || "",
        is_cached: false,
			},
			message: "Data has been processed successfully.",
		};
	} catch (error: any) {
		if (error.message.includes("Time out")) {
			setResponseStatus(event, 504);
		} else {
			setResponseStatus(event, 500);
		}
		//console.log(error.message);
		return {
			success: false,
			response: null,
			message: `${error.message}`,
		};
	}
});
