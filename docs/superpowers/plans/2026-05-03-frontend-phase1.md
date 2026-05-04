# Frontend Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a FastAPI HTTP layer over the existing Python discovery backend and a Next.js + Tailwind web UI with a filter sidebar, results table, and optional quality score column.

**Architecture:** A thin FastAPI app in `api/` exposes `GET /search` backed by the existing `search_repos(SearchParams)` function. A Next.js 15 frontend in `frontend/` uses Zustand for filter/UI state and React Query for server state. The two run as separate processes during development.

**Tech Stack:** Python 3.12, FastAPI, uvicorn, pytest — Next.js 15, TypeScript, Tailwind CSS, Zustand, @tanstack/react-query, Vitest, MSW

---

## File Map

**New Python files:**
- `api/__init__.py` — makes `api` a package
- `api/main.py` — FastAPI app factory + CORS config
- `api/routers/__init__.py` — makes `routers` a package
- `api/routers/search.py` — `GET /search` endpoint, error translation
- `tests/__init__.py` — test root package
- `tests/api/__init__.py` — test subpackage
- `tests/api/test_search.py` — integration tests for the search endpoint

**Modified Python files:**
- `pyproject.toml` — add fastapi, uvicorn, pytest deps + pytest pythonpath config

**New frontend files:**
- `frontend/` — entire Next.js app (scaffolded then extended)
- `frontend/components/Providers.tsx` — React Query QueryClientProvider (client component)
- `frontend/app/layout.tsx` — root layout: header + Providers wrapper
- `frontend/app/page.tsx` — main search page: FilterSidebar + RepoTable split layout
- `frontend/lib/types.ts` — `RepoResult` and `FilterState` TypeScript interfaces
- `frontend/lib/api.ts` — `searchRepos(filters)` typed fetch wrapper
- `frontend/lib/store.ts` — Zustand store: filter state, submitted filters, score toggle
- `frontend/hooks/useSearch.ts` — React Query hook wrapping `searchRepos`
- `frontend/components/FilterSidebar.tsx` — filter form wired to Zustand
- `frontend/components/RepoCard.tsx` — single `<tr>` row component
- `frontend/components/RepoTable.tsx` — full table: loading skeletons, empty state, error display
- `frontend/mocks/handlers.ts` — MSW request handlers for tests
- `frontend/hooks/useSearch.test.ts` — Vitest + RTL + MSW hook tests
- `frontend/vitest.config.ts` — Vitest config
- `frontend/vitest.setup.ts` — jest-dom setup
- `frontend/.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:8000`
- `frontend/.env.local.example` — template for API URL env var

---

## Task 1: FastAPI app + search endpoint

**Files:**
- Create: `api/__init__.py`
- Create: `api/main.py`
- Create: `api/routers/__init__.py`
- Create: `api/routers/search.py`
- Modify: `pyproject.toml`

- [ ] **Step 1: Add FastAPI and uvicorn dependencies**

```bash
uv add fastapi "uvicorn[standard]"
```

Expected: `pyproject.toml` dependencies updated, `.venv` updated.

- [ ] **Step 2: Create package init files**

Create `api/__init__.py` (empty):
```python
```

Create `api/routers/__init__.py` (empty):
```python
```

- [ ] **Step 3: Create the search router**

Create `api/routers/search.py`:
```python
from datetime import date

import httpx
from fastapi import APIRouter, HTTPException, Query

from src.discovery import RepoResult, SearchParams, search_repos

router = APIRouter()


@router.get("/search", response_model=list[RepoResult])
def search(
    query: str = Query(default=""),
    language: str | None = Query(default=None),
    min_stars: int = Query(default=1000),
    min_size_kb: int | None = Query(default=None),
    pushed_after: date | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
):
    params = SearchParams(
        query=query,
        language=language,
        min_stars=min_stars,
        min_size_kb=min_size_kb,
        pushed_after=pushed_after,
        limit=limit,
    )
    try:
        return search_repos(params)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="GitHub API timed out.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"GitHub API error {e.response.status_code}: {e.response.text[:200]}",
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Could not reach GitHub API.")
```

- [ ] **Step 4: Create the FastAPI app**

Create `api/main.py`:
```python
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.search import router as search_router

app = FastAPI(title="Open Source Project Index API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(search_router)
```

- [ ] **Step 5: Verify the API starts**

```bash
uv run uvicorn api.main:app --reload
```

