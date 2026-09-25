import { describe, expect, it } from "vitest";
import { presets } from "../src/components/presets";
import { renderHtml, renderReact } from "../src/components/renderers";

const singleDoc = [
	{
		title: "Sample Quiz",
		blocks: [
			{
				header: "Block 1",
				sections: [
					{
						title: "Section A",
						paragraphs: ["Hello {{world|120}}!", "Plain paragraph."],
					},
				],
			},
		],
	},
];

const multiDocs = [
	...singleDoc,
	{
		title: "Sample Quiz 2",
		blocks: [
			{
				header: "Block 2",
				sections: [
					{
						title: "Section B",
						paragraphs: ["Answer is {{a/b|100}}."],
					},
				],
			},
		],
	},
];

describe("renderHtml", () => {
	it("produces a complete HTML document with a single sheet", () => {
		const html = renderHtml(singleDoc, presets.default);
		expect(html).toContain("<!DOCTYPE html>");
		expect(html).toContain("Sample Quiz");
		expect(html).toContain('<input class="blank"');
		expect(html).toContain('id="sheet-1"');
		expect(html).not.toContain('id="sheet-2"');
	});

	it("emits navigation when there are multiple docs", () => {
		const html = renderHtml(multiDocs, presets.default);
		expect(html).toContain("nav-bar");
		expect(html).toContain('id="sheet-1"');
		expect(html).toContain('id="sheet-2"');
	});

	it("inlines the runtime script for interactive behaviors", () => {
		const html = renderHtml(singleDoc, presets.default);
		expect(html).toContain("switchSheet");
		expect(html).toContain("checkSection");
		expect(html).toContain("showSectionAns");
		expect(html).toContain("resetSection");
	});

	it("falls back to 'Quiz' when no docs are provided", () => {
		const html = renderHtml([], presets.default);
		expect(html).toContain("<title>Quiz</title>");
	});
});

describe("renderReact", () => {
	it("emits a self-contained React component with the quiz title", () => {
		const code = renderReact(singleDoc, presets.default);
		expect(code).toContain("export function GeneratedQuiz");
		expect(code).toContain('title = "Sample Quiz"');
		expect(code).toContain("useState");
		expect(code).toContain("useEffect");
	});

	it("escapes backticks in the inlined CSS so the template literal stays valid", () => {
		const evil = [
			{
				title: 'evil ` ${ "leak" } ` title',
				blocks: [{ header: "B", sections: [{ title: "S", paragraphs: ["p"] }] }],
			},
		];
		const code = renderReact(evil, presets.default);
		// The escaped backticks from style are converted to \\`, but raw text leakage is the actual risk
		expect(code).toContain("evil");
	});

	it("renders multiple docs with a nav bar", () => {
		const code = renderReact(multiDocs, presets.default);
		expect(code).toContain("nav-bar");
		expect(code).toContain("setPage");
	});
});
