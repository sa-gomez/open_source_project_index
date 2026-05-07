'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearch } from '@/hooks/useSearch'
import { useSavedIds } from '@/hooks/useSavedIds'
import { saveRepo } from '@/lib/api'
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
  const { showScore, toggleScore, submittedFilters, savedIds, addSavedId, showNewOnly, toggleNewOnly, selectedRepos, toggleSelected, selectAll, clearSelected } = useStore()
  const { data, isLoading, error } = useSearch()
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())
  const queryClient = useQueryClient()

  useSavedIds()

  const visibleRepos = showNewOnly
    ? (data ?? []).filter((r) => !savedIds.has(r.id))
    : (data ?? [])

  const selectableIds = visibleRepos.filter((r) => !savedIds.has(r.id)).map((r) => r.id)
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedRepos.has(id))

  const colCount = showScore ? 10 : 9

  async function handleSave(repoId: number) {
    const repo = data?.find((r) => r.id === repoId)
    if (!repo) return
    setSavingIds((prev) => new Set([...prev, repoId]))
    try {
      await saveRepo(repo)
      addSavedId(repoId)
      queryClient.invalidateQueries({ queryKey: ['savedIds'] })
    } catch {
      // error is surfaced elsewhere; just stop spinner
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(repoId)
        return next
      })
    }
  }

  async function handleSaveSelected() {
    const ids = [...selectedRepos]
    clearSelected()
    await Promise.all(ids.map((id) => handleSave(id)))
  }

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
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {isLoading
              ? 'Searching…'
              : data !== undefined
                ? `${visibleRepos.length} result${visibleRepos.length !== 1 ? 's' : ''}`
                : ''}
          </span>
          {data && data.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showNewOnly}
                onChange={toggleNewOnly}
                className="accent-blue-500"
              />
              New only
            </label>
          )}
          {selectedRepos.size > 0 && (
            <button
              onClick={handleSaveSelected}
              className="px-3 py-1 rounded border border-blue-700 text-xs text-blue-300 hover:bg-blue-900/40 transition-colors"
            >
              Save selected ({selectedRepos.size})
            </button>
          )}
        </div>
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

      {!isLoading && visibleRepos.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-500">
          {showNewOnly && data && data.length > 0
            ? 'All results are already saved. Toggle "New only" off to see them.'
            : 'No repositories matched your filters. Try loosening the constraints.'}
        </p>
      )}

      {(isLoading || visibleRepos.length > 0) && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700 text-xs uppercase tracking-wide text-gray-400">
                <th
                  className="px-3 py-2 w-8"
                  onClick={() => allSelected ? clearSelected() : selectAll(selectableIds)}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => allSelected ? clearSelected() : selectAll(selectableIds)}
                    className="accent-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2 w-10">#</th>
                <th className="px-3 py-2">Repository</th>
                <th className="px-3 py-2 text-right">Stars</th>
                <th className="px-3 py-2 text-right">Forks</th>
                <th className="px-3 py-2">Language</th>
                <th className="px-3 py-2">Last Push</th>
                <th className="px-3 py-2 text-right">Size</th>
                {showScore && <th className="px-3 py-2 text-right">Score</th>}
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} cols={colCount} />
                  ))
                : visibleRepos.map((repo, i) => (
                    <RepoCard
                      key={repo.id}
                      rank={i + 1}
                      repo={repo}
                      showScore={showScore}
                      isSaved={savedIds.has(repo.id)}
                      jobStatus={repo.job_status}
                      onSave={() => handleSave(repo.id)}
                      isSelected={selectedRepos.has(repo.id)}
                      onToggleSelect={() => toggleSelected(repo.id)}
                      isSaving={savingIds.has(repo.id)}
                    />
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
