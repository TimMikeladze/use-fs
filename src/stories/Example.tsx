import { action } from "@storybook/addon-actions";
import React, { useEffect, type JSX } from "react";
import { commonFilters, useFileSystem } from "..";

type FileState = {
	path: string;
	content: string | null;
	previousContent: string | null;
};

export const Example = () => {
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

	const {
		onDirectorySelection,
		onClear,
		files,
		isBrowserSupported,
		isProcessing,
	} = useFileSystem({
		filters: commonFilters,
		onFilesAdded: (newFiles, previousFiles) => {
			console.log("onFilesAdded", newFiles, previousFiles);
			action("onFilesAdded");
			const newEntries = Array.from(newFiles.keys()).map((path) => ({
				type: "added" as const,
				path,
				timestamp: Date.now(),
			}));
			setFileHistory((prev) => [...newEntries, ...prev].slice(0, 50));
		},
		onFilesChanged: (changedFiles, previousFiles) => {
			console.log("onFilesChanged", changedFiles, previousFiles);
			action("onFilesChanged");

			const changedFilesArray = Array.from(changedFiles);
			if (changedFilesArray.length > 0) {
				const [filePath, content] = changedFilesArray[0];
				const previousContent = previousFiles.get(filePath) || null;
				setSelectedFile({ path: filePath, content, previousContent });
			}
		},
		onFilesDeleted: (deletedFiles, previousFiles) => {
			console.log("onFilesDeleted", deletedFiles, previousFiles);
			action("onFilesDeleted");
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

	const [renderCount, setRenderCount] = React.useState(0);
	const [isLoading, setIsLoading] = React.useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setRenderCount((count) => count + 1);
	}, [files.size]);

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
				<div key={i} style={{ color: "#22863a" }}>
					+ {line}
				</div>
			));
		}
		if (!newContent) {
			// Deleted file
			return oldContent?.split("\n").map((line, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
				<div key={i} style={{ color: "#cb2431" }}>
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
					<div key={`${i}-${j}`} style={{ color: "#24292e" }}>
						{" "}
						{oldLines[i]}
					</div>,
				);
				i++;
				j++;
			} else {
				if (i < oldLines.length) {
					diff.push(
						<div key={`old-${i}`} style={{ color: "#cb2431" }}>
							- {oldLines[i]}
						</div>,
					);
					i++;
				}
				if (j < newLines.length) {
					diff.push(
						<div key={`new-${j}`} style={{ color: "#22863a" }}>
							+ {newLines[j]}
						</div>,
					);
					j++;
				}
			}
		}

		return diff;
	};

	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(2, 1fr)",
				gap: "2rem",
				padding: "1rem",
				maxWidth: "1600px",
				margin: "0 auto",
			}}
		>
			<div
				style={{
					display: "grid",
					gridTemplateRows: "auto auto 1fr auto",
					gap: "1.5rem",
				}}
			>
				<div
					style={{
						display: "grid",
						gap: "1rem",
						padding: "1rem",
						backgroundColor: "#fff",
						borderRadius: "4px",
						border: "1px solid #eee",
					}}
				>
					{!isBrowserSupported && (
						<div
							style={{
								color: "red",
								padding: "0.5rem",
								backgroundColor: "#ffebee",
								borderRadius: "4px",
							}}
						>
							Your browser does not support the File System Access API. Please
							try again in a different browser, such as Chrome.
						</div>
					)}
					<div>
						Select a directory on your file-system to watch for changes. The
						files will be listed below. If you have a .gitignore file in the
						directory, the files will be filtered according to the rules in that
						file.
					</div>
					<div>
						Component will re-render when files are added, changed, or deleted.
						When a file changes, its contents will be displayed as a diff on the
						right.
					</div>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "1rem",
							padding: "0.5rem",
							backgroundColor: "#f8f9fa",
							borderRadius: "4px",
						}}
					>
						<div>Number of renders: {renderCount}</div>
						<div>Number of files: {files.size}</div>
						{isLoading && (
							<div
								style={{
									color: "blue",
									fontSize: "0.875rem",
									gridColumn: "1 / -1",
									textAlign: "center",
								}}
							>
								(Loading directory...)
							</div>
						)}
					</div>
					<div
						style={{
							display: "flex",
							gap: "1rem",
							justifyContent: "center",
						}}
					>
						<button
							type="button"
							onClick={handleDirectorySelection}
							disabled={isLoading}
							style={{
								padding: "0.5rem 1rem",
								borderRadius: "4px",
								border: "1px solid #ddd",
								backgroundColor: "#fff",
								cursor: isLoading ? "not-allowed" : "pointer",
							}}
						>
							Select Directory
						</button>
						<button
							type="button"
							onClick={handleClear}
							disabled={isLoading}
							style={{
								padding: "0.5rem 1rem",
								borderRadius: "4px",
								border: "1px solid #ddd",
								backgroundColor: "#fff",
								cursor: isLoading ? "not-allowed" : "pointer",
							}}
						>
							Clear
						</button>
					</div>
				</div>

				<div
					style={{
						padding: "1rem",
						backgroundColor: "#fff",
						borderRadius: "4px",
						border: "1px solid #eee",
					}}
				>
					<h3 style={{ margin: "0 0 1rem 0" }}>Current Files:</h3>
					<div
						style={{
							display: "grid",
							gap: "0.5rem",
							opacity: isLoading ? 0.6 : 1,
							maxHeight: "200px",
							overflow: "auto",
						}}
					>
						{Array.from(files).map(([filePath]) => (
							<div
								key={filePath}
								style={{
									padding: "0.25rem 0.5rem",
									borderRadius: "2px",
									backgroundColor: "#f8f9fa",
									fontSize: "0.875rem",
								}}
							>
								{filePath}
							</div>
						))}
						{files.size === 0 && (
							<div
								style={{
									color: "#666",
									fontStyle: "italic",
									textAlign: "center",
								}}
							>
								No files selected
							</div>
						)}
					</div>
				</div>

				<div
					style={{
						padding: "1rem",
						backgroundColor: "#fff",
						borderRadius: "4px",
						border: "1px solid #eee",
					}}
				>
					<h3 style={{ margin: "0 0 1rem 0" }}>File History:</h3>
					<div
						style={{
							display: "grid",
							gap: "0.5rem",
							maxHeight: "200px",
							overflow: "auto",
						}}
					>
						{fileHistory.map((entry) => (
							<div
								key={`${entry.path}-${entry.timestamp}`}
								style={{
									color: entry.type === "added" ? "#22863a" : "#cb2431",
									fontSize: "0.875rem",
									padding: "0.25rem 0.5rem",
									backgroundColor:
										entry.type === "added" ? "#e6ffec" : "#ffebe9",
									borderRadius: "2px",
								}}
							>
								<span style={{ color: "#666" }}>
									[{formatTimestamp(entry.timestamp)}]
								</span>{" "}
								<strong>{entry.type === "added" ? "Added" : "Removed"}:</strong>{" "}
								{entry.path}
							</div>
						))}
						{fileHistory.length === 0 && (
							<div
								style={{
									color: "#666",
									fontStyle: "italic",
									textAlign: "center",
								}}
							>
								No file changes yet
							</div>
						)}
					</div>
				</div>
			</div>

			<div
				style={{
					backgroundColor: "#fff",
					borderRadius: "4px",
					border: "1px solid #eee",
					display: "grid",
					gridTemplateRows: "auto 1fr",
				}}
			>
				<div
					style={{
						padding: "1rem",
						borderBottom: selectedFile.content ? "1px solid #eee" : "none",
					}}
				>
					<h3 style={{ margin: 0 }}>
						{selectedFile.content
							? `File Changes: ${selectedFile.path}`
							: "File Changes"}
					</h3>
				</div>
				<div
					style={{
						padding: "1rem",
						overflow: "auto",
						fontFamily: "monospace",
						whiteSpace: "pre",
						fontSize: "0.875rem",
						backgroundColor: "#f8f9fa",
						margin: "0.5rem",
						borderRadius: "4px",
						minHeight: "400px",
					}}
				>
					{selectedFile.content ? (
						<div style={{ marginTop: "0.5rem" }}>
							{renderDiff(selectedFile.previousContent, selectedFile.content)}
						</div>
					) : (
						<div
							style={{
								height: "100%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "#666",
								fontStyle: "italic",
							}}
						>
							No file changes to display
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
