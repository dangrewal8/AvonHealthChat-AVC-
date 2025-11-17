/**
 * SearchBar Component
 *
 * Search input component for querying the RAG system.
 *
 * Tech Stack: React 18+ + TypeScript + Tailwind CSS
 */

import { useState, FormEvent, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  onSearch,
  isLoading = false,
  placeholder = 'Ask about patient records...',
  autoFocus = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const maxLength = 500;
  const characterCount = query.length;
  const isNearLimit = characterCount > maxLength * 0.9;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      {/* Input Container */}
      <div className="relative">
        {/* Search Icon */}
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          maxLength={maxLength}
          className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-24 text-gray-900 placeholder-gray-500 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {/* Right Side Buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {/* Clear Button */}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="rounded-md bg-primary p-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Search"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Search size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Character Count & Additional Info */}
      <div className="mt-2 flex items-center justify-between text-sm">
        <span
          className={`${
            isNearLimit ? 'text-orange-600 font-medium' : 'text-gray-500'
          }`}
        >
          {characterCount}/{maxLength} characters
        </span>

        {/* Optional: Keyboard shortcut hint */}
        <span className="text-gray-400 text-xs hidden sm:inline">
          Press Enter to search
        </span>
      </div>
    </form>
  );
}

export default SearchBar;
