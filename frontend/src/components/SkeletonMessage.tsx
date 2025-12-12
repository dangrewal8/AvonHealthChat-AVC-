/**
 * Skeleton Loading Component
 * Matches ChatMessage layout for seamless loading UX
 */

export function SkeletonMessage() {
  return (
    <div className="flex gap-3 mb-6">
      {/* Avatar skeleton */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 animate-pulse" />

      {/* Message content skeleton */}
      <div className="flex flex-col max-w-3xl flex-1 space-y-3">
        {/* Short answer skeleton */}
        <div className="rounded-2xl px-5 py-3 bg-gray-100 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-300 rounded w-1/2" />
        </div>

        {/* "Sources:" label skeleton */}
        <div className="h-3 bg-gray-200 rounded w-24 mb-2 animate-pulse" />

        {/* Provenance cards skeleton (2 cards) */}
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-lg p-3 animate-pulse"
            >
              {/* Header with type badge and date */}
              <div className="flex items-start justify-between mb-2">
                <div className="h-3 bg-gray-300 rounded w-20" />
                <div className="h-3 bg-gray-300 rounded w-24" />
              </div>

              {/* Snippet text lines */}
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 rounded w-full" />
                <div className="h-3 bg-gray-300 rounded w-5/6" />
                <div className="h-3 bg-gray-300 rounded w-4/6" />
              </div>

              {/* Source link */}
              <div className="mt-2 h-3 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
