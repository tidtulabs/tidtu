async function getExamListamList(
	endpoint: string = "",
	data: {
		text: string;
		dateUpload: string;
		href: string;
		isNew: boolean;
		pagination?: string;
		row?: number;
	}[] = [],
): Promise<{ data: typeof data; nextPagination: string; isNew: boolean }> {
	try {
		let isPageNew: boolean = false;
		let trueNew = false;
		let nextPagination = "";
		const fetch = `EXAM_LIST${endpoint ? `${endpoint}` : ""}`;
		const scraping = await scrapingData(fetch);

		if (scraping.data) {
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
		const data = await getExamListamList(endpoint);

		setResponseStatus(event, 200);
		return {
			success: true,
			response: {
				data: data.data,
				is_new: data.isNew,
				next_pagination: data.nextPagination || "",
			},
			message: "Data has been processed successfully.",
		};
	} catch (error: any) {
		if (error.message.includes("Timeout")) {
			setResponseStatus(event, 502);
		} else {
			setResponseStatus(event, 500);
		}
		return {
			success: false,
			data: null,
			message: `${error.message}`,
		};
	}
});
