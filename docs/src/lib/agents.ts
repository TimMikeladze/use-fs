import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { NPM, ORIGIN, REPO } from "./agent-files";

/**
 * The plain-text side of use-fs.com: `llms.txt`, `AGENTS.md` and `index.md`. Everything an agent reads here is cut out of the README by
 * heading, so a renamed or removed section throws and fails the build instead
 * of serving stale docs. Only the framing prose below is authored.
 */

const SUMMARY =
	"use-fs is a React hook for the File System Access API and the origin private file system (OPFS). Point `useFs()` at a folder the user picks on disk, or at browser-private storage, and the component receives every file inside it as a `Map<string, string>` and re-renders when a file is added, changed or deleted. It can also write, create and delete files. Nothing is uploaded; there is no server.";

/** Sections that are for people working on the repo, not using the package. */
const CONTRIBUTOR_SECTIONS = new Set(["Contributing"]);

export interface Section {
	level: number;
	title: string;
	slug: string;
	/** Lines under the heading, including nested subsections. */
	body: string[];
}

export const stripEmoji = (text: string) =>
	text.replace(/\p{Extended_Pictographic}️?\s?/gu, "").replace(/️/g, "");

/** GitHub's heading slug, applied to a heading with its emoji removed. */
export const slugify = (title: string) =>
	title
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, "")
		.trim()
		.replace(/\s/g, "-");

export const loadReadme = () =>
	readFileSync(join(process.cwd(), "..", "README.md"), "utf8");

