import { describe, expect, it } from "vitest";
import { presets } from "../src/components/presets";
import { generateStyle } from "../src/components/style-generator";

describe("generateStyle", () => {
	it("produces a non-empty CSS string", () => {
		const css = generateStyle(presets.default);
		expect(css.length).toBeGreaterThan(100);
	});

	it("includes all declared color custom properties", () => {
		const css = generateStyle(presets.default);
		expect(css).toContain("--bg-color");
		expect(css).toContain("--text-color");
		expect(css).toContain("--accent-color");
		expect(css).toContain("--correct-color");
		expect(css).toContain("--incorrect-color");
		expect(css).toContain("--block-bg");
	});

	it("reflects custom color overrides", () => {
		const custom = {
			...presets.default,
			colors: { ...presets.default.colors, bgColor: "#123456" },
		};
		const css = generateStyle(custom);
		expect(css).toContain("--bg-color:#123456");
	});

	it("reflects custom border-style settings", () => {
		const custom = {
			...presets.default,
			blank: {
				...presets.default.blank,
				borderStyle: "dashed" as const,
				borderWidth: 3,
			},
		};
		const css = generateStyle(custom);
		expect(css).toContain("3px dashed");
	});

	it("emits different output for each preset", () => {
		const outputs = Object.entries(presets).map(([name, settings]) => [
			name,
			generateStyle(settings),
		]);
		const distinct = new Set(outputs.map(([, css]) => css));
		expect(distinct.size).toBe(outputs.length);
	});
});
