interface IReponse {
	data: any[];
	isNew: boolean;
	nextPagination: string;
	currentPagination: string;
}

function parseTitleAndTime(input: string) {
	const parts = input
		.split("\n")
		.map((part) => part.trim())
		.filter((part) => part);

	if (!parts[0] || !parts[1]) {
		return { title: null, time: null };
	}

	return {
		title: parts[0],
		time: parts[1].replace(/[()]/g, ""),
	};
}

const getFirstRow = async () => {
	const scraping = await scrapingData("EXAM_LIST");

	if (!scraping.success || !scraping.data) {
		throw new Error(scraping.message);
	}

	const $ = scraping.data;
	const firstCell = $(".border_main")
		.find("table")
		.find("tr")
		.first()
		.find("td")
		.eq(2)
		.text();

	return parseTitleAndTime(firstCell);
};

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	try {
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

		const data = await getFirstRow();

		let currentData: IReponse = (await useStorage("cached").getItem(
			"examList:frequency",
		)) || {
			data: [],
			isNew: false,
			nextPagination: "",
			currentPagination: "",
		};

		const isNotNew =
			data.title === currentData.data[0]?.text &&
			data.time === currentData.data[0]?.dateUpload;

		if (isNotNew) {
			setResponseStatus(event, 200);
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
		} else {
			const isUpdated = await useStorage("cached").getItem("isUpdated");
			if (!isUpdated) {
				const URL = `${useRuntimeConfig().server.cache}/api/v1/pdaotao/scraping/cache`;

				$fetch(URL, {
					method: "PUT",
				})
					.then((response) => {
						//console.log("Success:", response);
					})
					.catch((error) => {
						//console.error("Error occurred:", error);
					});
			}
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
	} catch (error: any) {
		if (error.message.includes("Time out")) {
			setResponseStatus(event, 504);
		} else {
			setResponseStatus(event, 500);
		}
		return {
			success: false,
			response: null,
			message: `${error.message}`,
		};
	}
});
