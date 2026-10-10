import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createDocs, parseSections } from "../docs/src/lib/agents";

// The agent files on use-fs.com are cut out of the README by heading. These
// tests fail when a README edit removes something they depend on.
const readme = readFileSync("README.md", "utf8");
const docs = createDocs(readme);

describe("agent docs", () => {
	it("builds every file from the current README", () => {
		expect(() => docs.llmsTxt()).not.toThrow();
		expect(() => docs.agentsMd()).not.toThrow();
		expect(() => docs.full()).not.toThrow();
	});

	it("llms.txt is one file: llmstxt.org header, then the full docs", () => {
		const txt = docs.llmsTxt();
		expect(txt.startsWith("# use-fs\n\n> ")).toBe(true);
		expect(txt.match(/^# /gm)).toHaveLength(1);
		expect(txt).toContain("https://use-fs.com/AGENTS.md");
		for (const title of ["Install", "Picker or OPFS?", "Filters", "Options"]) {
			expect(txt).toMatch(
				new RegExp(`^#{2,3} ${title.replace("?", "\\?")}$`, "m"),
			);
		}
		expect(txt).toContain("npm install use-fs");
		expect(txt).not.toContain("Contributing");
	});

	it("AGENTS.md carries a runnable snippet and the option tables", () => {
		const md = docs.agentsMd();
		expect(md).toContain('import { useFs } from "use-fs";');
		expect(md).toContain("| `pollInterval` | `300` |");
		expect(md).toContain("| `writeFile(path, data, options?)` |");
		expect(md).toContain("`binaryFilter`");
	});

	it("full docs drop emoji, contributor notes and GitHub-style anchors", () => {
		const full = docs.full();
		expect(full).toMatch(/^# use-fs\n/);
		expect(full).toContain("## Picker or OPFS?");
		expect(full).toContain("](#picker-or-opfs)");
		expect(full).not.toMatch(/\p{Extended_Pictographic}/u);
		expect(full).not.toContain("## Contributing");
		expect(full).not.toContain("@linesofcode");
	});

	it("throws when a section it relies on is missing", () => {
		const broken = createDocs(readme.replace("### Options", "### Settings"));
		expect(() => broken.agentsMd()).toThrow(/"Options" matched 0/);
	});

	it("ignores headings inside code fences", () => {
		const sections = parseSections("## Real\n```sh\n# not a heading\n```\n");
		expect(sections.map((s) => s.title)).toEqual(["Real"]);
	});
});
