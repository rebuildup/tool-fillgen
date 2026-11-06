import { act, createElement } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BorderStyleSelect, ColorField, RangeField } from "../src/components/StyleFields";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
});

function setReactInputValue(input: HTMLInputElement, value: string) {
	const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
	setter?.call(input, value);
	input.dispatchEvent(new Event("input", { bubbles: true }));
}

function setReactSelectValue(select: HTMLSelectElement, value: string) {
	const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
	setter?.call(select, value);
	select.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("ColorField", () => {
	it("renders label and reflects current value", () => {
		act(() => {
			root.render(
				createElement(ColorField, {
					label: "背景色",
					ariaLabel: "background-color",
					value: "#ff0000",
					onChange: () => {},
				}),
			);
		});
		const label = container.querySelector("label");
		const input = container.querySelector("input[type=color]") as HTMLInputElement | null;
		expect(label?.textContent).toBe("背景色");
		expect(input?.value).toBe("#ff0000");
		expect(label?.getAttribute("for")).toBe(input?.id);
	});

	it("invokes onChange when the color input changes", () => {
		let observed = "";
		act(() => {
			root.render(
				createElement(ColorField, {
					label: "背景色",
					ariaLabel: "background-color",
					value: "#000000",
					onChange: (v: string) => {
						observed = v;
					},
				}),
			);
		});
		const input = container.querySelector("input[type=color]") as HTMLInputElement;
		act(() => {
			setReactInputValue(input, "#abcdef");
		});
		expect(observed.toLowerCase()).toBe("#abcdef");
	});
});

describe("RangeField", () => {
	it("renders label with current value and aria attributes", () => {
		act(() => {
			root.render(
				createElement(RangeField, {
					label: "基本サイズ",
					ariaLabel: "base-size",
					value: 16,
					min: 12,
					max: 24,
					step: 1,
					onChange: () => {},
				}),
			);
		});
		const label = container.querySelector("label");
		const input = container.querySelector("input[type=range]") as HTMLInputElement;
		expect(label?.textContent).toContain("基本サイズ");
		expect(label?.textContent).toContain("16px");
		expect(input.value).toBe("16");
		expect(input.min).toBe("12");
		expect(input.max).toBe("24");
	});

	it("emits numeric onChange when the range input changes", () => {
		let observed = -1;
		act(() => {
			root.render(
				createElement(RangeField, {
					label: "基本サイズ",
					ariaLabel: "base-size",
					value: 16,
					min: 12,
					max: 24,
					step: 1,
					onChange: (v: number) => {
						observed = v;
					},
				}),
			);
		});
		const input = container.querySelector("input[type=range]") as HTMLInputElement;
		act(() => {
			setReactInputValue(input, "20");
		});
		expect(observed).toBe(20);
	});
});

describe("BorderStyleSelect", () => {
	it("renders every border option", () => {
		act(() => {
			root.render(
				createElement(BorderStyleSelect, {
					value: "solid",
					onChange: () => {},
				}),
			);
		});
		const options = container.querySelectorAll("option");
		const values = Array.from(options).map((o) => o.value);
		expect(values).toContain("solid");
		expect(values).toContain("dashed");
		expect(values).toContain("dotted");
		expect(values).toContain("double");
	});

	it("calls onChange when selection changes", () => {
		let observed = "";
		act(() => {
			root.render(
				createElement(BorderStyleSelect, {
					value: "solid",
					onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
						observed = e.target.value;
					},
				}),
			);
		});
		const select = container.querySelector("select") as HTMLSelectElement;
		act(() => {
			setReactSelectValue(select, "dashed");
		});
		expect(observed).toBe("dashed");
	});
});
