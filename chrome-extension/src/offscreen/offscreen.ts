// Offscreen document for handling getUserMedia
// This runs in a context that has access to DOM APIs

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Only handle messages targeted at offscreen document
  if (message.target !== 'offscreen') {
    return false;
  }

  if (message.type === 'REQUEST_MIC_PERMISSION') {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // Stop the stream immediately - we just needed to trigger the permission
        stream.getTracks().forEach((track) => track.stop());
        sendResponse({ granted: true });
      })
      .catch((error) => {
        sendResponse({ granted: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  return false;
});
