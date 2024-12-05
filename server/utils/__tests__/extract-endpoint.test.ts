// sum.test.js
import { expect, test } from "vitest";
import { extractEndpoint } from "../extract-endpoint";

test("extract ../", () => {
	expect(extractEndpoint("../EXAM_LIST_Detail/?ID=60033&lang=VN")).toBe(
		"EXAM_LIST_Detail/?ID=60033&lang=VN",
	);
});

test("extract ./", () => {
	expect(extractEndpoint("./EXAM_LIST_Detail/?ID=60033&lang=VN")).toBe(
		"EXAM_LIST_Detail/?ID=60033&lang=VN",
	);
});

test("extract /", () => {
	expect(extractEndpoint("/EXAM_LIST_Detail/?ID=60033&lang=VN")).toBe(
		"EXAM_LIST_Detail/?ID=60033&lang=VN",
	);
});

test("extract not", () => {
	expect(extractEndpoint("EXAM_LIST_Detail/?ID=60033&lang=VN")).toBe(
		"EXAM_LIST_Detail/?ID=60033&lang=VN",
	);
});
