# ADR 0002 — standalone 静的 build 経路の追加

- Status: Proposed（Draft PR で owner review を待つ。AGENTS.md の design approval gate に基づく提案）
- Date: 2026-11-02
- Deciders: rebuildup maintainers
- 関連 Issue: rebuildup/tool-fillgen#4（host 側: rebuildup/my-web-2026#359）

## Context

`rebuildup/tool-fillgen` は private な source-only の React component library で、
`src/index.ts` が `FillgenApp` を export する（ADR 0001）。host 側の
`my-web-2026` は ADR-0006（Tool submodule policy）の下で、この repo の pinned SHA から
静的成果物を build して `/tools/fillgen/app/` に配信する。

現状は次のとおりで、**host 側は成果物を生成できない**。

- `package.json` に bundler の devDependency が無く、`build` script も無い
- エントリ HTML が無い（`index.html` が無い）
- `vite.config` が無い
- `src/components/FillGenTool.tsx:3` が `next/link` を import しており、
  breadcrumb のリンクが host の route（`/` と `/tools`）を指している
- `src/components/utils.ts:3` の `navigator.clipboard.writeText` は、sandbox frame
  （opaque origin）では権限拒否で失敗する

owner 要件は「**全 Tool を利用可能にする**」ことであり、host_disabled は恒久状態に
しない。sandbox / iframe の採否は owner の判断事項ではなく engineering decision である
（host 側 ADR-0020 / Issue #769）。

## 決定

### standalone build の足場を追加する

| 追加 | 役割 |
| --- | --- |
| `vite.config.ts` | `@vitejs/plugin-react` と `base: "./"` |
| `index.html` | `<div id="root">` と `/src/main.tsx` の module script |
| `src/main.tsx` | `createRoot` で `FillgenApp` を mount する entry |
| `package.json` | `dev` / `build` / `preview` script と Vite の devDependency |

`base: "./"` は必須である。host は成果物を `/tools/fillgen/` 配下で配信するため、
Vite の既定 base（`/`）では `dist/index.html` が host root を参照する
`/assets/index-*.js` を書き出し、配信時に 404 になる。

### library としての公開は壊さない

`main` / `types` / `exports` は変更しない。runtime 依存（`react` / `react-dom`）も
変えない。追加するのは devDependency のみである。

### `next/link` を host 相対の link として落とす

`next/link` は Next runtime の组件であり、standalone build に存在しない。host route
（`/` と `/tools`）を指す breadcrumb link は、iframe 内では遷移先が Tool ではなく
**frame をアプリから遠ざける**操作になるため、表示は保ったままテキストへ置き換える。
その結果 `src/**` に `next` の import が無くなるので `peerDependencies.next` を削除する。

### clipboard の fallback を持つ

opaque origin（sandbox frame without `allow-same-origin`）では async Clipboard API が
利用できず、copied ボタンが**何もしない**ように見える。そこで `document.execCommand("copy")`
への fallback を持ち、Clipboard API が使えない環境でもコピーが成立するようにする。
fallback の両経路（成功 / 失敗）は unit test で固定する。

### 依存の追加

| 追加 | バージョン | ライセンス | 代替案と不採用理由 |
| --- | --- | --- | --- |
| `vite` | `^7.3.7` | MIT | esbuild 単体の採用：不採用。HTML entry と asset graph の解決、dev server、preview を持つ Vite の方が host 側の preview 検証と一致する |
| `@vitejs/plugin-react` | `^5.2.0` | MIT | JSX transform の手組み：不採用。React 19 の Fast Refresh との整合と TS 設定の追随が長い |

いずれも devDependency であり、成果物（`dist/`）には含まれない。runtime 依存は増えて
いない。既存の test / lint / type-check の toolchain（Biome / Vitest / TypeScript）は
そのまま使う。

### coverage の扱い

`src/main.tsx` は `#root` を探して app を mount するだけの entry で、unit test する
ロジックが無い。既存の設定が `src/FillgenApp.tsx`（app entry）を coverage から
除外しているのと同じ扱いとして、`src/main.tsx` も coverage の exclude に追加する。
しきい値は変更しない（lines 40 / statements 40 / functions 60 / branches 85）。

## 検討した代替案

### `next build` / `next export` を standalone 経路にする

不採用。host は同一 origin の静的成果物を iframe で読み込むので、Next の runtime と
route 定義は不要である。素の Vite build の方が成果物が小さく、host 側の配信条件
（`/tools/<slug>/app/` 配下の相対パス）にもそのまま合う。

### `bun build` を bundler にする

不採用（今回は）。Bun bundler は単一バイナリで速いが、React の JSX transform と
`base` 相当の asset path 設定、および host 側の preview 検証（`vite preview` 相当）が
Vite より扱いにくい。host 側の Tool pipeline は Vite build を前提にしている
（host 側 `scripts/build-tools.mjs`）。

### library export のままにして、host 側が bundler を持つ

不採用。host 側は「pinned SHA の成果物を自分で build する」境界守住ため、build 経路は
Tool repo 側にある方が review 境界が明確である（ADR-0006 と同じ考え方）。

### `peerDependencies.next` を残す

不採用。`src/**` に `next` の import が無くなるので残すと、host が Next をインストール
する理由が消えるだけである。

## 影響

- library としての import は従来どおり（`main` / `types` / `exports` 不変）
- breadcrumb の "Home" / "Tools" は link でなくなる（iframe 内で遷移させないため）
- copy ボタンは Clipboard API が使えない環境でも `execCommand` で成立する
- `dist/` は生成物であり commit しない（`.gitignore` に既存）

## 再評価条件

- host 側が bundler を host 側へ移す判断をした場合（§「検討した代替案」参照）
- React 20 / Vite 8 への upgrade 時（toolchain の互換性を再評価）
- lockfile の bun バージョンをpinし直す際（下記「既知の不整合」）

## 既知の不整合（本 ADR の範囲外）

- `mise.toml` と CI は bun 1.1.34 を pin しているが、commit されている lockfile は
  **テキスト形式**（`bun.lock`、lockfileVersion 2）であり、bun 1.1.34 はその形式を
  読めず（`bun.lockb` を書く）。したがって CI の `bun install --frozen-lockfile` は
  現状 lockfile を参照していない。本 ADR で lockfile を更新した際も、テキスト形式を
  書ける bun（1.4.4）で更新している。**bun の pin と lockfile 形式の不整合は別の
  ticket で解消すべき**であり、本 ADR では触らない。
