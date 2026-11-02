import { afterEach, describe, expect, it, vi } from "vitest";
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

	it("returns false when the clipboard rejects and no fallback is available", async () => {
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

describe("copyText fallback", () => {
	const documentWithExecCommand = document as unknown as {
		execCommand?: (command: string) => boolean;
	};

	afterEach(() => {
		documentWithExecCommand.execCommand = undefined;
		Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
	});

	it("falls back to execCommand when the async clipboard API is unavailable", async () => {
		Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
		const execCommand = vi.fn(() => true);
		Object.defineProperty(document, "execCommand", {
			configurable: true,
			writable: true,
			value: execCommand,
		});

		const ok = await copyText("hello world");

		expect(ok).toBe(true);
		expect(execCommand).toHaveBeenCalledWith("copy");
		expect(document.querySelectorAll("textarea")).toHaveLength(0);
	});

	it("returns false when the fallback throws", async () => {
		Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
		Object.defineProperty(document, "execCommand", {
			configurable: true,
			writable: true,
			value: vi.fn(() => {
				throw new Error("blocked");
			}),
		});

		const ok = await copyText("hello world");

		expect(ok).toBe(false);
		expect(document.querySelectorAll("textarea")).toHaveLength(0);
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
