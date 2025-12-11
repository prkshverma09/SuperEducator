import { config } from '../config';

const API_BASE_URL = 'https://api.elevenlabs.io/v1';

export interface AddToKnowledgeBaseParams {
  url: string;
  name: string;
}

export interface KnowledgeBaseResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

const getApiKey = (): string => {
  return process.env.ELEVENLABS_API_KEY || '';
};

export const addUrlToKnowledgeBase = async (
  params: AddToKnowledgeBaseParams
): Promise<KnowledgeBaseResult> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    return { success: false, error: 'API key not configured. Add ELEVENLABS_API_KEY to .env file' };
  }

  try {
    const formData = new FormData();
    formData.append('url', params.url);
    formData.append('name', params.name);

    const response = await fetch(
      `${API_BASE_URL}/convai/agents/${config.elevenLabs.agentId}/add-to-knowledge-base`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.detail?.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, documentId: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
