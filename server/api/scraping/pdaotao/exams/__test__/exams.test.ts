import { describe, it, expect } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils";

describe("/api/scraping/pdaotao/exams", async () => {
	await setup({
		server: true,
	});

	it("should fetch exam data successfully", async () => {
		const res = await $fetch("/api/scraping/pdaotao/exams");

		const examData = res.response?.data || [];

		expect(res.success).toBe(true);
		expect(examData).toBeInstanceOf(Array);

		expect(examData[0]).toHaveProperty("href");
		expect(examData[0]).toHaveProperty("dateUpload");
	});
});
