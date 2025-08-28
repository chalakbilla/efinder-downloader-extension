let isDownloading = false;

document.getElementById('downloadBtn').addEventListener('click', () => {
    if (isDownloading) return;
    
    isDownloading = true;
    updateUI('downloading');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: collectLinksAndClaim
        });
    });
});

function collectLinksAndClaim() {
    const anchors = document.querySelectorAll('td[data-label="Photo Name"] a');
    const urls = [];
    anchors.forEach((a) => {
        const href = a.href;
        const filename = a.textContent.trim() || href.split('/').pop();
        urls.push({ href, filename });
    });

    const claimLabel = Array.from(document.querySelectorAll('div.form-group label'))
        .find(label => label.textContent.trim() === 'Claim No');
    const claimNo = claimLabel
        ? claimLabel.nextElementSibling.textContent.trim()
        : "UnknownClaim";

    chrome.runtime.sendMessage({ urls, claimNo });
}

function updateUI(state, data = {}) {
    const btn = document.getElementById('downloadBtn');
    const btnText = document.getElementById('btnText');
    const status = document.getElementById('status');

    switch (state) {
        case 'downloading':
            btn.classList.add('loading');
            btnText.innerHTML = '<div class="spinner"></div>Downloading...';
            status.textContent = 'Starting download...';
            status.className = 'visible';
            break;
            
        case 'complete':
            isDownloading = false;
            btn.classList.remove('loading');
            btnText.textContent = 'Download All Files';
            status.classList.remove('visible');
            
            setTimeout(() => {
                showResultModal(data);
            }, 300);
            break;
            
        case 'error':
            isDownloading = false;
            btn.classList.remove('loading');
            btnText.textContent = 'Download All Files';
            status.textContent = data.message || 'Download failed';
            status.className = 'visible error';
            
            setTimeout(() => {
                status.classList.remove('visible');
            }, 3000);
            break;
    }
}

function showResultModal(data) {
    const modal = document.getElementById('resultModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalIconText = document.getElementById('modalIconText');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    
    if (data.failed && data.failed.length > 0) {
        modalIcon.className = 'modal-icon error';
        modalIconText.textContent = '⚠';
        modalTitle.textContent = 'Download Completed with Issues';
        modalMessage.innerHTML = `
            <strong>✅ Successfully downloaded:</strong> ${data.successCount}/${data.total} files<br>
            <strong>❌ Failed:</strong> ${data.failed.length} files<br><br>
            Files saved in folder: <strong>"${data.claimNo}"</strong>
            ${data.failed.length <= 3 ? `<br><br><small>Failed files: ${data.failed.join(', ')}</small>` : ''}
        `;
    } else {
        modalIcon.className = 'modal-icon success';
        modalIconText.textContent = '✓';
        modalTitle.textContent = 'Download Complete!';
        modalMessage.innerHTML = `
            <strong>✅ Successfully downloaded:</strong> ${data.total} files<br><br>
            Files saved in folder: <strong>"${data.claimNo}"</strong>
        `;
    }
    
    modal.classList.add('show');
}

document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('resultModal').classList.remove('show');
});

// Listen for download completion from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'downloadComplete') {
        updateUI('complete', message.data);
    } else if (message.type === 'downloadError') {
        updateUI('error', { message: message.message });
    }
});