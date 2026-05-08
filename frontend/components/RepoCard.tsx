'use client'

import { useRouter } from 'next/navigation'
import type { JobStatus, RepoResult } from '@/lib/types'

function formatSize(sizeKb: number): string {
  if (sizeKb >= 1_000_000) return `${(sizeKb / 1_000_000).toFixed(1)}GB`
  if (sizeKb >= 1_000) return `${(sizeKb / 1_000).toFixed(1)}MB`
  return `${sizeKb}KB`
}

function formatCount(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  queued: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  processing: 'bg-blue-900/40 text-blue-300 border-blue-700',
  done: 'bg-green-900/40 text-green-300 border-green-700',
  failed: 'bg-red-900/40 text-red-300 border-red-700',
}

interface RepoCardProps {
  rank: number
  repo: RepoResult
  showScore: boolean
  isSaved?: boolean
  jobStatus?: JobStatus
  onSave?: () => void
  onRemove?: () => void
  isSelected?: boolean
  onToggleSelect?: () => void
  isSaving?: boolean
  detailPath?: string
}

export function RepoCard({
  rank,
  repo,
  showScore,
  isSaved,
  jobStatus,
  onSave,
  onRemove,
  isSelected,
  onToggleSelect,
  isSaving,
  detailPath,
}: RepoCardProps) {
  const router = useRouter()
  const pushedDate = new Date(repo.pushed_at).toISOString().slice(0, 10)

  function handleRowClick() {
    if (detailPath) {
      router.push(detailPath)
    }
  }

  return (
    <tr
      className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${detailPath ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={handleRowClick}
    >
      {onToggleSelect !== undefined && (
        <td
          className="px-3 py-2"
          onClick={(e) => { e.stopPropagation(); if (!isSaved) onToggleSelect() }}
        >
          {!isSaved && (
            <input
              type="checkbox"
              checked={isSelected ?? false}
              onChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
              className="accent-blue-500 cursor-pointer"
            />
          )}
        </td>
      )}
      <td className="px-3 py-2 text-gray-500 text-sm">{rank}</td>
      <td className="px-3 py-2 max-w-xs">
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-sm text-blue-400 truncate hover:underline block"
        >
          {repo.full_name}
        </a>
        {repo.description && (
          <div className="text-xs text-gray-400 mt-0.5 truncate">{repo.description}</div>
        )}
        {repo.indexed_at && (
          <div className="text-xs text-gray-600 mt-0.5">
            Indexed {repo.indexed_at.slice(0, 10)}
          </div>
        )}
      </td>
      <td className="px-3 py-2 text-sm text-right tabular-nums">{formatCount(repo.stars)}</td>
      <td className="px-3 py-2 text-sm text-right tabular-nums">{formatCount(repo.forks)}</td>
      <td className="px-3 py-2 text-sm text-gray-300">{repo.language ?? '—'}</td>
      <td className="px-3 py-2 text-sm text-gray-400 tabular-nums">{pushedDate}</td>
      <td className="px-3 py-2 text-sm text-right tabular-nums text-gray-400">
        {formatSize(repo.size)}
      </td>
      {showScore && (
        <td className="px-3 py-2 text-sm text-right tabular-nums text-green-400">
          {repo.quality_score.toFixed(1)}
        </td>
      )}
      {(onSave !== undefined || onRemove !== undefined) && (
        <td
          className="px-3 py-2 text-right"
          onClick={(e) => e.stopPropagation()}
        >
          {jobStatus && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${JOB_STATUS_COLORS[jobStatus]}`}
            >
              {jobStatus}
            </span>
          )}
          {isSaved && !jobStatus && (
            <span className="inline-flex items-center px-2 py-0.5 rounded border border-green-700 text-xs font-medium bg-green-900/30 text-green-400">
              Saved
            </span>
          )}
          {!isSaved && onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="px-2 py-0.5 rounded border border-gray-600 text-xs text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? '…' : 'Save'}
            </button>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              className="px-2 py-0.5 rounded border border-gray-700 text-xs text-gray-500 hover:text-red-400 hover:border-red-700 transition-colors"
            >
              Remove
            </button>
          )}
        </td>
      )}
    </tr>
  )
}
