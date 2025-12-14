// Log when the service worker loads (helps verify it is alive)
console.log('MathJax background service worker loaded');

// Log installed/updated events
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  chrome.commands.getAll((commands) => {
    console.log('Registered commands after install:', commands);
  });
});

// Log when Chrome starts up
chrome.runtime.onStartup.addListener(() => {
  console.log('Chrome startup: background service worker active');
});

// Background service worker for handling keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle_latex_float_editor') {
    console.log('Toggle command received');
    // Send message to content script to toggle floating editor
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (chrome.runtime.lastError) {
        console.log('Toggle shortcut tabs.query error:', chrome.runtime.lastError.message);
        return;
      }

      const activeTab = tabs && tabs[0];
      if (!activeTab) {
        console.log('Toggle shortcut: no active tab');
        return;
      }

      console.log('Sending toggle message to tab', activeTab.id);
      chrome.tabs.sendMessage(activeTab.id, {action: 'toggle_latex_editor'}, () => {
        if (chrome.runtime.lastError) {
          // Content script not available on this tab (e.g., chrome:// page)
          console.log('Toggle shortcut ignored:', chrome.runtime.lastError.message);
        }
      });
    });
  }
});
