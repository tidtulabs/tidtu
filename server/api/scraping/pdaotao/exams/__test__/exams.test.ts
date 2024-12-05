import { describe, it, expect } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils";
import { fileURLToPath } from "node:url";

describe("API Exams", async () => {
	await setup({
		rootDir: fileURLToPath(new URL("..", import.meta.url)),
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
