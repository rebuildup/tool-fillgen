import { describe, expect, it } from "vitest";
import {
	checkSection,
	resetSection,
	resizeInputElement,
	showSectionAns,
} from "../src/components/useQuizSectionHandlers";

const buildQuizSection = (blanks: { value: string; answers: string }[]) => {
	const section = document.createElement("div");
	section.className = "quiz-section";
	for (const { value, answers } of blanks) {
		const input = document.createElement("input");
		input.className = "blank";
		input.dataset.ans = answers;
		input.value = value;
		section.appendChild(input);
	}
	return section;
};

describe("resizeInputElement", () => {
	it("clamps dynamic width between base and 500", () => {
		const input = document.createElement("input");
		input.className = "blank";
		input.dataset.baseWidth = "100";
		input.value = "hi";
		resizeInputElement(input);
		const width = Number.parseInt(input.style.width, 10);
		expect(width).toBeGreaterThanOrEqual(100);
		expect(width).toBeLessThanOrEqual(500);
	});

	it("falls back to 80 when baseWidth is invalid", () => {
		const input = document.createElement("input");
		input.className = "blank";
		input.dataset.baseWidth = "abc";
		input.value = "";
		resizeInputElement(input);
		expect(Number.parseInt(input.style.width, 10)).toBeGreaterThanOrEqual(80);
	});
});

describe("checkSection", () => {
	it("marks inputs as correct when value matches an answer", () => {
		const section = buildQuizSection([{ value: "tokyo", answers: "tokyo|kyoto" }]);
		checkSection(section.querySelector("button") ?? withButton(section));
		const input = section.querySelector("input.blank");
		expect(input?.classList.contains("correct")).toBe(true);
		expect(input?.classList.contains("incorrect")).toBe(false);
	});

	it("treats '・' stripped answers as equivalent", () => {
		const section = buildQuizSection([{ value: "東京とうきょう", answers: "東京・とうきょう" }]);
		checkSection(withButton(section));
		const input = section.querySelector("input.blank");
		expect(input?.classList.contains("correct")).toBe(true);
	});

	it("marks inputs as incorrect when value does not match", () => {
		const section = buildQuizSection([{ value: "osaka", answers: "tokyo|kyoto" }]);
		checkSection(withButton(section));
		const input = section.querySelector("input.blank");
		expect(input?.classList.contains("incorrect")).toBe(true);
		expect(input?.classList.contains("correct")).toBe(false);
	});

	it("ignores whitespace in user input", () => {
		const section = buildQuizSection([{ value: " tokyo ", answers: "tokyo" }]);
		checkSection(withButton(section));
		const input = section.querySelector("input.blank");
		expect(input?.classList.contains("correct")).toBe(true);
	});

	it("returns silently when called outside a .quiz-section", () => {
		const button = document.createElement("button");
		document.body.appendChild(button);
		expect(() => checkSection(button)).not.toThrow();
		button.remove();
	});
});

describe("showSectionAns", () => {
	it("reveals tooltip for inputs that are not yet correct", () => {
		const section = buildQuizSection([
			{ value: "wrong", answers: "tokyo" },
			{ value: "tokyo", answers: "tokyo" },
		]);
		const input1 = section.querySelectorAll("input.blank")[0];
		const input2 = section.querySelectorAll("input.blank")[1];
		input2?.classList.add("correct");
		const wrapper1 = document.createElement("span");
		wrapper1.className = "input-wrapper";
		input1?.parentNode?.insertBefore(wrapper1, input1);
		if (input1) wrapper1.appendChild(input1);
		const wrapper2 = document.createElement("span");
		wrapper2.className = "input-wrapper";
		input2?.parentNode?.insertBefore(wrapper2, input2);
		if (input2) wrapper2.appendChild(input2);

		showSectionAns(withButton(section));

		expect(wrapper1.classList.contains("show-ans")).toBe(true);
		expect(wrapper2.classList.contains("show-ans")).toBe(false);
	});
});

describe("resetSection", () => {
	it("clears values and classes for every input", () => {
		const section = buildQuizSection([{ value: "tokyo", answers: "tokyo" }]);
		const input = section.querySelector("input.blank") as HTMLInputElement | null;
		const wrapper = document.createElement("span");
		wrapper.className = "input-wrapper input-wrapper show-ans";
		input?.parentNode?.insertBefore(wrapper, input);
		if (input) wrapper.appendChild(input);
		input?.classList.add("correct", "incorrect");

		resetSection(withButton(section));

		expect(input?.value).toBe("");
		expect(input?.classList.contains("correct")).toBe(false);
		expect(input?.classList.contains("incorrect")).toBe(false);
		expect(wrapper.classList.contains("show-ans")).toBe(false);
	});
});

function withButton(section: Element): HTMLButtonElement {
	const button = document.createElement("button");
	section.appendChild(button);
	return button;
}
