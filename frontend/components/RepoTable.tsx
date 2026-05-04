'use client'

import { useSearch } from '@/hooks/useSearch'
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

export function RepoTable() {
  const { showScore, toggleScore, submittedFilters } = useStore()
  const { data, isLoading, error } = useSearch()
  const colCount = showScore ? 8 : 7

  if (!submittedFilters) {
    return (
      <p className="mt-12 text-center text-sm text-gray-500">
        Set filters and click Search to find repositories.
      </p>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 min-h-[24px]">
        <span className="text-sm text-gray-400">
          {isLoading
            ? 'Searching…'
            : data !== undefined
              ? `${data.length} result${data.length !== 1 ? 's' : ''}`
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

      {!isLoading && data?.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-500">
          No repositories matched your filters. Try loosening the constraints.
        </p>
      )}

      {(isLoading || (data && data.length > 0)) && (
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
                : data?.map((repo, i) => (
                    <RepoCard
                      key={repo.id}
                      rank={i + 1}
                      repo={repo}
                      showScore={showScore}
                    />
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
