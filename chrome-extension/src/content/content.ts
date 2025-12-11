chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const selectedText = window.getSelection()?.toString() || '';
    sendResponse({ selectedText });
  }
  return true;
});

document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection()?.toString();
  if (selectedText && selectedText.trim().length > 0) {
    chrome.runtime.sendMessage({
      action: 'textSelected',
      selectedText: selectedText.trim()
    }).catch(() => {});
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta') {
    const selectedText = window.getSelection()?.toString();
    if (selectedText && selectedText.trim().length > 0) {
      chrome.runtime.sendMessage({
        action: 'textSelected',
        selectedText: selectedText.trim()
      }).catch(() => {});
    }
  }
});
