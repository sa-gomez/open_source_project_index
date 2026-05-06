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

## Commands (continued)

```bash
# Indexer (Phase 2)
uv run python scripts/indexer.py --dry-run  # preview combos, no writes
uv run python scripts/indexer.py            # populate repos.db (~27 API calls)
uv run python scripts/indexer.py --db-path /path/to/other.db
```

## Architecture

```
src/discovery/
  models.py        # Pydantic models: SearchParams, RepoResult
  github_search.py # GitHub API client + search logic
  scoring.py       # Quality score computation
  db.py            # SQLAlchemy engine factory + repositories Table definition
  repository.py    # upsert_repos(), browse_repos() — SQLite adapter
  __init__.py      # exports search_repos, SearchParams, RepoResult
api/
  main.py          # FastAPI app factory + CORS + lifespan (creates DB tables)
  routers/
    search.py      # GET /search — live GitHub search
    browse.py      # GET /browse → BrowsePage — queries SQLite index
scripts/
  indexer.py       # CLI: runs 27 SearchParams combos, upserts into repos.db
tests/
  api/
    test_search.py # FastAPI integration tests (7 tests)
    test_browse.py # Browse endpoint tests (6 tests)
frontend/
  app/
    layout.tsx         # root layout: header + nav + Providers
    page.tsx           # landing page: Browse Index + Live Search CTAs
    browse/page.tsx    # indexed browse page (auto-fetches on mount)
    search/page.tsx    # live GitHub search page
  components/
    FilterSidebar.tsx       # filter form (props-driven, no store coupling)
    SearchFilterSidebar.tsx # store wrapper for /search
    BrowseFilterSidebar.tsx # store wrapper for /browse
    RepoTable.tsx           # live search results table
    BrowseTable.tsx         # indexed browse table with pagination footer
    RepoCard.tsx            # single table row (shared)
    Nav.tsx                 # header nav with active-link highlighting
    Providers.tsx           # React Query QueryClientProvider wrapper
  hooks/
    useSearch.ts    # React Query hook, enabled after Search is clicked
    useBrowse.ts    # React Query hook, auto-enabled with keepPreviousData
  lib/
    types.ts    # RepoResult, FilterState, BrowseFilters, BrowsePage interfaces
    api.ts      # searchRepos(), browseRepos() fetch wrappers
    store.ts    # Zustand: search filters + browse filters + pagination state
repos.db           # SQLite index (gitignored; populate with scripts/indexer.py)
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

### Persistence layer (`repos.db`)

`GET /browse` queries a local SQLite database populated by `scripts/indexer.py`. The DB path defaults to `./repos.db` and can be overridden with the `DB_PATH` env var.

The `repositories` table mirrors `RepoResult` with an extra `indexed_at` timestamp. Topics are stored as a JSON text column. `upsert_repos()` uses `INSERT OR REPLACE` keyed on the GitHub repo `id`, so re-running the indexer refreshes stale data without duplicates.

The browse endpoint supports: `language`, `min_stars`, `min_size_kb`, `pushed_after`, `topics` (multi-value), `limit`, `offset`. Results are ordered by `quality_score DESC`.

## Next steps

- ~~Phase 2: persistence layer + indexed browse~~ ✓ done
- Phase 3: hybrid — filter cached index with optional live GitHub refresh
- Optional enrichment pass to fetch per-repo contributor counts
