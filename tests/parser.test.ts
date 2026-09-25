import { describe, expect, it } from "vitest";
import { autoWidth, paragraphToHtml, parseDoc } from "../src/components/parser";

describe("parseDoc", () => {
	it("extracts the top-level title from a single '#' line", () => {
		const doc = parseDoc("# Hello World\nbody line");
		expect(doc.title).toBe("Hello World");
	});

	it("builds blocks from '##' headings", () => {
		const doc = parseDoc("## Block A\nbody a\n\n## Block B\nbody b");
		expect(doc.blocks.map((b) => b.header)).toEqual(["Block A", "Block B"]);
	});

	it("collects sections under '###' headings within a block", () => {
		const doc = parseDoc("## B\n### S1\np1\np2\n### S2\np3");
		expect(doc.blocks[0].sections.map((s) => s.title)).toEqual(["S1", "S2"]);
		expect(doc.blocks[0].sections[0].paragraphs).toEqual(["p1 p2"]);
		expect(doc.blocks[0].sections[1].paragraphs).toEqual(["p3"]);
	});

	it("joins consecutive non-empty lines into a single paragraph", () => {
		const doc = parseDoc("## B\n### S\nline1\nline2\nline3");
		expect(doc.blocks[0].sections[0].paragraphs).toEqual(["line1 line2 line3"]);
	});

	it("uses 'Quiz' as default title when no '#' line is present", () => {
		const doc = parseDoc("## Only a header\nbody");
		expect(doc.title).toBe("Quiz");
	});

	it("handles CRLF line endings", () => {
		const doc = parseDoc("## B\r\n### S\r\np1\r\np2");
		expect(doc.blocks[0].sections[0].paragraphs).toEqual(["p1 p2"]);
	});

	it("creates a synthetic block when '###' appears before any '##'", () => {
		const doc = parseDoc("### S\nbody");
		expect(doc.blocks).toHaveLength(1);
		expect(doc.blocks[0].header).toBe("");
		expect(doc.blocks[0].sections[0].title).toBe("S");
	});
});

describe("autoWidth", () => {
	it("returns the minimum width for very short answers", () => {
		expect(autoWidth("")).toBe(60);
		expect(autoWidth("a")).toBeGreaterThanOrEqual(60);
	});

	it("caps the width at 400 for long answers", () => {
		expect(autoWidth("x".repeat(1000))).toBe(400);
	});

	it("scales roughly with answer length", () => {
		const small = autoWidth("ab");
		const large = autoWidth("a".repeat(30));
		expect(large).toBeGreaterThan(small);
	});
});

describe("paragraphToHtml", () => {
	it("replaces a single placeholder with an input element", () => {
		const out = paragraphToHtml("Hello {{world}}!");
		expect(out).toContain('<input class="blank"');
		expect(out).toContain('data-ans="world"');
		expect(out).not.toContain("{{world}}");
	});

	it("supports multiple answers separated by '/'", () => {
		const out = paragraphToHtml("{{a/b/c}}");
		expect(out).toContain('data-ans="a|b|c"');
	});

	it("uses explicit width when provided", () => {
		const out = paragraphToHtml("{{x|120}}");
		expect(out).toContain('data-base-width="120"');
		expect(out).toContain("width:120px");
	});

	it("falls back to autoWidth when no width is given", () => {
		const out = paragraphToHtml("{{hello}}");
		expect(out).toMatch(/data-base-width="\d+"/);
	});

	it("leaves plain text untouched", () => {
		expect(paragraphToHtml("no blanks here")).toBe("no blanks here");
	});

	it("does not match malformed placeholders without a closing brace", () => {
		const out = paragraphToHtml("{{broken");
		expect(out).toBe("{{broken");
	});
});
