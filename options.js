function adjustHeight() {
    let textarea = document.getElementById('blackList_ul');
    textarea.style.height = 'auto'; // 重置高度，以便重新计算

    // 设置文本区域的高度为内容的滚动高度
    textarea.style.height = textarea.scrollHeight + 'px';
}

function deleteItem(btn) {
    const listItem = btn.parentElement; // 获取当前 <li> 元素
    listItem.remove(); // 删除当前项
    adjustHeight();
}


// 将选项保存到 chrome.storage
function save_options() {
    let lastDays = document.getElementById('lastDays').value;
    let urlLength = document.getElementById('urlLength').value;
    let blackList_ul = document.getElementById('blackList_ul');
    // 获取 blackList_ul 中的所有 class 为 blackList_url 的子元素
    let blackList = [];
    blackList_ul.querySelectorAll('span.blackList_url').forEach(function (span) {
        blackList.push(span.innerText);
    });
    console.log(blackList);
    chrome.storage.local.set({
        lastDays: lastDays,
        urlLength: urlLength,
        blackList: blackList
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
    });
}

function showBlackList(blackList) {
    let blackList_ul = document.getElementById('blackList_ul');
    blackList_ul.innerHTML = '';
    if (!Array.isArray(blackList)) {
        blackList = [blackList];
    }
    for (let i = 0; i < blackList.length; i++) {
        let li = document.createElement('li');
        let span_btn = document.createElement('span');
        span_btn.classList.add('delete-btn');
        span_btn.addEventListener('click', function () {
            deleteItem(this);
        });
        span_btn.innerHTML = '✖';
        let span_text = document.createElement('span');
        span_text.classList.add('blackList_url');
        span_text.appendChild(document.createTextNode(blackList[i]));
        li.appendChild(span_btn);
        li.appendChild(span_text);
        blackList_ul.appendChild(li);
    }
}

// 使用首选项恢复选择框和复选框状态 
// 存储在 chrome.storage 中。
function restore_options() {
    chrome.storage.local.get({
        lastDays: '7',
        urlLength: '12',
        blackList: ''
    }, function (items) {
        console.log(items)
        document.getElementById('lastDays').value = items.lastDays;
        document.getElementById('urlLength').value = items.urlLength;
        showBlackList(items.blackList);
        adjustHeight();
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.addEventListener('DOMContentLoaded', adjustHeight);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('blackList').addEventListener('input', adjustHeight);