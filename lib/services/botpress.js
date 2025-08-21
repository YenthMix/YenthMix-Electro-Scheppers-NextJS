// Botpress service module for all Botpress-related API interactions

import { BOTPRESS_CONFIG } from '../config.js';

/**
 * Create a new user in Botpress
 */
export async function createUser() {
  console.log('🔵 Creating new Botpress user...');
  
  const response = await fetch(`${BOTPRESS_CONFIG.BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    throw new Error(`Botpress user creation failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ User created successfully:', data);
  
  if (!data.user || !data.key) {
    throw new Error('User or user key missing in Botpress response');
  }
  
  return { user: data.user, userKey: data.key };
}

/**
 * Create a new conversation for a user
 */
export async function createConversation(userKey) {
  console.log('🔵 Creating new conversation...');
  
  const response = await fetch(`${BOTPRESS_CONFIG.BASE_URL}/conversations`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'x-user-key': userKey
    },
    body: JSON.stringify({ body: {} })
  });

  if (!response.ok) {
    throw new Error(`Conversation creation failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Conversation created successfully:', data);
  
  if (!data.conversation || !data.conversation.id) {
    throw new Error('Conversation missing in Botpress response');
  }
  
  return { conversation: data.conversation };
}

/**
 * Track user messages before sending to Botpress
 */
export async function trackUserMessage(conversationId, text) {
  console.log(`🔵 Tracking user message: "${text}" for conversation ${conversationId}`);
  
  if (!conversationId || !text) {
    throw new Error('Missing conversationId or text');
  }
  
  return { success: true };
}

/**
 * Send a message to Botpress and get immediate response
 */
export async function sendMessage(conversationId, text, userKey) {
  console.log(`🔵 Sending message to Botpress: "${text}"`);
  
  const response = await fetch(`${BOTPRESS_CONFIG.BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'x-user-key': userKey
    },
    body: JSON.stringify({
      payload: { type: 'text', text },
      conversationId
    })
  });

  if (!response.ok) {
    throw new Error(`Message sending failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Message sent successfully:', data);
  
  return data;
}

/**
 * Get bot messages directly from Botpress
 */
export async function getBotResponse(conversationId, userKey) {
  console.log(`🔍 Fetching bot messages for conversation: ${conversationId}`);
  
  try {
    const response = await fetch(`${BOTPRESS_CONFIG.BASE_URL}/conversations/${conversationId}/messages`, {
      headers: {
        'accept': 'application/json',
        'x-user-key': userKey
      }
    });

    if (!response.ok) {
      throw new Error(`Messages fetch failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.messages && Array.isArray(data.messages)) {
      console.log(`📋 Total messages in conversation: ${data.messages.length}`);
      
      // Log all messages to see what we're getting
      data.messages.forEach((msg, index) => {
        const isBotMessage = msg.userId !== msg.conversationId;
        console.log(`📝 Message ${index + 1}: userId=${msg.userId}, conversationId=${msg.conversationId}, text="${msg.payload?.text}", isBot=${isBotMessage}`);
      });
      
      // Filter for bot messages (messages where userId !== conversationId)
      const botMessages = data.messages
        .filter(msg => msg.userId !== msg.conversationId && msg.payload?.text)
        .map(msg => ({
          id: msg.id,
          text: msg.payload?.text || null,
          image: msg.payload?.image || null,
          timestamp: new Date(msg.createdAt).getTime(),
          receivedAt: new Date().toISOString(),
          isBot: true // Mark as bot message
        }))
        .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp (oldest first)

      if (botMessages.length > 0) {
        console.log(`📝 Found ${botMessages.length} bot messages for conversation: ${conversationId}`);
        
        // Print each bot message to console in order
        botMessages.forEach((msg, index) => {
          console.log(`🤖 Bot says (${index + 1}/${botMessages.length}): "${msg.text}" (isBot: true)`);
        });
        
        return { 
          success: true, 
          messages: botMessages
        };
      } else {
        console.log(`ℹ️ No bot messages found for conversation: ${conversationId}`);
        return { 
          success: false, 
          message: 'No bot messages available' 
        };
      }
    } else {
      console.log(`ℹ️ No messages data for conversation: ${conversationId}`);
      return { 
        success: false, 
        message: 'No messages data available' 
      };
    }
  } catch (error) {
    console.error(`❌ Error fetching bot messages for ${conversationId}:`, error);
    return { 
      success: false, 
      message: 'Error fetching messages',
      error: error.message
    };
  }
}

/**
 * Fetch all messages for a conversation (legacy endpoint)
 */