/** Split Markdown into headed sections, ignoring `#` lines inside fences. */
export const parseSections = (markdown: string): Section[] => {
	const lines = markdown.split("\n");
	const headings: { index: number; level: number; title: string }[] = [];
	let inFence = false;

	lines.forEach((line, index) => {
		if (line.startsWith("```")) {
			inFence = !inFence;
			return;
		}
		const match = inFence ? null : /^(#{1,6})\s+(.*)$/.exec(line);
		if (match?.[1] && match[2]) {
			headings.push({
				index,
				level: match[1].length,
				title: stripEmoji(match[2]).trim(),
			});
		}
	});

	return headings.map((heading, i) => {
		const end =
			headings.slice(i + 1).find((next) => next.level <= heading.level)
				?.index ?? lines.length;
		return {
			level: heading.level,
			title: heading.title,
			slug: slugify(heading.title),
			body: lines.slice(heading.index + 1, end),
		};
	});
};

export const createDocs = (readme: string) => {
	const sections = parseSections(readme);

	const section = (title: string) => {
		const matches = sections.filter((s) => s.title === title);
		if (matches.length !== 1) {
			throw new Error(
				`README section "${title}" matched ${matches.length} headings, expected exactly 1`,
			);
		}
		return matches[0] as Section;
	};

	/** Body of a section, trimmed, stopping at its first subsection. */
	const intro = (title: string) => {
		const { body } = section(title);
		let inFence = false;
		const end = body.findIndex((line) => {
			if (line.startsWith("```")) {
				inFence = !inFence;
			}
			return !inFence && /^#{1,6}\s/.test(line);
		});
		return tidy(body.slice(0, end === -1 ? undefined : end).join("\n"));
	};

	/** The `n`th fenced block in a section, fences included. */
	const fence = (title: string, n = 0) => {
		const blocks = section(title)
			.body.join("\n")
			.match(/^```[^\n]*\n[\s\S]*?^```$/gm);
		const block = blocks?.[n];
		if (!block) {
			throw new Error(`README section "${title}" has no code block #${n}`);
		}
		return block;
	};

	/** Point README-internal anchors at the clean slugs, optionally absolute. */
	const relink = (markdown: string, base = "") =>
		markdown.replace(
			/\]\(#-?([^)]+)\)/g,
			(_, slug: string) => `](${base}#${slug})`,
		);

	const tidy = (markdown: string) =>
		relink(stripEmoji(markdown))
			.replace(/\n{3,}/g, "\n\n")
			.trim();

	/** The README as published docs: no emoji, no contributor notes. */
	const full = () => {
		const out: string[] = [];
		let skipLevel = 0;
		let inFence = false;

		for (const line of readme.split("\n")) {
			if (line.startsWith("```")) {
				inFence = !inFence;
			}
			const heading = inFence ? null : /^(#{1,6})\s+(.*)$/.exec(line);
			if (heading?.[1] && heading[2]) {
				const level = heading[1].length;
				if (skipLevel && level > skipLevel) {
					continue;
				}
				skipLevel = CONTRIBUTOR_SECTIONS.has(stripEmoji(heading[2]).trim())
					? level
					: 0;
			}
			// The follow-me and agent callouts are for people browsing GitHub.
			if (skipLevel || line.startsWith("> 👋") || line.startsWith("> 🤖")) {
				continue;
			}
			out.push(line);
		}

		return `${tidy(out.join("\n"))}\n`;
	};

	const install = fence("Install").split("\n")[1] as string;

	/**
	 * The one llms.txt: the llmstxt.org header (title, summary, links), then the
	 * whole README under it, so an agent needs a single fetch.
	 */
	const llmsTxt = () => {
		const docsBody = full().replace(/^# .*\n+/, "");

		return `# use-fs

> ${SUMMARY}

- [AGENTS.md](${ORIGIN}/AGENTS.md): how a coding agent should use the hook
- [Live demo](${ORIGIN}/): open a folder or browser storage and watch events stream in
- [Source on GitHub](${REPO})
- [Package on npm](${NPM})

${docsBody}`;
	};

	const agentsMd = () => `# use-fs: guide for coding agents

${SUMMARY}

Full docs: ${ORIGIN}/llms.txt

## Install

\`\`\`sh
${install}
\`\`\`

## Minimal example (works in every browser)

${fence("Origin private file system")}

## Folder on disk, with OPFS as the fallback

${fence("Picker or OPFS?")}

## Rules that are easy to get wrong

1. **Client only.** It is a React hook over browser APIs. In the Next.js App Router, put it in a \`"use client"\` component.
2. **Check support first.** \`isBrowserSupported\` gates the directory picker (desktop Chrome, Edge, Opera). \`isOpfsSupported\` gates OPFS reads and \`isOpfsWritable\` gates writes to it (Safari before 26 can read but not write from the main thread).
3. **The picker needs a user gesture.** Call \`onDirectorySelection()\` from a click handler, never from an effect. The first \`writeFile\` to a picked folder prompts for \`readwrite\` too, unless you passed \`mode: "readwrite"\`. \`addOpfsDirectory()\` needs no gesture and no prompt.
4. **Paths include the watched root.** Keys of \`files\` and every path you pass to \`writeFile\` / \`createFile\` / \`deleteFile\` / \`deleteDirectory\` look like \`notes/todo.md\`, not \`todo.md\`. They are POSIX-style; \`.\` and \`..\` are rejected, and a path outside every watched directory throws.
5. **Mount OPFS by \`name\`, and keep binaries out.** \`addOpfsDirectory({ name: "notes" })\` scopes the scan to your own subdirectory. Contents are read as UTF-8 text, so add \`binaryFilter\` (\`filters: [...commonFilters, binaryFilter]\`) when databases, images or archives live in the tree.

## Options

${intro("Options")}

## Return values

${intro("Return values")}

## Filters

${intro("Filters")}
`;

	return { sections, section, intro, fence, full, llmsTxt, agentsMd };
};

let cached: ReturnType<typeof createDocs> | undefined;

/** Docs built from the README next to the docs app, parsed once per build. */
export const docs = () => {
	cached ??= createDocs(loadReadme());
	return cached;
};

export const markdownResponse = (body: string, type = "text/markdown") =>
	new Response(body, {
		headers: { "content-type": `${type}; charset=utf-8` },
	});
