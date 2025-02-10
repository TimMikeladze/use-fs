import React, { type JSX } from "react";
import { commonFilters, useFs } from "use-fs";
import {Readme} from "./Readme";

type FileState = {
	path: string;
	content: string | null;
	previousContent: string | null;
};

const App = () => {
	const [selectedFile, setSelectedFile] = React.useState<FileState>({
		path: "",
		content: null,
		previousContent: null,
	});
	const [fileHistory, setFileHistory] = React.useState<
		Array<{
			type: "added" | "removed";
			path: string;
			timestamp: number;
		}>
	>([]);
	const [showCopied, setShowCopied] = React.useState(false);

	const { onDirectorySelection, onClear, files, isBrowserSupported } =
		useFs({
			filters: commonFilters,
			onFilesAdded: (newFiles, previousFiles) => {
				console.log("onFilesAdded", newFiles, previousFiles);
				const newEntries = Array.from(newFiles.keys()).map((path) => ({
					type: "added" as const,
					path,
					timestamp: Date.now(),
				}));
				setFileHistory((prev) => [...newEntries, ...prev].slice(0, 50));
			},
			onFilesChanged: (changedFiles, previousFiles) => {
				console.log("onFilesChanged", changedFiles, previousFiles);

				const changedFilesArray = Array.from(changedFiles);
				if (changedFilesArray.length > 0) {
					const [filePath, content] = changedFilesArray[0];
					const previousContent = previousFiles.get(filePath) || null;
					setSelectedFile({ path: filePath, content, previousContent });
				}
			},
			onFilesDeleted: (deletedFiles, previousFiles) => {
				console.log("onFilesDeleted", deletedFiles, previousFiles);
				if (deletedFiles.has(selectedFile.path)) {
					setSelectedFile({ path: "", content: null, previousContent: null });
				}
				const deletedEntries = Array.from(deletedFiles.keys()).map((path) => ({
					type: "removed" as const,
					path,
					timestamp: Date.now(),
				}));
				setFileHistory((prev) => [...deletedEntries, ...prev].slice(0, 50));
			},
		});

	const [isLoading, setIsLoading] = React.useState(false);

	const handleDirectorySelection = async () => {
		setIsLoading(true);
		try {
			await onDirectorySelection();
		} finally {
			setIsLoading(false);
		}
	};

	const handleClear = () => {
		onClear();
		setSelectedFile({ path: "", content: null, previousContent: null });
		setFileHistory([]);
	};

	const formatTimestamp = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString();
	};

	const renderDiff = (oldContent: string | null, newContent: string | null) => {
		if (!(oldContent || newContent)) {
			return null;
		}
		if (!oldContent) {
			// New file
			return newContent?.split("\n").map((line, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
				<div key={i} className="text-green-600">
					+ {line}
				</div>
			));
		}
		if (!newContent) {
			// Deleted file
			return oldContent?.split("\n").map((line, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
				<div key={i} className="text-red-600">
					- {line}
				</div>
			));
		}

		// Changed file - simple line by line diff
		const oldLines = oldContent.split("\n");
		const newLines = newContent.split("\n");
		const diff: JSX.Element[] = [];

		let i = 0;
		let j = 0;
		while (i < oldLines.length || j < newLines.length) {
			if (
				i < oldLines.length &&
				j < newLines.length &&
				oldLines[i] === newLines[j]
			) {
				diff.push(
					<div key={`${i}-${j}`} className="text-gray-800 dark:text-gray-200">
						{" "}
						{oldLines[i]}
					</div>,
				);
				i++;
				j++;
			} else {
				if (i < oldLines.length) {
					diff.push(
						<div key={`old-${i}`} className="text-red-600">
							- {oldLines[i]}
						</div>,
					);
					i++;
				}
				if (j < newLines.length) {
					diff.push(
						<div key={`new-${j}`} className="text-green-600">
							+ {newLines[j]}
						</div>,
					);
					j++;
				}
			}
		}

		return diff;
	};

	const handleCopyInstall = () => {
		navigator.clipboard.writeText("npm install use-fs");
		setShowCopied(true);
		setTimeout(() => setShowCopied(false), 2000);
	};

	return (
		<div className="!font-mono min-h-screen w-full bg-zinc-950">
			<nav className="border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
					<div className="flex items-center gap-6">
						<div className="items-center gap-2 rounded-lg bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 text-sm sm:flex backdrop-blur-sm">
							<code className="text-white">npm install use-fs</code>
							<button
								type="button"
								onClick={handleCopyInstall}
								className="group relative ml-1 rounded p-1 text-gray-400 hover:bg-black/50 hover:text-white flex-nowrap items-center"
								aria-label="Copy install command"
							>
								<svg className="h-4 w-4 pt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>
								{showCopied && (
									<span className="-bottom-8 -translate-x-1/2 absolute left-1/2 rounded bg-black border border-zinc-800 px-2 py-1 text-white text-xs">
										Copied!
									</span>
								)}
							</button>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<a
							href="https://github.com/TimMikeladze/use-fs"
							target="_blank"
							rel="noopener noreferrer"
							className="text-zinc-400 transition-colors hover:text-zinc-200"
							aria-label="View on GitHub"
						>
							<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
							</svg>
						</a>
						<a
							href="https://twitter.com/linesofcode"
							target="_blank"
							rel="noopener noreferrer"
							className="text-zinc-400 transition-colors hover:text-zinc-200"
							aria-label="Follow on Twitter"
						>
							<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
							</svg>
						</a>
					</div>
				</div>
			</nav>
			
			<main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-5">
				<Readme />
				<div className="py-4">
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
						<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
							<div className="grid grid-rows-[auto_auto_1fr_auto] gap-6">
								{!isBrowserSupported && (
									<div className="mb-4 rounded-lg border border-red-900/20 bg-red-950/10 p-3 text-sm text-red-400">
										Your browser does not support the File System Access API. Please try again in a different browser, such as Chrome.
									</div>
								)}
								<div className="mb-4 text-sm text-zinc-400">
									Select a directory to watch. Files will be filtered according to .gitignore rules if present.
									<br />
									<br />
									Edit a file and a diff will be shown in the right pane.
								</div>
								<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
									<div className="mb-3 text-sm text-zinc-300">
										Files: {files.size}
									</div>
									{isLoading && (
										<div className="text-center text-blue-400 text-xs">
											Loading directory...
										</div>
									)}
									<div className="mt-3 flex justify-center gap-3">
										<button
											type="button"
											onClick={handleDirectorySelection}
											disabled={isLoading}
											className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-sm text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										>
											Select Directory
										</button>
										<button
											type="button"
											onClick={handleClear}
											disabled={isLoading}
											className="rounded-lg border border-red-500 px-6 py-2.5 font-medium text-red-400 text-sm shadow-sm transition-all hover:bg-red-950/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										>
											Clear
										</button>
									</div>
								</div>

								<div className="mt-4 max-h-[calc(100vh-300px)] space-y-1 overflow-y-auto rounded-lg">
									{Array.from(files.keys()).map((path) => (
										<button
											type="button"
											key={path}
											className="w-full rounded-lg bg-transparent px-4 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900/50 focus:bg-zinc-900 focus:outline-none"
											onClick={() =>
												setSelectedFile({
													path,
													content: files.get(path) || null,
													previousContent: null,
												})
											}
										>
											{path}
										</button>
									))}
								</div>
							</div>
						</div>

						<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
							<div className="grid gap-4">
								<div className="font-medium text-lg text-white">
									{selectedFile.path || "No file selected"}
								</div>
								<div className="max-h-[calc(100vh-200px)] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 font-mono text-sm leading-relaxed">
									{renderDiff(
										selectedFile.previousContent,
										selectedFile.content,
									)}
								</div>
							</div>
						</div>

						<div className="col-span-1 lg:col-span-2">
							<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
								<div className="mb-4 font-medium text-lg text-white">
									File History
								</div>
								<div className="grid max-h-[200px] gap-2 overflow-y-auto rounded-lg">
									{fileHistory.map((entry, index) => (
										<div
											key={`${entry.path}-${entry.timestamp}-${index}`}
											className={`flex justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm transition-colors ${
												entry.type === "added"
													? "text-green-400"
													: "text-red-400"
											}`}
										>
											<span className="font-medium">{entry.path}</span>
											<span className="opacity-80">
												{formatTimestamp(entry.timestamp)}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
				
			</main>
			<footer className="mt-30 border-t border-zinc-800 bg-zinc-950/80 border-b px-4 backdrop-blur-sm h-18 flex items-center justify-center">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-center">
					<div className="text-center text-sm text-zinc-400">
						Built by{" "}
						<a
							href="https://linesofcode.dev"
							target="_blank"
							rel="noopener noreferrer"
							className="font-semibold text-zinc-300 transition-colors hover:text-white"
							aria-label="Visit Lines of Code website"
						>
							linesofcode.dev
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default App;
