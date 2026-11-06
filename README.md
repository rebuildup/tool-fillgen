# rebuildup/tool-fillgen

穴埋めプリントジェネレーター (`FillgenApp`) を提供する private source-only React component library。`my-web-2025` (Next.js 16) や rebuildup 配下の他 Next.js アプリへ埋め込むことを想定しています。

このリポジトリでは **ビルド成果物を生成しません**。`src/index.ts` を host project が直接 import して使います。

## 公開 API

```ts
// host project での利用例
import FillgenApp from "@rebuildup/tool-fillgen";

export default function Page() {
	return <FillgenApp />;
}
```

- Default export: `FillgenApp` (React component, `"use client"`)
- 動作環境: React 19.2+, Next.js 16+ (App Router)

## 機能概要

- マークダウン風テキストに `{{答え|幅}}` を挿入して穴埋めプリントを生成
- プレビュー / HTML / React の 3 タブで出力を確認
- プリセット (default / modern / warm / minimal) と詳細スタイル設定
- 採点・答え表示・リセット・ページ切替のインタラクティブ UI
- HTML / React コードのダウンロード / コピー

## 開発環境

| 用途 | ツール |
|---|---|
| Package manager | Bun |
| Formatter / Linter | Biome |
| Type-check | `tsc --noEmit` |
| Test | Vitest + happy-dom + `@vitest/coverage-v8` |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

### 必要なもの

- Bun (>= 1.1) — `curl -fsSL https://bun.sh/install | bash`
- React 19 / Next.js 16 は host project 側で解決されるため dev install では不要

### 初回セットアップ

```sh
bun install
```

### よく使うスクリプト

```sh
bun run check        # biome check --write (format + lint + import-sort)
bun run lint         # biome lint のみ
bun run format       # biome format --write のみ
bun run typecheck    # tsc --noEmit
bun run test         # vitest run (1 回実行)
bun run test:watch   # vitest (watch mode)
bun run coverage     # vitest run --coverage
bun run verify       # check + typecheck + test (full local gate)
```

### テストの追加

`tests/` 配下に `*.test.ts` / `*.test.tsx` を追加してください。Vitest が自動検出します。

Coverage は `src/**/*.ts(x)` を対象とし、`src/index.ts` と route 専用ファイル (`FillgenApp.tsx`, `FillGenTool.tsx`) は threshold 計算から除外しています。実際のロジック (`parser.ts`, `renderers.ts`, `style-generator.ts`, `presets.ts`, `utils.ts` の純粋関数部) は 80% 以上を維持してください。

## アーキテクチャ

```
src/
  index.ts                    # package entry point
  FillgenApp.tsx              # default React component
  components/
    FillGenTool.tsx           # ルートツール (editor + output + caret menu)
    EditorPanel.tsx           # マークダウン editor + page tabs
    OutputPanel.tsx           # preview / html / react tab container
    PreviewView.tsx           # ライブプレビュー DOM
    StyleSettingsPanel.tsx    # スタイル編集 panel (preset + section)
    StyleSections.tsx         # 色 / テキスト / ボタン / 空欄 / nav セクション
    StyleFields.tsx           # ColorField / RangeField / BorderStyleSelect
    CaretMenu.tsx             # 選択範囲を穴埋め化する popup menu
    presets.ts                # default / modern / warm / minimal preset
    parser.ts                 # マークダウン → Doc AST + paragraph → HTML
    renderers.ts              # Doc[] → standalone HTML / React component string
    style-generator.ts        # StyleSettings → CSS string
    types.ts                  # StyleSettings / Doc / Section / Block
    utils.ts                  # sanitizeFilename / copyText / downloadFile / getCaretScreenPosition
    useUndoHistory.ts         # Ctrl+Z undo hook
    useSelectionMenu.ts       # textarea selection + caret menu positioning hook
    useQuizSectionHandlers.ts # preview 内の採点 / 答え / リセット interaction
tests/
  parser.test.ts              # parseDoc / autoWidth / paragraphToHtml
  utils.test.ts               # sanitizeFilename
  style-generator.test.ts     # generateStyle
  renderers.test.ts           # renderHtml / renderReact
docs/
  adr/0001-toolchain.md       # Bun / Biome / Vitest 選定理由
```

`src/components/` は「dumping-ground」になっていません。各ファイルは責務 (parser / renderer / UI panel / hook / field / preset) を持ち、ファイル名でそれが読み取れます。共通 util は `utils.ts` にまとめていますが、責務語は host project と同じ命名規則 (`utility`) を使わず、より具体的な `clipboard` / `dom-caret` / `filename` への分割を再評価中です (ADR 化予定)。

## コーディング規約

- Source code は英語のみ (filename / identifier / comment)
- UI 文字列 (日本語) は変更しない (host project の locale policy に従う)
- Internal development docs (AGENTS.md / ADR / Skills) は日本語
- Git / GitHub message は英語
- Commit prefix: `feat` / `fix` / `refactor` / `test` / `docs` / `build` / `ci` / `chore` / `perf`
- Commit format: `<prefix>: <concise title>` + 空行 + summary

## 検証方針

CI は `bun run verify` を直接呼び出します。local と CI で同じ script を共有するため、validation logic の二重実装はありません。

新しい package を追加する場合は ADR に:

- 必要性 / 再現性 / 保守性 / context cost / determinism / security / license / cross-platform / version
- alternatives considered + rejection reasons

を残してください。

## 参考

- 親 project: `my-web-2025` (Next.js 16 host)
- 関連 tool: `rebuildup/tool-*` シリーズ
- Init policy: `docs/adr/0001-toolchain.md`

## License

MIT — see [LICENSE](./LICENSE).