/**
 * 标题：最近最常访问网页扩展
 * 描述：保存近期最常访问的网页，方便快速打开
 * 功能：
 * 搜索最近7天的浏览历史记录，按照访问次数排序，取访问次数最多的maxLength条记录显示
 * 每次打开新网页更新显示结果
 * TODO:
 * 1. 黑名单功能：正则表达式匹配的内容不显示
 * 2. 分组功能：匹配某个正则表达式的前n条记录。可以用来显示【飞书】最近最常访问的n个文档或者【知乎】最近最常访问的n个回答
 * 3. 快捷排除某个路径
 * 3. 把大部分逻辑放到background.js中处理
 */

contentName = "typedUrl_div"
urlLength = 15
blackList = [
    "https://poe.com/ChatGPT",
    "https://bytedance.larkoffice.com/drive/me/"
]

// 默认显示最近7天的浏览历史
lastDays = 7

function loadConfig() {
    chrome.storage.local.get({
        lastDays: lastDays,
        urlLength: urlLength,
        blackList: blackList
    }, function (items) {
        urlLength = items.urlLength;
        lastDays = items.lastDays;
        blackList = items.blackList;
        console.log(blackList)
        showHistory();
    });
}


// 新标签页打开历史链接
function onAnchorClick(event) {
    chrome.tabs.create({
        selected: true,
        url: event.srcElement.href
    });
    return false;
}

// 添加地址黑名单
function addBlackList(url) {
    blackList.push(url);
    chrome.storage.local.set({
        blackList: blackList
    }, function () {
        showHistory();
    });
}

function addRow(url, title, count) {
    let table = document.getElementById("typedUrl_table");
    let url_link = document.createElement('a');
    url_link.href = url;
    // 截取url的前42个字符
    url_title = url.substring(0, 42);
    // 鼠标悬浮时显示完整url
    url_link.addEventListener('mouseover', function () {
        url_link.title = url;
    });

    url_link.appendChild(document.createTextNode(url_title));
    url_link.addEventListener('click', onAnchorClick);
    let svg = document.createElement('img');
    svg.src = "disable.svg";
    svg.addEventListener('click', function () {
        addBlackList(url);
    });
    title_span = document.createElement('span');
    title_span.title = title;
    title_span.innerHTML = title.substring(0, 10);
    // 鼠标悬浮显示完整title
    title_span.addEventListener('mouseover', function () {
        title_span.title = title;
    });
    let row = table.insertRow();
    row.insertCell(0).appendChild(svg);
    row.insertCell(1).appendChild(url_link);
    row.insertCell(2).appendChild(title_span);
    row.insertCell(3).innerHTML = count;
}

// 清空表格内容，但保留标题
function clearTable() {
    let table = document.getElementById("typedUrl_table");
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
}

/**
 * 判断URL是否匹配@match规则（处理特殊字符）
 * @param {string} rule - @match 规则字符串
 * @param {string} url - 需要判断的URL
 * @returns {boolean} 是否匹配
 */
function matchRule(rule, url) {
    // 1. 解析@match规则的scheme、host和path
    let matchPattern = rule.trim();
    if (!matchPattern.startsWith("*://") && !matchPattern.startsWith("http")) {
        throw new Error("Invalid @match rule: " + matchPattern);
    }

    // 2. 对特殊字符进行转义
    function escapeRegexChars(str) {
        return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
    }

    // 3. 转换 @match 规则为正则表达式
    let regexPattern = matchPattern
        .replace(/\*/g, ".*")       // 将 * 转换成 .*
        .split("://")               // 分离协议部分
        .map(escapeRegexChars)      // 转义特殊字符
        .join("://");               // 重新拼接协议

    // 4. 处理协议
    if (regexPattern.startsWith("\\*:\\/\\/")) {
        regexPattern = "https?:\\/\\/" + regexPattern.slice(8); // 支持 http 和 https
    }

    // 5. 添加正则边界
    regexPattern = "^" + regexPattern + "$";

    // 6. 使用正则进行匹配
    const regex = new RegExp(regexPattern);
    return regex.test(url);
}


