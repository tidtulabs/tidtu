import { fetchFirstExamRow } from "services/pdaotao";
import { describe, expect, it, vi } from "vitest";

describe("Trích xuất dữ liệu từ phòng đào tạo DTU", () => {
	it("Khi thành công", async () => {
		const result = await fetchFirstExamRow();
		expect(result).toBeDefined();
	});


});
