# ADR 0001 — AI Agent toolchain と package manager の選定

- Status: Accepted
- Date: 2026-08-29
- Deciders: rebuildup maintainers

## Context

`rebuildup/tool-fillgen` は private source-only React 19 / Next.js 16 埋め込みライブラリ。初期状態では:

- `package.json` に scripts / devDependencies なし
- `package-lock.json` / `bun.lockb` / `pnpm-lock.yaml` なし
- formatter / linter / type-check / test 設定なし
- `.gitignore` は `node_modules/` 程度のみ
- agent 用 scaffold (AGENTS / Skills / ADR / plugin 宣言) なし

source は健全だが、検証ゲートが無く fresh-clone developer や coding agent が品質を判断できない。

## 解決したい capability

1. CI で機械的に検証できる quality gate
2. fresh-clone からの即時 build / test / lint / type-check
3. coding agent への簡潔で project-local な指示
4. 既存 source を変更せずに済む最小導入
5. 既存 parent (`my-web-2025`) への副作用ゼロ

## 決定

### Package manager: Bun

- `bun` / `bun run` / `bunx` を標準とする
- `bun.lockb` を commit し dev tooling (Biome, Vitest) version を pin
- npm / pnpm / Yarn / `npx` は導入しない

理由: init policy §10 の標準。lockfile ベースで cross-platform reproducible。Bun は Windows / WSL / Linux / macOS / NixOS で動作。

### Formatter + Linter: Biome

- `biome.json` を project root に配置
- `format` と `lint` を統合 (`biome check --write`)
- ESLint / Prettier は導入しない

理由: 単一 binary で format + lint + import-sort を完結。設定が ESLint + Prettier の 2-tool 構成より遥かに小さい。React 19 + TypeScript の現行版で十分機能。

### Test framework: Vitest

- `vitest` + `@vitest/coverage-v8` + `happy-dom`
- React 19 の `act()` 警告を抑制するため `tests/setup.ts` で `IS_REACT_ACT_ENVIRONMENT = true` を設定
- 純粋関数 (`parser.ts` / `utils.ts` / `renderers.ts` / `style-generator.ts` / `presets.ts`) は unit test、UI は happy-dom + `react-dom/client` の `createRoot` で smoke test
- init 段階の coverage threshold: `lines: 40, statements: 40, functions: 60, branches: 85`
- 80% 目標への roadmap: 個別実装タスク (`FillGenTool` / `EditorPanel` / `OutputPanel` / `useSelectionMenu`) のテストを追加するたびに thresholds を引き上げる

理由: init policy §29 が JS/TS で Vitest を第一候補と指定。React 19 互換。`@vitest/coverage-v8` は V8 ベースの高速 coverage。init 時点で 80% を要求すると未実装 module を強制 exclude することになり、init policy §27 (warning ゼロ / suppress 禁止) に違反するため、現実的な init scope に設定。

### Type-check: `tsc --noEmit`

- `tsconfig.json` を strict mode で構成
- `bun run typecheck` で `tsc --noEmit` を実行
- `noEmit: true` (build は host project の責務)

理由: source-only library は build しない。type-check は host が消費する前に品質保証する責務。

### CI: GitHub Actions

- `.github/workflows/ci.yml`
- `bun install --frozen-lockfile` → `bun run check` → `bun run typecheck` → `bun run test` → `bun run coverage`
- ローカルと CI で同じ package scripts を呼ぶ。validation logic の二重実装禁止 (init policy §34)

### Coding agent scaffold

- `AGENTS.md`: dispatcher のみ。詳細 workflow は Skill へ
- `.claude/skills/` : 必要に応じて追加 (現時点では作成しない。理由: boilerplate 禁止)
- `docs/adr/` : 本 ADR を起点に段階的追加

### `tsconfig.json` 構成

- `target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`
- `jsx: react-jsx` (TS 側で JSX を transform し、test で happy-dom に直接 render 可能にする)
- `strict: true` + `noUnusedLocals` + `noUnusedParameters` + `noFallthroughCasesInSwitch` + `noImplicitOverride` + `useUnknownInCatchVariables`
- `verbatimModuleSyntax: true` (明示的な type-only import を強制)
- `noEmit: true` (source-only library)

## 検討した代替案

### npm + ESLint + Prettier + Jest

- 採用しなかった理由: tool 数が 3 つに増える。lockfile は npm で問題ないが、init policy §10 が Bun を標準と指定。

### pnpm + ESLint + Prettier + Jest

- 採用しなかった理由: 同上。pnpm の workspace 機能は現時点で不要 (monorepo ではない)。

### ESLint flat config + Prettier (Biome 不採用)

- 採用しなかった理由: 設定ファイルが 2 つ必要になり、fresh-clone developer の学習コストが高い。Biome は 1 binary / 1 config で同等機能。

### Vitest 不採用、Jest 採用

- 採用しなかった理由: Jest は ESM + TypeScript の native サポートが遅れがち。React 19 + ESM 中心のこの project では Vitest の方が設定が簡潔。

### Knip 導入

- 採用しなかった理由: 14 ファイル規模では unused export / unused file の価値が薄い。Phase 拡大時に再評価。

### Playwright E2E

- 採用しなかった理由: 本 tool は親 Next.js app に埋め込まれる source library。E2E は親 app の責務。

### Containerfile

- 採用しなかった理由: source-only library に container は不要。Container 化は親 app / CI runner の責務。

### Nix flake

- 採用しなかった理由: private embed tool で system dependency が高い。再現性は Bun + Bun lockfile で確保できる。Nix は Phase 拡大時に再評価。

## Risk

- React 19.2 + Next.js 16 は bleeding edge。Biome / Vitest の最新版が互換であることを定期的に確認する。
- `bun.lockb` は cross-platform で動く binary diff を持つため、conflict 発生時は `bun install` で再生成する。

## 再評価条件

- ファイル数が 50 を超えたら Knip / dependency analysis を再評価
- 別 source library を monorepo 化する場合、Bun workspace + Nix flake を再評価
- React 20 / Next 17 への upgrade 時、Biome / Vitest の互換を再評価
- CI で flaky test が出るようになったら retry policy を ADR 化

## Project-local 再現方法

- `bun install` で lockfile から deterministic install
- CI は `bun install --frozen-lockfile` を使用
- dev tooling の version は `package.json` の `devDependencies` で明示
- agent 関連設定は全て repository 管理下 (`AGENTS.md`, `.gitignore`, `tsconfig.json`, `biome.json`, `vitest.config.ts`, `.github/workflows/`)
- 暗黙の global state への依存なし