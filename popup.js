/**
 * QuickLink History - Popup Script
 * 直接从 storage 读取缓存，不依赖 background 消息传递
 */

// Global configuration
let urlLength = 15;
let blackList = [];
let lastDays = 7;

// Global state
let allHistoryItems = [];
let filteredHistoryItems = [];
let selectedIndex = -1;

// Cache keys
const CACHE_KEY = 'historyCache';
const CACHE_TIMESTAMP_KEY = 'historyCacheTimestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cached compiled regex patterns for blacklist
let blackListRegexCache = [];

// Compile blacklist patterns once
function compileBlackListPatterns() {
    blackListRegexCache = blackList.map(rule => {
        if (!rule) return null;
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

// Parse URL and extract hostname
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
    console.log('[QuickLink] Loading config...');
    const startTime = performance.now();

    const items = await chrome.storage.local.get({
        lastDays: 7,
        urlLength: 15,
        blackList: []
    });

    urlLength = items.urlLength;
    lastDays = items.lastDays;
    blackList = items.blackList;

    document.getElementById('subtitle').textContent = `Last ${lastDays} days`;
    compileBlackListPatterns();

    console.log(`[QuickLink] Config loaded in ${(performance.now() - startTime).toFixed(1)}ms`);
}

// Add URL to blacklist
async function addBlackList(url) {
    blackList.push(url);
    compileBlackListPatterns();
    await chrome.storage.local.set({ blackList: blackList });

    // Refresh cache
    await loadAndCacheHistory();
    await displayHistory();
}

// Filter by blacklist
function filterBlackList(item) {
    for (let i = 0; i < blackListRegexCache.length; i++) {
        if (blackListRegexCache[i].test(item.url)) {
            return false;
        }
    }
    return true;
}

// Build popup DOM
function buildPopupDom(historyItems) {
    console.log(`[QuickLink] Building DOM with ${historyItems.length} items...`);
    const buildStart = performance.now();

    const list = document.getElementById('popup-list');

    // Clear
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }

    if (historyItems.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'popup-item';
        noResults.style.cursor = 'default';
        noResults.innerHTML = '<span style="color: var(--text-secondary);">No results found</span>';
        list.appendChild(noResults);
        return;
    }

    const fragment = document.createDocumentFragment();
    let displayedCount = 0;

    for (let i = 0; i < historyItems.length && displayedCount < urlLength; i++) {
        const item = historyItems[i];

        if (!filterBlackList(item)) continue;

        const parsedUrl = parseUrl(item.url);
        const colors = getFaviconColors(parsedUrl.hostname);

        const row = document.createElement('div');
        row.className = 'popup-item';
        if (i === selectedIndex) {
            row.classList.add('selected');
        }
        row.title = item.url;
        row.dataset.index = displayedCount;
        row.dataset.url = item.url;

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
            openUrl(item.url);
        });

        row.addEventListener('mouseenter', function() {
            selectedIndex = displayedCount;
            updateSelection();
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

    console.log(`[QuickLink] DOM built in ${(performance.now() - buildStart).toFixed(1)}ms, displayed ${displayedCount} items`);
}

// Open URL
function openUrl(url) {
    chrome.tabs.create({ selected: true, url: url });
}

// Load history and cache it
async function loadAndCacheHistory() {
    console.log('[QuickLink] Loading history from API...');
    const loadStart = performance.now();

    const lastTime = 1000 * 60 * 60 * 24 * lastDays;
    const startTime = Date.now() - lastTime;

    const historyItems = await chrome.history.search({
        text: '',
        maxResults: 100000,
        startTime: startTime
    });

    historyItems.sort((a, b) => b.visitCount - a.visitCount);

    // 打印每个URL和访问次数
    console.log('[QuickLink] History items:');
    historyItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.url} - Visit count: ${item.visitCount}`);
    });

    // Cache to storage
    await chrome.storage.local.set({
        [CACHE_KEY]: historyItems,
        [CACHE_TIMESTAMP_KEY]: Date.now()
    });

    console.log(`[QuickLink] History loaded and cached in ${(performance.now() - loadStart).toFixed(1)}ms, ${historyItems.length} items`);
    return historyItems;
}

// Get cached history or load fresh
async function getCachedHistory() {
    const result = await chrome.storage.local.get([CACHE_KEY, CACHE_TIMESTAMP_KEY]);
    const cachedData = result[CACHE_KEY];
    const cacheTime = result[CACHE_TIMESTAMP_KEY];

    const now = Date.now();

    // If cache exists and not expired, return it
    if (cachedData && cacheTime && (now - cacheTime < CACHE_DURATION)) {
        console.log(`[QuickLink] Using cached data (${cachedData.length} items, age: ${((now - cacheTime) / 1000).toFixed(0)}s)`);
        // 打印缓存的URL和访问次数
        console.log('[QuickLink] Cached history items:');
        cachedData.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.url} - Visit count: ${item.visitCount}`);
        });
        return cachedData;
    }

    // Otherwise, load fresh
    console.log('[QuickLink] Cache miss, loading fresh data');
    return await loadAndCacheHistory();
}

// Filter history by search query
function filterHistory(query) {
    if (!query || query.trim() === '') {
        filteredHistoryItems = allHistoryItems.slice(0, urlLength);
    } else {
        const lowerQuery = query.toLowerCase();
        filteredHistoryItems = allHistoryItems.filter(item => {
            const urlLower = item.url.toLowerCase();
            const titleLower = (item.title || '').toLowerCase();
            return urlLower.includes(lowerQuery) || titleLower.includes(lowerQuery);
        }).slice(0, urlLength);
    }
    selectedIndex = -1;
    buildPopupDom(filteredHistoryItems);
}

// Update selection visual
function updateSelection() {
    const items = document.querySelectorAll('.popup-item');
    items.forEach((item, index) => {
        if (index === selectedIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
}

// Handle keyboard navigation
function handleKeyDown(e) {
    const visibleItems = document.querySelectorAll('.popup-item');
    const itemCount = visibleItems.length;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, itemCount - 1);
        updateSelection();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelection();
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const selectedItem = visibleItems[selectedIndex];
        if (selectedItem && selectedItem.dataset.url) {
            openUrl(selectedItem.dataset.url);
        }
    } else if (e.key === 'Escape') {
        e.preventDefault();
        window.close();
    }
}

// Display history
async function displayHistory() {
    const historyItems = await getCachedHistory();
    allHistoryItems = historyItems;
    filteredHistoryItems = historyItems.slice(0, urlLength);
    buildPopupDom(filteredHistoryItems);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    const totalStart = performance.now();
    console.log('[QuickLink] Popup initializing...');

    // Settings button
    document.getElementById('btn-settings').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        filterHistory(e.target.value);
    });

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyDown);

    // Auto focus search input
    searchInput.focus();

    await loadConfig();
    await displayHistory();

    console.log(`[QuickLink] Total initialization time: ${(performance.now() - totalStart).toFixed(1)}ms`);
});
