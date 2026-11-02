import { act, createElement } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PreviewView } from "../src/components/PreviewView";
import type { Doc } from "../src/components/types";

let container: HTMLDivElement;
let root: Root;

const sampleDocs: Doc[] = [
	{
		title: "Sheet One",
		blocks: [
			{
				header: "Main Header",
				sections: [
					{
						title: "Section A",
						paragraphs: ["This contains {{placeholder|100}}.", "Plain paragraph."],
					},
				],
			},
		],
	},
];

beforeEach(() => {
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
});

describe("PreviewView", () => {
	it("renders the active sheet with section content", () => {
		const containerRef = { current: null } as unknown as React.RefObject<HTMLDivElement | null>;
		act(() => {
			root.render(
				createElement(PreviewView, {
					docs: sampleDocs,
					currentStyle: ".sheet{padding:1px}",
					activePage: 0,
					setActivePage: () => {},
					containerRef,
				}),
			);
		});
		expect(container.querySelector("h2.sheet-title")?.textContent).toBe("Sheet One");
		expect(container.querySelector("h3.main-header")?.textContent).toBe("Main Header");
		expect(container.querySelector("h4")?.textContent).toBe("Section A");
		expect(container.querySelector(".quiz-section")).not.toBeNull();
	});

	it("renders nav bar buttons when more than one doc is provided", () => {
		const containerRef = { current: null } as unknown as React.RefObject<HTMLDivElement | null>;
		const docs: Doc[] = [...sampleDocs, { ...sampleDocs[0], title: "Sheet Two" }];
		act(() => {
			root.render(
				createElement(PreviewView, {
					docs,
					currentStyle: "",
					activePage: 0,
					setActivePage: () => {},
					containerRef,
				}),
			);
		});
		const navButtons = container.querySelectorAll(".nav-btn");
		expect(navButtons.length).toBe(2);
		expect(navButtons[0].textContent).toBe("第1回");
		expect(navButtons[1].textContent).toBe("第2回");
	});

	it("invokes setActivePage when a nav button is clicked", () => {
		const containerRef = { current: null } as unknown as React.RefObject<HTMLDivElement | null>;
		const docs: Doc[] = [...sampleDocs, { ...sampleDocs[0], title: "Sheet Two" }];
		let targetIndex = -1;
		act(() => {
			root.render(
				createElement(PreviewView, {
					docs,
					currentStyle: "",
					activePage: 0,
					setActivePage: (i: number) => {
						targetIndex = i;
					},
					containerRef,
				}),
			);
		});
		const secondNav = container.querySelectorAll(".nav-btn")[1] as HTMLButtonElement;
		act(() => {
			secondNav.click();
		});
		expect(targetIndex).toBe(1);
	});

	it("renders three section control buttons per quiz section", () => {
		const containerRef = { current: null } as unknown as React.RefObject<HTMLDivElement | null>;
		act(() => {
			root.render(
				createElement(PreviewView, {
					docs: sampleDocs,
					currentStyle: "",
					activePage: 0,
					setActivePage: () => {},
					containerRef,
				}),
			);
		});
		const controls = container.querySelectorAll(".section-controls .btn-mini");
		expect(controls.length).toBe(3);
	});
});
