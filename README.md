# 🗂️ use-fs

A React hook for integrating with the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API).

The File System Access API enables web applications to seamlessly work with files on a user's local system. After a user grants permission, web apps can read, write, and manage files directly - eliminating the need for repeated file selection dialogs. This capability is ideal for creating powerful browser-based tools.

Unlike traditional file selection dialogs, the user will be prompted to select a directory, the hook will watch the files in that directory for changes - rerendering when changes are detected.

Visit [**use-fs.com**](https://use-fs.app) to try it out.

> ⚠️ Note: The File System API is not yet fully supported in all browsers yet. Works in Chrome, Edge and Opera.

## 📡 Install

```console
npm install use-fs

yarn add use-fs

pnpm add use-fs
```

> 👋 Hello there! Follow me [@linesofcode](https://twitter.com/linesofcode) or visit [linesofcode.dev](https://linesofcode.dev) for more cool projects like this one.

## 🚀 Getting Started