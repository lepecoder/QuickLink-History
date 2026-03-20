# UI Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize QuickLink History Chrome extension UI with Material Design and Teal theme.

**Architecture:** Replace inline styles and table-based layout with modern CSS and Material Design components. Update HTML structure for both popup and options pages, with minimal JavaScript changes for DOM manipulation.

**Tech Stack:** Vanilla JavaScript, HTML5, CSS3, Chrome Extension APIs (Manifest V3)

---

## File Structure

```
QuickLink-History/
├── popup.html      # Restructure with Material Design layout
├── popup.js        # Update addRow(), clearTable(), add favicon colors
├── options.html    # Restructure with sectioned layout
├── options.js      # Update showBlackList() for new DOM structure
├── styles.css      # Complete rewrite with Material Design tokens
└── manifest.json   # No changes needed
```

---

### Task 1: Create Material Design Stylesheet

**Files:**
- Modify: `styles.css` (complete rewrite)

- [ ] **Step 1: Write complete Material Design stylesheet**

```css
/* ========================================
   QuickLink History - Material Design Styles
   Theme: Teal (#009688)
   ======================================== */

/* CSS Variables */
:root {
  /* Primary Colors */
  --primary: #009688;
  --primary-dark: #00796b;
  --primary-light: #e0f2f1;

  /* Text Colors */
  --text-primary: #333333;
  --text-secondary: #757575;

  /* Surface Colors */
  --background: #fafafa;
  --surface: #ffffff;
  --border: #e0e0e0;
  --hover: #f5f5f5;

  /* Semantic Colors */
  --error: #f44336;

  /* Favicon Colors */
  --favicon-blue-bg: #e3f2fd;
  --favicon-blue-text: #1976d2;
  --favicon-orange-bg: #fff3e0;
  --favicon-orange-text: #f57c00;
  --favicon-green-bg: #e8f5e9;
  --favicon-green-text: #388e3c;
  --favicon-pink-bg: #fce4ec;
  --favicon-pink-text: #c2185b;
  --favicon-purple-bg: #f3e5f5;
  --favicon-purple-text: #7b1fa2;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.12);

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 50%;
}

/* ========================================
   Popup Styles
   ======================================== */

/* Popup Container */
body.popup-body {
  margin: 0;
  padding: 0;
  background: var(--background);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-width: 360px;
}

.popup-container {
  background: var(--surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  width: 360px;
}

/* Popup Header */
.popup-header {
  background: var(--primary);
  color: white;
  padding: 16px;
}

.popup-header h1 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.popup-header .subtitle {
  font-size: 12px;
  opacity: 0.8;
  margin: 0;
}

/* Popup List */
.popup-list {
  padding: 8px 0;
  max-height: 400px;
  overflow-y: auto;
}

/* Popup List Item */
.popup-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.popup-item:hover {
  background: var(--hover);
}

.popup-item:active {
  background: var(--border);
}

/* Favicon */
.popup-favicon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  font-weight: 500;
  font-size: 14px;
}

/* Item Content */
.popup-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.popup-url {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 0 2px 0;
}

.popup-title {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

/* Visit Count Badge */
.popup-count {
  font-size: 12px;
  color: white;
  background: var(--primary);
  padding: 2px 8px;
  border-radius: var(--radius-lg);
  margin-left: 8px;
  flex-shrink: 0;
}

/* Blacklist Button (hidden by default) */
.popup-blacklist-btn {
  display: none;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--error);
  cursor: pointer;
  margin-left: 8px;
  font-size: 16px;
  flex-shrink: 0;
}

.popup-item:hover .popup-blacklist-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Popup Footer */
.popup-footer {
  border-top: 1px solid var(--border);
  padding: 0;
}

.popup-footer button {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.popup-footer button:hover {
  background: var(--hover);
}

/* ========================================
   Options Page Styles
   ======================================== */

body.options-body {
  margin: 0;
  padding: 20px;
  background: var(--background);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.options-container {
  background: var(--surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  max-width: 420px;
  width: 100%;
  overflow: hidden;
}

/* Options Header */
.options-header {
  background: var(--primary);
  color: white;
  padding: 20px;
}

.options-header h1 {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.options-header .subtitle {
  font-size: 13px;
  opacity: 0.8;
  margin: 0;
}

/* Options Section */
.options-section {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.options-section:last-of-type {
  border-bottom: none;
}

.options-section-header {
  color: var(--primary);
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Form Group */
.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

/* Form Controls */
.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--surface);
  box-sizing: border-box;
  transition: border-color 0.15s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
}

/* Form Row (two columns) */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Blacklist Styles */
.blacklist-container {
  background: var(--hover);
  border-radius: var(--radius-sm);
  padding: 12px;
}

.blacklist-item {
  display: flex;
  align-items: center;
  padding: 8px;
  background: var(--surface);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  margin-bottom: 6px;
}

.blacklist-item:last-child {
  margin-bottom: 0;
}

.blacklist-url {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.blacklist-delete {
  color: var(--error);
  cursor: pointer;
  font-size: 16px;
  margin-left: 8px;
  flex-shrink: 0;
}

.blacklist-delete:hover {
  opacity: 0.8;
}

/* Save Button */
.btn-save {
  width: 100%;
  padding: 14px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-save:hover {
  background: var(--primary-dark);
}

/* Status Message */
#status {
  text-align: center;
  font-size: 13px;
  color: var(--primary);
  margin-top: 12px;
  min-height: 20px;
}
```

