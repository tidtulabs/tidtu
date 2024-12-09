/*
 * TODO: Cấu tạo thường thấy của một unit test
 * TODO: 1. Arrange (Chuẩn bị): Khởi tạo dữ liệu giả lập, mô phỏng hành vi của các hàm
 * TODO: 2. Act (Hành động): Gọi hàm cần kiểm tra
 * TODO: 3. Assert (Kiểm tra kết quả): So sánh kết quả trả về với kết quả mong đợi
 * TODO: 4. Teardown: Dọn dẹp dữ liệu, giải phóng bộ nhớ (thường dùng Integration Testing)
 */
import { describe, it, expect, vi } from "vitest";
import axios from "axios";
import scrapingData from "../scraping-data";

// Mock axios.get
vi.mock("axios");

//  COMMENT: MOCK axios.get để không gọi thực tế đến endpoint(BackEnd)

describe("Trích xuất dữ liệu từ phòng đào tạo DTU", () => {
	it("Khi thành công", async () => {
		// NOTE: Arrange (Chuẩn bị)
		const mockData = "<html><body><div>Test</div></body></html>"; // Dữ liệu giả lập (Mock)
		const mockResponse = {
			data: mockData, // Dữ liệu giả lập
			status: 200, // Status code giả lập là 200
		};
		vi.mocked(axios.get).mockResolvedValue(mockResponse); // Mô phỏng axios.get để trả về response giả lập
		// NOTE: Act (Hành động)
		const result = await scrapingData("test-endpoint");

		// NOTE: Assert (Kiểm tra kết quả)
		expect(result.success).toBe(true);
		expect(result.data).toBeDefined();
	});

	it("xử lí khi code không phải là 200 (500)", async () => {
		// NOTE: Arrange (Chuẩn bị)
		const mockResponse = {
			status: 500, // Status code giả lập là 500
			data: "", // Dữ liệu giả lập
		};
		// NOTE: Act (Hành động)
		vi.mocked(axios.get).mockResolvedValue(mockResponse); // Mô phỏng axios.get để trả về response với status 500
		const result = await scrapingData("test-endpoint");
		// NOTE: Assert (Kiểm tra kết quả)
		expect(result.data).toBeUndefined();
		expect(result.success).toBe(false);
		expect(result.message).toBeDefined();
		// expect(result.message).toContain("Status code: 500");
	});

	it("Khi lỗi quá thời gian phải hồi (server Duy Tân quá tải hoặc bị sập)", async () => {
		// Mô phỏng axios.get để ném ra lỗi timeout
		vi.mocked(axios.get).mockRejectedValue({
			code: "ECONNABORTED", // Lỗi timeout 504 / 408
		});
		const result = await scrapingData("test-endpoint");
		expect(result.success).toBe(false);
		expect(result.message).toBeDefined();
	});

	it("Xử lí khi hàm lỗi ném lỗi (Throw error)", async () => {
		vi.mocked(axios.get).mockRejectedValue(new Error("Unexpected error")); // Mô phỏng axios.get để ném ra lỗi khác
		const result = await scrapingData("test-endpoint");
		expect(result.success).toBe(false);
		expect(result.message).toContain("An unexpected error occurred");
	});

	it("Xử lí khi không có dữ liệu", async () => {
		const mockResponse = {
			data: "", // Dữ liệu giả lập không có dữ liệu
			message: "No data", // Không có dữ liệu
		};
		// Mô phỏng axios.get trả về không có data
		vi.mocked(axios.get).mockResolvedValue(mockResponse);
		const result = await scrapingData("test-endpoint");
		expect(result.success).toBe(false);
		expect(result.message).toBeDefined();
	});
});
