interface IReponse {
	data: any[];
	isNew: boolean;
	nextPagination: string;
	currentPagination: string;
}

interface IRes {
	status: string;
	data: any[];
	meta: {
		pagination: {
			next: string;
		};
		isCached: boolean;
		isNew: boolean;
	};
	message: string;
}

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

// NOTE: This function is used to run a background task

const cachePaginationData = async (currentData: IReponse) => {
	//console.log(currentData.nextPagination);
	const data = await getExamList(currentData.nextPagination);
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
	if (currentData.isNew) {
		//console.log("dequeue is running");
		//console.log("data length is less than 14*15");
		cachePaginationData(currentData);
	} else {
		await useStorage("cached").setItem("scraping", currentData);
		await useStorage("cached").removeItem("isUpdated");
		//setTimeout(() => {}, 10000);
		return currentData;
	}
};

//async function asyncCacheUpdater(obj: IReponse) {
//	setImmediate(async () => {
//		await cachePaginationData(obj);
//		await useStorage("cached").removeItem("isUpdated");
//	});
//}

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	try {
		let endpoint = "";
		const total = query.total || false;
		if (total) {
			const currentData: IReponse = (await useStorage("cached").getItem(
				"examList:total",
			)) || {
				data: [],
				isNew: false,
				nextPagination: "",
				currentPagination: "",
			};

			return {
				success: true,
				response: {
					data: currentData.data,
					is_new: currentData.isNew,
					next_pagination: currentData.nextPagination || "",
					current_pagination: currentData.currentPagination || "",
					is_cached: true,
				},
				message: "Data has been processed successfully. (isUpdated)",
			};
		}
		//await useStorage("cached").setItem("total", total);
		//console.log(total);
		//if (query.next_pagination) {
		//	endpoint = extractEndpoint(query.next_pagination as string);
		//}
		//console.log("endpoint",endpoint);
		const data = await getExamList(endpoint);
		setResponseStatus(event, 200);

		if (endpoint === "") {
			let currentData: IReponse = (await useStorage("cached").getItem(
				"examList:frequency",
			)) || {
				data: [],
				isNew: false,
				nextPagination: "",
				currentPagination: "",
			};

			const isNotNew =
				data.data[0]?.text === currentData.data[0]?.text &&
				data.data[0]?.dateUpload === currentData.data[0]?.dateUpload;
			//console.log(data.data[0].pagination);
			//console.log(currentData);
			if (isNotNew) {
				return {
					success: true,
					response: {
						data: currentData.data,
						is_new: currentData.isNew,
						next_pagination: currentData.nextPagination || "",
						current_pagination: currentData.currentPagination || "",
						is_cached: true,
					},
					message: "Data has been processed successfully. (Cached)",
				};
			} else if (
				!isNotNew &&
				data.data[0].pagination === "EXAM_LIST"
				//currentData.data.length > 0
			) {
				const isUpdated = await useStorage("cached").getItem("isUpdated");
				const newObj = {
					data: data.data,
					isNew: data.isNew,
					nextPagination: data.nextPagination,
					currentPagination: data.currentPagination,
				};

				if (!isUpdated) {
					//await useStorage("cached").setItem("isUpdated", true, {
					//	ttl: 60,
					//});

					const URL = `${useRuntimeConfig().server.cache}/api/v1/pdaotao/scraping/cache`;
					//console.log(URL);
					$fetch(URL, {
						method: "PUT",
					});
					//     console.log(t);
					//console.log("fetching");
					//const up = await cachePaginationData(newObj);
					//if (up) {
					//	return {
					//		success: true,
					//		response: {
					//			data: up.data,
					//			is_new: up.isNew,
					//			next_pagination: up.nextPagination || "",
					//			current_pagination: up.currentPagination || "",
					//			is_cached: false,
					//			is_updated: true,
					//		},
					//		message: "Data has been processed successfully. (Is updated)",
					//	};
					//}
				}
				return {
					success: true,
					response: {
						data: currentData.data,
						is_new: currentData.isNew,
						next_pagination: currentData.nextPagination || "",
						current_pagination: currentData.currentPagination || "",
						is_cached: true,
						is_updated: true,
					},
					message: "Data has been processed successfully. (Is updated)",
				};
			}
		}

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