- [ ] **Step 2: Verify stylesheet syntax**

Run: No automated test for CSS. Visual verification in browser.

- [ ] **Step 3: Commit stylesheet**

```bash
git add styles.css
git commit -m "style: add Material Design stylesheet with Teal theme"
```

---

### Task 2: Restructure Popup HTML

**Files:**
- Modify: `popup.html`

- [ ] **Step 1: Rewrite popup.html with Material Design structure**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>QuickLink History</title>
    <link rel="stylesheet" href="styles.css">
</head>

<body class="popup-body">
    <div class="popup-container">
        <div class="popup-header">
            <h1>Frequently Visited</h1>
            <p class="subtitle" id="subtitle">Last 7 days</p>
        </div>

        <div class="popup-list" id="popup-list">
            <!-- List items will be dynamically inserted here -->
        </div>

        <div class="popup-footer">
            <button id="btn-settings">Open Settings</button>
        </div>
    </div>

    <script src="popup.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit popup.html**

```bash
git add popup.html
git commit -m "feat: restructure popup with Material Design layout"
```

---

### Task 3: Update Popup JavaScript

**Files:**
- Modify: `popup.js`

- [ ] **Step 1: Add favicon color helper function**

Add this function after the global variables (after line 22):

```javascript
// Get favicon color based on domain first letter
function getFaviconColors(url) {
    try {
        const hostname = new URL(url).hostname;
        const firstChar = hostname.charAt(0).toUpperCase();

        if (firstChar >= 'A' && firstChar <= 'E') {
            return { bg: '#e3f2fd', text: '#1976d2' };
        } else if (firstChar >= 'F' && firstChar <= 'J') {
            return { bg: '#fff3e0', text: '#f57c00' };
        } else if (firstChar >= 'K' && firstChar <= 'O') {
            return { bg: '#e8f5e9', text: '#388e3c' };
        } else if (firstChar >= 'P' && firstChar <= 'T') {
            return { bg: '#fce4ec', text: '#c2185b' };
        } else {
            return { bg: '#f3e5f5', text: '#7b1fa2' };
        }
    } catch (e) {
        return { bg: '#e0e0e0', text: '#757575' };
    }
}
```

- [ ] **Step 2: Replace addRow function**

Replace the existing `addRow` function (lines 58-88) with:

