'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRepo } from '@/hooks/useRepo'
import type { JobStatus } from '@/lib/types'

const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  queued: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  processing: 'bg-blue-900/40 text-blue-300 border-blue-700',
  done: 'bg-green-900/40 text-green-300 border-green-700',
  failed: 'bg-red-900/40 text-red-300 border-red-700',
}

const ANALYSIS_STATUS_MESSAGES: Record<JobStatus, string> = {
  queued: 'Queued for analysis — results will appear here once processing completes.',
  processing: 'Analysis in progress…',
  done: 'Analysis complete.',
  failed: 'Analysis failed. Check error logs for details.',
}

function formatSize(sizeKb: number): string {
  if (sizeKb >= 1_000_000) return `${(sizeKb / 1_000_000).toFixed(1)} GB`
  if (sizeKb >= 1_000) return `${(sizeKb / 1_000).toFixed(1)} MB`
  return `${sizeKb} KB`
}

function formatCount(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500 mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-200">{value ?? <span className="text-gray-600">—</span>}</dd>
    </div>
  )
}

export default function RepoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: repo, isLoading, error } = useRepo(Number(id))

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-5 bg-gray-800 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !repo) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="rounded border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error instanceof Error ? error.message : 'Repository not found.'}
        </div>
        <Link href="/browse" className="mt-4 inline-block text-sm text-gray-400 hover:text-gray-200">
          ← Back to Browse
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-white truncate">{repo.full_name}</h1>
            {repo.job_status && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${JOB_STATUS_COLORS[repo.job_status]}`}>
                {repo.job_status}
              </span>
            )}
          </div>
          {repo.description && (
            <p className="mt-1 text-sm text-gray-400">{repo.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/browse" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Browse
          </Link>
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded border border-gray-600 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
          >
            View on GitHub ↗
          </a>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stats + Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <section className="rounded border border-gray-800 p-4">
            <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-medium">Stats</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Stars" value={formatCount(repo.stars)} />
              <Field label="Forks" value={formatCount(repo.forks)} />
              <Field label="Watchers" value={formatCount(repo.watchers)} />
              <Field label="Open Issues" value={formatCount(repo.open_issues)} />
              <Field label="Size" value={formatSize(repo.size)} />
              <Field label="Language" value={repo.language} />
            </dl>
          </section>

          <section className="rounded border border-gray-800 p-4">
            <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-medium">Details</h2>
            <dl className="space-y-3">
              <Field label="License" value={repo.license_name} />
              <Field
                label="Homepage"
                value={
                  repo.homepage ? (
                    <a href={repo.homepage} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate block">
                      {repo.homepage}
                    </a>
                  ) : null
                }
              />
              <Field label="Created" value={repo.created_at.slice(0, 10)} />
              <Field label="Last Push" value={repo.pushed_at.slice(0, 10)} />
              {repo.indexed_at && <Field label="Indexed" value={repo.indexed_at.slice(0, 10)} />}
            </dl>
          </section>
        </div>

        {/* Topics */}
        {repo.topics.length > 0 && (
          <section className="rounded border border-gray-800 p-4">
            <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-medium">Topics</h2>
            <div className="flex flex-wrap gap-2">
              {repo.topics.map((topic) => (
                <span key={topic} className="px-2 py-0.5 rounded bg-gray-800 text-xs text-gray-300 border border-gray-700">
                  {topic}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Quality Score */}
        <section className="rounded border border-gray-800 p-4">
          <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-medium">Quality Score</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-green-400">{repo.quality_score.toFixed(1)}</span>
            <span className="text-xs text-gray-500">/ 100</span>
          </div>
        </section>

        {/* Analysis */}
        <section className="rounded border border-gray-800 p-4">
          <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-medium">Analysis</h2>
          {repo.job_status ? (
            <p className="text-sm text-gray-400">{ANALYSIS_STATUS_MESSAGES[repo.job_status]}</p>
          ) : (
            <p className="text-sm text-gray-600">No analysis data available.</p>
          )}
        </section>
      </div>
    </div>
  )
}
