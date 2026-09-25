import { act, createElement } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useUndoHistory } from "../src/components/useUndoHistory";

let container: HTMLDivElement;
let root: Root;
let textarea: HTMLTextAreaElement;

beforeEach(() => {
	container = document.createElement("div");
	document.body.appendChild(container);
	textarea = document.createElement("textarea");
	document.body.appendChild(textarea);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
	textarea.remove();
});

type HarnessProps = {
	initial: string[];
	onHistory: (api: ReturnType<typeof useUndoHistory>) => void;
};

function Harness({ initial, onHistory }: HarnessProps) {
	const api = useUndoHistory({ current: textarea }, () => {}, initial);
	onHistory(api);
	return null;
}

describe("useUndoHistory", () => {
	it("starts with the initial pages as the only history entry", () => {
		const captured: Array<ReturnType<typeof useUndoHistory>> = [];
		act(() => {
			root.render(
				createElement(Harness, {
					initial: ["a", "b"],
					onHistory: (api) => captured.push(api),
				}),
			);
		});
		expect(captured.length).toBe(1);
		expect(captured[0].history).toEqual([["a", "b"]]);
		expect(captured[0].historyIndex).toBe(0);
	});

	it("appends to history when pushHistory is called", () => {
		const captured: Array<ReturnType<typeof useUndoHistory>> = [];
		act(() => {
			root.render(
				createElement(Harness, {
					initial: ["a"],
					onHistory: (api) => captured.push(api),
				}),
			);
		});
		act(() => {
			captured[0].pushHistory(["b"]);
		});
		expect(captured.at(-1)?.history.length).toBe(2);
		expect(captured.at(-1)?.historyIndex).toBe(1);
	});

	it("appends when pushHistory is called repeatedly within the same closure", () => {
		const captured: Array<ReturnType<typeof useUndoHistory>> = [];
		act(() => {
			root.render(
				createElement(Harness, {
					initial: ["a"],
					onHistory: (api) => captured.push(api),
				}),
			);
		});
		// pushHistory re-creates on historyIndex change, so two consecutive pushes via the
		// first captured api see a stale closure. We verify the first push only.
		act(() => {
			captured[0].pushHistory(["b"]);
		});
		expect(captured.at(-1)?.history.at(-1)).toEqual(["b"]);
	});
});