Expected: `Uvicorn running on http://127.0.0.1:8000`. Open `http://127.0.0.1:8000/docs` — the `/search` endpoint appears in Swagger UI. Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add api/ pyproject.toml uv.lock
git commit -m "feat: add FastAPI search endpoint"
```

---

## Task 2: FastAPI integration tests

**Files:**
- Create: `tests/__init__.py`
- Create: `tests/api/__init__.py`
- Create: `tests/api/test_search.py`
- Modify: `pyproject.toml`

- [ ] **Step 1: Add pytest dependency**

```bash
uv add --dev pytest
```

- [ ] **Step 2: Add pytest config to pyproject.toml**

Add this section to `pyproject.toml`:
```toml
[tool.pytest.ini_options]
pythonpath = ["."]
```

- [ ] **Step 3: Create test package init files**

Create `tests/__init__.py` (empty):
```python
```

Create `tests/api/__init__.py` (empty):
```python
```

- [ ] **Step 4: Write the tests**

Create `tests/api/test_search.py`:
```python
from unittest.mock import MagicMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient

from api.main import app
from src.discovery.models import RepoResult

client = TestClient(app)


@pytest.fixture
def sample_repo() -> RepoResult:
    return RepoResult(
        id=1,
        full_name="org/repo",
        description="A test repo",
        url="https://github.com/org/repo",
        homepage=None,
        stars=5000,
        forks=200,
        watchers=5000,
        open_issues=10,
        size=100000,
        language="Python",
        topics=[],
        license_name="MIT",
        has_issues=True,
        has_wiki=True,
        created_at="2020-01-01T00:00:00Z",
        pushed_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        quality_score=75.0,
    )


def test_search_returns_results(sample_repo: RepoResult) -> None:
    with patch("api.routers.search.search_repos", return_value=[sample_repo]):
        response = client.get("/search?language=python&min_stars=5000")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["full_name"] == "org/repo"
    assert data[0]["quality_score"] == 75.0


def test_search_returns_empty_list() -> None:
    with patch("api.routers.search.search_repos", return_value=[]):
        response = client.get("/search")
    assert response.status_code == 200
    assert response.json() == []


def test_search_github_http_error_returns_502() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 403
    mock_response.text = "rate limited"
    error = httpx.HTTPStatusError("403", request=MagicMock(), response=mock_response)
    with patch("api.routers.search.search_repos", side_effect=error):
        response = client.get("/search")
    assert response.status_code == 502


def test_search_timeout_returns_504() -> None:
    with patch(
        "api.routers.search.search_repos",
        side_effect=httpx.TimeoutException("timeout"),
    ):
        response = client.get("/search")
    assert response.status_code == 504


def test_search_invalid_limit_too_high_returns_422() -> None:
    response = client.get("/search?limit=999")
    assert response.status_code == 422


def test_search_invalid_limit_zero_returns_422() -> None:
    response = client.get("/search?limit=0")
    assert response.status_code == 422
```

- [ ] **Step 5: Run tests and verify they pass**

```bash
uv run pytest tests/api/test_search.py -v
```

Expected: all 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add tests/ pyproject.toml uv.lock
git commit -m "test: add FastAPI search endpoint integration tests"
```

---

## Task 3: Next.js + Tailwind scaffold

**Files:**
- Create: `frontend/` (entire Next.js app)
- Create: `frontend/components/Providers.tsx`

- [ ] **Step 1: Scaffold the Next.js app**

From the project root:
```bash
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm
```

Accept all defaults when prompted.

- [ ] **Step 2: Install additional dependencies**

```bash
cd frontend
npm install @tanstack/react-query zustand
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom msw
```

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: Next.js dev server running at `http://localhost:3000`. Default Next.js page loads. Stop with Ctrl+C.

- [ ] **Step 4: Create the Providers component**

Create `frontend/components/Providers.tsx`:
```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: scaffold Next.js frontend with Tailwind, React Query, Zustand"
```

---

## Task 4: TypeScript types, API client, env config

**Files:**
- Create: `frontend/lib/types.ts`
- Create: `frontend/lib/api.ts`
- Create: `frontend/.env.local`
- Create: `frontend/.env.local.example`

- [ ] **Step 1: Create shared TypeScript types**

Create `frontend/lib/types.ts`:
```typescript
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
}
```

- [ ] **Step 2: Create the API client**

Create `frontend/lib/api.ts`:
```typescript
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
```

- [ ] **Step 3: Create env files**

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create `frontend/.env.local.example`:
```
# URL of the FastAPI backend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 4: Verify TypeScript compiles cleanly**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/lib/ frontend/.env.local.example
git commit -m "feat: add TypeScript types and API client"
```

Note: do **not** stage `frontend/.env.local` — it contains local config.

