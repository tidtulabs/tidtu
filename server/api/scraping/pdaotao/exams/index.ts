import { collectData } from "@/lib/collectData";
import { extractEndPoint } from "@/utils/extractEndPont";

async function fetchLinks(
	endpoint: string = "",
	takeOld: boolean = false,
	data: {
		text: string;
		dateUpload: string;
		href: string;
		isNew: boolean;
		pagination?: string;
	}[] = [],
): Promise<{ data: typeof data; lastPagination: string }> {
	try {
		let isPageNew: boolean = false;
		const fetch = `EXAM_LIST${endpoint ? `${endpoint}` : ""}`;
		const $ = await collectData(fetch);

		const rows = $(".border_main").find("tr");

		for (let index = 0; index < rows.length; index++) {
			const element = rows[index];

			if (index < 2) continue;

			const links = $(element).find("a");
			const img = $(element).find("img");

			for (let linkIndex = 0; linkIndex < links.length; linkIndex++) {
				const linkElement = links[linkIndex];
				const linkText = $(linkElement).text().trim();
				const linkHref = $(linkElement).attr("href");

				if (index < rows.length - 1) {
					img.each((index, element) => {
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
						href: (linkHref && extractEndPoint(linkHref)) || "",
						pagination: fetch,
					});
				} else if (linkIndex === links.length - 1 && linkText === ">>") {
					const nextHref = extractEndPoint(linkHref || "");
					const nextPagination = nextHref.match(/page=(\d+)/);
					// console.log(
					// 	"nextPagination",
					// 	nextPagination && parseInt(nextPagination[1]),
					// );

					if (
						takeOld ||
						(!takeOld && isPageNew) ||
						(nextPagination && parseInt(nextPagination[1]) <= 5)
					) {
						const recursiveResult = await fetchLinks(nextHref, takeOld, data);
						return {
							data: recursiveResult.data,
							lastPagination: recursiveResult.lastPagination,
						};
					} else {
						return {
							data,
							lastPagination: linkHref || "",
						};
					}
				} else {
					continue;
				}
			}
		}

		return {
			data,
			lastPagination: endpoint,
		};
	} catch (error) {
		throw new Error(`Error fetching page: ${error}`);
	}
}

async function fetch(
	endpoint: string = "",
	data: {
		text: string;
		dateUpload: string;
		href: string;
		isNew: boolean;
		pagination?: string;
	}[] = [],
): Promise<{ data: typeof data; nextPagination: string; isNew: boolean }> {
	try {
		let isPageNew: boolean = false;
		let trueNew = false;
		let nextPagination = "";
		const fetch = `EXAM_LIST${endpoint ? `${endpoint}` : ""}`;
		const $ = await collectData(fetch);
		const rows = $(".border_main").find("tr");

		for (let index = 0; index < rows.length; index++) {
			const element = rows[index];

			if (index < 2) continue;

			const links = $(element).find("a");
			const img = $(element).find("img");

			for (let linkIndex = 0; linkIndex < links.length; linkIndex++) {
				const linkElement = links[linkIndex];
				const linkText = $(linkElement).text().trim();
				const linkHref = $(linkElement).attr("href");

				if (index < rows.length - 1) {
					img.each((index, element) => {
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
						href: (linkHref && extractEndPoint(linkHref)) || "",
						pagination: fetch,
					});
				} else if (linkIndex === links.length - 1 && linkText === ">>") {
					nextPagination = extractEndPoint(linkHref || "");
					trueNew = isPageNew;
				} else {
					continue;
				}
			}
		}

		return {
			data,
			isNew: trueNew,
			nextPagination: nextPagination,
		};
	} catch (error) {
		throw new Error(`Error fetching page: ${error}`);
	}
}

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	try {
		let endpoint = "";

		if (query.next_pagination) {
			endpoint = extractEndPoint(query.next_pagination as string);
		}
		// const data = await fetchLinks(endpoint, takeOld);
		const data = await fetch(endpoint);

		return {
			success: true,
			response: {
				data: data.data,
				is_new: data.isNew,
				next_pagination: data.nextPagination || "",
			},
			message: "Data has been processed successfully.",
		};
	} catch (error) {
		return {
			success: false,
			response: null,
			message: `Error: ${error}`,
		};
	}
});
