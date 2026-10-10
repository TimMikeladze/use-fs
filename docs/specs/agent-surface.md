# Agent surface for use-fs.com

Give coding agents a plain-text way into the library, built from the README so
it cannot drift from it.

## Routes (all static, generated at build from `../README.md`)

| Path | Content |
| --- | --- |
| `/llms.txt` | The only llms file. [llmstxt.org](https://llmstxt.org) header (H1, summary blockquote, links), then the whole README as clean Markdown, minus contributor notes. One fetch, no index/full split |
| `/AGENTS.md` | How an agent should use the hook: install, minimal snippet, options + return tables, the mistakes that break it |
| `/index.md` | The landing page as Markdown (the README docs; the page demonstrates the README) |
| `/robots.txt`, `/sitemap.xml` | Allow all, list the pages above |

## Approach

- `docs/src/lib/agents.ts` parses the README into H2/H3 sections and fenced
  blocks. Snippets and tables are looked up by heading; a heading that does not
  resolve throws, failing the build. Authored prose (summary, mistakes) lives
  in the same module.
- Headings lose their emoji; README anchors (`#-picker-or-opfs`) are rewritten
  to the clean slugs, made absolute against `https://use-fs.com`.
- The home page advertises them through `<link rel="alternate">`
  (`text/markdown`, `text/plain`).
- Navbar: a **For agents** menu linking each file with a one-line description.
- Repo root gets an `AGENTS.md` for agents working *on* the repo (commands,
  layout, conventions).
- `tests/agents.test.ts` (root vitest) asserts every section resolves and each
  output carries the parts agents rely on.
