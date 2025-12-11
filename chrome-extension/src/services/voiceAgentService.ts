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
  conversation = await Conversation.startSession({
    agentId: config.elevenLabs.agentId,
    connectionType: 'webrtc',
    onConnect: callbacks.onConnect,
    onDisconnect: callbacks.onDisconnect,
    onError: callbacks.onError,
    onStatusChange: callbacks.onStatusChange,
    onModeChange: callbacks.onModeChange,
  });

  return conversation;
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
