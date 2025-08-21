'use client';
import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useAuth } from './AuthProvider';

// Load config from environment variables
// N8N removed - using direct Botpress Chat API integration
// No longer need BACKEND_URL since we're using Next.js API routes

interface Message {
  id: string;
  text?: string;
  image?: string;
  isBot: boolean;
  receivedAt?: string;
  timestamp?: number;
  isTyping?: boolean;
  displayText?: string;
  fullText?: string;
}

interface ChatContextType {
  messages: Message[];
  isConnected: boolean;
  isLoading: boolean;
  isChatOpen: boolean;
  unreadCount: number;
  inputValue: string;
  setInputValue: (value: string) => void;
  toggleChat: () => void;
  sendMessage: (message: string) => Promise<void>;
  initializeChatAPI: () => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setDisplayedMessageIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setLastReadMessageId: React.Dispatch<React.SetStateAction<string>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  chatSettings: any;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome-1', text: "Hallo! Hoe kan ik u vandaag helpen?", isBot: true }
  ]);
  const [displayedMessageIds, setDisplayedMessageIds] = useState(new Set(['welcome-1']));
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userKey, setUserKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [lastReadMessageId, setLastReadMessageId] = useState('welcome-1');
  const [chatSettings, setChatSettings] = useState<any>(null);
  
  // Ref for auto-scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('chatSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setChatSettings(settings);
      
      // Update welcome message if it exists
      if (settings.welcomeMessage && messages.length > 0 && messages[0].id === 'welcome-1') {
        setMessages(prev => [
          { ...prev[0], text: settings.welcomeMessage },
          ...prev.slice(1)
        ]);
      }
    }
  }, []);

  // Listen for storage changes and custom events to update settings in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatSettings' && e.newValue) {
        const settings = JSON.parse(e.newValue);
        setChatSettings(settings);
        
        // Update welcome message if it exists
        if (settings.welcomeMessage && messages.length > 0 && messages[0].id === 'welcome-1') {
          setMessages(prev => [
            { ...prev[0], text: settings.welcomeMessage },
            ...prev.slice(1)
          ]);
        }
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail && e.detail.settings) {
        setChatSettings(e.detail.settings);
        
        // Update welcome message if it exists
        if (e.detail.settings.welcomeMessage && messages.length > 0 && messages[0].id === 'welcome-1') {
          setMessages(prev => [
            { ...prev[0], text: e.detail.settings.welcomeMessage },
            ...prev.slice(1)
          ]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('chatSettingsChanged', handleCustomStorageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('chatSettingsChanged', handleCustomStorageChange as EventListener);
    };
  }, [messages]);

  // Only initialize chat if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializeChatAPI();
    }
  }, [isAuthenticated]);

  // Auto-close chat when navigating to different pages
  useEffect(() => {
    const handleRouteChange = () => {
      setIsChatOpen(false);
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);



  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    const animationFrameId = requestAnimationFrame(() => {
      requestAnimationFrame(scrollToBottom);
    });
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [messages.length]);

  // Update unread count when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only count bot messages as unread, not user messages or loading states
      if (lastMessage.isBot && lastMessage.id !== lastReadMessageId && !isChatOpen) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [messages, lastReadMessageId, isChatOpen]);

  const initializeChatAPI = async () => {
    try {
      const userResponse = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!userResponse.ok) {
        throw new Error(`User creation failed: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      
      if (!userData.userKey) {
        throw new Error('User key missing from backend response');
      }
      
      setUserKey(userData.userKey);
      
      const convResponse = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userKey: userData.userKey })
      });
      
      if (!convResponse.ok) {
        throw new Error(`Conversation creation failed: ${convResponse.status}`);
      }
      
      const convData = await convResponse.json();
      
      if (!convData.conversation?.id) {
        throw new Error('Conversation ID missing from backend response');
      }
      
      setConversationId(convData.conversation.id);
      setUserId(userData.user.id);
      setIsConnected(true);
      
    } catch (error) {
      console.error('Failed to initialize chat API:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: "Failed to connect to Botpress. Please make sure the backend server is running with 'npm run backend'.",
        isBot: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const sendToBotpress = async (userMessage: string) => {
    if (!conversationId) {
      throw new Error('Not connected to chat system');
    }

    try {
      const sendTimestamp = new Date().toISOString();
      console.log(`🔵 Sending message to Botpress: "${userMessage}" for conversation: ${conversationId}`);
      
      // First, track the user message
      const trackResponse = await fetch('/api/track-user-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          text: userMessage
        })
      });

      if (!trackResponse.ok) {
        throw new Error(`Message tracking failed: ${trackResponse.status}`);
      }

      console.log(`✅ User message tracked successfully`);
      
      // Then send message to Botpress
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          text: userMessage,
          userKey
        })
      });

      if (!response.ok) {
        throw new Error(`Botpress message error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Message sent to Botpress successfully at ${sendTimestamp}:`, data);
      
      // Start waiting for initial response, then continuous polling
      startInitialWait();
      
      return data;
      
    } catch (error) {
      console.error('Error sending message to Botpress:', error);
      throw error;
    }
  };

  const startInitialWait = () => {
    let initialWaitCount = 0;
    const maxInitialWaits = 10; // Wait up to 10 seconds for first message
    
    const checkForInitialMessage = async () => {
      try {
        initialWaitCount++;
        console.log(`⏳ Waiting for initial bot response (${initialWaitCount}/${maxInitialWaits})...`);
        
        const botResponse = await fetch(`/api/bot-response/${conversationId}?userKey=${userKey}`);
        
        if (botResponse.ok) {
          const botData = await botResponse.json();
          
          if (botData.success && botData.messages && Array.isArray(botData.messages) && botData.messages.length > 0) {
            // First message received! Start continuous polling
            console.log(`🎯 First bot message received! Starting continuous polling...`);
            startContinuousPolling();
            return;
          }
        }
        
        // No message yet, continue waiting
        if (initialWaitCount < maxInitialWaits) {
          setTimeout(checkForInitialMessage, 1000); // Check every 1 second
        } else {
          console.log(`⏰ Initial wait timeout - no response after ${maxInitialWaits} seconds`);
          setIsLoading(false);
        }
        
      } catch (error) {
        console.error('Error during initial wait:', error);
        if (initialWaitCount < maxInitialWaits) {
          setTimeout(checkForInitialMessage, 1000);
        } else {
          setIsLoading(false);
        }
      }
    };
    
    // Start initial wait
    checkForInitialMessage();
  };

  const startContinuousPolling = () => {
    let pollCount = 0;
    let lastMessageCount = 0;
    let allBotMessages: any[] = []; // Buffer to collect all bot messages
    let shouldStopPolling = false; // Flag to stop polling
    // Removed maxPolls - will poll indefinitely until typing is complete
    
    const poll = async () => {
      try {
        pollCount++;
        console.log(`🔍 Continuous polling attempt ${pollCount} for additional bot responses...`);
        
        const botResponse = await fetch(`/api/bot-response/${conversationId}?userKey=${userKey}`);
        
        if (botResponse.ok) {
          const botData = await botResponse.json();
          
          if (botData.success && botData.messages && Array.isArray(botData.messages)) {
            const currentMessageCount = botData.messages.length;
            
            if (currentMessageCount > lastMessageCount) {
              // New messages found - process them immediately
              const newMessages = botData.messages.slice(lastMessageCount);
              allBotMessages = [...allBotMessages, ...newMessages];
              
              console.log(`📝 Found ${newMessages.length} new bot messages (total buffered: ${allBotMessages.length})`);
              
              // Process new messages immediately
              processNewMessages(newMessages, () => {
                shouldStopPolling = true; // Set flag when typing completes
              });
              
              lastMessageCount = currentMessageCount;
              shouldStopPolling = false; // Reset stop flag when new messages arrive
            } else if (shouldStopPolling) {
              // No new messages and we should stop polling
              console.log(`✅ No new messages found after typing completed. Stopping polling.`);
              setIsLoading(false);
              return;
            }
          }
        } else {
          console.error(`❌ Failed to get bot response: ${botResponse.status}`);
        }
        
        // Continue polling after 2 seconds (no max limit)
        setTimeout(poll, 2000);
        
      } catch (error) {
        console.error('Error during continuous polling:', error);
        
        // Continue polling even on error (no max limit)
        setTimeout(poll, 2000);
      }
    };
    
    // Start continuous polling
    poll();
  };

  const processNewMessages = (newMessages: any[], onTypingComplete?: () => void) => {
    // Safety check - ensure newMessages is valid
    if (!Array.isArray(newMessages) || newMessages.length === 0) {
      console.log(`⚠️ No valid messages to process`);
      if (onTypingComplete) onTypingComplete();
      return;
    }
    
    console.log(`🔍 Processing ${newMessages.length} new bot messages immediately`);
    
    // Convert backend messages to frontend format with validation
    const newBotMessages = newMessages
      .filter((msg: any) => msg && typeof msg === 'object') // Filter out invalid messages
      .map((msg: any) => ({
        id: msg.id || `bot-${Date.now()}-${Math.random()}`, // Fallback ID if missing
        text: msg.text || '',
        image: msg.image || undefined,
        isBot: true,
        timestamp: msg.timestamp || Date.now(),
        receivedAt: msg.receivedAt || Date.now(),
        isTyping: false,
        displayText: '',
        fullText: msg.text || ''
      }))
      .filter(msg => msg.text.trim() !== ''); // Filter out empty messages
    
    // Print to console
    newBotMessages.forEach((msg: any) => {
      console.log(`🤖 Bot says: "${msg.text}" (isBot: true)`);
    });
    
    setMessages(prev => {
      // Validate previous messages state
      if (!Array.isArray(prev)) {
        console.error(`❌ Invalid messages state:`, prev);
        return prev;
      }
      
      // Get the last user message to check for echoes (with validation)
      const lastUserMessage = prev.filter(m => m && typeof m === 'object' && m.isBot === false).pop();
      
      // More robust duplicate filtering - check multiple criteria
      let uniqueNewMessages = newBotMessages.filter((newMsg: any) => {
        // Check if this message already exists in previous messages
        const isDuplicate = prev.some(existingMsg => {
          // Check by ID (most reliable)
          if (existingMsg.id === newMsg.id) return true;
          
          // Check by exact text match
          if (existingMsg.text === newMsg.text) return true;
          
          // Check by timestamp (within 1 second tolerance) and text
          if (existingMsg.timestamp && newMsg.timestamp) {
            const timeDiff = Math.abs(existingMsg.timestamp - newMsg.timestamp);
            if (timeDiff < 1000 && existingMsg.text === newMsg.text) return true;
          }
          
          // Check by text similarity (case-insensitive, trimmed)
          const normalizedExisting = existingMsg.text?.toLowerCase().trim();
          const normalizedNew = newMsg.text?.toLowerCase().trim();
          if (normalizedExisting && normalizedNew && normalizedExisting === normalizedNew) return true;
          
          return false;
        });
        
        if (isDuplicate) {
          console.log(`🔄 Duplicate detected and filtered: "${newMsg.text}" (ID: ${newMsg.id})`);
        }
        
        return !isDuplicate;
      });
      
      // Filter out bot messages that echo the user's last message (with validation)
      if (lastUserMessage && lastUserMessage.text && typeof lastUserMessage.text === 'string') {
        const echoFiltered = uniqueNewMessages.filter((msg: any) => {
          if (!msg.text || typeof msg.text !== 'string') return true; // Keep invalid messages for now
          
          const userText = lastUserMessage.text!.toLowerCase().trim();
          const botText = msg.text.toLowerCase().trim();
          
          return userText !== botText;
        });
        
        if (echoFiltered.length !== uniqueNewMessages.length) {
          console.log(`⚠️ Filtered out ${uniqueNewMessages.length - echoFiltered.length} echo messages from bot`);
        }
        uniqueNewMessages = echoFiltered;
      }
      
      if (uniqueNewMessages.length !== newBotMessages.length) {
        console.log(`⚠️ Total filtered: ${newBotMessages.length - uniqueNewMessages.length} messages`);
      }
      
      // Sort messages by timestamp to ensure correct order (with validation)
      const messagesToType = uniqueNewMessages
        .filter(msg => msg && msg.isBot === true && msg.id !== 'welcome-1')
        .sort((a, b) => {
          // Ensure both timestamps are valid numbers
          const timestampA = typeof a.timestamp === 'number' ? a.timestamp : Date.now();
          const timestampB = typeof b.timestamp === 'number' ? b.timestamp : Date.now();
          return timestampA - timestampB;
        });
      
      // Only add the first message to the screen, others will be added sequentially
      const messagesToShow = messagesToType.length > 0 ? [messagesToType[0]] : [];
      const updatedMessages = [...prev, ...messagesToShow];
      
      console.log(`📝 Updated messages state (${updatedMessages.length} total):`, updatedMessages.map(m => ({ id: m.id, text: m.text, isBot: m.isBot })));
      
      // Start typing messages one by one in order
      if (messagesToType.length > 0) {
        startSequentialTyping(messagesToType, 0, onTypingComplete);
      } else {
        // No messages to type - DON'T call onTypingComplete immediately
        // This prevents polling from stopping when only echo messages are filtered out
        console.log(`🔄 No valid messages to type, but continuing to poll for real bot responses...`);
        // Don't call onTypingComplete() here - let polling continue
      }
      
      return updatedMessages;
    });
  };

  const startSequentialTyping = (messages: any[], currentIndex: number, onTypingComplete?: () => void) => {
    if (currentIndex >= messages.length) {
      // All messages have been typed
      console.log(`✅ All ${messages.length} messages have been typed sequentially`);
      if (onTypingComplete) {
        onTypingComplete();
      }
      return;
    }
    
    const currentMessage = messages[currentIndex];
    console.log(`🎯 Starting to type message ${currentIndex + 1}/${messages.length}: "${currentMessage.text}"`);
    
    startTypewriterEffect(currentMessage.id, currentMessage.fullText, 0, () => {
      // When this message finishes typing, add the next message to screen and start typing it
      console.log(`✅ Message ${currentIndex + 1} typing completed, adding next message to screen`);
      
      if (currentIndex + 1 < messages.length) {
        // Add the next message to the screen (check for duplicates first)
        setMessages(prev => {
          const nextMessage = messages[currentIndex + 1];
          
          // Validate next message
          if (!nextMessage || typeof nextMessage !== 'object') {
            console.error(`❌ Invalid next message:`, nextMessage);
            return prev;
          }
          
          // More robust duplicate detection - check multiple criteria
          const messageExists = prev.some(msg => {
            // Check by ID (most reliable)
            if (msg.id === nextMessage.id) return true;
            
            // Check by exact text match
            if (msg.text === nextMessage.text) return true;
            
            // Check by timestamp (within 1 second tolerance)
            if (msg.timestamp && nextMessage.timestamp) {
              const timeDiff = Math.abs(msg.timestamp - nextMessage.timestamp);
              if (timeDiff < 1000 && msg.text === nextMessage.text) return true;
            }
            
            // Check by text similarity (case-insensitive, trimmed)
            const normalizedText1 = msg.text?.toLowerCase().trim();
            const normalizedText2 = nextMessage.text?.toLowerCase().trim();
            if (normalizedText1 && normalizedText2 && normalizedText1 === normalizedText2) return true;
            
            return false;
          });
          
          if (messageExists) {
            console.log(`⚠️ Message already exists, skipping: "${nextMessage.text}" (ID: ${nextMessage.id})`);
            return prev; // Don't add duplicate
          }
          
          // Additional safety check - ensure message has required properties
          if (!nextMessage.id || !nextMessage.text || !nextMessage.isBot) {
            console.log(`⚠️ Invalid message format, skipping:`, nextMessage);
            return prev;
          }
          
          console.log(`📝 Adding next message to screen: "${nextMessage.text}" (ID: ${nextMessage.id})`);
          return [...prev, nextMessage];
        });
      }
      
      // Start typing the next message
      startSequentialTyping(messages, currentIndex + 1, onTypingComplete);
    });
  };

  const checkForNewMessagesAfterTyping = () => {
    // This function will be called when typing completes
    // We'll check if there are new messages and continue polling if needed
    console.log(`🔍 Checking for new messages after typing completed...`);
    // The polling will continue automatically and check for new messages
  };

  const startTypewriterEffect = (messageId: string, fullText: string, delay: number = 0, onComplete?: () => void) => {
    // Validate input parameters
    if (!messageId || typeof messageId !== 'string') {
      console.error(`❌ Invalid messageId for typewriter effect:`, messageId);
      if (onComplete) onComplete();
      return;
    }
    
    if (!fullText || typeof fullText !== 'string') {
      console.error(`❌ Invalid fullText for typewriter effect:`, fullText);
      if (onComplete) onComplete();
      return;
    }
    
    if (typeof delay !== 'number' || delay < 0) {
      console.warn(`⚠️ Invalid delay for typewriter effect, using 0:`, delay);
      delay = 0;
    }
    
    setTimeout(() => {
      let currentIndex = 0;
      const typeSpeed = 50; // 50ms per character
      
      const typeNextChar = () => {
        if (currentIndex < fullText.length) {
          setMessages(prev => {
            // Validate messages state
            if (!Array.isArray(prev)) {
              console.error(`❌ Invalid messages state during typewriter:`, prev);
              return prev;
            }
            
            return prev.map(msg => {
              // Validate each message
              if (!msg || typeof msg !== 'object') {
                console.warn(`⚠️ Invalid message during typewriter:`, msg);
                return msg;
              }
              
              if (msg.id === messageId) {
                return { 
                  ...msg, 
                  displayText: fullText.substring(0, currentIndex + 1), 
                  isTyping: true 
                };
              }
              return msg;
            });
          });
          
          currentIndex++;
          setTimeout(typeNextChar, typeSpeed);
        } else {
          // Typing complete
          setMessages(prev => {
            // Validate messages state
            if (!Array.isArray(prev)) {
              console.error(`❌ Invalid messages state when completing typewriter:`, prev);
              return prev;
            }
            
            return prev.map(msg => {
              // Validate each message
              if (!msg || typeof msg !== 'object') {
                console.warn(`⚠️ Invalid message when completing typewriter:`, msg);
                return msg;
              }
              
              if (msg.id === messageId) {
                return { 
                  ...msg, 
                  displayText: fullText, 
                  isTyping: false 
                };
              }
              return msg;
            });
          });
          
          console.log(`✅ Typewriter effect completed for message: "${fullText}" (ID: ${messageId})`);
          if (onComplete) onComplete();
        }
      };
      
      typeNextChar();
    }, delay);
  };

  const sendMessage = async (userMessage: string) => {
    // Validate input parameters
    if (!userMessage || typeof userMessage !== 'string') {
      console.error(`❌ Invalid user message:`, userMessage);
      return;
    }
    
    if (!userMessage.trim()) {
      console.log(`⚠️ Empty user message, ignoring`);
      return;
    }
    
    if (isLoading || !isConnected) {
      console.log(`⚠️ Cannot send message - loading: ${isLoading}, connected: ${isConnected}`);
      return;
    }
    
    // Create user message object with validation
    const userMessageObj = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
      text: userMessage.trim(),
      isBot: false,
      timestamp: Date.now(),
      isTyping: false,
      displayText: userMessage.trim(),
      fullText: userMessage.trim()
    };
    
    console.log(`👤 User says: "${userMessageObj.text}" (isBot: false, ID: ${userMessageObj.id})`);
    
    // Add user message to state with validation
    setMessages(prev => {
      if (!Array.isArray(prev)) {
        console.error(`❌ Invalid messages state when adding user message:`, prev);
        return [userMessageObj];
      }
      return [...prev, userMessageObj];
    });
    
    setIsLoading(true);
    
    try {
      await sendToBotpress(userMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: "Sorry, I couldn't send your message. Please try again.",
        isBot: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !isConnected) return;
    
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    if (!isChatOpen) {
      // Opening chat - mark all messages as read
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        setLastReadMessageId(lastMessage.id);
        setUnreadCount(0);
      }
    }
    setIsChatOpen(!isChatOpen);
  };

  const handleRefresh = async () => {
    try {
      console.log('🔄 Starting chat refresh...');
      
      // Disable input and show loading state
      setIsLoading(true);
      setIsConnected(false);
      setInputValue('');
      
      // Reset messages to just the welcome message
      const welcomeMessage = chatSettings?.welcomeMessage || "Hallo! Hoe kan ik u vandaag helpen?";
      setMessages([{ id: 'welcome-1', text: welcomeMessage, isBot: true }]);
      setDisplayedMessageIds(new Set(['welcome-1']));
      setLastReadMessageId('welcome-1');
      setUnreadCount(0);
      
      // Try to reinitialize the chat connection to get a fresh conversation ID
      // We'll do this manually to avoid showing error messages during refresh
      try {
        const userResponse = await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          if (userData.userKey) {
            setUserKey(userData.userKey);
            
            const convResponse = await fetch('/api/conversation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userKey: userData.userKey })
            });
            
            if (convResponse.ok) {
              const convData = await convResponse.json();
              
              if (convData.conversation?.id) {
                setConversationId(convData.conversation.id);
                setUserId(userData.user.id);
                console.log('✅ Chat refreshed successfully with new conversation ID');
                
                // Wait 2 seconds before allowing user to type again
                setTimeout(() => {
                  setIsConnected(true);
                  setIsLoading(false);
                  console.log('✅ Chat refresh completed - user can now type');
                }, 2000);
                
                return;
              }
            }
          }
        }
        
        // If we get here, the refresh didn't work but that's okay
        console.warn('Could not get fresh conversation ID during refresh, but chat is reset');
        
        // Wait 2 seconds even if refresh failed
        setTimeout(() => {
          setIsConnected(false);
          setIsLoading(false);
          console.log('⚠️ Chat refresh completed with connection issues');
        }, 2000);
        
      } catch (initError) {
        console.warn('Could not reinitialize chat connection during refresh:', initError);
        
        // Wait 2 seconds even if refresh failed
        setTimeout(() => {
          setIsConnected(false);
          setIsLoading(false);
          console.log('⚠️ Chat refresh completed with connection issues');
        }, 2000);
      }
      
      // Add a message to let user know they can still chat
      const infoMessage = {
        id: `info-${Date.now()}`,
        text: "Chat is refreshed. You can start a new conversation.",
        isBot: true
      };
      setMessages(prev => [...prev, infoMessage]);
      
    } catch (error) {
      console.error('Error refreshing chat:', error);
      
      // Wait 2 seconds even if refresh failed
      setTimeout(() => {
        setIsConnected(false);
        setIsLoading(false);
        console.log('❌ Chat refresh failed');
      }, 2000);
    }
  };

  const contextValue: ChatContextType = {
    messages,
    isConnected,
    isLoading,
    isChatOpen,
    unreadCount,
    inputValue,
    setInputValue,
    toggleChat,
    sendMessage,
    initializeChatAPI,
    setMessages,
    setDisplayedMessageIds,
    setLastReadMessageId,
    setUnreadCount,
    chatSettings
  };

    // Check if we're on specific pages where chat bubble should be hidden
  const [isOnAdminPage, setIsOnAdminPage] = useState(false);
  const [isOnLandingPage, setIsOnLandingPage] = useState(false);

  useEffect(() => {
    const checkPath = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isOnChatBeheren = path === '/chat-beheren';
        const isOnLanding = path === '/';
        
        setIsOnAdminPage(isOnChatBeheren);
        setIsOnLandingPage(isOnLanding);
        
        // Close chat window when on chat support page or landing page
        if ((isOnChatBeheren || isOnLanding) && isChatOpen) {
          setIsChatOpen(false);
        }
      }
    };

    // Check on mount
    checkPath();

    // Listen for route changes
    const handleRouteChange = () => {
      checkPath();
    };

    window.addEventListener('popstate', handleRouteChange);
    
    // Also check periodically for route changes (for Next.js client-side routing)
    const interval = setInterval(checkPath, 100);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      clearInterval(interval);
    };
  }, [isChatOpen, user?.role]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
      
                   {/* Floating Chat Bubble - Show on any page except landing page and chat support */}
             {isAuthenticated && !isOnLandingPage && !isOnAdminPage && (
               <div
                 className={`chat-bubble ${isChatOpen ? 'open' : ''}`}
                 onClick={toggleChat}
                 style={{
                   backgroundColor: chatSettings?.bubbleColor || '#de3f30',
                   color: chatSettings?.bubbleTextColor || '#ffffff'
                 }}
               >
                 <div className="bubble-icon">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill={chatSettings?.theme === 'dark' ? '#333333' : 'currentColor'}/>
                     <path d="M7 9H17V11H7V9ZM7 12H14V14H7V12Z" fill={chatSettings?.theme === 'dark' ? '#333333' : 'currentColor'}/>
                   </svg>
                 </div>
                 {isLoading && (
                   <div className="bubble-badge loading">...</div>
                 )}
                 {!isLoading && unreadCount > 0 && (
                   <div className="bubble-badge">{unreadCount}</div>
                 )}
               </div>
             )}

      {/* Chat Window - Only show when authenticated and not on admin pages */}
      {isAuthenticated && !isOnAdminPage && (
        <div 
          className={`chat-window ${isChatOpen ? 'open' : ''}`}
          style={{
            width: chatSettings?.chatWindowWidth || 480,
            height: chatSettings?.chatWindowHeight || 600,
            backgroundColor: chatSettings?.theme === 'dark' ? '#1a1a1a' : '#ffffff',
            color: chatSettings?.theme === 'dark' ? '#ffffff' : '#333333'
          }}
        >
        <div className="chat-header" style={{
          backgroundColor: chatSettings?.bubbleColor || '#de3f30',
          color: chatSettings?.bubbleTextColor || '#ffffff'
        }}>
          <div className="chat-header-content">
            <div className="chat-logo">
              <div className="logo-mark">
                <div className="logo-s"></div>
                <div className="logo-square"></div>
              </div>
              <div className="logo-text">
                <span>ELEKTRO</span>
                <span>SCHEPPERS</span>
              </div>
            </div>
            <div className="chat-title">{chatSettings?.botName || 'Saar'}</div>
            <div className="chat-header-controls">
              <div className={`connection-status ${isConnected ? 'connected' : 'connecting'}`}>
                {isConnected ? '🟢 Verbonden' : '🟡 Verbinden...'}
              </div>
              <button 
                onClick={handleRefresh}
                className="chat-refresh-button"
                title="Vernieuwen"
                disabled={isLoading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
          <button className="close-button" onClick={toggleChat}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        
        <div 
          className="chat-messages"
          style={{
            backgroundColor: chatSettings?.theme === 'dark' ? '#2a2a2a' : '#f8f8f8'
          }}
        >
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.isBot ? 'bot-message' : 'user-message'}`}
            >
                              <div 
                  className="message-content"
                  style={{
                    backgroundColor: message.isBot 
                      ? (chatSettings?.theme === 'dark' ? '#3a3a3a' : '#ffffff')
                      : (chatSettings?.bubbleColor || '#de3f30'),
                    color: message.isBot 
                      ? (chatSettings?.theme === 'dark' ? '#ffffff' : '#333333')
                      : (chatSettings?.bubbleTextColor || '#ffffff'),
                    fontFamily: chatSettings?.fontFamily || 'Open Sans'
                  }}
                >
                {message.text && <div className="message-text">
                  {message.isBot && message.isTyping ? (
                    <>
                      {message.displayText || ''}
                      <span className="typing-cursor">|</span>
                    </>
                  ) : (
                    message.displayText || message.text
                  )}
                </div>}
                {message.image && (
                  <div className="message-image">
                    <img 
                      src={message.image} 
                      alt="Chat image" 
                      onError={(e) => {
                        console.error('Failed to load image:', message.image);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot-message">
              <div className="message-content loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="text-xs mt-1 opacity-70">
                  Bot is responding...
                </div>
              </div>
            </div>
          )}
          
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
        
        <div 
          className="chat-input"
          style={{
            backgroundColor: chatSettings?.theme === 'dark' ? '#1a1a1a' : '#ffffff',
            borderTop: `1px solid ${chatSettings?.theme === 'dark' ? '#333333' : '#e0e0e0'}`
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              !isConnected 
                ? "Verbinden met Botpress..." 
                : isLoading 
                  ? "Bot is typing..." 
                  : "Type uw bericht hier..."
            }
            className="message-input"
            disabled={isLoading || !isConnected}
            style={{
              backgroundColor: chatSettings?.theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
              color: chatSettings?.theme === 'dark' ? '#ffffff' : '#333333',
              border: `1px solid ${chatSettings?.theme === 'dark' ? '#444444' : '#e0e0e0'}`
            }}
          />
          <button 
            onClick={handleSendMessage} 
            className={`send-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !isConnected}
            style={{
              backgroundColor: chatSettings?.bubbleColor || '#de3f30',
              color: chatSettings?.bubbleTextColor || '#ffffff'
            }}
          >
            {!isConnected ? 'Verbinden...' : isLoading ? '...' : 'Versturen'}
          </button>
        </div>
      </div>
      )}
    </ChatContext.Provider>
  );
} 