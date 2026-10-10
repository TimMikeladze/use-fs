/**
 * The agent-facing files and the URLs they point at. Kept free of Node APIs so
 * the navbar can import it alongside the route handlers.
 */

export const ORIGIN = "https://use-fs.com";
export const REPO = "https://github.com/TimMikeladze/use-fs";
export const NPM = "https://www.npmjs.com/package/use-fs";

/** The agent-facing files, in the order the navbar and `llms.txt` list them. */
export const AGENT_FILES = [
	{
		path: "/llms.txt",
		title: "llms.txt",
		description: "The full documentation in one file, for language models",
	},
	{
		path: "/AGENTS.md",
		title: "AGENTS.md",
		description: "How a coding agent should use the hook",
	},
	{
		path: "/index.md",
		title: "index.md",
		description: "This page as Markdown",
		// Same docs as llms.txt; advertised through <link rel="alternate">.
		hideInNav: true,
	},
] as const;
