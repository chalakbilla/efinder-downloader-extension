chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.urls && message.claimNo) {
      let total = message.urls.length;
      let successCount = 0;
      let failed = [];

      // If no files found
      if (total === 0) {
          chrome.runtime.sendMessage({
              type: 'downloadError',
              message: 'No files found to download'
          });
          return;
      }

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

              // Check if all downloads are complete
              if (successCount + failed.length === total) {
                  const summary = `Downloaded: ${successCount}/${total}\nFailed: ${failed.length}`;
                  console.log(summary);
                  
                  if (failed.length > 0) {
                      console.log(`Failed files: ${failed.join(", ")}`);
                  }

                  // Show browser notification
                  chrome.notifications.create({
                      type: "basic",
                      iconUrl: "icon.png",
                      title: "Download Complete",
                      message: summary
                  });

                  // Send completion message to popup
                  chrome.runtime.sendMessage({
                      type: 'downloadComplete',
                      data: {
                          total: total,
                          successCount: successCount,
                          failed: failed,
                          claimNo: message.claimNo,
                          summary: summary
                      }
                  });
              }
          });
      }
  }
});