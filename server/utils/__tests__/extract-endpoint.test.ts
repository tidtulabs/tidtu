import { expect, test } from "vitest";
import { extractEndpoint } from "../extract-endpoint";

test("../", () => {
	expect(extractEndpoint("../EXAM_LIST_Detail/?ID=60033&lang=VN")).toBe(
		"EXAM_LIST_Detail/?ID=60033&lang=VN",
	);
});

test("./", () => {
	expect(extractEndpoint("./EXAM_LIST_Detail/?ID=60033&lang=VN")).toBe(
		"EXAM_LIST_Detail/?ID=60033&lang=VN",
	);
});

test("/", () => {
	expect(extractEndpoint("/EXAM_LIST_Detail/?ID=60033&lang=VN")).toBe(
		"EXAM_LIST_Detail/?ID=60033&lang=VN",
	);
});

test("", () => {
	expect(extractEndpoint("EXAM_LIST_Detail/?ID=60033&lang=VN")).toBe(
		"EXAM_LIST_Detail/?ID=60033&lang=VN",
	);
});
