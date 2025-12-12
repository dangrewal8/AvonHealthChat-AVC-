/**
 * ChatMessage Component
 *
 * Displays individual chat messages in a ChatGPT/Claude-style bubble format.
 * User messages on the right (blue), AI responses on the left (white).
 */

import { User, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { UIResponse } from '../types';
import { ProvenanceCard } from './ProvenanceCard';

/**
 * Format user IDs in text to be abbreviated and clickable
 * Example: user_HryoL5hpFahYE3foFry69afE9gv1 -> user_Hr... (clickable)
 */
function formatUserIds(text: string): React.ReactNode[] {
  const userIdPattern = /(user_[a-zA-Z0-9]{4,})/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = userIdPattern.exec(text)) !== null) {
    const fullUserId = match[1];
    const abbreviatedId = fullUserId.slice(0, 7) + '...';

    // Add text before the user ID
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the clickable user ID link
    parts.push(
      <a
        key={match.index}
        href={`#user-${fullUserId}`}
        className="text-blue-600 hover:text-blue-800 underline decoration-dotted"
        title={`Full ID: ${fullUserId}`}
        onClick={(e) => {
          e.preventDefault();
          navigator.clipboard.writeText(fullUserId);
          alert(`Copied full user ID: ${fullUserId}`);
        }}
      >
        {abbreviatedId}
      </a>
    );

    lastIndex = match.index + fullUserId.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

interface ChatMessageProps {
  type: 'user' | 'assistant';
  content: string;
  result?: UIResponse;
  timestamp?: string;
}

export function ChatMessage({ type, content, result, timestamp }: ChatMessageProps) {
  const [showDetails, setShowDetails] = useState(false);

  const isUser = type === 'user';

  // Format content with clickable user IDs for AI responses
  const formattedContent = useMemo(() => {
    if (isUser) return content;
    return formatUserIds(content);
  }, [content, isUser]);

  // Format detailed summary with clickable user IDs
  const formattedDetailedSummary = useMemo(() => {
    if (!result?.detailed_summary) return null;
    return formatUserIds(result.detailed_summary);
  }, [result?.detailed_summary]);

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6 animate-fadeIn`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-200'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-gray-700" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message Bubble */}
        <div className={`rounded-2xl px-5 py-3 ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
            : 'bg-white border border-gray-200 shadow-sm text-gray-900'
        }`}>
          <p className="text-base leading-relaxed whitespace-pre-wrap">{formattedContent}</p>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className="text-xs text-gray-400 mt-1 px-1">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )}

        {/* Detailed Results for AI responses */}
        {!isUser && result && (
          <div className="mt-3 w-full">
            {/* Toggle Details Button */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Hide details</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Show details</span>
                </>
              )}
            </button>

            {/* Expandable Details */}
            {showDetails && (
              <div className="mt-4 space-y-4 animate-fadeIn">
                {/* Detailed Summary */}
                {formattedDetailedSummary && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Detailed Summary
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {formattedDetailedSummary}
                    </p>
                  </div>
                )}

                {/* Key Information */}
                {result.structured_extractions && result.structured_extractions.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Key Information
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {result.structured_extractions.slice(0, 6).map((extraction, index) => (
                        <div
                          key={index}
                          className="text-xs bg-gray-50 rounded-lg p-2 border border-gray-100"
                        >
                          <div className="font-medium text-gray-700 mb-1">{extraction.type}</div>
                          <div className="text-gray-600">{extraction.value}</div>
                          <div className="text-gray-400 mt-1">
                            Confidence: {(extraction.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources */}
                {result.provenance && result.provenance.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Sources ({result.provenance.length})
                    </h4>
                    <div className="space-y-2">
                      {result.provenance.slice(0, 3).map((prov, index) => (
                        <ProvenanceCard
                          key={prov.artifact_id}
                          provenance={prov}
                          index={index + 1}
                        />
                      ))}
                      {result.provenance.length > 3 && (
                        <p className="text-xs text-gray-500 mt-2">
                          +{result.provenance.length - 3} more sources
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
