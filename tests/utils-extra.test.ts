import { describe, expect, it, vi } from "vitest";
import { copyText, downloadFile } from "../src/components/utils";

describe("copyText", () => {
	it("writes to the clipboard and returns true", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});
		const ok = await copyText("hello world");
		expect(ok).toBe(true);
		expect(writeText).toHaveBeenCalledWith("hello world");
		Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
	});

	it("returns false when the clipboard rejects", async () => {
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: {
				writeText: vi.fn().mockRejectedValue(new Error("blocked")),
			},
		});
		const ok = await copyText("nope");
		expect(ok).toBe(false);
		Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
	});
});

describe("downloadFile", () => {
	it("creates a blob URL and clicks a temporary anchor", () => {
		const revoke = vi.fn();
		const createObjectURL = vi.fn(() => "blob:abc");
		const originalCreate = URL.createObjectURL;
		const originalRevoke = URL.revokeObjectURL;
		const originalAppend = document.body.appendChild.bind(document.body);
		let clickCount = 0;

		Object.assign(URL, { createObjectURL, revokeObjectURL: revoke });

		const appendSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
			if (node instanceof HTMLAnchorElement) {
				node.click = () => {
					clickCount += 1;
				};
			}
			return originalAppend(node as Node);
		});

		downloadFile("payload", "file.txt");

		expect(createObjectURL).toHaveBeenCalled();
		expect(revoke).toHaveBeenCalled();
		expect(clickCount).toBe(1);

		URL.createObjectURL = originalCreate;
		URL.revokeObjectURL = originalRevoke;
		appendSpy.mockRestore();
	});
});