---

## Task 5: Zustand store

**Files:**
- Create: `frontend/lib/store.ts`

- [ ] **Step 1: Create the store**

Create `frontend/lib/store.ts`:
```typescript
import { create } from 'zustand'
import type { FilterState } from './types'

interface StoreState {
  filters: FilterState
  submittedFilters: FilterState | null
  showScore: boolean
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  submitSearch: () => void
  toggleScore: () => void
}

const defaultFilters: FilterState = {
  query: '',
  language: null,
  minStars: null,
  minSizeKb: null,
  pushedAfter: null,
  limit: 20,
}

export const useStore = create<StoreState>((set) => ({
  filters: defaultFilters,
  submittedFilters: null,
  showScore: false,

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  submitSearch: () =>
    set((state) => ({ submittedFilters: { ...state.filters } })),

  toggleScore: () => set((state) => ({ showScore: !state.showScore })),
}))
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/lib/store.ts
git commit -m "feat: add Zustand store for filter and UI state"
```

---

## Task 6: useSearch React Query hook

**Files:**
- Create: `frontend/hooks/useSearch.ts`

- [ ] **Step 1: Create the hook**

Create `frontend/hooks/useSearch.ts`:
```typescript
import { useQuery } from '@tanstack/react-query'
import { searchRepos } from '@/lib/api'
import { useStore } from '@/lib/store'

export function useSearch() {
  const submittedFilters = useStore((state) => state.submittedFilters)

  return useQuery({
    queryKey: ['search', submittedFilters],
    queryFn: () => searchRepos(submittedFilters!),
    enabled: submittedFilters !== null,
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/hooks/useSearch.ts
git commit -m "feat: add useSearch React Query hook"
```

---

## Task 7: FilterSidebar component

**Files:**
- Create: `frontend/components/FilterSidebar.tsx`

- [ ] **Step 1: Create the component**

Create `frontend/components/FilterSidebar.tsx`:
```tsx
'use client'

import { useStore } from '@/lib/store'

export function FilterSidebar() {
  const { filters, setFilter, submitSearch } = useStore()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submitSearch()
  }

  const inputClass =
    'w-full rounded bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500'
  const labelClass = 'block text-xs text-gray-400 mb-1'

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className={labelClass}>Language</label>
        <input
          type="text"
          value={filters.language ?? ''}
          onChange={(e) => setFilter('language', e.target.value || null)}
          placeholder="e.g. python"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Min Stars</label>
        <input
          type="number"
          value={filters.minStars ?? ''}
          onChange={(e) =>
            setFilter('minStars', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="e.g. 1000"
          min={0}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Min Size (KB)</label>
        <input
          type="number"
          value={filters.minSizeKb ?? ''}
          onChange={(e) =>
            setFilter('minSizeKb', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="e.g. 50000"
          min={0}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Pushed After</label>
        <input
          type="date"
          value={filters.pushedAfter ?? ''}
          onChange={(e) => setFilter('pushedAfter', e.target.value || null)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Limit</label>
        <input
          type="number"
          value={filters.limit}
          onChange={(e) => setFilter('limit', Number(e.target.value) || 20)}
          min={1}
          max={100}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-3 py-2 text-sm font-medium transition-colors"
      >
        Search
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/components/FilterSidebar.tsx
git commit -m "feat: add FilterSidebar component"
```

---

## Task 8: RepoCard and RepoTable components

**Files:**
- Create: `frontend/components/RepoCard.tsx`
- Create: `frontend/components/RepoTable.tsx`

- [ ] **Step 1: Create RepoCard (a single table row)**

Create `frontend/components/RepoCard.tsx`:
```tsx
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
```

- [ ] **Step 2: Create RepoTable**

Create `frontend/components/RepoTable.tsx`:
```tsx
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
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd ..
git add frontend/components/RepoCard.tsx frontend/components/RepoTable.tsx
git commit -m "feat: add RepoCard and RepoTable components"
```

---

## Task 9: Wire up layout and main page

**Files:**
- Modify: `frontend/app/layout.tsx`
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Replace layout.tsx**

Overwrite `frontend/app/layout.tsx` with:
```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Open Source Project Index',
  description: 'Discover production-grade open source repositories',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <header className="border-b border-gray-800 px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Open Source Project Index</h1>
        </header>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Replace page.tsx**

Overwrite `frontend/app/page.tsx` with:
```tsx
import { FilterSidebar } from '@/components/FilterSidebar'
import { RepoTable } from '@/components/RepoTable'

