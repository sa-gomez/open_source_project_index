import { http, HttpResponse } from 'msw'
import type { RepoResult } from '@/lib/types'

export const mockRepo: RepoResult = {
  id: 1,
  full_name: 'org/repo',
  description: 'A test repo',
  url: 'https://github.com/org/repo',
  homepage: null,
  stars: 5000,
  forks: 200,
  watchers: 5000,
  open_issues: 10,
  size: 100000,
  language: 'Python',
  topics: [],
  license_name: 'MIT',
  has_issues: true,
  has_wiki: true,
  created_at: '2020-01-01T00:00:00Z',
  pushed_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  quality_score: 75.0,
}

export const handlers = [
  http.get('http://localhost:8000/search', () => {
    return HttpResponse.json([mockRepo])
  }),
]
