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

interface KnowledgeBaseDocument {
  id: string;
  name: string;
}

interface AgentKnowledgeBaseItem {
  type: string;
  name: string;
  id: string;
}

const getApiKey = (): string => {
  return process.env.ELEVENLABS_API_KEY || '';
};

const createDocumentFromUrl = async (
  apiKey: string,
  url: string,
  name: string
): Promise<{ success: boolean; document?: KnowledgeBaseDocument; error?: string }> => {
  const response = await fetch(`${API_BASE_URL}/convai/knowledge-base/url`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, name }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.detail?.message || `Failed to create document: ${response.status}`,
    };
  }

  const data = await response.json();
  return { success: true, document: { id: data.id, name: data.name || name } };
};

const getAgentKnowledgeBase = async (
  apiKey: string,
  agentId: string
): Promise<AgentKnowledgeBaseItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/convai/agents/${agentId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.conversation_config?.agent?.prompt?.knowledge_base || [];
  } catch {
    return [];
  }
};

const addDocumentToAgent = async (
  apiKey: string,
  agentId: string,
  document: KnowledgeBaseDocument,
  existingKnowledgeBase: AgentKnowledgeBaseItem[]
): Promise<{ success: boolean; error?: string }> => {
  const newKnowledgeBaseItem: AgentKnowledgeBaseItem = {
    type: 'url',
    name: document.name,
    id: document.id,
  };

  const updatedKnowledgeBase = [...existingKnowledgeBase, newKnowledgeBaseItem];

  const response = await fetch(`${API_BASE_URL}/convai/agents/${agentId}`, {
    method: 'PATCH',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: {
            knowledge_base: updatedKnowledgeBase,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.detail?.message || `Failed to update agent: ${response.status}`,
    };
  }

  return { success: true };
};

export const addUrlToKnowledgeBase = async (
  params: AddToKnowledgeBaseParams
): Promise<KnowledgeBaseResult> => {
  const apiKey = getApiKey();
  const agentId = config.elevenLabs.agentId;

  if (!apiKey) {
    return { success: false, error: 'API key not configured. Add ELEVENLABS_API_KEY to .env file' };
  }

  if (!agentId) {
    return { success: false, error: 'Agent ID not configured. Add ELEVENLABS_AGENT_ID to .env file' };
  }

  try {
    const createResult = await createDocumentFromUrl(apiKey, params.url, params.name);
    if (!createResult.success || !createResult.document) {
      return { success: false, error: createResult.error };
    }

    const existingKnowledgeBase = await getAgentKnowledgeBase(apiKey, agentId);

    const updateResult = await addDocumentToAgent(
      apiKey,
      agentId,
      createResult.document,
      existingKnowledgeBase
    );

    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    return { success: true, documentId: createResult.document.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const clearKnowledgeBase = async (): Promise<{ success: boolean; error?: string }> => {
  const apiKey = getApiKey();
  const agentId = config.elevenLabs.agentId;

  if (!apiKey) {
    return { success: false, error: 'API key not configured. Add ELEVENLABS_API_KEY to .env file' };
  }

  if (!agentId) {
    return { success: false, error: 'Agent ID not configured. Add ELEVENLABS_AGENT_ID to .env file' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/convai/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_config: {
          agent: {
            prompt: {
              knowledge_base: [],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.detail?.message || `Failed to clear knowledge base: ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
