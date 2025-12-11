chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting panel behavior:', error));

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'textSelected') {
    chrome.runtime.sendMessage(message).catch(() => {});
  }
  sendResponse({});
  return true;
});

