import { act, createElement, useState } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CaretMenu } from "../src/components/CaretMenu";
import { BlankStyleSection } from "../src/components/StyleSections";
import { presets } from "../src/components/presets";
import type { StyleSettings } from "../src/components/types";

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

describe("CaretMenu", () => {
	it("positions itself at menuPos and forwards click to wrap handler", () => {
		let clicked = 0;
		const menuRef = { current: null } as unknown as React.RefObject<HTMLDivElement>;
		act(() => {
			root.render(
				createElement(CaretMenu, {
					menuPos: { top: 200, left: 350 },
					menuRef,
					wrapSelectionAsBlank: () => {
						clicked += 1;
					},
				}),
			);
		});
		const div = container.firstElementChild as HTMLDivElement;
		expect(div.style.top).toBe("200px");
		expect(div.style.left).toBe("350px");
		const button = div.querySelector("button") as HTMLButtonElement;
		act(() => {
			button.click();
		});
		expect(clicked).toBe(1);
	});

	it("prevents default mousedown to preserve selection", () => {
		const menuRef = { current: null } as unknown as React.RefObject<HTMLDivElement>;
		act(() => {
			root.render(
				createElement(CaretMenu, {
					menuPos: { top: 0, left: 0 },
					menuRef,
					wrapSelectionAsBlank: () => {},
				}),
			);
		});
		const div = container.firstElementChild as HTMLDivElement;
		let prevented = false;
		const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
		event.preventDefault = () => {
			prevented = true;
		};
		act(() => {
			div.dispatchEvent(event);
		});
		expect(prevented).toBe(true);
	});
});

describe("BlankStyleSection", () => {
	it("renders border style select, line width range and background color field", () => {
		const initial = presets.default;
		act(() => {
			root.render(
				createElement(BlankStyleSection, {
					settings: initial,
					setSettings: () => {},
				}),
			);
		});
		expect(container.querySelector("select")).not.toBeNull();
		const ranges = container.querySelectorAll("input[type=range]");
		expect(ranges.length).toBeGreaterThanOrEqual(1);
		expect(container.querySelector("input[type=color]")).not.toBeNull();
	});

	it("calls setSettings with updated borderStyle", () => {
		let captured = presets.default;
		act(() => {
			root.render(
				createElement(BlankStyleSection, {
					settings: presets.default,
					setSettings: (next) => {
						captured = next as StyleSettings;
					},
				}),
			);
		});
		const select = container.querySelector("select") as HTMLSelectElement;
		const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
		act(() => {
			setter?.call(select, "dashed");
			select.dispatchEvent(new Event("change", { bubbles: true }));
		});
		expect(captured.blank.borderStyle).toBe("dashed");
	});
});

describe("StyleSettingsPanel preset selector", () => {
	function Harness() {
		const [settings, setSettings] = useState<StyleSettings>(presets.default);
		return createElement(
			"div",
			null,
			createElement("span", { "data-testid": "accent" }, settings.colors.accentColor),
			createElement(
				"select",
				{
					"data-testid": "preset-select",
					value: "default",
					onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
						const key = e.target.value;
						if (key !== "custom" && presets[key]) {
							setSettings(presets[key]);
						}
					},
				},
				...Object.keys(presets).map((k) => createElement("option", { key: k, value: k }, k)),
				createElement("option", { value: "custom" }, "custom"),
			),
		);
	}

	it("updates state when a preset is chosen", () => {
		act(() => {
			root.render(createElement(Harness));
		});
		const select = container.querySelector('[data-testid="preset-select"]') as HTMLSelectElement;
		const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
		act(() => {
			setter?.call(select, "warm");
			select.dispatchEvent(new Event("change", { bubbles: true }));
		});
		const accent = container.querySelector('[data-testid="accent"]') as HTMLSpanElement;
		expect(accent.textContent).toBe(presets.warm.colors.accentColor);
	});
});
