import { describe, it, expect, vi } from "vitest";
import axios from "axios";
import scrapingData from "../scraping-data";

// Mock axios.get
vi.mock("axios");

//  NOTE: MOCK axios.get để không gọi thực tế đến endpoint(BackEnd)

describe("scrapingData", () => {
	it("should return data when request is successful", async () => {
		const mockData = "<html><body><div>Test</div></body></html>"; // Dữ liệu giả lập
		const mockResponse = {
			data: mockData,
			status: 200,
		};

		// Mô phỏng axios.get để trả về response giả lập
		vi.mocked(axios.get).mockResolvedValue(mockResponse);

		const result = await scrapingData("test-endpoint");

		expect(result.success).toBe(true);
		expect(result.data).toBeDefined();
	});

	it("should handle non-200 status codes", async () => {
		const mockResponse = {
			data: "",
			status: 500, // Status code giả lập là 500
		};

		// Mô phỏng axios.get để trả về response với status 500
		vi.mocked(axios.get).mockResolvedValue(mockResponse);

		const result = await scrapingData("test-endpoint");

		expect(result.success).toBe(false);
		expect(result.message).toBeDefined();
		expect(result.message).toContain("Status code: 500");
	});

	it("should handle timeout error", async () => {
		// Mô phỏng axios.get để ném ra lỗi timeout
		vi.mocked(axios.get).mockRejectedValue({
			code: "ECONNABORTED",
			message: "Timeout error",
		});

		const result = await scrapingData("test-endpoint");

		expect(result.success).toBe(false);
		expect(result.message).toBe("Unexpected error: Timeout error");
	});

	it("should handle other errors", async () => {
		// Mô phỏng axios.get để ném ra lỗi khác
		vi.mocked(axios.get).mockRejectedValue(new Error("Unexpected error"));

		const result = await scrapingData("test-endpoint");

		expect(result.success).toBe(false);
		expect(result.message).toContain("Unexpected error: ");
	});
});

//  BUG: Đây là ví dụ lỗi khi

// describe("scrapingData ví dụ lỗi dữ liệu", () => {
// 	it("Timeout nhưng trả true", async () => {
// 		vi.mocked(axios.get).mockRejectedValue({
// 			code: "ECONNABORTED",
// 			message: "Timeout error",
// 		});
//
// 		const result = await scrapingData("test-endpoint");
//
// 		expect(result.success).toBe(true);
// 		expect(result.message).toBe("Unexpected error: Timeout error");
// 	});
//
// 	it("should handle other errors", async () => {
// 		vi.mocked(axios.get).mockRejectedValue(new Error("Unexpected error"));
//
// 		const result = await scrapingData("test-endpoint");
//
// 		expect(result.success).toBe(false);
// 		expect(result.message).toBe("Unexpected error: Unexpected error");
// 	});
// });
