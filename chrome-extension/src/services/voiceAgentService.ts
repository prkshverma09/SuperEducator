import { Conversation, type Status, type Mode } from '@elevenlabs/client';
import { config } from '../config';

export type ConversationStatus = Status;
export type AgentMode = Mode;

export interface VoiceAgentCallbacks {
  onConnect?: (props: { conversationId: string }) => void;
  onDisconnect?: () => void;
  onError?: (message: string, context?: unknown) => void;
  onStatusChange?: (props: { status: Status }) => void;
  onModeChange?: (props: { mode: Mode }) => void;
}

let conversation: Conversation | null = null;

export const startConversation = async (
  callbacks: VoiceAgentCallbacks
): Promise<Conversation> => {
  console.log('[VoiceAgentService] Starting session with agent:', config.elevenLabs.agentId);

  try {
    // Get the extension URL for self-hosted worklet files to avoid CSP blob: URL restrictions
    const workletBasePath = chrome.runtime.getURL('worklets');
    console.log('[VoiceAgentService] Worklet base path:', workletBasePath);

    conversation = await Conversation.startSession({
      agentId: config.elevenLabs.agentId,
      connectionType: 'websocket',
      // Self-host worklet files to avoid CSP blob: URL restrictions in Chrome extensions
      workletPaths: {
        rawAudioProcessor: `${workletBasePath}/rawAudioProcessor.js`,
        audioConcatProcessor: `${workletBasePath}/audioConcatProcessor.js`,
      },
      onConnect: callbacks.onConnect,
      onDisconnect: callbacks.onDisconnect,
      onError: callbacks.onError,
      onStatusChange: callbacks.onStatusChange,
      onModeChange: callbacks.onModeChange,
    });

    console.log('[VoiceAgentService] Session started successfully');
    return conversation;
  } catch (error) {
    console.error('[VoiceAgentService] Failed to start session:', error);
    throw error;
  }
};

export const endConversation = async (): Promise<void> => {
  if (conversation) {
    await conversation.endSession();
    conversation = null;
  }
};

export const setMuted = (muted: boolean): void => {
  conversation?.setMicMuted(muted);
};

export const isConversationActive = (): boolean => {
  return conversation !== null;
};