// 过滤黑名单
function filterBlackList(item) {
    // 将item的url与黑名单进行正则匹配
    for (let i = 0, ie = blackList.length; i < ie; i++) {
        if (matchRule(blackList[i], item.url)) {
            return false;
        }
    }
    return true;
}


// 构建弹窗DOM
// 使用表格展示最近访问历史
function buildPopupDom(data) {
    data = data.filter(item => filterBlackList(item))
    clearTable();

    for (let i = 0, ie = data.length; i < ie; i++) {
        addRow(data[i].url, data[i].title, data[i].visitCount);
    }

}

// 展示最近的浏览历史，时间、标题、URL、访问次数
function showHistory() {
    let lastTime = 1000 * 60 * 60 * 24 * 1;
    let now = new Date().getTime();
    let oneTimeAgo = now - lastTime;
    chrome.history.search({
        'text': '',
        'maxResults': 10000,
        'startTime': oneTimeAgo
    }, function (historyItems) {
        historyItems.sort(function (a, b) { return b.visitCount - a.visitCount; })

        buildPopupDom(historyItems);
    });

}

// Search history to find up to ten links that a user has typed in,
// and show those links in a popup.
function buildTypedUrlList(divName) {
    // To look for history items visited in the last week,
    // subtract a week of microseconds from the current time.
    let microsecondsPerWeek = 1000 * 60 * 60 * 24 * 1;
    let oneWeekAgo = new Date().getTime() - microsecondsPerWeek;

    // Track the number of callbacks from chrome.history.getVisits()
    // that we expect to get.  When it reaches zero, we have all results.
    let numRequestsOutstanding = 0;

    chrome.history.search(
        {
            text: '', // Return every history item....
            startTime: oneWeekAgo // that was accessed less than one week ago.
        },
        function (historyItems) {
            // For each history item, get details on all visits.
            for (let i = 0; i < historyItems.length; ++i) {
                let url = historyItems[i].url;
                let time = historyItems[i].lastVisitTime;
                let title = historyItems[i].title;
                let count = historyItems[i].visitCount;
                // console.log(`Processing ${url}, time: ${time}, title: ${title}, count: ${count}`);
                let processVisitsWithUrl = function (url) {
                    // We need the url of the visited item to process the visit.
                    // Use a closure to bind the  url into the callback's args.
                    return function (visitItems) {
                        processVisits(url, visitItems);
                    };
                };
                chrome.history.getVisits({ url: url }, processVisitsWithUrl(url));
                numRequestsOutstanding++;
            }
            if (!numRequestsOutstanding) {
                onAllVisitsProcessed();
            }
        }
    );

    // Maps URLs to a count of the number of times the user typed that URL into
    // the omnibox.
    let urlToCount = {};

    // Callback for chrome.history.getVisits().  Counts the number of
    // times a user visited a URL by typing the address.
    const processVisits = function (url, visitItems) {
        for (let i = 0, ie = visitItems.length; i < ie; ++i) {
            // Ignore items unless the user typed the URL.
            if (visitItems[i].transition != 'typed') {
                continue;
            }

            if (!urlToCount[url]) {
                urlToCount[url] = 0;
            }

            urlToCount[url]++;
        }

        // If this is the final outstanding call to processVisits(),
        // then we have the final results.  Use them to build the list
        // of URLs to show in the popup.
        if (!--numRequestsOutstanding) {
            onAllVisitsProcessed();
        }
    };

    // This function is called when we have the final list of URls to display.
    const onAllVisitsProcessed = () => {
        // Get the top scorring urls.
        let urlArray = [];
        for (let url in urlToCount) {
            urlArray.push(url);
        }

        // Sort the URLs by the number of times the user typed them.
        urlArray.sort(function (a, b) {
            return urlToCount[b] - urlToCount[a];
        });

        buildPopupDom(divName, urlArray.slice(0, 10));
    };
}

const button = document.getElementById('button1');
button.addEventListener('click', function () {
    loadConfig();
    // showHistory();
});

document.addEventListener('DOMContentLoaded', function () {

    // buildTypedUrlList('typedUrl_div');
    // showHistory();
    loadConfig();
});
