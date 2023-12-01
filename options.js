// 将选项保存到 chrome.storage
function save_options() {
    var color = document.getElementById('color').value;
    var likesColor = document.getElementById('like').checked;
    localStorage.setItem('key','value');
    chrome.storage.sync.set({
        favoriteColor: color,
        likesColor: likesColor
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
        likesColor: true
    }, function (items) {
        document.getElementById('color').value = items.favoriteColor;
        document.getElementById('like').checked = items.likesColor;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);