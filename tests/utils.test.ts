import { describe, expect, it } from "vitest";
import { sanitizeFilename } from "../src/components/utils";

describe("sanitizeFilename", () => {
	it("removes reserved characters", () => {
		expect(sanitizeFilename('a<b>c:"d/e\\f|g?h*i')).toBe("abcdefghi");
	});

	it("replaces whitespace with hyphens", () => {
		expect(sanitizeFilename("hello world  foo")).toBe("hello-world-foo");
	});

	it("strips non-word characters except hyphens", () => {
		expect(sanitizeFilename("テスト!?title")).toBe("title");
		expect(sanitizeFilename("hello!world?")).toBe("helloworld");
	});

	it("truncates to 50 characters", () => {
		const long = "a".repeat(200);
		expect(sanitizeFilename(long).length).toBe(50);
	});

	it("returns an empty string when input has no safe characters", () => {
		expect(sanitizeFilename("???")).toBe("");
	});
});
