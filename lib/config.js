// Centralized configuration for API endpoints and constants

const API_ID = process.env.API_ID;
const BOTPRESS_BASE_URL = `https://chat.botpress.cloud/${API_ID}`;

export const BOTPRESS_CONFIG = {
  API_ID,
  BASE_URL: BOTPRESS_BASE_URL,
  BOT_ID: process.env.BOTPRESS_BOT_ID,
  WORKSPACE_ID: process.env.BOTPRESS_WORKSPACE_ID,
  KNOWLEDGE_BASE_ID: process.env.BOTPRESS_KNOWLEDGE_BASE_ID,
  BEARER_TOKEN: process.env.BOTPRESS_BEARER_TOKEN,
  FILES_API_URL: process.env.FILES_API_URL
};

// API endpoints for frontend use
export const API_ENDPOINTS = {
  // User and conversation management
  createUser: '/api/user',
  createConversation: '/api/conversation',
  
  // Message handling
  trackUserMessage: '/api/track-user-message',
  sendMessage: '/api/message',
  // Real-time message streaming via SSE
  botStream: (conversationId) => `/api/bot-stream/${conversationId}`,
  getMessages: '/api/messages',
  
  // File management
  uploadFile: '/api/upload',
  getDocuments: '/api/documents',
  deleteDocument: (id) => `/api/documents/${id}`,
  
  // Debug endpoints
  clearAll: '/api/debug/clear-all',
  storedResponses: '/api/debug/stored-responses',
  
  // Health check
  health: '/health'
};

// File upload configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};
