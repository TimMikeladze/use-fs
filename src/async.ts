/** Small async primitives shared by the scanner and the hook. */

/**
 * Runs `task` over `items` with at most `limit` tasks in flight.
 *
 * Unlike a batched `Promise.all` there is no barrier between groups: as soon as
 * one task settles the next item starts, so a single slow file cannot stall the
 * whole batch.
 */
export const mapLimit = async <T>(
	items: readonly T[],
	limit: number,
	task: (item: T, index: number) => Promise<void>,
): Promise<void> => {
	const size = Math.max(1, Math.floor(limit) || 1);

	if (items.length <= size) {
		await Promise.all(items.map(task));
		return;
	}

	let cursor = 0;

	const worker = async () => {
		while (cursor < items.length) {
			const index = cursor;
			cursor += 1;
			await task(items[index] as T, index);
		}
	};

	await Promise.all(Array.from({ length: size }, worker));
};

/** True for a `DOMException` (or `Error`) with the given `name`. */
export const isErrorWithName = (value: unknown, name: string): boolean =>
	value instanceof Error && value.name === name;

/** True when the user dismissed a picker dialog. */
export const isAbortError = (value: unknown): boolean =>
	isErrorWithName(value, "AbortError");

/** True when a handle no longer resolves to an entry on disk. */
export const isNotFoundError = (value: unknown): boolean =>
	isErrorWithName(value, "NotFoundError");

/**
 * True when an entry is locked by another context - most often a worker
 * holding a `createSyncAccessHandle()` on the file, which is exclusive.
 */
export const isLockedError = (value: unknown): boolean =>
	isErrorWithName(value, "NoModificationAllowedError");

/**
 * Rewraps a lock conflict on `path` with a message that says what happened,
 * keeping the `NoModificationAllowedError` name so {@link isLockedError} still
 * matches. Anything else is returned unchanged.
 */
export const describeLockError = (
	value: unknown,
	path: string,
	{ directory = false }: { directory?: boolean } = {},
): unknown => {
	if (!isLockedError(value)) {
		return value;
	}

	const subject = directory ? `A file inside "${path}"` : `"${path}"`;
	const error = new Error(
		`${subject} is locked by another context, most likely a worker holding a sync access handle on it. Retry once that handle is closed.`,
		{ cause: value },
	);
	error.name = "NoModificationAllowedError";

	return error;
};

/** Normalises anything thrown into an `Error`. */
export const toError = (value: unknown): Error => {
	if (value instanceof Error) {
		return value;
	}

	return new Error(typeof value === "string" ? value : JSON.stringify(value));
};
