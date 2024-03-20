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
lastDays = 7

function loadConfig() {
    chrome.storage.sync.get({
        lastDays: lastDays,
        urlLength: urlLength,
        blackList: blackList
    }, function (items) {
        console.log(items)
        urlLength = items.urlLength;
        lastDays = items.lastDays;
        blackListStr = items.blackList;
        blackList = blackListStr.split('\n');
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


function buildPopupDom(data) {
    let popupDiv = document.getElementById(contentName);
    data = data.filter(item => !blackList.includes(item.url))
    // console.log(data1)

    let ul = document.createElement('ul');
    // 移除之前的列表
    if (popupDiv.firstChild != null) {
        popupDiv.removeChild(popupDiv.firstChild);
    }
    popupDiv.appendChild(ul);

    for (let i = 0, ie = Math.min(data.length, urlLength); i < ie; ++i) {
        let a = document.createElement('a');
        a.href = data[i].url;
        a.appendChild(document.createTextNode(data[i].title));
        a.addEventListener('click', onAnchorClick);

        let svg = document.createElement('img');
        svg.src = "disable.svg";
        svg.addEventListener('click', function(){
            console.log("cli"+data[i].url);
        });

        let urlSpan = document.createElement('span');
        urlSpan.textContent = ", url: " + data[i].url;

        let countSpan = document.createElement('span');
        countSpan.textContent = ", count: " + data[i].visitCount;

        let li = document.createElement('li');
        li.appendChild(svg);
        li.appendChild(a);
        li.appendChild(urlSpan);
        li.appendChild(countSpan);

        ul.appendChild(li);
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
