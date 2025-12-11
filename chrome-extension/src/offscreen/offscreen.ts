// Offscreen document for handling getUserMedia
// This runs in a context that has access to DOM APIs

console.log('[Offscreen] Offscreen document loaded');

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Only handle messages targeted at offscreen document
  if (message.target !== 'offscreen') {
    return false;
  }

  console.log('[Offscreen] Received message:', message.type);

  if (message.type === 'REQUEST_MIC_PERMISSION') {
    console.log('[Offscreen] Requesting microphone permission...');
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // Stop the stream immediately - we just needed to trigger the permission
        stream.getTracks().forEach((track) => track.stop());
        console.log('[Offscreen] Microphone permission granted');
        sendResponse({ granted: true });
      })
      .catch((error) => {
        console.log('[Offscreen] Microphone permission denied:', error.message);
        sendResponse({ granted: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  return false;
});