```javascript
function addRow(url, title, count) {
    const list = document.getElementById('popup-list');
    const colors = getFaviconColors(url);

    // Get first letter for favicon
    let initial = '?';
    try {
        const hostname = new URL(url).hostname;
        initial = hostname.charAt(0).toUpperCase();
    } catch (e) {
        initial = '?';
    }

    // Create list item
    const item = document.createElement('div');
    item.className = 'popup-item';
    item.title = url;

    // Favicon
    const favicon = document.createElement('div');
    favicon.className = 'popup-favicon';
    favicon.style.background = colors.bg;
    favicon.style.color = colors.text;
    favicon.textContent = initial;

    // Content container
    const content = document.createElement('div');
    content.className = 'popup-content';

    // URL
    const urlEl = document.createElement('p');
    urlEl.className = 'popup-url';
    urlEl.textContent = url.length > 40 ? url.substring(0, 40) + '...' : url;
    urlEl.title = url;

    // Title
    const titleEl = document.createElement('p');
    titleEl.className = 'popup-title';
    titleEl.textContent = title || '(No title)';
    titleEl.title = title || '';

    content.appendChild(urlEl);
    content.appendChild(titleEl);

    // Visit count badge
    const countBadge = document.createElement('span');
    countBadge.className = 'popup-count';
    countBadge.textContent = count;

    // Blacklist button
    const blacklistBtn = document.createElement('button');
    blacklistBtn.className = 'popup-blacklist-btn';
    blacklistBtn.innerHTML = '&#10006;';
    blacklistBtn.title = 'Add to blacklist';
    blacklistBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        addBlackList(url);
    });

    // Click to open
    item.addEventListener('click', function() {
        chrome.tabs.create({ selected: true, url: url });
    });

    // Assemble
    item.appendChild(favicon);
    item.appendChild(content);
    item.appendChild(countBadge);
    item.appendChild(blacklistBtn);

    list.appendChild(item);
}
```

- [ ] **Step 3: Replace clearTable function**

Replace the existing `clearTable` function (lines 91-96) with:

```javascript
function clearTable() {
    const list = document.getElementById('popup-list');
    list.innerHTML = '';
}
```

- [ ] **Step 4: Update showHistory to use lastDays config**

Replace the `showHistory` function (lines 162-176) with:

```javascript
function showHistory() {
    const lastTime = 1000 * 60 * 60 * 24 * lastDays;
    const now = new Date().getTime();
    const oneTimeAgo = now - lastTime;

    // Update subtitle
    document.getElementById('subtitle').textContent = `Last ${lastDays} days`;

    chrome.history.search({
        'text': '',
        'maxResults': 10000,
        'startTime': oneTimeAgo
    }, function (historyItems) {
        historyItems.sort(function (a, b) { return b.visitCount - a.visitCount; });
        buildPopupDom(historyItems.slice(0, urlLength));
    });
}
```

- [ ] **Step 5: Update button event listener**

Replace the button event listener (lines 264-268) with:

```javascript
document.getElementById('btn-settings').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
});
```

- [ ] **Step 6: Remove unused code**

Remove the `onAnchorClick` function (lines 40-46) and `buildTypedUrlList` function (lines 180-262) as they are no longer used.

- [ ] **Step 7: Commit popup.js changes**

```bash
git add popup.js
git commit -m "feat: update popup.js for Material Design UI"
```

---

### Task 4: Restructure Options HTML

**Files:**
- Modify: `options.html`

- [ ] **Step 1: Rewrite options.html with sectioned layout**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>QuickLink History Settings</title>
    <link rel="stylesheet" href="styles.css">
</head>

