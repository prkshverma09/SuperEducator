import React, { useState, useCallback } from 'react';
import {
  startConversation,
  endConversation,
  setMuted,
  VoiceAgentCallbacks,
  AgentMode as SDKAgentMode,
} from '../services/voiceAgentService';

type UIStatus = 'idle' | 'connecting' | 'connected' | 'error';

const VoiceAgent: React.FC = () => {
  const [status, setStatus] = useState<UIStatus>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [agentMode, setAgentMode] = useState<SDKAgentMode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const requestMicPermission = async (): Promise<{ granted: boolean; error?: string }> => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'requestMicPermission' });
      return response;
    } catch (error) {
      return { granted: false, error: error instanceof Error ? error.message : 'Failed to request permission' };
    }
  };

  const handleStart = useCallback(async () => {
    setStatus('connecting');
    setErrorMessage('');

    // First, request microphone permission through the background script's offscreen document
    const permissionResult = await requestMicPermission();
    if (!permissionResult.granted) {
      setStatus('error');
      setErrorMessage(permissionResult.error || 'Microphone permission denied');
      return;
    }

    const callbacks: VoiceAgentCallbacks = {
      onConnect: () => {
        setStatus('connected');
        setAgentMode('listening');
      },
      onDisconnect: () => {
        setStatus('idle');
        setAgentMode(null);
        setIsMuted(false);
      },
      onError: (message: string) => {
        setStatus('error');
        setErrorMessage(message || 'Connection failed');
      },
      onStatusChange: ({ status: connectionStatus }) => {
        if (connectionStatus === 'disconnected') {
          setStatus('idle');
          setAgentMode(null);
          setIsMuted(false);
        }
      },
      onModeChange: ({ mode }) => {
        setAgentMode(mode);
      },
    };

    try {
      await startConversation(callbacks);
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to start conversation'
      );
    }
  }, []);

  const handleEnd = useCallback(async () => {
    try {
      await endConversation();
      setStatus('idle');
      setAgentMode(null);
      setIsMuted(false);
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    setMuted(newMutedState);
  }, [isMuted]);

  const getStatusText = (): string => {
    if (agentMode === 'speaking') return 'Speaking...';
    if (agentMode === 'listening') return 'Listening...';
    return 'Connected';
  };

  if (status === 'idle' || status === 'error') {
    return (
      <div className="voice-agent-bar">
        <button
          className="voice-start-btn"
          onClick={handleStart}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          Talk to Agent
        </button>
        {status === 'error' && errorMessage && (
          <div className="voice-error">{errorMessage}</div>
        )}
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="voice-agent-bar">
        <div className="voice-connecting">
          <div className="voice-spinner"></div>
          <span>Connecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-agent-bar voice-active">
      <div className="voice-status">
        <span className="voice-live-dot"></span>
        <span className="voice-status-text">Live</span>
        <span className="voice-mode">{getStatusText()}</span>
      </div>
      <div className="voice-controls">
        <button
          className={`voice-mute-btn ${isMuted ? 'muted' : ''}`}
          onClick={handleMuteToggle}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
        <button className="voice-end-btn" onClick={handleEnd}>
          End Call
        </button>
      </div>
    </div>
  );
};

export default VoiceAgent;
