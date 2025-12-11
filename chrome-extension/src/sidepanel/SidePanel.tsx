import React, { useState, useEffect, useCallback } from 'react';

const SidePanel: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const getSelectedText = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        setError('No active tab found');
        setIsLoading(false);
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' });

      if (response?.selectedText) {
        setSelectedText(response.selectedText);
      } else {
        setSelectedText('');
      }
    } catch (err) {
      setError('Could not read selection. Try refreshing the page.');
      console.error('Error getting selected text:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getSelectedText();

    const handleMessage = (message: { action: string; selectedText?: string }) => {
      if (message.action === 'textSelected' && message.selectedText) {
        setSelectedText(message.selectedText);
        setError('');
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [getSelectedText]);

  const handleCopy = async () => {
    if (selectedText) {
      await navigator.clipboard.writeText(selectedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleClear = () => {
    setSelectedText('');
  };

  return (
    <div className="sidepanel-container">
      <header className="sidepanel-header">
        <div className="header-title">
          <div className="logo">📝</div>
          <h1>Text Reader</h1>
        </div>
        <button className="refresh-btn" onClick={getSelectedText} title="Refresh">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
        </button>
      </header>

      <main className="sidepanel-content">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Reading selection...</p>
          </div>
        ) : error ? (
          <div className="error">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button className="retry-btn" onClick={getSelectedText}>Try Again</button>
          </div>
        ) : selectedText ? (
          <div className="text-display">
            <div className="text-header">
              <span className="text-label">Selected Text</span>
              <button className="clear-btn" onClick={handleClear} title="Clear">
                ✕
              </button>
            </div>
            <div className="text-content">{selectedText}</div>
            <div className="text-meta">
              <div className="meta-item">
                <span className="meta-value">{selectedText.length}</span>
                <span className="meta-label">characters</span>
              </div>
              <div className="meta-item">
                <span className="meta-value">{selectedText.split(/\s+/).filter(Boolean).length}</span>
                <span className="meta-label">words</span>
              </div>
            </div>
            <button className={`copy-btn ${copySuccess ? 'success' : ''}`} onClick={handleCopy}>
              {copySuccess ? '✓ Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        ) : (
          <div className="no-selection">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
              </svg>
            </div>
            <h2>No text selected</h2>
            <p>Select some text on the page to see it here</p>
          </div>
        )}
      </main>

      <footer className="sidepanel-footer">
        <p>Select text anywhere on the page</p>
      </footer>
    </div>
  );
};

export default SidePanel;

