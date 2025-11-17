/**
 * SearchBar Demo Component
 *
 * Demonstrates all features of the SearchBar component.
 *
 * Tech Stack: React 18+ + TypeScript + Tailwind CSS
 */

import { useState } from 'react';
import { SearchBar } from './SearchBar';

export function SearchBarDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleSearch = (query: string) => {
    console.log('Search query:', query);

    // Simulate API call
    setIsLoading(true);
    setSearchHistory((prev) => [query, ...prev].slice(0, 5));

    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleHistoryClick = (query: string) => {
    handleSearch(query);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            SearchBar Component Demo
          </h1>
          <p className="text-lg text-gray-600">
            Interactive demonstration of all SearchBar features
          </p>
        </div>

        {/* Main SearchBar */}
        <div className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">
            Search Interface
          </h2>
          <SearchBar
            onSearch={handleSearch}
            isLoading={isLoading}
            placeholder="Ask about patient records..."
          />
        </div>

        {/* Features Grid */}
        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <FeatureCard
            title="Auto-Focus"
            description="Input field automatically receives focus when component mounts"
            icon="🎯"
          />

          {/* Feature 2 */}
          <FeatureCard
            title="Enter to Submit"
            description="Press Enter key to submit the search query"
            icon="⌨️"
          />

          {/* Feature 3 */}
          <FeatureCard
            title="Clear Button"
            description="Click X button to clear the input and refocus"
            icon="❌"
          />

          {/* Feature 4 */}
          <FeatureCard
            title="Character Count"
            description="Real-time character counter with 500 character limit"
            icon="🔢"
          />

          {/* Feature 5 */}
          <FeatureCard
            title="Loading State"
            description="Disabled input and spinning icon during search"
            icon="⏳"
          />

          {/* Feature 6 */}
          <FeatureCard
            title="Responsive Design"
            description="Works seamlessly on mobile, tablet, and desktop"
            icon="📱"
          />
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold text-gray-800">
              Recent Searches
            </h2>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <ul className="space-y-2">
                {searchHistory.map((query, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between rounded-md border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <span className="text-gray-700">{query}</span>
                    <button
                      onClick={() => handleHistoryClick(query)}
                      className="text-sm text-primary hover:text-blue-700 hover:underline"
                    >
                      Search again
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Component Props */}
        <div className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">
            Component Props
          </h2>
          <div className="overflow-x-auto rounded-lg bg-white shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Prop
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    onSearch
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    (query: string) =&gt; void
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">Yes</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Callback function called when search is submitted
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    isLoading
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">boolean</td>
                  <td className="px-6 py-4 text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Indicates loading state (default: false)
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    placeholder
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">string</td>
                  <td className="px-6 py-4 text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Placeholder text for input field
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    autoFocus
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">boolean</td>
                  <td className="px-6 py-4 text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Auto-focus on mount (default: true)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Code Example */}
        <div>
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">
            Usage Example
          </h2>
          <div className="rounded-lg bg-gray-900 p-6 text-white">
            <pre className="overflow-x-auto text-sm">
              <code>{`import { SearchBar } from './components/SearchBar';

function App() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const result = await searchAPI(query);
      console.log('Results:', result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SearchBar
      onSearch={handleSearch}
      isLoading={isLoading}
      placeholder="Ask about patient records..."
      autoFocus={true}
    />
  );
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature Card Component
 */
function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-3 text-4xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

export default SearchBarDemo;
