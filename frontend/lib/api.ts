import type { FilterState, RepoResult } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function searchRepos(filters: FilterState): Promise<RepoResult[]> {
  const params = new URLSearchParams()

  if (filters.query) params.set('query', filters.query)
  if (filters.language) params.set('language', filters.language)
  if (filters.minStars !== null) params.set('min_stars', String(filters.minStars))
  if (filters.minSizeKb !== null) params.set('min_size_kb', String(filters.minSizeKb))
  if (filters.pushedAfter) params.set('pushed_after', filters.pushedAfter)
  params.set('limit', String(filters.limit))

  const res = await fetch(`${API_BASE}/search?${params.toString()}`)

  if (!res.ok) {
    if (res.status === 504) throw new Error('Could not reach the server.')
    if (res.status === 502)
      throw new Error('GitHub API unavailable — check your token or try again.')
    if (res.status === 422) {
      const body = await res.json().catch(() => null)
      const detail =
        body?.detail?.[0]?.msg ?? body?.detail ?? 'Invalid search parameters.'
      throw new Error(String(detail))
    }
    throw new Error(`Unexpected error: ${res.status}`)
  }

  return res.json() as Promise<RepoResult[]>
}
