document.getElementById('downloadBtn').addEventListener('click', () => {
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
  
