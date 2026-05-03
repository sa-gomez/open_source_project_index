import type { RepoResult } from '@/lib/types'

function formatSize(sizeKb: number): string {
  if (sizeKb >= 1_000_000) return `${(sizeKb / 1_000_000).toFixed(1)}GB`
  if (sizeKb >= 1_000) return `${(sizeKb / 1_000).toFixed(1)}MB`
  return `${sizeKb}KB`
}

function formatCount(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

interface RepoCardProps {
  rank: number
  repo: RepoResult
  showScore: boolean
}

export function RepoCard({ rank, repo, showScore }: RepoCardProps) {
  const pushedDate = new Date(repo.pushed_at).toISOString().slice(0, 10)

  return (
    <tr
      className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
      onClick={() => window.open(repo.url, '_blank', 'noopener,noreferrer')}
    >
      <td className="px-3 py-2 text-gray-500 text-sm">{rank}</td>
      <td className="px-3 py-2 max-w-xs">
        <div className="font-medium text-sm text-blue-400 truncate">{repo.full_name}</div>
        {repo.description && (
          <div className="text-xs text-gray-400 mt-0.5 truncate">{repo.description}</div>
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
    </tr>
  )
}
