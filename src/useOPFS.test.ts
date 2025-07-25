import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOPFS } from "./index";

// Mock the navigator.storage API
const mockNavigator = {
	storage: {
		getDirectory: vi.fn(),
	},
};

// Mock FileSystemDirectoryHandle
class MockFileSystemDirectoryHandle {
	private entriesMap = new Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>();
	name: string;
	kind = "directory" as const;

	constructor(name = "root") {
		this.name = name;
	}

	getFileHandle(name: string, options?: { create?: boolean }) {
		const existing = this.entriesMap.get(name);
		if (existing && existing.kind === "file") {
			return existing;
		}
		if (!(existing || options?.create)) {
			throw new Error(`File not found: ${name}`);
		}
		const handle = new MockFileSystemFileHandle(name);
		this.entriesMap.set(name, handle);
		return handle;
	}

	getDirectoryHandle(name: string, options?: { create?: boolean }) {
		const existing = this.entriesMap.get(name);
		if (existing && existing.kind === "directory") {
			return existing;
		}
		if (!(existing || options?.create)) {
			throw new Error(`Directory not found: ${name}`);
		}
		const handle = new MockFileSystemDirectoryHandle(name);
		this.entriesMap.set(name, handle);
		return handle;
	}

	removeEntry(name: string, _options?: { recursive?: boolean }) {
		if (!this.entriesMap.has(name)) {
			throw new Error(`Entry not found: ${name}`);
		}
		this.entriesMap.delete(name);
	}

	*entries(): IterableIterator<[string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle]> {
		for (const [name, handle] of this.entriesMap) {
			yield [name, handle];
		}
	}
}

// Mock FileSystemFileHandle
class MockFileSystemFileHandle {
	name: string;
	kind = "file" as const;
	private content = "";

	constructor(name: string) {
		this.name = name;
	}

	async getFile() {
		return {
			text: async () => this.content,
			size: this.content.length,
		};
	}

	async createWritable() {
		return {
			write: async (data: string | ArrayBuffer | Blob) => {
				if (typeof data === "string") {
					this.content = data;
				} else if (data instanceof Blob) {
					this.content = await data.text();
				} else {
					this.content = new TextDecoder().decode(data);
				}
			},
			close: async () => {},
			abort: async () => {},
		};
	}
}

describe("useOPFS", () => {
	beforeEach(() => {
		// Reset the mock
		vi.clearAllMocks();

		// Setup navigator mock
		Object.defineProperty(global, "navigator", {
			value: mockNavigator,
			writable: true,
		});

		// Setup a mock root directory
		const rootDir = new MockFileSystemDirectoryHandle();
		mockNavigator.storage.getDirectory.mockResolvedValue(rootDir);
	});

	it("should detect browser support", () => {
		const { result } = renderHook(() => useOPFS());
		expect(result.current.isSupported).toBe(true);
	});

	it("should detect lack of browser support", () => {
		Object.defineProperty(global, "navigator", {
			value: {},
			writable: true,
		});

		const { result } = renderHook(() => useOPFS());
		expect(result.current.isSupported).toBe(false);

		// Restore navigator for other tests
		Object.defineProperty(global, "navigator", {
			value: mockNavigator,
			writable: true,
		});
	});

	it("should write and read a file", async () => {
		const { result } = renderHook(() => useOPFS());

		await act(async () => {
			await result.current.writeFile("test.txt", "Hello, OPFS!");
		});

		await act(async () => {
			const content = await result.current.readFile("test.txt");
			expect(content).toBe("Hello, OPFS!");
		});
	});

	it("should check if file exists", async () => {
		const { result } = renderHook(() => useOPFS());

		// File should not exist initially
		await act(async () => {
			const exists = await result.current.exists("test.txt");
			expect(exists).toBe(false);
		});

		// Create file
		await act(async () => {
			await result.current.writeFile("test.txt", "content");
		});

		// File should exist now
		await act(async () => {
			const exists = await result.current.exists("test.txt");
			expect(exists).toBe(true);
		});
	});

	it("should delete a file", async () => {
		const { result } = renderHook(() => useOPFS());

		// Create file
		await act(async () => {
			await result.current.writeFile("test.txt", "content");
		});

		// Verify it exists
		await act(async () => {
			const exists = await result.current.exists("test.txt");
			expect(exists).toBe(true);
		});

		// Delete file
		await act(async () => {
			await result.current.deleteFile("test.txt");
		});

		// Verify it's deleted
		await act(async () => {
			const exists = await result.current.exists("test.txt");
			expect(exists).toBe(false);
		});
	});

	it("should create and list directories", async () => {
		const { result } = renderHook(() => useOPFS());

		// Create directory
		await act(async () => {
			await result.current.createDirectory("testdir");
		});

		// List files in root
		await act(async () => {
			const files = await result.current.listFiles();
			expect(files).toHaveLength(1);
			expect(files[0].name).toBe("testdir");
			expect(files[0].kind).toBe("directory");
		});
	});

	it("should get file info", async () => {
		const { result } = renderHook(() => useOPFS());

		// Create file
		await act(async () => {
			await result.current.writeFile("test.txt", "Hello");
		});

		// Get file info
		await act(async () => {
			const info = await result.current.getFileInfo("test.txt");
			expect(info.name).toBe("test.txt");
			expect(info.kind).toBe("file");
			expect(info.size).toBe(5);
		});
	});

	it("should handle nested paths", async () => {
		const { result } = renderHook(() => useOPFS());

		// Create nested file
		await act(async () => {
			await result.current.writeFile("dir/subdir/test.txt", "Nested content");
		});

		// Read nested file
		await act(async () => {
			const content = await result.current.readFile("dir/subdir/test.txt");
			expect(content).toBe("Nested content");
		});

		// List files in nested directory
		await act(async () => {
			const files = await result.current.listFiles("dir/subdir");
			expect(files).toHaveLength(1);
			expect(files[0].name).toBe("test.txt");
		});
	});

	it("should handle errors gracefully", async () => {
		const onError = vi.fn();
		const { result } = renderHook(() => useOPFS({ onError }));

		// Try to read non-existent file
		await act(async () => {
			await expect(
				result.current.readFile("nonexistent.txt"),
			).rejects.toThrow();
			expect(onError).toHaveBeenCalled();
		});
	});

	it("should throw error when OPFS is not supported", async () => {
		Object.defineProperty(global, "navigator", {
			value: {},
			writable: true,
		});

		const { result } = renderHook(() => useOPFS());

		await act(async () => {
			await expect(result.current.readFile("test.txt")).rejects.toThrow(
				"OPFS is not supported in this browser",
			);
		});
	});
});
