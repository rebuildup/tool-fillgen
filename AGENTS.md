# AGENTS

Tool repo for `rebuildup/tool-fillgen`. This file is the canonical cross-agent contract for this repository. Keep it concise — detailed workflows live in Agent Skills under `.claude/skills/` and `docs/`.

## Project identity

- Name: `@rebuildup/tool-fillgen`
- Type: private, source-only React component library (no build step)
- Consumed by: `my-web-2025` (Next.js 16 host) and other tools in the rebuildup org
- Entry point: `src/index.ts` exports `FillgenApp` (default + named)

The host project handles embedding, routing, and rendering. This repo is responsible for parser, renderer, and editor UI quality.

## Source language policy

- Source code (filenames, identifiers, comments, code docs): English only
- UI strings (Japanese) and other user-facing locale: stay in their respective locale files
- Internal development docs (ADRs, design, runbooks, Skills, AGENTS): Japanese
- Git / GitHub messages: English

## Toolchain

- Runtime: React 19.2
- Peer: Next.js 16
- Language: TypeScript
- Package manager: Bun (`bun`, `bun run`, `bunx`, `bun.lockb` if added)
- Formatter + linter: Biome
- Tests: Vitest (unit + component)
- Type-check: `tsc --noEmit`

No npm / pnpm / Yarn / `npx`. Do not introduce them without a documented reason in an ADR.

## Task scope

- Implement the requested task fully. Do not silently shrink scope to "MVP".
- Initial development stage: no backward compatibility shims unless an external contract is explicitly designated stable.
- Implementation diary / TODO history / abandoned ideas belong in ADRs, not in source files.

## Validation entry point

Run all applicable checks before declaring completion:

```sh
bun run check        # format + lint
bun run typecheck    # tsc --noEmit
bun run test         # vitest run
bun run coverage     # vitest run --coverage
```

CI (`.github/workflows/ci.yml`) calls the same scripts. Do not duplicate validation logic between local and CI.

## Branch / worktree policy

- Work on local `main` only.
- No feature branches, no temporary branches, no Git worktrees unless explicitly requested by the user.
- Subagents use worktree-free mechanisms.

## Design approval gate

This repo has no formal `docs/design/` yet. For non-trivial changes (new components, parser format changes, output schema changes):

1. Read existing source for the touched area.
2. Propose the design change as an ADR (`docs/adr/NNNN-*.md`) or update an existing one.
3. Get user agreement.
4. Implement.

## Skill discovery

Project-local Skills live under `.claude/skills/`. Use the `Skill` tool to load them. The init policy at `docs/adr/0001-toolchain.md` documents which capabilities are delegated to Skills vs. native tools.

## Mode / permission policy

- Respect the active agent mode and its permission gates. Do not look for bypass routes.
- Do not silently disable validation, blanket-ignore warnings, or use `.only` to fake green.
- If a required tool is blocked by permissions or trust, request a mode change from the user.

## Quality gate

- No `// @ts-ignore`, `eslint-disable`, blanket Biome ignore, or coverage exclusion without justification.
- Coverage thresholds (lines/statements/functions/branches) ≥ 80% on testable source. See ADR 0001.
- Type-check, lint, and test must finish with zero errors and zero actionable warnings.

## Dependencies

- Keep dependencies minimal. Prefer native platform capability over new packages.
- Each new dependency requires an ADR entry or design rationale: why needed, alternatives, license, version, maintenance state.
- License audit required for every new package.

## What this file does NOT cover

Detailed workflows are in Agent Skills. Examples:

- Test-driven development workflow
- Code review checklist
- Git commit / PR conventions
- Dependency hygiene procedure
- Fresh-clone audit steps

Look up the relevant Skill before starting a non-trivial task.