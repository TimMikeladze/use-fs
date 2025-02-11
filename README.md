# 🗂️ use-fs

A React hook for integrating with the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API).

The File System Access API enables web applications to seamlessly work with files on a user's local system. After a user grants permission, web apps can read, write, and manage files directly - eliminating the need for repeated file selection dialogs. This capability is ideal for creating powerful browser-based tools.

Unlike traditional file selection dialogs, the user will be prompted to select a directory, the hook will watch the files in that directory for changes - rerendering when changes are detected.

[**use-fs.com**](https://use-fs.app) to try it out.

> ⚠️ Note: The File System API is not supported in all browsers. Works on Desktop in Chrome, Edge and Opera.

## 📡 Install

```console
npm install use-fs

yarn add use-fs

pnpm add use-fs
```

> 👋 Hello there! Follow me [@linesofcode](https://twitter.com/linesofcode) or visit [linesofcode.dev](https://linesofcode.dev) for more cool projects like this one.

## 🚀 Getting Started

```tsx
import { useFs } from "use-fs";

function App() {
  const { 
    onDirectorySelection, // Function to trigger directory selection dialog
    files,               // Map of file paths to their contents
    isBrowserSupported,  // Boolean indicating if File System API is supported
    onClear,            // Function to clear selected directory and stop watching
    isProcessing        // Boolean indicating if files are being processed
  } = useFs({
    // Optional array of filter functions to exclude files/directories. By default `commonFilters` is used to ignore .git, node_modules, etc.
    filters: [
      // Built-in filters available:
      // - distFilter (excludes dist/, build/, node_modules/, etc.)
      // - gitFilter (respects .gitignore)
      // - miscFilter (excludes .DS_Store, etc.)
      // Or use commonFilters which includes all of the above
    ],
    
    // Called when new files are added to the watched directory
    onFilesAdded: (newFiles, previousFiles) => {
      console.log('Files added:', newFiles);
      // newFiles: Map<string, string> - path -> content
      // previousFiles: Map<string, string> - previous state
    },

    // Called when existing files are modified
    onFilesChanged: (changedFiles, previousFiles) => {
      console.log('Files changed:', changedFiles);
      // changedFiles: Map<string, string> - path -> new content
      // previousFiles: Map<string, string> - previous state
    },

    // Called when files are deleted from the watched directory
    onFilesDeleted: (deletedFiles, previousFiles) => {
      console.log('Files deleted:', deletedFiles);
      // deletedFiles: Map<string, string> - path -> last known content
      // previousFiles: Map<string, string> - previous state
    },
  });

  if (!isBrowserSupported) {
    return <div>Browser not supported</div>;
  }

  return (
    <div>
      <button 
        onClick={onDirectorySelection}
        disabled={isProcessing}
      >
        Select Directory
      </button>

      <button 
        onClick={onClear}
        disabled={isProcessing}
      >
        Clear
      </button>

      {files.size > 0 && (
        <div>
          <h2>Files ({files.size}):</h2>
          <div>
            {Array.from(files.entries()).map(([path, content]) => (
              <div key={path}>
                <h3>{path}</h3>
                <pre>{content}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

The hook provides several key features:

1. **File System Access**: Prompts users to select a directory and maintains access to it.
2. **File Watching**: Continuously monitors selected directory for changes.
3. **Content Management**: Provides access to file contents and updates in real-time.
4. **Filtering**: Built-in and custom filters to exclude unwanted files/directories.
5. **Performance Optimizations**: 
   - Batched file processing
   - Content caching
   - Debounced updates
   - Efficient change detection

### Props

- `filters?: FilterFn[]` - Array of filter functions to exclude files/directories
- `onFilesAdded?: (newFiles: Map<string, string>, previousFiles: Map<string, string>) => void` - Callback when files are added
- `onFilesChanged?: (changedFiles: Map<string, string>, previousFiles: Map<string, string>) => void` - Callback when files change
- `onFilesDeleted?: (deletedFiles: Map<string, string>, previousFiles: Map<string, string>) => void` - Callback when files are deleted
- `pollInterval?: number` - How often to check for changes (default: 100ms)
- `batchSize?: number` - How many files to process in parallel (default: 50)
- `debounceInterval?: number` - Debounce interval for updates (default: 50ms)
- `fileCacheTtl?: number` - How long to cache file contents (default: 5000ms)

### Return Values

- `onDirectorySelection: () => Promise<void>` - Function to open directory picker
- `onClear: () => void` - Function to stop watching and clear state
- `files: Map<string, string>` - Current map of file paths to contents
- `isProcessing: boolean` - Whether files are being processed
- `isBrowserSupported: boolean` - Whether File System API is supported