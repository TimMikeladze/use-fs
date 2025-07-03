# 🗂️ use-fs

A React hook for integrating with the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API). Visit [**use-fs.com**](https://use-fs.com) to try it out in your browser.

The File System Access API enables web applications to seamlessly work with files on a user's local system. After a user grants permission, web apps can read, write, and manage files directly - eliminating the need for repeated file selection dialogs. This capability is ideal for creating powerful browser-based tools.

Unlike traditional file selection dialogs, the user will be prompted to select a directory, the hook will watch the files in that directory for changes - rerendering when changes are detected.

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
    onDirectorySelection, 
    files,
    isBrowserSupported,
    onClear,
    isProcessing,
    writeFile,
    deleteFile,
    startPolling,
    stopPolling,
    isPolling
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

  const handleSaveFile = async (path: string, content: string) => {
    try {
      await writeFile(path, content, { truncate: true });
      console.log('File saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const handleDeleteFile = async (path: string) => {
    try {
      await deleteFile(path);
      console.log('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

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

      <button 
        onClick={startPolling}
        disabled={isProcessing || isPolling}
      >
        Start Polling
      </button>

      <button 
        onClick={stopPolling}
        disabled={isProcessing || !isPolling}
      >
        Stop Polling
      </button>

      <div>
        Status: {isPolling ? 'Polling Active' : 'Polling Stopped'}
      </div>

      {files.size > 0 && (
        <div>
          <h2>Files ({files.size}):</h2>
          <div>
            {Array.from(files.entries()).map(([path, content]) => (
              <div key={path}>
                <h3>{path}</h3>
                <pre>{content}</pre>
                <button onClick={() => handleSaveFile(path, 'New content')}>
                  Save Changes
                </button>
                <button onClick={() => handleDeleteFile(path)}>
                  Delete File
                </button>
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
2. **File Writing**: Allows writing content to files with options for truncation and creation.
3. **File Deletion**: Enables safe removal of files from the selected directory.
4. **File Watching**: Continuously monitors selected directory for changes with automatic polling.
5. **Polling Control**: Manual control over when to start/stop monitoring for file changes.
6. **Content Management**: Provides access to file contents and updates in real-time.
7. **Filtering**: Built-in and custom filters to exclude unwanted files/directories.
8. **Performance Optimizations**: 
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
- `writeFile: (path: string, data: string | ArrayBuffer | Blob, options?: FileWriteOptions) => Promise<void>` - Function to write to files
- `deleteFile: (path: string) => Promise<void>` - Function to delete files
- `startPolling: () => void` - Function to manually start polling for file changes
- `stopPolling: () => void` - Function to manually stop polling for file changes  
- `isPolling: boolean` - Whether the hook is actively polling for changes


## 📚 Contributing

1. Navigate to the `docs` directory
2. Run `pnpm install` to install the dependencies
3. Run `pnpm dev` to start the development server
3. Navigate to `http://localhost:3000` to view the demo.
5. Modify the `Demo.tsx` file to make your changes.

If you're making changes to the `use-fs` package, you can run `pnpm build` to build the package and then run `pnpm link use-fs` to link the package to the `docs` directory for local development and testing.