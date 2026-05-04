# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A tool for discovering and analyzing high-quality, production-grade open source projects. Includes a web UI, a FastAPI backend, and a Python discovery module that queries the GitHub Search API.

Python 3.12, managed with `uv`. Node 20+, managed with `npm` (frontend).

## Commands

```bash
# Backend
uv sync                              # install Python dependencies
uv run uvicorn api.main:app --reload # start FastAPI server (port 8000)
uv run python main.py                # run the CLI demo
uv run pytest tests/                 # run Python tests
uv add <package>                     # add a Python dependency

# Frontend
cd frontend && npm install           # install Node dependencies
cd frontend && npm run dev           # start Next.js dev server (port 3000)
cd frontend && npm test              # run frontend tests (Vitest)
cd frontend && npm run build         # production build
```

## Architecture

```
src/discovery/
  models.py        # Pydantic models: SearchParams, RepoResult
  github_search.py # GitHub API client + search logic
  scoring.py       # Quality score computation
  __init__.py      # exports search_repos, SearchParams, RepoResult
api/
  main.py          # FastAPI app factory + CORS (loads .env)
  routers/
    search.py      # GET /search — wraps search_repos, translates httpx errors
tests/
  api/
    test_search.py # FastAPI integration tests (7 tests)
frontend/
  app/
    layout.tsx     # root layout: header + QueryClientProvider
    page.tsx       # main search page: FilterSidebar + RepoTable
  components/
    FilterSidebar.tsx  # filter form (query, language, topics, stars, size, date, limit)
    RepoTable.tsx      # results table with skeleton/empty/error states
    RepoCard.tsx       # single table row
    Providers.tsx      # React Query QueryClientProvider wrapper
  hooks/
    useSearch.ts       # React Query hook, enabled after Search is clicked
  lib/
    types.ts       # RepoResult, FilterState TypeScript interfaces
    api.ts         # searchRepos() fetch wrapper
    store.ts       # Zustand store: filters, submittedFilters, showScore
main.py            # CLI demo runner (rich table output)
```

### Discovery module (`src/discovery/`)

`search_repos(params: SearchParams) -> list[RepoResult]` is the main entry point. It:
1. Builds a GitHub search query from `SearchParams` (stars, size, language, topics, pushed_after)
2. Calls `GET https://api.github.com/search/repositories`
3. Scores and sorts results by `quality_score`

**Quality scoring** (`scoring.py`) uses a weighted composite of 7 signals, normalized relative to the result set:

| Signal | Weight | Notes |
|---|---|---|
| size | 30% | Sigmoid centered at 100MB — small repos score near zero |
| completeness | 20% | license + topics + homepage |
| forks | 15% | log-scaled |
| recency | 15% | exponential decay from last push |
| issues | 10% | log-scaled open issue count |
| stars | 5% | log-scaled; intentionally low to avoid surfacing list repos |
| community | 5% | forks/stars ratio |

**Key design decision:** Stars are weighted low (5%) because high-star repos are often curated lists or learning resources, not production codebases. Size (30%) is the dominant signal because real projects tend to be 100MB+.

`SearchParams` supports a `min_size_kb` field that pushes a `size:>=N` qualifier into the GitHub query itself, filtering at the API level before results are returned.

### Auth

Reads `GITHUB_TOKEN` from `.env` (via `python-dotenv`). Falls back to unauthenticated (10 req/min vs 30 req/min). Copy `.env.example` to `.env` to get started.

### GitHub API limitation

Contributor count is not available via the search API. It requires a separate `GET /repos/{owner}/{repo}/contributors` call per repo. Not yet implemented — forks is used as a proxy in scoring.

## Next steps

- Phase 2: persistence layer + indexed browse (pre-indexed repo list, no live search)
- Phase 3: hybrid — filter cached index with optional live GitHub refresh
- Optional enrichment pass to fetch per-repo contributor counts
