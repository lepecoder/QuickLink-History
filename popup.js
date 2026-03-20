/**
 * QuickLink History - Popup Script
 * Description: Display frequently visited pages from browsing history
 * Features:
 * - Show most visited URLs within configured time range
 * - Sort by visit count
 * - Support blacklist filtering
 * - Uses cached data from background for fast loading
 */

// Global configuration
let urlLength = 15;
let blackList = [];

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
async function loadConfig() {
    console.log('[QuickLink Popup] Loading config...');
    const startTime = performance.now();

    const items = await chrome.storage.local.get({
        lastDays: 7,
        urlLength: 15,
        blackList: []
    });
    urlLength = items.urlLength;
    blackList = items.blackList;

    // Update subtitle with lastDays
    document.getElementById('subtitle').textContent = `Last ${items.lastDays} days`;

    // Compile blacklist patterns once
    compileBlackListPatterns();

    console.log(`[QuickLink Popup] Config loaded in ${(performance.now() - startTime).toFixed(1)}ms`);
}

// Add URL to blacklist
async function addBlackList(url) {
    blackList.push(url);
    compileBlackListPatterns();
    await chrome.storage.local.set({ blackList: blackList });

    // Refresh cache and rebuild UI
    await chrome.runtime.sendMessage({ action: 'refreshCache' });
    await displayHistory();
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

// Build popup DOM with cached history data
function buildPopupDom(historyItems) {
    console.log(`[QuickLink Popup] Building DOM with ${historyItems.length} items...`);
    const buildStart = performance.now();

    const list = document.getElementById('popup-list');

    // Clear efficiently
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }

    // Use DocumentFragment for batch insertion
    const fragment = document.createDocumentFragment();
    let displayedCount = 0;

    // History is already sorted by visitCount from background
    for (let i = 0; i < historyItems.length && displayedCount < urlLength; i++) {
        const item = historyItems[i];

        // Skip blacklisted items
        if (!filterBlackList(item)) continue;

        const parsedUrl = parseUrl(item.url);
        const colors = getFaviconColors(parsedUrl.hostname);

        const row = document.createElement('div');
        row.className = 'popup-item';
        row.title = item.url;

        const displayUrl = item.url.length > 40 ? item.url.substring(0, 40) + '...' : item.url;
        const displayTitle = item.title || '(No title)';

        row.innerHTML = `
            <div class="popup-favicon" style="background:${colors.bg};color:${colors.text}">${parsedUrl.initial}</div>
            <div class="popup-content">
                <p class="popup-url" title="${item.url}">${displayUrl}</p>
                <p class="popup-title" title="${item.title || ''}">${displayTitle}</p>
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
        displayedCount++;
    }

    list.appendChild(fragment);

    console.log(`[QuickLink Popup] DOM built in ${(performance.now() - buildStart).toFixed(1)}ms, displayed ${displayedCount} items`);
}

// Get history from background (cached) and display
async function displayHistory() {
    console.log('[QuickLink Popup] Requesting history from background...');
    const requestStart = performance.now();

    try {
        const response = await chrome.runtime.sendMessage({ action: 'getHistory' });
        if (response.error) {
            console.error('[QuickLink Popup] Error:', response.error);
            // Fallback: load directly
            await loadHistoryDirect();
        } else {
            const loadTime = performance.now() - requestStart;
            console.log(`[QuickLink Popup] Got ${response.history.length} items from cache in ${loadTime.toFixed(1)}ms`);
            buildPopupDom(response.history);
        }
    } catch (e) {
        console.error('[QuickLink Popup] Failed to get cached history:', e);
        // Fallback: load directly
        await loadHistoryDirect();
    }
}

// Fallback: load history directly if background is not available
async function loadHistoryDirect() {
    console.log('[QuickLink Popup] Loading history directly (fallback)...');
    const items = await chrome.storage.local.get({ lastDays: 7 });
    const lastTime = 1000 * 60 * 60 * 24 * items.lastDays;
    const startTime = Date.now() - lastTime;

    const historyItems = await chrome.history.search({
        text: '',
        maxResults: 100000,
        startTime: startTime
    });

    historyItems.sort((a, b) => b.visitCount - a.visitCount);
    buildPopupDom(historyItems);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    const totalStart = performance.now();

    // Settings button
    document.getElementById('btn-settings').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    await loadConfig();
    await displayHistory();
    console.log(`[QuickLink Popup] Total load time: ${(performance.now() - totalStart).toFixed(1)}ms`);
});