<body class="options-body">
    <div class="options-container">
        <div class="options-header">
            <h1>Settings</h1>
            <p class="subtitle">Customize your history display</p>
        </div>

        <div class="options-section">
            <h2 class="options-section-header">
                <span>📊</span> Display Settings
            </h2>
            <div class="form-row">
                <div class="form-group">
                    <label for="lastDays">Time Range</label>
                    <select id="lastDays" class="form-control">
                        <option value="1">1 day</option>
                        <option value="2">2 days</option>
                        <option value="3">3 days</option>
                        <option value="4">4 days</option>
                        <option value="5">5 days</option>
                        <option value="6">6 days</option>
                        <option value="7" selected>7 days</option>
                        <option value="8">8 days</option>
                        <option value="9">9 days</option>
                        <option value="10">10 days</option>
                        <option value="11">11 days</option>
                        <option value="12">12 days</option>
                        <option value="13">13 days</option>
                        <option value="14">14 days</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="urlLength">Results Count</label>
                    <input type="number" id="urlLength" class="form-control" min="1" max="99" value="15">
                </div>
            </div>
        </div>

        <div class="options-section">
            <h2 class="options-section-header">
                <span>🚫</span> Blacklist
            </h2>
            <div class="blacklist-container" id="blackList_ul">
                <!-- Blacklist items will be dynamically inserted here -->
            </div>
        </div>

        <div class="options-section">
            <button id="save" class="btn-save">Save Settings</button>
            <div id="status"></div>
        </div>
    </div>

    <script src="options.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit options.html**

```bash
git add options.html
git commit -m "feat: restructure options page with sectioned Material Design layout"
```

---

### Task 5: Update Options JavaScript

**Files:**
- Modify: `options.js`

- [ ] **Step 1: Update showBlackList function**

Replace the existing `showBlackList` function (lines 41-62) with:

```javascript
function showBlackList(blackList) {
    const blackList_ul = document.getElementById('blackList_ul');
    blackList_ul.innerHTML = '';

    if (!Array.isArray(blackList) || blackList.length === 0) {
        return;
    }

    for (let i = 0; i < blackList.length; i++) {
        const item = document.createElement('div');
        item.className = 'blacklist-item';

        const url = document.createElement('span');
        url.className = 'blacklist-url';
        url.appendChild(document.createTextNode(blackList[i]));

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'blacklist-delete';
        deleteBtn.innerHTML = '&#10006;';
        deleteBtn.addEventListener('click', function() {
            deleteItem(this);
        });

        item.appendChild(url);
        item.appendChild(deleteBtn);
        blackList_ul.appendChild(item);
    }
}
```

- [ ] **Step 2: Update deleteItem function**

Replace the existing `deleteItem` function (lines 9-13) with:

```javascript
function deleteItem(btn) {
    const listItem = btn.parentElement;
    listItem.remove();
}
```

- [ ] **Step 3: Remove unused code**

Remove the `adjustHeight` function (lines 1-7) and related event listeners (lines 80, 82) as they are no longer needed.

- [ ] **Step 4: Commit options.js**

```bash
git add options.js
git commit -m "feat: update options.js for Material Design UI"
```

---

### Task 6: Final Verification and Testing

**Files:**
- None (verification only)

- [ ] **Step 1: Test in Chrome**

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project directory
4. Click the extension icon to open popup
5. Verify popup displays with Material Design styling
6. Click on a history item to verify it opens in new tab
7. Click the blacklist button (✖) on hover to test blacklist functionality
8. Click "Open Settings" to open options page
9. Verify options page displays correctly
10. Modify settings and click "Save Settings"
11. Reopen popup to verify settings are applied

- [ ] **Step 2: Create final commit**

```bash
git add -A
git commit -m "feat: complete UI modernization with Material Design and Teal theme"
```

---

## Summary

| Task | Files Changed | Description |
|------|---------------|-------------|
| 1 | styles.css | Complete rewrite with Material Design tokens |
| 2 | popup.html | New structure with header, list, footer |
| 3 | popup.js | Updated DOM manipulation, favicon colors |
| 4 | options.html | New sectioned layout |
| 5 | options.js | Updated showBlackList, removed adjustHeight |
| 6 | - | Manual testing in Chrome |
