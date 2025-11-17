/**
 * ChatMessage Component
 *
 * Displays individual chat messages in a ChatGPT/Claude-style bubble format.
 * User messages on the right (blue), AI responses on the left (white).
 */

import { User, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { UIResponse } from '../types';
import { ProvenanceCard } from './ProvenanceCard';

interface ChatMessageProps {
  type: 'user' | 'assistant';
  content: string;
  result?: UIResponse;
  timestamp?: string;
}

export function ChatMessage({ type, content, result, timestamp }: ChatMessageProps) {
  const [showDetails, setShowDetails] = useState(false);

  const isUser = type === 'user';

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
          <p className="text-base leading-relaxed whitespace-pre-wrap">{content}</p>
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
                {result.detailed_summary && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Detailed Summary
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {result.detailed_summary}
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
