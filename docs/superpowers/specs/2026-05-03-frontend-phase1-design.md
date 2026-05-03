# Frontend Phase 1 Design: Live Search UI

**Date:** 2026-05-03
**Scope:** Phase 1 of 3 — live search UI backed by the existing GitHub discovery module via FastAPI.

---

## Overview

Add a web UI to the open source project discovery tool. Users enter search filters, hit Search, and see a ranked list of production-grade GitHub repositories. The Python discovery backend is exposed via a thin FastAPI layer. The frontend is Next.js + Tailwind, using React Query for server state and Zustand for filter/UI state.

This is Phase 1 only. Phase 2 (browsing a pre-indexed list) and Phase 3 (hybrid cached + live) are tracked separately.

---

## Repo Layout

```
open_source_project_index/
  src/discovery/          # existing Python backend (unchanged)
  api/                    # new: FastAPI app
    main.py               # app factory + CORS config
    routers/search.py     # GET /search endpoint
  frontend/               # new: Next.js app
    app/
      layout.tsx          # root layout shell (header, providers)
      page.tsx            # main search page (the only page in Phase 1)
    components/
      FilterSidebar.tsx
      RepoTable.tsx
      RepoCard.tsx        # expandable row / score toggle
    lib/
      api.ts              # typed fetch wrappers
      store.ts            # Zustand: filter + UI state
    hooks/
      useSearch.ts        # React Query hook
```

---

## API Contract

**Endpoint:** `GET /search`

Query parameters (all optional):

| Param | Type | Default | Notes |
|---|---|---|---|
| `query` | string | `""` | Free-text search |
| `language` | string | — | e.g. `"python"` |
| `min_stars` | int | `1000` | |
| `min_size_kb` | int | — | API-level size filter |
| `pushed_after` | date | — | ISO format `YYYY-MM-DD` |
| `limit` | int | `20` | |

**Response: 200 OK**
```json
[
  {
    "id": 123,
    "full_name": "org/repo",
    "description": "...",
    "url": "https://github.com/org/repo",
    "stars": 12400,
    "forks": 830,
    "language": "Python",
    "topics": ["ml", "pytorch"],
    "license_name": "MIT",
    "size": 105000,
    "pushed_at": "2024-11-03T14:22:00Z",
    "quality_score": 73.5
  }
]
```

FastAPI derives the request model from the existing `SearchParams` Pydantic model and the response schema from `RepoResult` — no duplication.

**Error responses:**

| Status | Cause | Frontend message |
|---|---|---|
| `422` | Invalid params | Inline field errors on filter inputs |
| `502` | GitHub API error (rate limit, bad token) | "GitHub API unavailable — check your token or try again." |
| `504` | GitHub API timeout | "Could not reach the server." |

---

## UI Layout

Split two-column layout:

```
┌─────────────────────────────────────────────────────┐
│  [Header: Open Source Project Index]                │
├──────────────┬──────────────────────────────────────┤
│  Filters     │  Results                             │
│  (~280px)    │                                      │
│              │  [12 results]  [Show Score toggle]   │
│  Language    │                                      │
│  Min Stars   │  # │ Repo        │ Stars │ Lang │ … │
│  Min Size    │  1 │ org/repo    │ 12.4k │ Py   │ … │
│  Pushed After│  2 │ …                               │
│  Limit       │                                      │
│              │                                      │
│  [Search]    │                                      │
└──────────────┴──────────────────────────────────────┘
```

- Sidebar: fixed 280px, filters map 1:1 to `SearchParams` fields
- Search is triggered by the Search button, not on every keystroke
- Results table columns: `#`, `Repository`, `Stars`, `Forks`, `Language`, `Last Push`, `Size`, and optionally `Score`
- Score column is hidden by default, shown via a toggle (UI state in Zustand)
- Clicking a repo row opens the GitHub URL in a new tab
- Loading state: skeleton rows
- Empty state: "No repositories matched your filters. Try loosening the constraints."

---

## State Management

**Zustand store** — two slices:

```typescript
interface FilterState {
  query: string
  language: string | null
  minStars: number | null
  minSizeKb: number | null
  pushedAfter: string | null  // ISO date string YYYY-MM-DD
  limit: number
}

interface UIState {
  showScore: boolean
}
```

**React Query (`useSearch` hook):**
- Query key: `['search', filterState]`
- Only enabled after the user clicks Search
- `staleTime: 5 minutes` — cached results survive navigation
- `retry: 1` — one retry on failure, then surface error

Filter state lives in Zustand (not React Query) because it is UI-owned and needs to persist across navigations in future phases.

---

## Error Handling

- **Rate limit / bad token:** FastAPI translates `httpx.HTTPStatusError` into a 502 with a human-readable message. Frontend displays it inline below the table header.
- **No results:** Empty state message in the results area.
- **Network error:** React Query surfaces it; UI shows "Could not reach the server."
- **Invalid params:** FastAPI returns 422 with field-level detail; frontend shows inline errors on the relevant filter inputs.

---

## Testing

- **FastAPI:** Integration tests using `httpx.AsyncClient` + `TestClient` with a mocked `search_repos`. One test per error scenario (200, 422, 502).
- **React Query hook:** `@testing-library/react` + MSW (Mock Service Worker) to intercept the API call.
- No unit tests for individual UI components in Phase 1 — integration tests cover the surface area adequately.

---

## Out of Scope (Phase 1)

- Persistence / indexed browse (Phase 2)
- Hybrid cached + live search (Phase 3)
- Authentication / user accounts
- Saved searches
- Contributor count enrichment (noted as a future backend enhancement in CLAUDE.md)
