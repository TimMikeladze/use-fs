# Working on use-fs

Guide for coding agents changing this repo. To *use* the package, read
https://use-fs.com/AGENTS.md or https://use-fs.com/llms.txt instead.

## Layout

- `src/` - the package. `useFileSystem.ts` is the hook; `scan.ts` walks and diffs
  directories; `filters.ts`, `opfs.ts`, `async.ts` hold the pieces it builds on.
  Everything public is re-exported from `src/index.ts`.
- `tests/` - vitest (jsdom). `tests/mock-fs.ts` fakes `FileSystemDirectoryHandle`.
- `docs/` - use-fs.com, a Next.js 16 + Fumadocs app. Landing page in
  `docs/src/app/(home)`. Read `docs/AGENTS.md` before touching Next.js code.
- `docs/src/lib/agents.ts` - builds `/llms.txt`, `/AGENTS.md` and `/index.md` from `README.md` by heading.
- `docs/specs/` - short design notes for larger changes.

## Commands

```sh
pnpm test -- --run    # unit tests
pnpm typecheck        # tsc, package + tests
pnpm lint             # biome, writes fixes
pnpm build            # tsup into dist/
cd docs && pnpm dev   # site; builds the package first
```

## Rules

- `README.md` is the documentation and the source of the agent files. Renaming
  or removing a README heading that `docs/src/lib/agents.ts` reads fails
  `tests/agents.test.ts` - update both together.
- Every public API change updates the README tables (Options, Return values,
  Lower-level exports) and the tests.
- The only runtime dependency is `ignore` (for `.gitignore` parsing); React is a peer. Do not add more without a strong reason.
- Commits follow Conventional Commits (`feat(opfs): ...`, `fix: ...`).
