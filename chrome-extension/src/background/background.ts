chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting panel behavior:', error));

let creatingOffscreen: Promise<void> | null = null;

async function ensureOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  creatingOffscreen = chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification: 'Request microphone permission for voice agent',
  });

  await creatingOffscreen;
  creatingOffscreen = null;
}

async function requestMicPermission(): Promise<{ granted: boolean; error?: string }> {
  await ensureOffscreenDocument();

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'REQUEST_MIC_PERMISSION', target: 'offscreen' },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ granted: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { granted: false, error: 'No response from offscreen document' });
        }
      }
    );
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'textSelected') {
    chrome.runtime.sendMessage(message).catch(() => {});
    sendResponse({});
  } else if (message.action === 'requestMicPermission') {
    requestMicPermission().then(sendResponse);
    return true; // Keep channel open for async response
  } else {
    sendResponse({});
  }
  return true;
});

