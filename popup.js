let isDownloading = false;

// Download button functionality
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

// Add serial numbers button functionality
document.getElementById('addSerialBtn').addEventListener('click', () => {
    const status = document.getElementById('status');
    
    status.textContent = 'Adding serial numbers to page tables...';
    status.className = 'visible';
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: addSerialNumbersToTables
        }, (results) => {
            if (chrome.runtime.lastError) {
                status.textContent = 'Error: ' + chrome.runtime.lastError.message;
                status.className = 'visible error';
            } else if (results && results[0] && results[0].result) {
                const result = results[0].result;
                if (result.error) {
                    status.textContent = 'Error: ' + result.error;
                    status.className = 'visible error';
                } else if (result.tablesFound === 0) {
                    status.textContent = 'No tables found on this page';
                    status.className = 'visible error';
                } else {
                    status.textContent = `Added serial numbers to ${result.tablesFound} table(s)!`;
                    status.className = 'visible success';
                    
                    // Show modal with details
                    showModal('success', 'Serial Numbers Added!', 
                        `Successfully added serial numbers to <strong>${result.tablesFound} table(s)</strong> with <strong>${result.totalRows} total rows</strong>.<br><br>The tables now have "S.No" columns that will automatically update if rows are added or removed.`);
                }
            } else {
                status.textContent = 'No tables found on this page';
                status.className = 'visible error';
            }
            
            setTimeout(() => {
                status.className = '';
            }, 3000);
        });
    });
});

// Function to be injected into page for collecting download links
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

// Function to be injected into page for adding serial numbers
function addSerialNumbersToTables() {
    try {
        const SERIAL_CLASS = 'js-serial-cell';
        const HEADER_CLASS = 'js-serial-header';

        // Create global controller storage (so repeated pastes won't double-attach)
        window.__serialNumberObservers = window.__serialNumberObservers || [];

        // Helper: already processed?
        function alreadyProcessed(tbody) {
            return window.__serialNumberObservers.some(entry => entry.tbody === tbody);
        }

        // Main routine for a single tbody
        function processTbody(tbody, idx) {
            function addSerials() {
                const rows = Array.from(tbody.querySelectorAll('tr'));
                // Remove previous serial cells we added (prevents duplicates)
                rows.forEach(row => {
                    const old = row.querySelector('td.' + SERIAL_CLASS);
                    if (old) old.remove();
                });

                // Insert serial td as first cell in each row
                rows.forEach((row, i) => {
                    const cell = document.createElement('td');
                    cell.className = SERIAL_CLASS;
                    cell.textContent = i + 1;
                    // optional styling (comment out if you don't want inline styles)
                    cell.style.fontWeight = '600';
                    cell.style.paddingRight = '8px';
                    // put it before the first child element (safer than firstChild)
                    row.insertBefore(cell, row.children[0] || row.firstChild);
                });

                // If table has a thead, ensure a header cell "S.No" is added as first <th>
                const table = tbody.closest('table');
                if (table) {
                    const thead = table.querySelector('thead');
                    if (thead) {
                        let headerRow = thead.querySelector('tr');
                        if (!headerRow) {
                            headerRow = document.createElement('tr');
                            thead.appendChild(headerRow);
                        }
                        const existingTh = headerRow.querySelector('th.' + HEADER_CLASS);
                        if (existingTh) existingTh.remove();
                        const th = document.createElement('th');
                        th.className = HEADER_CLASS;
                        th.textContent = 'S.No';
                        headerRow.insertBefore(th, headerRow.children[0] || headerRow.firstChild);
                    }
                }

                console.info(`[serials] tbody#${idx} — ${rows.length} rows numbered`);
                return rows.length;
            }

            // Run once immediately
            const rowCount = addSerials();

            // Observe changes so numbering stays correct if rows are added/removed later
            const mo = new MutationObserver(() => {
                // simple debounce using requestAnimationFrame to avoid thrash
                if (typeof window.__serialNumber_rAF === 'number') cancelAnimationFrame(window.__serialNumber_rAF);
                window.__serialNumber_rAF = requestAnimationFrame(() => addSerials());
            });
            mo.observe(tbody, { childList: true, subtree: false });

            // store controller so user can disconnect later
            window.__serialNumberObservers.push({
                tbody,
                observer: mo,
                refresh: addSerials,
                disconnect: () => { mo.disconnect(); }
            });

            return rowCount;
        }

        // Find all tbodies on page (you can change this selector if you want)
        const tbodies = Array.from(document.querySelectorAll('tbody'));
        if (tbodies.length === 0) {
            console.error('No <tbody> found on this page. If your table is created later by JS/Angular, run this script after rows appear or keep page open and paste again.');
            return { tablesFound: 0, totalRows: 0, error: 'No <tbody> found on this page' };
        }

        let totalRows = 0;
        let tablesProcessed = 0;

        tbodies.forEach((tb, i) => {
            if (!alreadyProcessed(tb)) {
                const rowCount = processTbody(tb, i);
                totalRows += rowCount;
                tablesProcessed++;
            } else {
                console.info(`tbody#${i} already processed — use window.__serialNumberObservers to control.`);
            }
        });

        console.info('Serial-numbering active. Controls are available at window.__serialNumberObservers');
        console.info('To stop all observers: window.__serialNumberObservers.forEach(x=>x.disconnect()); window.__serialNumberObservers = [];');
        console.info('To refresh manually: window.__serialNumberObservers.forEach(x=>x.refresh());');

        return { tablesFound: tablesProcessed, totalRows: totalRows };
    } catch (err) {
        console.error('Error running serial-number script:', err);
        return { error: err.message };
    }
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

// Generic modal function
function showModal(type, title, message) {
    const modal = document.getElementById('resultModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalIconText = document.getElementById('modalIconText');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    
    modalIcon.className = `modal-icon ${type}`;
    modalIconText.textContent = type === 'success' ? '✓' : '✕';
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    
    modal.classList.add('show');
}

document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('resultModal').classList.remove('show');
});

// Close modal when clicking outside
document.getElementById('resultModal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('show');
    }
});

// Listen for download completion from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'downloadComplete') {
        updateUI('complete', message.data);
    } else if (message.type === 'downloadError') {
        updateUI('error', { message: message.message });
    }
});