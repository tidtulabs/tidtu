import { Context } from "hono";
import { scrapingData } from "lib/cheerio";
import { checkFileExtension, checkFileType } from "utils/check-file";
// import { logger } from "lib/winston";
import { extractEndpoint } from "utils/extract-endpoint";

function parseExamTitleAndTime(input: string) {
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

export const fetchFirstExamRow = async () => {
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
	// const f = $(".border_main")
	// .find("table")
	// .find("tr")
	// .first()
	// .find("td").find("img").last().attr("src")?.includes("news.gif")
	// console.log("f", f);

	return parseExamTitleAndTime(firstCell);
};

type ExamItem = {
	examTitle: string; // Tiêu đề bài thi
	examDetailsUrl: string; // Ngày tải lên
	uploadDate: string; // Ngày tải lên
	isNew: boolean; // Cờ đánh dấu bài thi có mới hay không
	pagination: number; //  phân trang hiện tại
	row: number; // Số thứ tự dòng bài thi trong bảng
};

type ExamListResult = {
	data: ExamItem[];
	meta: {
		currentPagination: string;
		nextPagination: string;
	};
};

export const fetchExamList = async (c: Context) => {
	try {
		const isTotalRequested = c.req.query("total") || false;
		if (isTotalRequested) {
			const cachedExamList = await c.env.CACHE_TIDTU.get("examList:total");
			const cachedData: ExamListResult = cachedExamList
				? JSON.parse(cachedExamList)
				: null;
			return {
				data: cachedData?.data || [],
				meta: cachedData?.meta,
			};
		}
		const examData = await fetchFirstExamRow();
		const cachedExamList = await c.env.CACHE_TIDTU.get("examList:frequency");

		const cachedData: ExamListResult = cachedExamList
			? JSON.parse(cachedExamList)
			: null;

		if (
			examData.title === cachedData?.data[0]?.examTitle &&
			examData.time === cachedData?.data[0]?.uploadDate
		) {
			return {
				data: cachedData?.data || [],
				meta: cachedData?.meta,
			};
		} else {
			const isUpdated = await c.env.CACHE_TIDTU.get("isUpdated");
			if (!isUpdated) {
				// 	const URL = `${c.env.CACHE_SERVICE_API}/api/v1/pdaotao/scraping/cache`;
				// 	console.log("URL", URL);
				// 	fetch(URL, {
				// 		method: "PUT",
				// 	})
				// 		.then((response) => {
				// 			// console.log("Success:", response);
				// 		})
				// 		.catch((error) => {
				// 			// console.error("Error occurred:", error);
				// 		});
				return {
					data: cachedData?.data || [],
					meta: {
						...cachedData?.meta,
						shouldUpdate: true,
					},
				};
			}
		}
		return {
			data: cachedData?.data || [],
			meta: cachedData?.meta,
		};
	} catch (error: any) {
		// logger.error(error.message);
		// console.log("error", error);
		return null;
	}
};

const getLinkDownLoad = async (endPoint: string) => {
	const scraping = await scrapingData(endPoint);
	if (scraping.success === false) {
		throw new Error(scraping.message);
	}

	if (scraping.data) {
		const $ = scraping.data;
		let urlFile = null;
		const rows = $(".border_main").find("table").find("tr").first().find("td");

		urlFile = $(rows).find("tr").find("a").eq(1).attr("href");

		if (!urlFile) {
			throw new Error("File url not found in the page.");
		}
		return extractEndpoint(urlFile);
	}
};

export const resolveExamDownloadLink = async (c: Context) => {
	const examId = c.req.param("examId");
	const cacheKey = `downloadFile:${examId}`;
	const cachedUrl = await c.env.CACHE_TIDTU.get(cacheKey);

	if (cachedUrl) {
		return cachedUrl;
	}

	const url = await getLinkDownLoad(`EXAM_LIST_Detail/?ID=${examId}&lang=VN`);

	if (url) {
		if (checkFileExtension(url)) {
			await c.env.CACHE_TIDTU.put(cacheKey, url, {
				expirationTtl: 60 * 60 * 24 * 2,
			});
			return url;
		} else {
			if (await checkFileType(url)) {
				await c.env.CACHE_TIDTU.put(cacheKey, url, {
					expirationTtl: 60 * 60 * 24 * 2,
				});
				return url;
			}
		}
	}
	return null;
};
