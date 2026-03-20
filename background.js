/**
 * QuickLink History - Background Service Worker
 * 只负责定时刷新缓存，不负责初始化加载
 */

const CACHE_KEY = 'historyCache';
const CACHE_TIMESTAMP_KEY = 'historyCacheTimestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load history and cache it
async function loadAndCacheHistory() {
    const config = await chrome.storage.local.get({
        lastDays: 7,
        urlLength: 15,
        blackList: []
    });

    const lastTime = 1000 * 60 * 60 * 24 * config.lastDays;
    const startTime = Date.now() - lastTime;

    console.log('[QuickLink Background] Refreshing cache...');

    const historyItems = await chrome.history.search({
        text: '',
        maxResults: 100000,
        startTime: startTime
    });

    historyItems.sort((a, b) => b.visitCount - a.visitCount);

    // 打印每个URL和访问次数
    console.log('[QuickLink Background] History items:');
    historyItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.url} - Visit count: ${item.visitCount}`);
    });

    await chrome.storage.local.set({
        [CACHE_KEY]: historyItems,
        [CACHE_TIMESTAMP_KEY]: Date.now()
    });

    console.log(`[QuickLink Background] Cached ${historyItems.length} history items`);
}

// Periodic cache refresh (every 5 minutes)
chrome.alarms.create('refreshCache', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'refreshCache') {
        loadAndCacheHistory();
    }
});

// Initial cache on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('[QuickLink Background] Extension installed/updated, preloading cache...');
    loadAndCacheHistory();
});
