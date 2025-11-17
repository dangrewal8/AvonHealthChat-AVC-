/**
 * App Component - Modern Chat Interface
 *
 * ChatGPT/Claude-style medical assistant with:
 * - Chat bubbles (user on right, AI on left)
 * - Fixed input at bottom
 * - Scrollable message area
 * - Modern Tailwind CSS styling
 */

import { useState, useEffect, useRef } from 'react';
import { Activity, Send, Loader2, Trash2 } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ErrorState, createErrorInfo } from './components/ErrorState';
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

// LocalStorage key
const STORAGE_KEY = 'avon_health_chat_history';

function App() {
  const [patientId] = useState('patient-123');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingresponse, setIsLoadingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ragQuery = useRAGQuery();

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, []);

  // Save chat history
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingresponse]);

  const handleSend = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoadingresponse) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoadingResponse(true);

    try {
      // PRIORITY 3: Build conversation history from recent messages (last 5 messages)
      const conversationHistory = messages.slice(-5).map(msg => ({
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

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Query failed:', error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all chat history? This cannot be undone.')) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Avon Health Assistant
              </h1>
              <p className="text-sm text-gray-500">
                Patient: {patientId}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome to Avon Health Assistant
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
              {isLoadingresponse && (
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

      {/* Input Area - Fixed at Bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="relative flex items-end gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about patient records..."
              disabled={isLoadingresponse}
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
              disabled={isLoadingresponse || !inputValue.trim()}
              className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:shadow-xl"
              aria-label="Send message"
            >
              {isLoadingresponse ? (
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
  );
}

export default App;
