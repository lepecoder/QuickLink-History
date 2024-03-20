
function adjustHeight() {
    let textarea = document.getElementById('blackList');
    textarea.style.height = 'auto'; // 重置高度，以便重新计算

    // 设置文本区域的高度为内容的滚动高度
    textarea.style.height = textarea.scrollHeight + 'px';
}


// 将选项保存到 chrome.storage
function save_options() {
    var color = document.getElementById('color').value;
    var likesColor = document.getElementById('like').checked;
    let lastDays = document.getElementById('lastDays').value;
    let urlLength = document.getElementById('urlLength').value;
    let blackList = document.getElementById('blackList').value;
    chrome.storage.sync.set({
        favoriteColor: color,
        likesColor: likesColor,
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

// 使用首选项恢复选择框和复选框状态 
// 存储在 chrome.storage 中。
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        favoriteColor: 'red',
        likesColor: true,
        lastDays: '7',
        urlLength: '12',
        blackList: ''
    }, function (items) {
        document.getElementById('color').value = items.favoriteColor;
        document.getElementById('like').checked = items.likesColor;
        document.getElementById('lastDays').value = items.lastDays;
        document.getElementById('urlLength').value = items.urlLength;
        document.getElementById('blackList').value = items.blackList;
        adjustHeight();
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.addEventListener('DOMContentLoaded', adjustHeight);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('blackList').addEventListener('input', adjustHeight);