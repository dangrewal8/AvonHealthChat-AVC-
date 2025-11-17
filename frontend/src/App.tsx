/**
 * App Component - Chat Interface with Authentication
 *
 * ChatGPT-style layout with:
 * - Login authentication
 * - Conversation history sidebar (left)
 * - Full-width chat area (right)
 * - Multiple conversation support
 * - Fixed clear chat functionality
 */

import { useState, useEffect, useRef } from 'react';
import { Activity, Send, Loader2, Trash2 } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { Login } from './components/Login';
import { ConversationSidebar, Conversation } from './components/ConversationSidebar';
import { useRAGQuery } from './hooks/useQuery';
import { UIResponse } from './types';

// Message interface
interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  result?: UIResponse;
}

// ConversationData interface
interface ConversationData {
  id: string;
  messages: Message[];
  createdAt: string;
}

// LocalStorage keys
const CONVERSATIONS_KEY = 'avon_health_conversations';
const CURRENT_CONVERSATION_KEY = 'avon_health_current_conversation';

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth on mount (from localStorage - persists forever)
  useEffect(() => {
    const auth = localStorage.getItem('avon_health_auth');
    setIsAuthenticated(auth === 'true');
  }, []);

  // Conversation management
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [patientId] = useState('patient-123');
  const [inputValue, setInputValue] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ragQuery = useRAGQuery();

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CONVERSATIONS_KEY);
    const savedCurrentId = localStorage.getItem(CURRENT_CONVERSATION_KEY);

    if (saved) {
      try {
        const loadedConvos = JSON.parse(saved);
        setConversations(loadedConvos);

        if (savedCurrentId && loadedConvos.find((c: ConversationData) => c.id === savedCurrentId)) {
          setCurrentConversationId(savedCurrentId);
        } else if (loadedConvos.length > 0) {
          setCurrentConversationId(loadedConvos[0].id);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    }
    if (currentConversationId) {
      localStorage.setItem(CURRENT_CONVERSATION_KEY, currentConversationId);
    }
  }, [conversations, currentConversationId]);

  // Get current conversation
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingResponse]);

  // Create new conversation
  const handleNewConversation = () => {
    const newConvo: ConversationData = {
      id: Date.now().toString(),
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setConversations(prev => [newConvo, ...prev]);
    setCurrentConversationId(newConvo.id);
  };

  // Select conversation
  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    if (window.confirm('Delete this conversation? This cannot be undone.')) {
      setConversations(prev => {
        const filtered = prev.filter(c => c.id !== id);

        // If deleting current conversation, switch to first available
        if (id === currentConversationId) {
          setCurrentConversationId(filtered.length > 0 ? filtered[0].id : null);
        }

        // Update localStorage
        if (filtered.length === 0) {
          localStorage.removeItem(CONVERSATIONS_KEY);
          localStorage.removeItem(CURRENT_CONVERSATION_KEY);
        }

        return filtered;
      });
    }
  };

  // Clear all conversations (fixed functionality)
  const handleClearAllChats = () => {
    if (window.confirm('Clear ALL conversations? This cannot be undone.')) {
      setConversations([]);
      setCurrentConversationId(null);
      localStorage.removeItem(CONVERSATIONS_KEY);
      localStorage.removeItem(CURRENT_CONVERSATION_KEY);
    }
  };

  // Send message
  const handleSend = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoadingResponse) return;

    // Create conversation if none exists
    let convId = currentConversationId;
    if (!convId) {
      const newConvo: ConversationData = {
        id: Date.now().toString(),
        messages: [],
        createdAt: new Date().toISOString(),
      };
      setConversations(prev => [newConvo, ...prev]);
      convId = newConvo.id;
      setCurrentConversationId(convId);
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    };

    // Get current messages before updating state
    const currentConv = conversations.find(c => c.id === convId);
    const currentMessages = currentConv?.messages || [];

    setConversations(prev =>
      prev.map(c =>
        c.id === convId
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      )
    );
    setInputValue('');
    setIsLoadingResponse(true);

    try {
      // Build conversation history from messages BEFORE adding new user message
      // Include the new user message we just created
      const allMessages = [...currentMessages, userMessage];
      const conversationHistory = allMessages.slice(-5).map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      const result = await ragQuery.mutateAsync({
        query: trimmedInput,
        patient_id: patientId,
        options: {
          detail_level: 3,
          max_results: 5,
        },
        conversation_history: conversationHistory.length > 0 ? conversationHistory : undefined,
      });

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.short_answer,
        timestamp: new Date().toISOString(),
        result,
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, messages: [...c.messages, aiMessage] }
            : c
        )
      );
    } catch (error) {
      console.error('Query failed - Full error:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

      // Add error message with more details
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };
      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, messages: [...c.messages, errorMessage] }
            : c
        )
      );
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('avon_health_auth');
    setIsAuthenticated(false);
  };

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  // Generate conversation summaries for sidebar
  const conversationSummaries: Conversation[] = conversations.map(conv => {
    const firstUserMessage = conv.messages.find(m => m.type === 'user');
    return {
      id: conv.id,
      title: firstUserMessage?.content.slice(0, 50) || 'New Conversation',
      preview: firstUserMessage?.content.slice(0, 80) || 'No messages yet',
      timestamp: conv.createdAt,
      messageCount: conv.messages.length,
    };
  });

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        conversations={conversationSummaries}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onLogout={handleLogout}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Avon Health Chat
                </h1>
                <p className="text-sm text-gray-500">
                  Patient: {patientId}
                </p>
              </div>
            </div>
            {conversations.length > 0 && (
              <button
                onClick={handleClearAllChats}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear all chats"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome to Avon Health Chat
                </h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Ask me anything about the patient's medical records, medications, conditions, or care plans.
                </p>
                <div className="text-left bg-white rounded-xl border border-gray-200 p-6 max-w-md shadow-sm">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Example questions:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>What medications is the patient currently taking?</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>What is the patient's diabetes management plan?</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>When was the patient's last follow-up visit?</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Does the patient have any history of heart disease?</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              // Chat Messages
              <div className="space-y-1">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    type={message.type}
                    content={message.content}
                    result={message.result}
                    timestamp={message.timestamp}
                  />
                ))}
                {isLoadingResponse && (
                  <div className="flex gap-3 mb-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-gray-700 animate-pulse" />
                    </div>
                    <div className="flex flex-col max-w-3xl">
                      <div className="rounded-2xl px-5 py-3 bg-white border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="relative flex items-end gap-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about patient records..."
                disabled={isLoadingResponse}
                rows={1}
                className="flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-3 pr-12 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all max-h-32"
                style={{
                  minHeight: '48px',
                  height: 'auto',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = '48px';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              <button
                onClick={handleSend}
                disabled={isLoadingResponse || !inputValue.trim()}
                className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:shadow-xl"
                aria-label="Send message"
              >
                {isLoadingResponse ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
