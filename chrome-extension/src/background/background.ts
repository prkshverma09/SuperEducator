chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[Background] Error setting panel behavior:', error));

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

// Try to request mic permission via offscreen document (works if already granted)
async function tryOffscreenMicPermission(): Promise<{ granted: boolean; error?: string }> {
  try {
    await ensureOffscreenDocument();

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ granted: false, error: 'Timeout waiting for offscreen response' });
      }, 3000);

      chrome.runtime.sendMessage(
        { type: 'REQUEST_MIC_PERMISSION', target: 'offscreen' },
        (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            console.log('[Background] Offscreen permission check failed:', chrome.runtime.lastError.message);
            resolve({ granted: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response || { granted: false, error: 'No response from offscreen document' });
          }
        }
      );
    });
  } catch (error) {
    console.log('[Background] Error in offscreen permission check:', error);
    return { granted: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Store pending permission requests that are waiting for the permissions page
let pendingPermissionResolve: ((result: { granted: boolean; error?: string }) => void) | null = null;
let permissionTabId: number | null = null;

// Open the permissions page in a new tab
async function openPermissionsPage(): Promise<{ granted: boolean; error?: string }> {
  console.log('[Background] Opening permissions page in new tab...');

  return new Promise((resolve) => {
    pendingPermissionResolve = resolve;

    // Set a timeout in case user closes the tab without granting
    const timeout = setTimeout(() => {
      if (pendingPermissionResolve === resolve) {
        console.log('[Background] Permission request timed out');
        pendingPermissionResolve = null;
        permissionTabId = null;
        resolve({ granted: false, error: 'Permission request timed out or was cancelled' });
      }
    }, 60000); // 60 second timeout

    chrome.tabs.create({ url: 'permissions.html' }, (tab) => {
      if (tab.id) {
        permissionTabId = tab.id;

        // Listen for tab close
        const tabRemovedListener = (closedTabId: number) => {
          if (closedTabId === permissionTabId && pendingPermissionResolve === resolve) {
            clearTimeout(timeout);
            chrome.tabs.onRemoved.removeListener(tabRemovedListener);
            pendingPermissionResolve = null;
            permissionTabId = null;
            // Tab was closed, check if permission was granted by trying offscreen again
            tryOffscreenMicPermission().then(resolve);
          }
        };
        chrome.tabs.onRemoved.addListener(tabRemovedListener);
      }
    });
  });
}

// Main permission request flow
async function requestMicPermission(): Promise<{ granted: boolean; error?: string }> {
  console.log('[Background] Microphone permission requested');

  // First, try the offscreen document (works if permission already granted)
  const offscreenResult = await tryOffscreenMicPermission();
  console.log('[Background] Offscreen permission result:', offscreenResult);

  if (offscreenResult.granted) {
    return offscreenResult;
  }

  // Permission not granted, need to open the full-tab permissions page
  console.log('[Background] Permission not granted, opening permissions page...');
  return openPermissionsPage();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.action || message.type);

  if (message.action === 'textSelected') {
    chrome.runtime.sendMessage(message).catch(() => {});
    sendResponse({});
  } else if (message.action === 'requestMicPermission') {
    requestMicPermission().then(sendResponse);
    return true; // Keep channel open for async response
  } else if (message.action === 'permissionGranted') {
    // Permission was granted from the permissions page
    console.log('[Background] Permission granted from permissions page');
    if (pendingPermissionResolve) {
      pendingPermissionResolve({ granted: true });
      pendingPermissionResolve = null;
      permissionTabId = null;
    }
    sendResponse({ success: true });
  } else {
    sendResponse({});
  }
  return true;
});
