'use client'

import { useBrowse } from '@/hooks/useBrowse'
import { useStore } from '@/lib/store'
import { RepoCard } from './RepoCard'

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-gray-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-3.5 bg-gray-800 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export function BrowseTable() {
  const { showScore, toggleScore, currentPage, setBrowsePage, submittedBrowseFilters } =
    useStore()
  const { data, isLoading, error, isFetching } = useBrowse()
  const colCount = showScore ? 8 : 7

  const total = data?.total ?? 0
  const limit = submittedBrowseFilters.limit
  const totalPages = Math.ceil(total / limit)
  const startItem = total === 0 ? 0 : currentPage * limit + 1
  const endItem = Math.min((currentPage + 1) * limit, total)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 min-h-[24px]">
        <span className="text-sm text-gray-400">
          {isLoading || isFetching
            ? 'Loading…'
            : total > 0
              ? `Showing ${startItem}–${endItem} of ${total} repos`
              : ''}
        </span>
        <button
          onClick={toggleScore}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          {showScore ? 'Hide Score' : 'Show Score'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-700 bg-red-900/30 px-4 py-2.5 text-sm text-red-300">
          {error instanceof Error ? error.message : 'An unexpected error occurred.'}
        </div>
      )}

      {!isLoading && !error && total === 0 && (
        <p className="mt-8 text-center text-sm text-gray-500">
          No repos indexed yet — run{' '}
          <code className="font-mono text-gray-400">uv run python scripts/indexer.py</code>{' '}
          to populate the index.
        </p>
      )}

      {!isLoading && !error && total > 0 && data?.results.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-500">
          No repositories matched your filters. Try loosening the constraints.
        </p>
      )}

      {(isLoading || (data && data.results.length > 0)) && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-3 py-2 w-10">#</th>
                <th className="px-3 py-2">Repository</th>
                <th className="px-3 py-2 text-right">Stars</th>
                <th className="px-3 py-2 text-right">Forks</th>
                <th className="px-3 py-2">Language</th>
                <th className="px-3 py-2">Last Push</th>
                <th className="px-3 py-2 text-right">Size</th>
                {showScore && <th className="px-3 py-2 text-right">Score</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} cols={colCount} />
                  ))
                : data?.results.map((repo, i) => (
                    <RepoCard
                      key={repo.id}
                      rank={currentPage * limit + i + 1}
                      repo={repo}
                      showScore={showScore}
                    />
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm">
          <button
            onClick={() => setBrowsePage(currentPage - 1)}
            disabled={currentPage === 0}
            className="px-3 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-gray-500">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setBrowsePage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="px-3 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