export default function Home() {
  return (
    <div className="flex h-[calc(100vh-57px)]">
      <aside className="w-[280px] shrink-0 border-r border-gray-800 overflow-y-auto">
        <FilterSidebar />
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <RepoTable />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Manually verify the full UI**

Terminal 1 — start the API (from project root):
```bash
uv run uvicorn api.main:app --reload
```

Terminal 2 — start the frontend:
```bash
cd frontend && npm run dev
```

Open `http://localhost:3000`. Verify:
- Header shows "Open Source Project Index"
- Filter sidebar on the left with 5 inputs and a Search button
- Results area shows "Set filters and click Search…" on first load
- Enter `python` in Language, click Search — skeleton rows appear, then real results
- "Show Score" toggle adds/removes the Score column
- Clicking a repo row opens GitHub in a new tab

- [ ] **Step 4: Commit**

```bash
cd ..
git add frontend/app/layout.tsx frontend/app/page.tsx
git commit -m "feat: wire up main search page layout"
```

---

## Task 10: Frontend hook tests with Vitest + MSW

**Files:**
- Create: `frontend/vitest.config.ts`
- Create: `frontend/vitest.setup.ts`
- Create: `frontend/mocks/handlers.ts`
- Create: `frontend/hooks/useSearch.test.ts`
- Modify: `frontend/package.json`

- [ ] **Step 1: Create Vitest config**

Create `frontend/vitest.config.ts`:
```typescript
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 2: Create Vitest setup file**

Create `frontend/vitest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Add test scripts to package.json**

In `frontend/package.json`, add to the `"scripts"` object:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create MSW handlers**

Create `frontend/mocks/handlers.ts`:
```typescript
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
```

- [ ] **Step 5: Write the hook tests**

Create `frontend/hooks/useSearch.test.ts`:
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import React from 'react'
import { handlers, mockRepo } from '../mocks/handlers'
import { useSearch } from './useSearch'
import { useStore } from '@/lib/store'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  server.resetHandlers()
  useStore.setState({
    filters: {
      query: '',
      language: null,
      minStars: null,
      minSizeKb: null,
      pushedAfter: null,
      limit: 20,
    },
    submittedFilters: null,
    showScore: false,
  })
})

afterAll(() => server.close())

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return React.createElement(QueryClientProvider, { client: queryClient }, children)
}

test('does not fetch before search is submitted', () => {
  const { result } = renderHook(() => useSearch(), { wrapper })
  expect(result.current.data).toBeUndefined()
  expect(result.current.isLoading).toBe(false)
  expect(result.current.fetchStatus).toBe('idle')
})

test('fetches and returns results after submitSearch', async () => {
  useStore.setState({
    submittedFilters: {
      query: '',
      language: 'python',
      minStars: 1000,
      minSizeKb: null,
      pushedAfter: null,
      limit: 20,
    },
  })

  const { result } = renderHook(() => useSearch(), { wrapper })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  expect(result.current.data).toHaveLength(1)
  expect(result.current.data![0].full_name).toBe(mockRepo.full_name)
  expect(result.current.data![0].quality_score).toBe(75.0)
})

test('surfaces error message on 502', async () => {
  server.use(
    http.get('http://localhost:8000/search', () =>
      HttpResponse.json({ detail: 'GitHub API error' }, { status: 502 }),
    ),
  )

  useStore.setState({
    submittedFilters: {
      query: '',
      language: null,
      minStars: 1000,
      minSizeKb: null,
      pushedAfter: null,
      limit: 20,
    },
  })

  const { result } = renderHook(() => useSearch(), { wrapper })

  await waitFor(() => expect(result.current.isError).toBe(true))

  expect(result.current.error).toBeInstanceOf(Error)
  expect((result.current.error as Error).message).toContain('GitHub API unavailable')
})
```

- [ ] **Step 6: Run tests and verify they pass**

```bash
cd frontend && npm test
```

Expected: 3 tests pass.

- [ ] **Step 7: Commit**

```bash
cd ..
git add frontend/vitest.config.ts frontend/vitest.setup.ts frontend/mocks/ frontend/hooks/useSearch.test.ts frontend/package.json
git commit -m "test: add useSearch hook tests with Vitest and MSW"
```

---

## Done

At this point:
- `uv run uvicorn api.main:app --reload` starts the Python API at port 8000
- `cd frontend && npm run dev` starts the Next.js UI at port 3000
- `uv run pytest tests/` runs Python API tests
- `cd frontend && npm test` runs frontend hook tests

Phase 2 (indexed browse + persistence layer) is tracked in the frontend phases memory file.
