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

## Branch / release workflow

- `main` is released / integrated state.
- current release integration line is `release-x-y-z`.
- durable implementation work is tracked by GitHub Issue; ticket branch defaults to the Issue number only.
- independent ticket PRs target the current release branch.
- once the release branch has meaningful difference, maintain a Draft release PR from `release-x-y-z` to `main`.
- normal integration into `main` comes only from the current release branch.
- landing uses merge commits only; squash / rebase merge are not used.
- worktrees are allowed when they improve isolation, but a worktree alone is not runtime-isolation proof.
- concurrent workers must separate mutable runtime state when applicable.

## Design approval gate

This repo has no formal `docs/design/` yet. For non-trivial changes (new components, parser format changes, output schema changes):

1. Read existing source for the touched area.
2. Propose the design change as an ADR (`docs/adr/NNNN-*.md`) or update an existing one.
3. Get user agreement.
4. Implement.

## Skill discovery

Project-local operational Skills are installed into `.agents/skills/` and `.claude/skills/` through `bunx skills`. Use `mise run skills-bootstrap` on fresh setup and `mise run skills-update` for continuous updates. `skills-lock.json` is the durable source/content metadata.

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

## Constitution / operating profile

- Top-level contract: [`constitution/CONSTITUTION.md`](constitution/CONSTITUTION.md)
- Current Operating Model: [`organization/profiles/release-driven-solo.md`](organization/profiles/release-driven-solo.md)
- Existing React/Bun/Biome/Vitest/source-only-library decisions remain project-specific authority when they preserve the Constitution.
- project-init operational Skills track current upstream through the project-local Skills CLI rather than a frozen governance revision.
