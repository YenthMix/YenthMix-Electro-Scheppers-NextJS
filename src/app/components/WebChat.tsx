'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useChat } from './ChatProvider';

interface ChatSettings {
  bubbleColor: string;
  bubbleTextColor: string;
  chatBackgroundColor: string;
  chatTextColor: string;
  botName: string;
  theme: 'light' | 'dark';
  welcomeMessage: string;
  chatWindowWidth: number;
  chatWindowHeight: number;
  fontFamily: string;
}

const defaultSettings: ChatSettings = {
  bubbleColor: '#de3f30',
  bubbleTextColor: '#ffffff',
  chatBackgroundColor: '#ffffff',
  chatTextColor: '#333333',
  botName: 'Saar',
  theme: 'light',
  welcomeMessage: 'Hallo! Hoe kan ik u vandaag helpen?',
  chatWindowWidth: 480,
  chatWindowHeight: 600,
  fontFamily: 'Open Sans'
};

export default function WebChat() {
  const { user } = useAuth();
  const { 
    messages, 
    isLoading, 
    isConnected, 
    sendMessage,
    setInputValue,
    inputValue,
    initializeChatAPI,
    setMessages,
    setDisplayedMessageIds,
    setLastReadMessageId,
    setUnreadCount,
    chatSettings
  } = useChat();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>(defaultSettings);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('chatSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
    }
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent) => {
      setSettings(event.detail.settings);
    };

    window.addEventListener('chatSettingsChanged', handleSettingsChange as EventListener);
    return () => {
      window.removeEventListener('chatSettingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  // Apply settings to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--chat-bubble-color', settings.bubbleColor);
    root.style.setProperty('--chat-bubble-text-color', settings.bubbleTextColor);
    root.style.setProperty('--chat-background-color', settings.chatBackgroundColor);
    root.style.setProperty('--chat-text-color', settings.chatTextColor);
    root.style.setProperty('--chat-font-family', settings.fontFamily);
    
    // Apply width and height with minimum cap of 400px
    const width = Math.max(settings.chatWindowWidth || 480, 400);
    const height = Math.max(settings.chatWindowHeight || 600, 400);
    root.style.setProperty('--chat-window-width', `${width}px`);
    root.style.setProperty('--chat-window-height', `${height}px`);
    
    // Apply theme
    if (settings.theme === 'dark') {
      root.style.setProperty('--chat-background-color', '#2a2a2a');
      root.style.setProperty('--chat-text-color', '#ffffff');
      root.style.setProperty('--chat-input-background', '#3a3a3a');
      root.style.setProperty('--chat-input-border', '#444444');
      root.style.setProperty('--chat-border-color', '#333333');
      root.style.setProperty('--chat-bot-message-bg', '#3a3a3a');
      root.style.setProperty('--chat-bot-message-text', '#ffffff');
    } else {
      root.style.setProperty('--chat-background-color', '#f8f8f8');
      root.style.setProperty('--chat-text-color', '#333333');
      root.style.setProperty('--chat-input-background', '#f5f5f5');
      root.style.setProperty('--chat-input-border', '#e0e0e0');
      root.style.setProperty('--chat-border-color', '#e0e0e0');
      root.style.setProperty('--chat-bot-message-bg', '#ffffff');
      root.style.setProperty('--chat-bot-message-text', '#333333');
    }
  }, [settings]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to convert URLs in text to clickable links
  const formatMessageWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s\)\]\}]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="message-link"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue(''); // Clear the input field immediately
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRefresh = async () => {
    try {
      console.log('🔄 Starting WebChat refresh...');
      
      // Start animation immediately - show current messages
      setIsRefreshing(true);
      setInputValue('');
      
      // Wait 1 second (when animation reaches top) to perform actual refresh
      setTimeout(async () => {
        try {
          console.log('🔄 Performing actual refresh...');
          
          // Reset messages to just the welcome message
          const welcomeMessage = settings?.welcomeMessage || "Hallo! Hoe kan ik u vandaag helpen?";
          setMessages([{ id: 'welcome-1', text: welcomeMessage, isBot: true }]);
          setDisplayedMessageIds(new Set(['welcome-1']));
          setLastReadMessageId('welcome-1');
          setUnreadCount(0);
          
          // Try to reinitialize the chat connection to get a fresh conversation ID
          try {
            await initializeChatAPI();
            console.log('✅ WebChat refreshed successfully');
          } catch (initError) {
            console.warn('Could not reinitialize chat connection, but chat is reset:', initError);
            
            // Add a message to let user know they can still chat
            const infoMessage = {
              id: `info-${Date.now()}`,
              text: "Chat is refreshed. You can start a new conversation.",
              isBot: true
            };
            setMessages(prev => [...prev, infoMessage]);
          }
          
        } catch (error) {
          console.error('Error during refresh:', error);
        }
      }, 1000); // Refresh happens when animation reaches top
      
      // Wait 2 seconds (when animation reaches bottom) to allow typing again
      setTimeout(() => {
        setIsRefreshing(false);
        console.log('✅ WebChat refresh completed - user can now type');
      }, 2000);
      
    } catch (error) {
      console.error('Error refreshing WebChat:', error);
      
      // Wait 2 seconds even if refresh failed
      setTimeout(() => {
        setIsRefreshing(false);
        console.log('❌ WebChat refresh failed');
      }, 2000);
    }
  };

  return (
    <div 
      className="webchat-container"
      style={{
        fontFamily: settings.fontFamily
      }}
    >
      {/* Animated Refresh Progress Bar */}
      {isRefreshing && (
        <div className="webchat-refresh-progress">
          <div className="webchat-progress-fill"></div>
        </div>
      )}
      
      <div className="webchat-header">
         <div className="webchat-logo">
           <div className="logo-mark">
             <div className="logo-s"></div>
             <div className="logo-square"></div>
           </div>
           <div className="logo-text">
             <span>ELEKTRO</span>
             <span>SCHEPPERS</span>
           </div>
         </div>
         <div className="webchat-title">{settings.botName}</div>
         <div className="webchat-header-controls">
           <div className={`webchat-connection-status ${isConnected ? 'connected' : 'connecting'}`}>
             {isConnected ? '🟢 Verbonden' : '🟡 Verbinden...'}
           </div>
           <button 
             onClick={handleRefresh}
             className="webchat-refresh-button"
             title="Vernieuwen"
             disabled={isLoading || isRefreshing}
           >
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
             </svg>
           </button>
         </div>
       </div>

      <div className="webchat-messages">
                 {messages.map((message) => (
           <div 
             key={message.id} 
             className={`webchat-message ${message.isBot ? 'bot-message' : 'user-message'}`}
           >
             <div className="webchat-message-content">
               {message.isBot && message.isTyping ? (
                 <>
                   {formatMessageWithLinks(message.displayText || '')}
                   <span className="typing-cursor">|</span>
                 </>
               ) : (
                 formatMessageWithLinks(message.displayText || message.text || '')
               )}
             </div>
           </div>
         ))}
        {isLoading && (
          <div className="webchat-message bot-message">
            <div className="webchat-message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

             <div className="webchat-input">
         <input
           type="text"
           value={inputValue}
           onChange={(e) => setInputValue(e.target.value)}
           onKeyPress={handleKeyPress}
           placeholder="Type uw bericht hier..."
           className="webchat-message-input"
           disabled={isLoading || isRefreshing}
         />
         <button 
           onClick={handleSendMessage}
           disabled={!inputValue.trim() || isLoading || isRefreshing}
           className="webchat-send-button"
         >
           {isRefreshing ? 'Vernieuwen...' : isLoading ? 'Versturen...' : 'Versturen'}
         </button>
       </div>
    </div>
  );
}
