import { scrapingData } from "../cheerio";
import { describe, expect, it, vi } from "vitest";

global.fetch = vi.fn();

describe("scrapingData", () => {
	it("Xử lý lỗi timeout đúng cách", async () => {
		const mockTimeoutError = new DOMException(
			"The operation was aborted.",
			"AbortError",
		);
		(vi.mocked(fetch) as any).mockRejectedValue(mockTimeoutError);

		const result = await scrapingData("EXAM_LIST");
		expect(result.success).toBe(false);
    expect(result.errorType).toBe("TIMEOUT");
	});

	it("Xử lý lỗi server đúng cách", async () => {
		const mockResponse = new Response(null, { status: 500 });
		(vi.mocked(fetch) as any).mockResolvedValue(mockResponse);

		const result = await scrapingData("EXAM_LIST");
		expect(result.success).toBe(false);
    expect(result.errorType).toBe("SERVER_ERROR");	
	});
});
