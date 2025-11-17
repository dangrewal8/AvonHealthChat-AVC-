/**
 * Conversation Sidebar Component
 *
 * ChatGPT-style conversation history sidebar
 * Shows list of previous conversations with ability to switch between them
 */

import { MessageSquare, Plus, Trash2, LogOut } from 'lucide-react';

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  messageCount: number;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onLogout: () => void;
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onLogout,
}: ConversationSidebarProps) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      {/* Header with New Chat Button */}
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all text-sm font-medium shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8 px-4">
            No conversations yet. Start a new chat!
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative flex items-start gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                  currentConversationId === conv.id
                    ? 'bg-white border border-gray-200 shadow-sm'
                    : 'hover:bg-white/60 border border-transparent'
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-500" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {conv.title}
                  </div>
                  <div className="text-xs text-gray-600 truncate mt-0.5">
                    {conv.preview}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {conv.messageCount} messages
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 hover:bg-red-100 rounded transition-opacity"
                  title="Delete conversation"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Logout */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
