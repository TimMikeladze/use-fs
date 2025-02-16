import ignore from "ignore";
import {
	type EffectCallback,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

export type FileWriteOptions = {
	/** Whether to create the file if it doesn't exist */
	create?: boolean;
	/** Whether to truncate the file if it exists */
	truncate?: boolean;
};

export type FileOperations = {
	/** Write data to a file at the specified path */
	writeFile: (
		path: string,
		data: string | ArrayBuffer | Blob,
		options?: FileWriteOptions,
	) => Promise<void>;

	/** Create a new file at the specified path */
	createFile: (
		path: string,
		initialData?: string | ArrayBuffer | Blob,
	) => Promise<FileSystemFileHandle>;

	/** Delete a file at the specified path */
	deleteFile: (path: string) => Promise<void>;
};

export type Filter = {
	shouldIncludeFile: (
		filepath: string,
		handle: FileSystemHandle,
	) => Promise<boolean>;
	shouldProcessDirectory: (
		filepath: string,
		handle: FileSystemHandle,
	) => Promise<boolean>;
};

export type FilterFn = () => Promise<Filter>;

export const gitFilter: FilterFn = async () => {
	const ig = ignore({
		allowRelativePaths: true,
	});

	// TODO support multiple gitignore files
	let gitIgnoreLoaded = false;

	return {
		shouldIncludeFile: async (filepath: string, handle: FileSystemHandle) => {
			if (
				filepath.endsWith(".gitignore") &&
				!gitIgnoreLoaded &&
				handle.kind === "file"
			) {
				const fileHandle = handle as FileSystemFileHandle;
				const file = await fileHandle.getFile();
				const text = await file.text();
				ig.add(text);
				gitIgnoreLoaded = true;
				return false;
			}
			const { ignored } = ig.test(filepath);

			return !ignored;
		},
		shouldProcessDirectory: async (
			filepath: string,
			_handle: FileSystemHandle,
		) => {
			const { ignored } = ig.test(filepath);

			if (filepath.endsWith(".git")) {
				return false;
			}

			if (filepath.includes(".git/")) {
				return false;
			}

			return !ignored;
		},
	};
};

export const distFilter: FilterFn = async () => {
	const isDist = (filepath: string) => {
		if (filepath.includes("/dist/")) {
			return true;
		}
		if (filepath.includes("/out/")) {
			return true;
		}
		if (filepath.includes("/build/")) {
			return true;
		}
		if (filepath.includes("/vendor/")) {
			return true;
		}
		if (filepath.includes("/node_modules/")) {
			return true;
		}
		if (filepath.includes("/.next/")) {
			return true;
		}
		return false;
	};
	return {
		shouldIncludeFile: async (filepath: string, _handle: FileSystemHandle) => {
			if (isDist(filepath)) {
				return false;
			}
			return true;
		},
		shouldProcessDirectory: async (
			filepath: string,
			_handle: FileSystemHandle,
		) => {
			if (isDist(filepath)) {
				return false;
			}
			return true;
		},
	};
};

export const miscFilter: FilterFn = async () => {
	const isMisc = (filepath: string) => {
		if (filepath.endsWith(".DS_Store")) {
			return true;
		}
		if (filepath.endsWith(".crswap")) {
			return true;
		}
		return false;
	};
	return {
		shouldIncludeFile: async (filepath: string, _handle: FileSystemHandle) => {
			if (isMisc(filepath)) {
				return false;
			}
			return true;
		},
		shouldProcessDirectory: async (
			filepath: string,
			_handle: FileSystemHandle,
		) => {
			if (isMisc(filepath)) {
				return false;
			}
			return true;
		},
	};
};

export const commonFilters = [distFilter, miscFilter, gitFilter];

/* eslint-disable no-undef */
export const processDirectory = async (
	directoryHandle: FileSystemDirectoryHandle,
	directoryPath: string,
	filters: Filter[],
	includeFiles: Map<string, FileSystemFileHandle>,
	ignoreFilePaths: Set<string>,
): Promise<Map<string, FileSystemFileHandle>> => {
	// Early exit if directory is already ignored
	if (ignoreFilePaths.has(directoryPath)) {
		return includeFiles;
	}

	// Check directory against filters first
	for (const filter of filters) {
		if (
			(await filter.shouldProcessDirectory(directoryPath, directoryHandle)) ===
			false
		) {
			ignoreFilePaths.add(directoryPath);
			return includeFiles;
		}
	}

	// Process files first
	const filePromises: Promise<void>[] = [];
	// @ts-ignore
	for await (const entry of directoryHandle.values()) {
		if (entry.kind === "file") {
			const path = `${directoryPath}/${entry.name}`;
			if (!ignoreFilePaths.has(path)) {
				filePromises.push(
					(async () => {
						let shouldInclude = true;
						for (const filter of filters) {
							if (
								(await filter.shouldIncludeFile(
									path,
									entry as FileSystemFileHandle,
								)) === false
							) {
								shouldInclude = false;
								ignoreFilePaths.add(path);
								includeFiles.delete(path);
								break;
							}
						}
						if (shouldInclude) {
							includeFiles.set(path, entry as FileSystemFileHandle);
						}
					})(),
				);
			}
		}
	}
	await Promise.all(filePromises);

	// Process directories
	const dirPromises: Promise<Map<string, FileSystemFileHandle>>[] = [];
	// @ts-ignore
	for await (const entry of directoryHandle.values()) {
		if (entry.kind === "directory") {
			const path = `${directoryPath}/${entry.name}`;
			if (!ignoreFilePaths.has(path)) {
				dirPromises.push(
					processDirectory(
						entry as FileSystemDirectoryHandle,
						path,
						filters,
						includeFiles,
						ignoreFilePaths,
					),
				);
			}
		}
	}
	await Promise.all(dirPromises);

	return includeFiles;
};

const useDebounce = <T>(value: T, delay: number): T => {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
};

export interface UseFileHandlingHookProps {
	filters?: FilterFn[];
	onFilesAdded?: (
		newFiles: Map<string, string>,
		previousFiles: Map<string, string>,
	) => void;
	onFilesChanged?: (
		changedFiles: Map<string, string>,
		previousFiles: Map<string, string>,
	) => void;
	onFilesDeleted?: (
		deletedFiles: Map<string, string>,
		previousFiles: Map<string, string>,
	) => void;
	pollInterval?: number;
	batchSize?: number;
	debounceInterval?: number;
	/** Time in milliseconds to cache file contents before re-reading from disk. Defaults to 5000ms (5 seconds) */
	fileCacheTtl?: number;
}

const DEFAULT_POLL_INTERVAL = 100;
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_DEBOUNCE_INTERVAL = 50;
const DEFAULT_FILE_CACHE_TTL = 5000; // 5 seconds

export const useFileSystem = (props: UseFileHandlingHookProps) => {
	const {
		onFilesAdded: onAddFile,
		onFilesChanged: onChangeFile,
		onFilesDeleted: onDeleteFile,
		batchSize = DEFAULT_BATCH_SIZE,
		debounceInterval = DEFAULT_DEBOUNCE_INTERVAL,
	} = props;

	const watchedDirectoriesRef = useRef<Map<string, FileSystemDirectoryHandle>>(
		new Map(),
	);
	const handlesRef = useRef<Map<string, FileSystemFileHandle>>(new Map());
	const previousHandlesRef = useRef<Set<string>>(new Set());
	const filesMapRef = useRef<Record<string, string>>({});
	const previousFilesMapRef = useRef<Record<string, string>>({});
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const [files, setFiles] = useState<Map<string, string>>(new Map());
	const [isProcessing, setIsProcessing] = useState(false);

	// Add a cache for file contents
	const fileContentsCache = useRef<
		Map<string, { content: string; timestamp: number }>
	>(new Map());
	const fileCacheTtl = props.fileCacheTtl || DEFAULT_FILE_CACHE_TTL;

	const clearWatchedDirectories = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		watchedDirectoriesRef.current.clear();
		handlesRef.current.clear();
		previousHandlesRef.current.clear();
		filesMapRef.current = {};
		previousFilesMapRef.current = {};
		fileContentsCache.current.clear();
		setFiles(new Map());
	}, []);

	const processWatchedDirectories = useCallback(async () => {
		const temporaryHandles = new Map<string, FileSystemFileHandle>();
		const ignoreFilePaths = new Set<string>();

		const filterFns: FilterFn[] = props.filters || commonFilters;
		const filters: Filter[] = [];

		for (const filterFn of filterFns) {
			filters.push(await filterFn());
		}

		const dirPromises: Promise<Map<string, FileSystemFileHandle>>[] = [];
		watchedDirectoriesRef.current.forEach((directoryHandle, directoryPath) => {
			dirPromises.push(
				processDirectory(
					directoryHandle,
					directoryPath,
					filters,
					temporaryHandles,
					ignoreFilePaths,
				),
			);
		});

		await Promise.all(dirPromises);

		temporaryHandles.forEach((_, filePath) => {
			if (ignoreFilePaths.has(filePath)) {
				temporaryHandles.delete(filePath);
			}
		});

		handlesRef.current = temporaryHandles;
	}, [props.filters]);

	const processFiles = useCallback(async () => {
		previousFilesMapRef.current = {
			...(filesMapRef.current || {}),
		};

		const seenFiles = new Set<string>();
		const changedFiles = new Map<string, string>();
		const deletedFilesSet = new Set<string>();
		let rerender = false;

		const now = Date.now();
		const handles = Array.from(handlesRef.current);
		const newFilesMap: Record<string, string> = {};

		for (let i = 0; i < handles.length; i += batchSize) {
			const batch = handles.slice(i, i + batchSize);
			await Promise.all(
				batch.map(async ([filePath, handle]) => {
					if (handle.kind === "file") {
						seenFiles.add(filePath);

						try {
							const cached = fileContentsCache.current.get(filePath);
							if (cached && now - cached.timestamp < fileCacheTtl) {
								newFilesMap[filePath] = cached.content;
								if (cached.content !== previousFilesMapRef.current[filePath]) {
									changedFiles.set(filePath, cached.content);
								}
								return;
							}

							const file = await (handle as FileSystemFileHandle).getFile();
							const text = await file.text();
							fileContentsCache.current.set(filePath, {
								content: text,
								timestamp: now,
							});

							newFilesMap[filePath] = text;
							if (text !== previousFilesMapRef.current[filePath]) {
								changedFiles.set(filePath, text);
							}
						} catch (error) {
							handlesRef.current.delete(filePath);
							deletedFilesSet.add(filePath);
							fileContentsCache.current.delete(filePath);
							rerender = true;
						}
					}
				}),
			);
		}

		// Clean up old cache entries
		const cacheEntries = Array.from(fileContentsCache.current.entries());
		for (const [path, { timestamp }] of cacheEntries) {
			if (now - timestamp > fileCacheTtl) {
				fileContentsCache.current.delete(path);
			}
		}

		const deletedFiles = Array.from([
			...Array.from(previousHandlesRef.current),
			...Array.from(deletedFilesSet),
		]).filter((filePath) => !seenFiles.has(filePath));

		const addedFiles = Array.from(seenFiles).filter(
			(filePath) => !previousHandlesRef.current.has(filePath),
		);

		const addedFilesMap = new Map<string, string>();

		for (const addedFile of addedFiles) {
			addedFilesMap.set(addedFile, filesMapRef.current[addedFile]);
		}

		const deletedFilesMap = new Map<string, string>();

		for (const deletedFile of deletedFiles) {
			deletedFilesMap.set(deletedFile, filesMapRef.current[deletedFile]);
			handlesRef.current.delete(deletedFile);
			delete filesMapRef.current[deletedFile];
		}

		const previousFiles = new Map<string, string>(
			Array.from(previousHandlesRef.current).map((filePath) => [
				filePath,
				filesMapRef.current[filePath],
			]),
		);

		if (changedFiles.size > 0) {
			rerender = true;
			onChangeFile?.(changedFiles, previousFiles);
		}

		if (deletedFiles.length > 0) {
			rerender = true;
			onDeleteFile?.(deletedFilesMap, previousFiles);
		}

		if (addedFiles.length > 0) {
			rerender = true;
			onAddFile?.(addedFilesMap, previousFiles);
		}

		previousHandlesRef.current = seenFiles;
		filesMapRef.current = newFilesMap;

		if (rerender) {
			setFiles(new Map(Object.entries(filesMapRef.current)));
		}
	}, [onAddFile, onChangeFile, onDeleteFile, batchSize, fileCacheTtl]);

	// Debounce the files state update
	const debouncedFiles = useDebounce(files, debounceInterval);

	const startPollingWatchedDirectories = useCallback(() => {
		let processingPromise: Promise<void> | null = null;

		// Only start a new interval if one isn't already running
		if (!intervalRef.current) {
			intervalRef.current = setInterval(async () => {
				if (isProcessing || processingPromise) {
					return;
				}

				setIsProcessing(true);
				processingPromise = (async () => {
					try {
						await processWatchedDirectories();
						await processFiles();
					} finally {
						setIsProcessing(false);
						processingPromise = null;
					}
				})();
			}, props.pollInterval || DEFAULT_POLL_INTERVAL);
		}
	}, [
		processWatchedDirectories,
		processFiles,
		isProcessing,
		props.pollInterval,
	]);

	const onDirectorySelection = async () => {
		try {
			// @ts-ignore
			const directoryHandle = await window.showDirectoryPicker();

			if (!directoryHandle) {
				return;
			}

			const initialDirectoryPath = directoryHandle.name;
			watchedDirectoriesRef.current.set(initialDirectoryPath, directoryHandle);
			startPollingWatchedDirectories();
		} catch (error) {
			console.error("Error during directory selection:");
			console.error(error);
		}
	};

	const writeFile = useCallback(
		async (
			path: string,
			data: string | ArrayBuffer | Blob,
			options: FileWriteOptions = {},
		) => {
			// Validate path
			if (!path || typeof path !== "string") {
				throw new Error("Invalid file path");
			}

			const { create = true, truncate = false } = options;
			const handle = handlesRef.current.get(path);

			if (!handle) {
				if (!create) {
					throw new Error(`File not found: ${path}`);
				}
				// Create new file
				const directoryPath = path.substring(0, path.lastIndexOf("/"));
				const fileName = path.substring(path.lastIndexOf("/") + 1);

				// Validate directory path
				if (!(directoryPath && fileName)) {
					throw new Error("Invalid file path structure");
				}

				const dirHandle = watchedDirectoriesRef.current.get(directoryPath);

				if (!dirHandle) {
					throw new Error(`Directory not found: ${directoryPath}`);
				}

				const fileHandle = await dirHandle.getFileHandle(fileName, {
					create: true,
				});
				handlesRef.current.set(path, fileHandle);
			}

			const fileHandle = handlesRef.current.get(path);
			if (!fileHandle) {
				throw new Error(`File not found: ${path}`);
			}

			// Double-check we're writing to the correct file
			if (fileHandle.name !== path.split("/").pop()) {
				throw new Error("File path mismatch");
			}

			const writable = await fileHandle.createWritable({
				keepExistingData: !truncate,
			});

			try {
				await writable.write(data);
				await writable.close();

				// Update cache and trigger change events
				const content =
					typeof data === "string" ? data : await new Response(data).text();
				fileContentsCache.current.set(path, {
					content,
					timestamp: Date.now(),
				});

				const changedFiles = new Map([[path, content]]);
				const previousFiles = new Map(
					Array.from(previousHandlesRef.current).map((filePath) => [
						filePath,
						filesMapRef.current[filePath],
					]),
				);

				onChangeFile?.(changedFiles, previousFiles);
				filesMapRef.current[path] = content;
				setFiles(new Map(Object.entries(filesMapRef.current)));
			} catch (error) {
				await writable.abort();
				throw error;
			}
		},
		[onChangeFile],
	);

	const createFile = useCallback(
		async (path: string, initialData?: string | ArrayBuffer | Blob) => {
			const directoryPath = path.substring(0, path.lastIndexOf("/"));
			const fileName = path.substring(path.lastIndexOf("/") + 1);
			const dirHandle = watchedDirectoriesRef.current.get(directoryPath);

			if (!dirHandle) {
				throw new Error(`Directory not found: ${directoryPath}`);
			}

			const fileHandle = await dirHandle.getFileHandle(fileName, {
				create: true,
			});
			handlesRef.current.set(path, fileHandle);

			if (initialData) {
				await writeFile(path, initialData, { truncate: true });
			}

			return fileHandle;
		},
		[writeFile],
	);

	const deleteFile = useCallback(
		async (path: string) => {
			const handle = handlesRef.current.get(path);
			if (!handle) {
				throw new Error(`File not found: ${path}`);
			}

			const directoryPath = path.substring(0, path.lastIndexOf("/"));
			const fileName = path.substring(path.lastIndexOf("/") + 1);
			const dirHandle = watchedDirectoriesRef.current.get(directoryPath);

			if (!dirHandle) {
				throw new Error(`Directory not found: ${directoryPath}`);
			}

			await dirHandle.removeEntry(fileName);
			handlesRef.current.delete(path);
			fileContentsCache.current.delete(path);

			const deletedFiles = new Map([[path, filesMapRef.current[path]]]);
			const previousFiles = new Map(
				Array.from(previousHandlesRef.current).map((filePath) => [
					filePath,
					filesMapRef.current[filePath],
				]),
			);

			delete filesMapRef.current[path];
			previousHandlesRef.current.delete(path);

			onDeleteFile?.(deletedFiles, previousFiles);
			setFiles(new Map(Object.entries(filesMapRef.current)));
		},
		[onDeleteFile],
	);

	useUnmount(() => {
		clearWatchedDirectories();
	});

	return {
		handles: handlesRef.current,
		onDirectorySelection,
		onClear: clearWatchedDirectories,
		files: debouncedFiles,
		setFiles,
		isProcessing,
		isBrowserSupported: window !== undefined && "showDirectoryPicker" in window,
		writeFile,
		createFile,
		deleteFile,
	};
};

export const useFs = useFileSystem;

// below is copied from usehooks-ts

const useEffectOnce = (effect: EffectCallback) => {
	useEffect(effect, []);
};

const useUnmount = (fn: () => void): void => {
	const fnRef = useRef(fn);

	fnRef.current = fn;

	useEffectOnce(() => () => fnRef.current());
};
