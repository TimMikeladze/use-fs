# 🗂️ use-fs

A React hook for integrating with the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) and [Origin Private File System (OPFS)](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API). Visit [**use-fs.com**](https://use-fs.com) to try it out in your browser.

This library provides two main hooks:

1. **`useFs`** - For working with the user's local file system via the File System Access API
2. **`useOPFS`** - For working with the Origin Private File System (OPFS)

## 🔄 File System Access API vs OPFS

| Feature | File System Access API (`useFs`) | OPFS (`useOPFS`) |
|---------|------------------------------|------------------|
| **User Permission** | Requires user permission prompt | No permission required |
| **File Location** | User's local file system | Private to your web app |
| **Persistence** | Files remain on user's device | Files persist in browser storage |
| **Browser Support** | Chrome, Edge, Opera (desktop) | Chrome, Firefox, Safari (modern) |
| **Use Case** | User file editing, document apps | App data, caching, temporary files |

The File System Access API enables web applications to seamlessly work with files on a user's local system. After a user grants permission, web apps can read, write, and manage files directly - eliminating the need for repeated file selection dialogs.

OPFS provides a private file system for web applications that persists across sessions without requiring user permission. It's ideal for storing application data, caches, and temporary files.

> ⚠️ Note: Browser support varies. `useFs` works on Desktop in Chrome, Edge and Opera. `useOPFS` works in modern browsers including Chrome, Firefox, and Safari.

## 📡 Install

```console
npm install use-fs

yarn add use-fs

pnpm add use-fs
```

> 👋 Hello there! Follow me [@linesofcode](https://twitter.com/linesofcode) or visit [linesofcode.dev](https://linesofcode.dev) for more cool projects like this one.

## 🚀 Getting Started

### Using the File System Access API (`useFs`)

The `useFs` hook provides access to the user's local file system with permission prompts and directory watching capabilities.

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

### Using the Origin Private File System (`useOPFS`)

The `useOPFS` hook provides access to a private file system for your web application without requiring user permissions.

```tsx
import { useOPFS } from "use-fs";

function OPFSApp() {
  const {
    isSupported,
    readFile,
    writeFile,
    deleteFile,
    createDirectory,
    deleteDirectory,
    listFiles,
    exists,
    getFileInfo
  } = useOPFS({
    onError: (error) => {
      console.error('OPFS Error:', error);
    }
  });

  if (!isSupported) {
    return <div>OPFS not supported in this browser</div>;
  }

  const handleCreateFile = async () => {
    try {
      await writeFile('documents/notes.txt', 'Hello, OPFS!');
      console.log('File created successfully');
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  const handleReadFile = async () => {
    try {
      const content = await readFile('documents/notes.txt');
      console.log('File content:', content);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const handleListFiles = async () => {
    try {
      const files = await listFiles('documents');
      console.log('Files in documents:', files);
    } catch (error) {
      console.error('Error listing files:', error);
    }
  };

  const handleCreateDirectory = async () => {
    try {
      await createDirectory('documents/photos');
      console.log('Directory created successfully');
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  };

  const handleCheckExists = async () => {
    try {
      const fileExists = await exists('documents/notes.txt');
      console.log('File exists:', fileExists);
    } catch (error) {
      console.error('Error checking file existence:', error);
    }
  };

  const handleGetFileInfo = async () => {
    try {
      const info = await getFileInfo('documents/notes.txt');
      console.log('File info:', info);
    } catch (error) {
      console.error('Error getting file info:', error);
    }
  };

  return (
    <div>
      <h2>OPFS File Operations</h2>
      <button onClick={handleCreateDirectory}>Create Directory</button>
      <button onClick={handleCreateFile}>Create File</button>
      <button onClick={handleReadFile}>Read File</button>
      <button onClick={handleListFiles}>List Files</button>
      <button onClick={handleCheckExists}>Check Exists</button>
      <button onClick={handleGetFileInfo}>Get File Info</button>
      <button onClick={() => deleteFile('documents/notes.txt')}>Delete File</button>
      <button onClick={() => deleteDirectory('documents', true)}>Delete Directory</button>
    </div>
  );
}
```

## 📚 API Reference

### `useFs` Hook

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

#### Props

- `filters?: FilterFn[]` - Array of filter functions to exclude files/directories
- `onFilesAdded?: (newFiles: Map<string, string>, previousFiles: Map<string, string>) => void` - Callback when files are added
- `onFilesChanged?: (changedFiles: Map<string, string>, previousFiles: Map<string, string>) => void` - Callback when files change
- `onFilesDeleted?: (deletedFiles: Map<string, string>, previousFiles: Map<string, string>) => void` - Callback when files are deleted
- `pollInterval?: number` - How often to check for changes (default: 100ms)
- `batchSize?: number` - How many files to process in parallel (default: 50)
- `debounceInterval?: number` - Debounce interval for updates (default: 50ms)
- `fileCacheTtl?: number` - How long to cache file contents (default: 5000ms)

#### Return Values

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

### `useOPFS` Hook

The `useOPFS` hook provides a simple API for working with the Origin Private File System without user permission prompts.

#### Props

- `onError?: (error: Error) => void` - Optional callback for error handling

#### Return Values

- `isSupported: boolean` - Whether OPFS is supported in the current browser
- `readFile: (path: string) => Promise<string>` - Read a file's content as text
- `writeFile: (path: string, content: string | ArrayBuffer | Blob) => Promise<void>` - Write content to a file
- `deleteFile: (path: string) => Promise<void>` - Delete a file
- `createDirectory: (path: string) => Promise<void>` - Create a directory (creates parent directories as needed)
- `deleteDirectory: (path: string, recursive?: boolean) => Promise<void>` - Delete a directory
- `listFiles: (path?: string) => Promise<OPFSFileInfo[]>` - List files and directories in a path
- `exists: (path: string) => Promise<boolean>` - Check if a file or directory exists
- `getFileInfo: (path: string) => Promise<OPFSFileInfo>` - Get detailed information about a file or directory

#### Types

```typescript
interface OPFSFileInfo {
  name: string;        // File/directory name
  path: string;        // Full path
  kind: "file" | "directory";
  size?: number;       // File size (only for files)
}
```


## 📚 Contributing

### Development

1. Navigate to the `docs` directory
2. Run `npm install` to install the dependencies
3. Run `npm dev` to start the development server
4. Navigate to `http://localhost:3000` to view the demo.
5. Modify the `Demo.tsx` file to make your changes.

If you're making changes to the `use-fs` package, you can run `npm build` to build the package and then run `npm link use-fs` to link the package to the `docs` directory for local development and testing.

### Example: Simple OPFS Note-Taking App

Here's a complete example of using `useOPFS` to build a simple note-taking application:

```tsx
import React, { useState, useEffect } from 'react';
import { useOPFS } from 'use-fs';

function NotesApp() {
  const [notes, setNotes] = useState<string[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');

  const {
    isSupported,
    readFile,
    writeFile,
    deleteFile,
    listFiles,
    createDirectory
  } = useOPFS({
    onError: (error) => {
      console.error('OPFS Error:', error);
      alert(`Error: ${error.message}`);
    }
  });

  // Load notes list on mount
  useEffect(() => {
    if (isSupported) {
      loadNotes();
    }
  }, [isSupported]);

  const loadNotes = async () => {
    try {
      // Ensure notes directory exists
      await createDirectory('notes');
      
      // List all notes
      const files = await listFiles('notes');
      const noteFiles = files
        .filter(file => file.kind === 'file' && file.name.endsWith('.txt'))
        .map(file => file.name.replace('.txt', ''));
      
      setNotes(noteFiles);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const saveNote = async () => {
    if (!currentNote.trim()) {
      alert('Please enter a note name');
      return;
    }

    try {
      await writeFile(`notes/${currentNote}.txt`, noteContent);
      await loadNotes(); // Refresh notes list
      setCurrentNote('');
      setNoteContent('');
      alert('Note saved successfully!');
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const loadNote = async (noteName: string) => {
    try {
      const content = await readFile(`notes/${noteName}.txt`);
      setSelectedNote(noteName);
      setNoteContent(content);
    } catch (error) {
      console.error('Failed to load note:', error);
    }
  };

  const deleteNote = async (noteName: string) => {
    if (!confirm(`Delete note "${noteName}"?`)) return;

    try {
      await deleteFile(`notes/${noteName}.txt`);
      await loadNotes(); // Refresh notes list
      if (selectedNote === noteName) {
        setSelectedNote(null);
        setNoteContent('');
      }
      alert('Note deleted successfully!');
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  if (!isSupported) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Notes App</h2>
        <p>Sorry, your browser doesn't support OPFS (Origin Private File System).</p>
        <p>Please use a modern browser like Chrome, Firefox, or Safari.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>📝 OPFS Notes App</h2>
      
      {/* Create new note */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Create New Note</h3>
        <input
          type="text"
          placeholder="Note name"
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <br /><br />
        <textarea
          placeholder="Note content"
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          rows={5}
          cols={50}
          style={{ width: '100%', padding: '5px' }}
        />
        <br /><br />
        <button onClick={saveNote} style={{ padding: '10px 20px' }}>
          Save Note
        </button>
      </div>

      {/* Notes list */}
      <div>
        <h3>Saved Notes ({notes.length})</h3>
        {notes.length === 0 ? (
          <p>No notes saved yet. Create your first note above!</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {notes.map((note) => (
              <div
                key={note}
                style={{
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  backgroundColor: selectedNote === note ? '#f0f0f0' : 'white'
                }}
              >
                <strong>{note}</strong>
                <div style={{ marginTop: '5px' }}>
                  <button
                    onClick={() => loadNote(note)}
                    style={{ marginRight: '10px', padding: '5px 10px' }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteNote(note)}
                    style={{ padding: '5px 10px', backgroundColor: '#ff6b6b', color: 'white' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current note editor */}
      {selectedNote && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <h3>Editing: {selectedNote}</h3>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={10}
            cols={50}
            style={{ width: '100%', padding: '5px' }}
          />
          <br /><br />
          <button
            onClick={async () => {
              await writeFile(`notes/${selectedNote}.txt`, noteContent);
              alert('Note updated!');
            }}
            style={{ padding: '10px 20px', marginRight: '10px' }}
          >
            Update Note
          </button>
          <button
            onClick={() => {
              setSelectedNote(null);
              setNoteContent('');
            }}
            style={{ padding: '10px 20px' }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default NotesApp;
```

This example demonstrates:
- Browser support detection
- Creating directories
- Writing and reading files
- Listing files with filtering
- Error handling
- File deletion
- A complete user interface

## 📚 Contributing

1. Navigate to the `docs` directory
2. Run `pnpm install` to install the dependencies
3. Run `pnpm dev` to start the development server
3. Navigate to `http://localhost:3000` to view the demo.
5. Modify the `Demo.tsx` file to make your changes.

If you're making changes to the `use-fs` package, you can run `pnpm build` to build the package and then run `pnpm link use-fs` to link the package to the `docs` directory for local development and testing.