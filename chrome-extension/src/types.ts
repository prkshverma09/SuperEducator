export interface ElevenLabsConfig {
  apiKey: string;
  agentId: string;
}

export interface KnowledgeBaseResponse {
  id: string;
  name: string;
}

export interface AddKnowledgeBaseRequest {
  url?: string;
  name: string;
}

