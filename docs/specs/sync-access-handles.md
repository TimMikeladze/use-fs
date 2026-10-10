# Coexisting with workers that use sync access handles

`createSyncAccessHandle()` is the fast, worker-only OPFS write path (SQLite WASM,
large binary blobs). The hook stays on the main thread and keeps using
`getFile()` / `createWritable()`. These changes make the two cooperate.

## 1. Opt-in filter for binary files

Problem: a worker rewriting `app.sqlite` changes its size/mtime on almost every
poll, so `scan.ts` re-reads and UTF-8 decodes the whole database each tick.

- New `binaryFilter` (+ `DEFAULT_BINARY_FILE_SUFFIXES`), case-insensitive:
  SQLite databases and their `-wal` / `-shm` / `-journal` files (full suffixes
  like `.sqlite-wal`, so a text file named `dev-journal` survives), `.wasm`,
  archives, images, audio/video, fonts, `.pdf`.
- **Opt in, not part of `commonFilters`** - defaults do not change. Usage:
  `filters: [...commonFilters, binaryFilter]`.
- No content sniffing: an unknown-extension binary would need a byte read every
  poll since it never becomes a record. Extension list is cheap and predictable.

## 2. Name lock conflicts on write

A worker holding a sync handle has an exclusive lock; `createWritable()` and
`removeEntry()` reject with a bare `NoModificationAllowedError`.

- `async.ts`: `isLockedError(error)` (`NoModificationAllowedError`), exported.
- `writeFile`, `deleteFile`, `deleteDirectory` rethrow it as an `Error` whose
  message names the path and the likely cause, keeping
  `name = "NoModificationAllowedError"` and the original as `cause`, so
  `isLockedError` still matches.

## 3. Report a failing file once, not every poll

`scanDirectories` already keeps the last good record when a read fails, but calls
`onError` on every tick.

- New optional `ScanParams.failingPaths: Set<string>` (mutated by the scan). A
  read error is reported only when the path is not already in the set; a
  successful read (or the file disappearing) removes it.
- The hook owns one set in a ref and resets it on `clear()`.

## 4. Separate "can read OPFS" from "can write OPFS"

`createWritable()` only landed in Safari 26; Safari 15.2–18 read OPFS but can only
write through a worker's sync handle.

- `opfs.ts`: `isOpfsWritable()` - OPFS present and
  `FileSystemFileHandle.prototype.createWritable` exists. Hook exposes
  `isOpfsWritable`.
- `writeFile` throws a clear `NotSupportedError` when the handle has no
  `createWritable`, instead of `TypeError: createWritable is not a function`.
- README browser table and notes corrected.

## 5. Document the worker pattern

README section: worker owns bytes via sync handles and writes into a mount the
hook watches; changes show up after the worker's `flush()`/`close()` on the next
poll; keep DB files out of the watched tree (or opt into `binaryFilter`); lock
errors and what they mean.

## Tests

- filters: `binaryFilter` drops `app.sqlite`, `app.sqlite-wal`, `IMG.JPG`, keeps `a.ts`
  and `dev-journal`; `commonFilters` still keeps `logo.png`.
- hook: `writeFile` on a browser without `createWritable` creates no empty file.
- scan: a file that throws on read reports once across two scans, again after
  recovery-then-failure.
- hook: `writeFile` on a locked file rejects with `isLockedError` + path in
  message; `writeFile` without `createWritable` rejects with `NotSupportedError`.
- opfs: `isOpfsWritable` true/false.
