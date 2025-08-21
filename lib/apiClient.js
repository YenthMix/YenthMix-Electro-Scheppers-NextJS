// API client for frontend components to interact with backend APIs

import { API_ENDPOINTS } from './config.js';

/**
 * Generic API client with error handling
 */
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API call failed: ${response.status} - ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * User management
 */
export const userAPI = {
  create: () => apiCall(API_ENDPOINTS.createUser, { method: 'POST' })
};

/**
 * Conversation management
 */
export const conversationAPI = {
  create: (userKey) => apiCall(API_ENDPOINTS.createConversation, {
    method: 'POST',
    body: JSON.stringify({ userKey })
  })
};

/**
 * Message management
 */
export const messageAPI = {
  track: (conversationId, text) => apiCall(API_ENDPOINTS.trackUserMessage, {
    method: 'POST',
    body: JSON.stringify({ conversationId, text })
  }),
  
  send: (conversationId, text, userKey) => apiCall(API_ENDPOINTS.sendMessage, {
    method: 'POST',
    body: JSON.stringify({ conversationId, text, userKey })
  }),
  
  // getBotResponse removed - now using SSE for real-time messages
// SSE connection is handled directly in ChatProvider component
  
  getAll: (conversationId, userKey) => apiCall(
    `${API_ENDPOINTS.getMessages}?conversationId=${conversationId}&userKey=${userKey}`
  )
};

/**
 * File management
 */
export const fileAPI = {
  upload: (formData) => fetch(API_ENDPOINTS.uploadFile, {
    method: 'POST',
    body: formData // Don't set Content-Type for FormData
  }).then(response => {
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    return response.json();
  }),
  
  getDocuments: () => apiCall(API_ENDPOINTS.getDocuments),
  
  deleteDocument: (id) => apiCall(API_ENDPOINTS.deleteDocument(id), {
    method: 'DELETE'
  })
};

/**
 * Debug functions
 */
export const debugAPI = {
  clearAll: () => apiCall(API_ENDPOINTS.clearAll, { method: 'POST' }),
  getStoredResponses: () => apiCall(API_ENDPOINTS.storedResponses)
};

/**
 * Health check
 */
export const healthAPI = {
  check: () => apiCall(API_ENDPOINTS.health)
};