export async function getMessages(conversationId, userKey) {
  console.log(`🔍 Fetching messages for conversation: ${conversationId}`);
  
  const response = await fetch(`${BOTPRESS_CONFIG.BASE_URL}/conversations/${conversationId}/messages`, {
    headers: {
      'accept': 'application/json',
      'x-user-key': userKey
    }
  });

  if (!response.ok) {
    throw new Error(`Messages fetch failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Fetched ${data.messages?.length || 0} messages`);
  
  return data;
}

/**
 * Register file with Botpress Knowledge Base
 */
export async function registerFileWithBotpress(file, title) {
  const timestamp = Date.now();
  const filename = file.originalname;
  const kbIdForKey = BOTPRESS_CONFIG.KNOWLEDGE_BASE_ID.startsWith('kb-') 
    ? BOTPRESS_CONFIG.KNOWLEDGE_BASE_ID 
    : `kb-${BOTPRESS_CONFIG.KNOWLEDGE_BASE_ID}`;
  const fileKey = `${kbIdForKey}/${timestamp}-${filename}`;
  
  console.log(`📝 Registering file with key: ${fileKey}`);
  
  const registerRes = await fetch(BOTPRESS_CONFIG.FILES_API_URL, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${BOTPRESS_CONFIG.BEARER_TOKEN}`,
      'x-bot-id': BOTPRESS_CONFIG.BOT_ID,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      key: fileKey,
      contentType: file.mimetype,
      size: file.size,
      index: true,
      accessPolicies: ['public_content'],
      tags: {
        source: 'knowledge-base',
        kbId: BOTPRESS_CONFIG.KNOWLEDGE_BASE_ID.replace(/^kb-/, ''),
        title: title,
        category: 'support',
        uploadedVia: 'api'
      }
    })
  });

  if (!registerRes.ok) {
    const errorText = await registerRes.text();
    console.error(`❌ File registration failed: ${registerRes.status}`);
    console.error(`   Error details: ${errorText}`);
    throw new Error(`File registration failed: ${registerRes.status} - ${errorText}`);
  }

  const registerData = await registerRes.json();
  const fileObj = registerData.file || registerData;
  
  if (!fileObj.uploadUrl || !fileObj.id) {
    throw new Error('No uploadUrl or fileId in Botpress response');
  }
  
  console.log(`✅ File metadata registered. File ID: ${fileObj.id}`);
  
  return {
    fileId: fileObj.id,
    uploadUrl: fileObj.uploadUrl,
    fileKey,
    fileName: filename,
    title
  };
}

/**
 * Upload file content to Botpress storage
 */
export async function uploadFileContent(uploadUrl, fileBuffer, mimetype) {
  const uploadContentRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimetype
    },
    body: fileBuffer
  });

  if (!uploadContentRes.ok) {
    throw new Error(`File content upload failed: ${uploadContentRes.status}`);
  }
  
  console.log(`✅ File content uploaded to storage.`);
  return true;
}

/**
 * Get documents from knowledge base
 */
export async function getDocuments() {
  console.log('📄 Fetching documents from Botpress Knowledge Base...');
  
  const url = new URL(BOTPRESS_CONFIG.FILES_API_URL);
  url.searchParams.append('tags[category]', 'support');
  url.searchParams.append('tags[source]', 'knowledge-base');
  url.searchParams.append('limit', '100');
  
  console.log(`📄 Fetching from: ${url.toString()}`);
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${BOTPRESS_CONFIG.BEARER_TOKEN}`,
      'x-bot-id': BOTPRESS_CONFIG.BOT_ID,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Botpress API error: ${response.status}`);
    console.error(`   Error details: ${errorText}`);
    throw new Error(`Botpress API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const files = data.files || data;
  console.log('📋 Botpress KB files response:', files);
  
  return { success: true, files };
}

/**
 * Delete document from knowledge base
 */
export async function deleteDocument(fileId) {
  console.log(`🗑️ Deleting file from Botpress: ${fileId}`);
  
  const deleteRes = await fetch(`${BOTPRESS_CONFIG.FILES_API_URL}/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${BOTPRESS_CONFIG.BEARER_TOKEN}`,
      'x-bot-id': BOTPRESS_CONFIG.BOT_ID,
      'Content-Type': 'application/json'
    }
  });

  if (!deleteRes.ok) {
    const errorText = await deleteRes.text();
    console.error(`❌ Botpress delete error: ${deleteRes.status}`);
    console.error(`   Error details: ${errorText}`);
    throw new Error(`Failed to delete file: ${deleteRes.status} - ${errorText}`);
  }

  console.log(`✅ File deleted successfully: ${fileId}`);
  return { success: true };
}

/**
 * Clear all state (debug function)
 */
export function clearAllState() {
  console.log('🧹 FORCE CLEARING ALL STATE');
  
  console.log(`✅ Cleared all state.`);
  
  return {
    success: true,
    message: 'All state cleared',
    timestamp: Date.now()
  };
}

/**
 * Get stored responses (debug function)
 */
export function getStoredResponses() {
  console.log('🔍 DEBUG ENDPOINT CALLED - Current storage state:');
  console.log(`   No message storage (direct API calls now)`);
  
  return { 
    totalBotMessageConversations: 0,
    totalBotMessages: 0,
    totalUserMessages: 0,
    botMessages: {},
    userMessages: {},
    globalMessages: {},
    activeTimeouts: 0,
    timestamp: Date.now()
  };
}
