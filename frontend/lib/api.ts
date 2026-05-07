import type { BrowseFilters, BrowsePage, FilterState, ProcessingJob, RepoResult } from './types'

export async function searchRepos(filters: FilterState): Promise<RepoResult[]> {
  const params = new URLSearchParams()

  if (filters.query) params.set('query', filters.query)
  if (filters.language) params.set('language', filters.language)
  if (filters.minStars !== null) params.set('min_stars', String(filters.minStars))
  if (filters.minSizeKb !== null) params.set('min_size_kb', String(filters.minSizeKb))
  if (filters.pushedAfter) params.set('pushed_after', filters.pushedAfter)
  for (const topic of filters.topics) {
    params.append('topics', topic)
  }
  params.set('limit', String(filters.limit))

  const res = await fetch(`/api/search?${params.toString()}`)

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

export async function browseRepos(filters: BrowseFilters): Promise<BrowsePage> {
  const params = new URLSearchParams()

  if (filters.language) params.set('language', filters.language)
  if (filters.minStars) params.set('min_stars', String(filters.minStars))
  if (filters.minSizeKb !== null) params.set('min_size_kb', String(filters.minSizeKb))
  if (filters.pushedAfter) params.set('pushed_after', filters.pushedAfter)
  for (const topic of filters.topics) {
    params.append('topics', topic)
  }
  params.set('limit', String(filters.limit))
  params.set('offset', String(filters.offset))

  const res = await fetch(`/api/browse?${params.toString()}`)

  if (!res.ok) {
    if (res.status === 504) throw new Error('Could not reach the server.')
    if (res.status === 422) {
      const body = await res.json().catch(() => null)
      const detail =
        body?.detail?.[0]?.msg ?? body?.detail ?? 'Invalid parameters.'
      throw new Error(String(detail))
    }
    throw new Error(`Unexpected error: ${res.status}`)
  }

  return res.json() as Promise<BrowsePage>
}

export async function saveRepo(repo: RepoResult): Promise<ProcessingJob> {
  const res = await fetch('/api/index', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(repo),
  })

  if (!res.ok) {
    if (res.status === 409) throw new Error('Repo already saved.')
    throw new Error(`Unexpected error: ${res.status}`)
  }

  return res.json() as Promise<ProcessingJob>
}

export async function removeRepo(repoId: number): Promise<void> {
  const res = await fetch(`/api/index/${repoId}`, { method: 'DELETE' })

  if (!res.ok) {
    if (res.status === 404) throw new Error('Repo not found.')
    throw new Error(`Unexpected error: ${res.status}`)
  }
}

export async function getSavedIds(): Promise<Set<number>> {
  const res = await fetch('/api/index/ids')

  if (!res.ok) throw new Error(`Unexpected error: ${res.status}`)

  const data = (await res.json()) as { ids: number[] }
  return new Set(data.ids)
}
