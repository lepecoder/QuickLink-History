/**
 * QuickLink History Options Page
 * Handles settings save/restore and blacklist management
 */

// Delete blacklist item
function deleteItem(btn) {
    const listItem = btn.parentElement;
    listItem.remove();
}

// Save options to chrome.storage
function save_options() {
    const lastDays = document.getElementById('lastDays').value;
    const urlLength = document.getElementById('urlLength').value;
    const blackList_ul = document.getElementById('blackList_ul');

    // Get all blacklist URLs
    const blackList = [];
    blackList_ul.querySelectorAll('.blacklist-url').forEach(function(span) {
        blackList.push(span.textContent);
    });

    chrome.storage.local.set({
        lastDays: lastDays,
        urlLength: urlLength,
        blackList: blackList
    }, function() {
        // Show success message
        const status = document.getElementById('status');
        status.textContent = 'Settings saved successfully!';
        setTimeout(function() {
            status.textContent = '';
        }, 1500);
    });
}

// Display blacklist items
function showBlackList(blackList) {
    const blackList_ul = document.getElementById('blackList_ul');
    blackList_ul.innerHTML = '';

    if (!Array.isArray(blackList) || blackList.length === 0) {
        return;
    }

    for (let i = 0; i < blackList.length; i++) {
        const item = document.createElement('div');
        item.className = 'blacklist-item';

        const url = document.createElement('span');
        url.className = 'blacklist-url';
        url.appendChild(document.createTextNode(blackList[i]));

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'blacklist-delete';
        deleteBtn.innerHTML = '&#10006;';
        deleteBtn.title = 'Remove';
        deleteBtn.addEventListener('click', function() {
            deleteItem(this);
        });

        item.appendChild(url);
        item.appendChild(deleteBtn);
        blackList_ul.appendChild(item);
    }
}

// Restore options from chrome.storage
function restore_options() {
    chrome.storage.local.get({
        lastDays: '7',
        urlLength: '15',
        blackList: []
    }, function(items) {
        document.getElementById('lastDays').value = items.lastDays;
        document.getElementById('urlLength').value = items.urlLength;
        showBlackList(items.blackList);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
