/**
 * QuickLink History - Background Service Worker
 * Handles history preloading and caching for fast popup display
 */

// Default configuration
const DEFAULT_CONFIG = {
    lastDays: 7,
    urlLength: 15,
    blackList: []
};

// Cache key for storing history data
const CACHE_KEY = 'historyCache';
const CACHE_TIMESTAMP_KEY = 'historyCacheTimestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load history and cache it
 */
async function loadAndCacheHistory() {
    const config = await chrome.storage.local.get(DEFAULT_CONFIG);
    const { lastDays, blackList } = config;

    const lastTime = 1000 * 60 * 60 * 24 * lastDays;
    const now = Date.now();
    const startTime = now - lastTime;

    // Query ALL history within time range
    const historyItems = await chrome.history.search({
        text: '',
        maxResults: 100000, // Large number to get all
        startTime: startTime
    });

    // Sort by visit count (descending)
    historyItems.sort((a, b) => b.visitCount - a.visitCount);

    // Store in cache
    await chrome.storage.local.set({
        [CACHE_KEY]: historyItems,
        [CACHE_TIMESTAMP_KEY]: now
    });

    console.log(`[QuickLink] Cached ${historyItems.length} history items`);
    return historyItems;
}

/**
 * Get cached history or load fresh if expired
 */
async function getCachedHistory() {
    const result = await chrome.storage.local.get([CACHE_KEY, CACHE_TIMESTAMP_KEY]);
    const cachedData = result[CACHE_KEY];
    const cacheTime = result[CACHE_TIMESTAMP_KEY];

    const now = Date.now();

    // If cache exists and not expired, return it
    if (cachedData && cacheTime && (now - cacheTime < CACHE_DURATION)) {
        console.log('[QuickLink] Using cached history');
        return cachedData;
    }

    // Otherwise, load fresh data
    console.log('[QuickLink] Cache expired or missing, loading fresh data');
    return await loadAndCacheHistory();
}

/**
 * Check if cache needs refresh based on config changes
 */
async function checkAndRefreshCache() {
    const result = await chrome.storage.local.get([CACHE_TIMESTAMP_KEY]);
    const cacheTime = result[CACHE_TIMESTAMP_KEY];

    // If no cache or cache is old, refresh
    if (!cacheTime || (Date.now() - cacheTime > CACHE_DURATION)) {
        await loadAndCacheHistory();
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getHistory') {
        getCachedHistory().then(history => {
            sendResponse({ history: history });
        }).catch(error => {
            console.error('[QuickLink] Error getting history:', error);
            sendResponse({ error: error.message });
        });
        return true; // Required for async sendResponse
    }

    if (message.action === 'refreshCache') {
        loadAndCacheHistory().then(history => {
            sendResponse({ history: history });
        }).catch(error => {
            console.error('[QuickLink] Error refreshing cache:', error);
            sendResponse({ error: error.message });
        });
        return true;
    }
});

// Preload history when extension starts
chrome.runtime.onStartup.addListener(() => {
    console.log('[QuickLink] Extension started, preloading history...');
    loadAndCacheHistory();
});

// Preload history when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
    console.log('[QuickLink] Extension installed, preloading history...');
    loadAndCacheHistory();
});

// Refresh cache periodically (every 5 minutes)
chrome.alarms.create('refreshCache', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'refreshCache') {
        console.log('[QuickLink] Periodic cache refresh...');
        loadAndCacheHistory();
    }
});
