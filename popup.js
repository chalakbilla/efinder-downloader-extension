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

    // Try multiple ways to find claim number
    let claimNo = "UnknownClaim";
    
    // Method 1: Look for label with "Claim No"
    const claimLabel = Array.from(document.querySelectorAll('div.form-group label'))
        .find(label => label.textContent.trim() === 'Claim No');
    
    if (claimLabel && claimLabel.nextElementSibling) {
        claimNo = claimLabel.nextElementSibling.textContent.trim();
    } else {
        // Method 2: Look for any element containing claim number
        const claimElements = document.querySelectorAll('*');
        for (let element of claimElements) {
            const text = element.textContent;
            if (text && text.includes('Claim') && text.includes('No')) {
                // Extract claim number from text
                const match = text.match(/claim\s*no\s*:?\s*([a-zA-Z0-9-_]+)/i);
                if (match) {
                    claimNo = match[1];
                    break;
                }
            }
        }
        
        // Method 3: Look for input fields that might contain claim number
        if (claimNo === "UnknownClaim") {
            const inputs = document.querySelectorAll('input[type="text"], input[type="hidden"]');
            for (let input of inputs) {
                if (input.name && input.name.toLowerCase().includes('claim') && input.value) {
                    claimNo = input.value.trim();
                    break;
                }
            }
        }
    }

    // Clean up claim number - remove any unwanted characters
    claimNo = claimNo.replace(/[^a-zA-Z0-9-_]/g, '') || "UnknownClaim";
    
    console.log('Found claim number:', claimNo); // Debug log
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
    
    console.log('Modal data:', data); // Debug log
    
    if (data.failed && data.failed.length > 0) {
        modalIcon.className = 'modal-icon error';
        modalIconText.textContent = '⚠';
        modalTitle.textContent = 'Download Completed with Issues';
        modalMessage.innerHTML = `
            <strong>📊 Total Files Found:</strong> ${data.total}<br>
            <strong>✅ Successfully Downloaded:</strong> ${data.successCount}<br>
            <strong>❌ Failed:</strong> ${data.failed.length}<br><br>
            <strong>📁 Folder Name:</strong> "${data.claimNo}"<br>
            <strong>📍 Location:</strong> Downloads/${data.claimNo}/
            ${data.failed.length <= 3 ? `<br><br><small>❌ Failed files: ${data.failed.join(', ')}</small>` : ''}
        `;
    } else {
        modalIcon.className = 'modal-icon success';
        modalIconText.textContent = '✓';
        modalTitle.textContent = '🎉 Download Complete!';
        modalMessage.innerHTML = `
            <strong>📊 Total Files:</strong> ${data.total}<br>
            <strong>✅ All Successfully Downloaded!</strong><br><br>
            <strong>📁 Folder Name:</strong> "${data.claimNo}"<br>
            <strong>📍 Location:</strong> Downloads/${data.claimNo}/
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