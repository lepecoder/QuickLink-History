# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QuickLink History is a Chrome Extension (Manifest V3) that displays the most frequently visited web pages within a configurable time range. Built with vanilla JavaScript, HTML, and CSS - no build system or framework.

## Development

### Loading the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select this directory
4. The extension icon appears in the toolbar

### Testing Changes
After modifying any file, reload the extension in `chrome://extensions/` using the refresh icon on the extension card.

## Architecture

```
├── manifest.json      # Extension configuration (Manifest V3)
├── popup.html/js      # Main popup UI - displays history results
├── options.html/js    # Settings page - configures days, count, blacklist
├── background.js      # Service worker (minimal, placeholder code)
└── styles.css         # Styles for options page
```

### Key Components

**popup.js** - Core functionality:
- `loadConfig()` - Loads settings from `chrome.storage.local`
- `showHistory()` - Fetches browsing history via `chrome.history.search()`
- `filterBlackList()` - Filters URLs using blacklist patterns
- `matchRule(rule, url)` - Converts @match-style patterns to regex for blacklist matching

**options.js** - Settings management:
- Stores `lastDays` (1-14), `urlLength` (result count), `blackList` array
- Blacklist supports Chrome @match pattern format (e.g., `https://example.com/*`)

### Chrome APIs Used
- `chrome.history.search()` - Query browsing history
- `chrome.storage.local` - Persist user settings
- `chrome.tabs.create()` - Open links in new tabs

## Configuration

Default values (defined in popup.js):
- `lastDays`: 7 (days to look back)
- `urlLength`: 15 (number of results to display)
- `blackList`: Array of URL patterns to exclude

## Code Notes

- The `showHistory()` function currently uses a hardcoded 1-day lookback (`lastTime = 1000 * 60 * 60 * 24 * 1`) instead of the configured `lastDays` value - this appears to be a bug
- `buildTypedUrlList()` is unused legacy code for filtering "typed" URLs only
- Comments and UI text are in Chinese
