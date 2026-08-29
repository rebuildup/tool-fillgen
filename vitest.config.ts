import { defineConfig } from "vitest/config";

// Coverage thresholds reflect the realistic init-time scope.
// The init policy's 80% target applies to individual tested modules once
// implementation tasks have grown their test suite. See ADR 0001 for the
// roadmap from init thresholds toward the 80% project goal.
export default defineConfig({
	test: {
		environment: "happy-dom",
		globals: false,
		include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
		setupFiles: ["./tests/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			include: ["src/**/*.ts", "src/**/*.tsx"],
			exclude: [
				"src/**/*.d.ts",
				"src/**/index.ts",
				"src/FillgenApp.tsx",
				"src/components/FillGenTool.tsx",
			],
			thresholds: {
				lines: 40,
				statements: 40,
				functions: 60,
				branches: 85,
			},
		},
	},
});
