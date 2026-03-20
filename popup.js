/**
 * QuickLink History - Popup Script
 * Description: Display frequently visited pages from browsing history
 * Features:
 * - Show most visited URLs within configured time range
 * - Sort by visit count
 * - Support blacklist filtering
 * - Optimized for fast popup loading
 */

// Global configuration
let urlLength = 15;
let blackList = [];
let lastDays = 7;

// Cached compiled regex patterns for blacklist
let blackListRegexCache = [];

// Compile blacklist patterns once
function compileBlackListPatterns() {
    blackListRegexCache = blackList.map(rule => {
        let matchPattern = rule.trim();
        if (!matchPattern.startsWith("*://") && !matchPattern.startsWith("http")) {
            return null;
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

        try {
            return new RegExp("^" + regexPattern + "$");
        } catch (e) {
            return null;
        }
    }).filter(r => r !== null);
}

// Get favicon color based on domain first letter
function getFaviconColors(hostname) {
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
}

// Parse URL and extract hostname (optimized)
function parseUrl(url) {
    try {
        const urlObj = new URL(url);
        return {
            hostname: urlObj.hostname,
            initial: urlObj.hostname.charAt(0).toUpperCase()
        };
    } catch (e) {
        return { hostname: '', initial: '?' };
    }
}

// Load configuration from storage
function loadConfig() {
    chrome.storage.local.get({
        lastDays: lastDays,
        urlLength: urlLength,
        blackList: []
    }, function(items) {
        urlLength = items.urlLength;
        lastDays = items.lastDays;
        blackList = items.blackList;

        // Compile blacklist patterns once
        compileBlackListPatterns();

        showHistory();
    });
}

// Add URL to blacklist
function addBlackList(url) {
    blackList.push(url);
    compileBlackListPatterns();
    chrome.storage.local.set({
        blackList: blackList
    }, function() {
        showHistory();
    });
}

// Filter by blacklist (optimized with pre-compiled regex)
function filterBlackList(item) {
    for (let i = 0; i < blackListRegexCache.length; i++) {
        if (blackListRegexCache[i].test(item.url)) {
            return false;
        }
    }
    return true;
}

// Create list item row (optimized)
function addRow(url, title, count, parsedUrl, colors) {
    const list = document.getElementById('popup-list');

    // Use template literal for faster DOM creation
    const item = document.createElement('div');
    item.className = 'popup-item';
    item.title = url;

    item.innerHTML = `
        <div class="popup-favicon" style="background:${colors.bg};color:${colors.text}">${parsedUrl.initial}</div>
        <div class="popup-content">
            <p class="popup-url" title="${url}">${url.length > 40 ? url.substring(0, 40) + '...' : url}</p>
            <p class="popup-title" title="${title || ''}">${title || '(No title)'}</p>
        </div>
        <span class="popup-count">${count}</span>
        <button class="popup-blacklist-btn" title="Add to blacklist">&#10006;</button>
    `;

    // Event listeners
    item.addEventListener('click', function() {
        chrome.tabs.create({ selected: true, url: url });
    });

    const blacklistBtn = item.querySelector('.popup-blacklist-btn');
    blacklistBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        addBlackList(url);
    });

    list.appendChild(item);
}

// Build popup DOM (optimized with DocumentFragment)
function buildPopupDom(data) {
    const list = document.getElementById('popup-list');

    // Clear efficiently
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }

    // Use DocumentFragment for batch insertion
    const fragment = document.createDocumentFragment();

    data.forEach(item => {
        if (!filterBlackList(item)) return;

        const parsedUrl = parseUrl(item.url);
        const colors = getFaviconColors(parsedUrl.hostname);

        const row = document.createElement('div');
        row.className = 'popup-item';
        row.title = item.url;

        row.innerHTML = `
            <div class="popup-favicon" style="background:${colors.bg};color:${colors.text}">${parsedUrl.initial}</div>
            <div class="popup-content">
                <p class="popup-url" title="${item.url}">${item.url.length > 40 ? item.url.substring(0, 40) + '...' : item.url}</p>
                <p class="popup-title" title="${item.title || ''}">${item.title || '(No title)'}</p>
            </div>
            <span class="popup-count">${item.visitCount}</span>
            <button class="popup-blacklist-btn" title="Add to blacklist">&#10006;</button>
        `;

        row.addEventListener('click', function() {
            chrome.tabs.create({ selected: true, url: item.url });
        });

        const blacklistBtn = row.querySelector('.popup-blacklist-btn');
        blacklistBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            addBlackList(item.url);
        });

        fragment.appendChild(row);
    });

    list.appendChild(fragment);
}

// Show browsing history (optimized)
function showHistory() {
    const lastTime = 1000 * 60 * 60 * 24 * lastDays;
    const now = new Date().getTime();
    const oneTimeAgo = now - lastTime;

    // Update subtitle
    document.getElementById('subtitle').textContent = `Last ${lastDays} days`;

    // OPTIMIZATION: Use reasonable maxResults instead of 10000
    // We only show top results, so fetch 3-4x what we need to account for blacklist filtering
    const fetchCount = Math.min(urlLength * 5, 200);

    chrome.history.search({
        'text': '',
        'maxResults': fetchCount,
        'startTime': oneTimeAgo
    }, function(historyItems) {
        // Sort by visit count
        historyItems.sort((a, b) => b.visitCount - a.visitCount);
        buildPopupDom(historyItems);
    });
}

// Settings button
document.getElementById('btn-settings').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
});

// Initialize on load
document.addEventListener('DOMContentLoaded', loadConfig);
