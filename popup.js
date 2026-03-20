/**
 * QuickLink History - Popup Script
 * Description: Display frequently visited pages from browsing history
 * Features:
 * - Show most visited URLs within configured time range
 * - Sort by visit count
 * - Support blacklist filtering
 */

// Global configuration
let urlLength = 15;
let blackList = [
    "https://poe.com/ChatGPT",
    "https://bytedance.larkoffice.com/drive/me/"
];
let lastDays = 7;

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

// Load configuration from storage
function loadConfig() {
    chrome.storage.local.get({
        lastDays: lastDays,
        urlLength: urlLength,
        blackList: blackList
    }, function(items) {
        urlLength = items.urlLength;
        lastDays = items.lastDays;
        blackList = items.blackList;
        showHistory();
    });
}

// Add URL to blacklist
function addBlackList(url) {
    blackList.push(url);
    chrome.storage.local.set({
        blackList: blackList
    }, function() {
        showHistory();
    });
}

// Create list item row
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

// Clear list content
function clearTable() {
    const list = document.getElementById('popup-list');
    list.innerHTML = '';
}

/**
 * Check if URL matches @match pattern
 * @param {string} rule - @match pattern string
 * @param {string} url - URL to check
 * @returns {boolean} Whether it matches
 */
function matchRule(rule, url) {
    let matchPattern = rule.trim();
    if (!matchPattern.startsWith("*://") && !matchPattern.startsWith("http")) {
        throw new Error("Invalid @match rule: " + matchPattern);
    }

    function escapeRegexChars(str) {
        return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
    }

    let regexPattern = matchPattern
        .replace(/\*/g, ".*")
        .split("://")
        .map(escapeRegexChars)
        .join("://");

    if (regexPattern.startsWith("\\*:\\/\\/")) {
        regexPattern = "https?:\\/\\/" + regexPattern.slice(8);
    }

    regexPattern = "^" + regexPattern + "$";

    const regex = new RegExp(regexPattern);
    return regex.test(url);
}

// Filter by blacklist
function filterBlackList(item) {
    for (let i = 0, ie = blackList.length; i < ie; i++) {
        if (matchRule(blackList[i], item.url)) {
            return false;
        }
    }
    return true;
}

// Build popup DOM
function buildPopupDom(data) {
    data = data.filter(item => filterBlackList(item));
    clearTable();

    for (let i = 0, ie = data.length; i < ie; i++) {
        addRow(data[i].url, data[i].title, data[i].visitCount);
    }
}

// Show browsing history
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
    }, function(historyItems) {
        historyItems.sort(function(a, b) { return b.visitCount - a.visitCount; });
        buildPopupDom(historyItems.slice(0, urlLength));
    });
}

// Settings button
document.getElementById('btn-settings').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
});

// Initialize on load
document.addEventListener('DOMContentLoaded', loadConfig);
