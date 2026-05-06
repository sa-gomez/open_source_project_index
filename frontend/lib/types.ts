export interface RepoResult {
  id: number
  full_name: string
  description: string | null
  url: string
  homepage: string | null
  stars: number
  forks: number
  watchers: number
  open_issues: number
  size: number
  language: string | null
  topics: string[]
  license_name: string | null
  has_issues: boolean
  has_wiki: boolean
  created_at: string
  pushed_at: string
  updated_at: string
  quality_score: number
}

export interface FilterState {
  query: string
  language: string | null
  minStars: number | null
  minSizeKb: number | null
  pushedAfter: string | null
  limit: number
  topics: string[]
}

export interface BrowseFilters {
  language: string | null
  minStars: number
  minSizeKb: number | null
  pushedAfter: string | null
  topics: string[]
  limit: number
  offset: number
}

export interface BrowsePage {
  results: RepoResult[]
  total: number
  limit: number
  offset: number
}
