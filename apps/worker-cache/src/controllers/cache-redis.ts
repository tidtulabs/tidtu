import { Request, Response } from "express";
import { KV } from "@config/cloudflare";
import { ExamItem, getExamList } from "@services/cache-redis";
import { logger } from "@utils/winston";

const Task = async (
	endpoint: string | null,
	data: ExamItem[] = [],
	remainingPages: number = 0,
	includeAll: boolean = false,
) => {
	let nextPagination = "";
	let currentPagination = "";
	let isNew = false;

	const fe = endpoint ? `EXAM_LIST${endpoint}` : "EXAM_LIST";

	const scraping = await getExamList(fe);

	const end = scraping.data[scraping.data.length - 1];
	Array.prototype.push.apply(data, scraping.data);

	if (scraping.nextPagination) {
		if (end.isNew || includeAll)
			return Task(scraping.nextPagination, data, remainingPages, includeAll);
		else {
			if (remainingPages > 0) {
				remainingPages--;
				return Task(scraping.nextPagination, data, remainingPages);
			}
		}
	}

	if (scraping) {
		isNew = end.isNew || false;
		nextPagination = scraping.nextPagination || "";
		currentPagination = endpoint || "";
	}

	return {
		data: data,
		meta: {
			nextPagination: nextPagination,
			currentPagination: currentPagination,
			dateCreated: new Date().toISOString(),
		},
	};
};

export const cachedRedis = async (_: Request, res: Response) => {
	try {
		await KV.put("isUpdated", "true", { expirationTtl: 120 });
		const task1 = await Task("", [], 7);
		const task2 = await Task(task1.meta.nextPagination, [], 0, true);
		await KV.put("examList:frequency", JSON.stringify(task1));
		await KV.put("examList:total", JSON.stringify(task2));
		await KV.delete("isUpdated");

		logger.info("create cache KV successfull");

		res.status(201).json({
			success: true,
			message: "create cache redis successfull",
			data: null,
		});
	} catch (error: any) {
		logger.error(error.message);
		res.status(500).json({
			success: false,
			message: "something went wrong",
			data: null,
		});
	}
};
