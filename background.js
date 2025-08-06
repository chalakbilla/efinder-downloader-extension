chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.urls && message.claimNo) {
      let total = message.urls.length;
      let successCount = 0;
      let failed = [];
  
      for (const item of message.urls) {
        const downloadOptions = {
          url: item.href,
          filename: `${message.claimNo}/${item.filename}`,
          saveAs: false
        };
  
        chrome.downloads.download(downloadOptions, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error(`Failed to download ${item.filename}: ${chrome.runtime.lastError.message}`);
            failed.push(item.filename);
          } else {
            successCount++;
          }
  
          if (successCount + failed.length === total) {
            const summary = `Downloaded: ${successCount}/${total}\nFailed: ${failed.length}`;
            console.log(summary);
            if (failed.length > 0) {
              console.log(`Failed files: ${failed.join(", ")}`);
            }
  
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icon.png",
              title: "Download Complete",
              message: summary
            });
          }
        });
      }
    }
  });
  