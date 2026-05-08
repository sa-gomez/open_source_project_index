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
  models.py        # Pydantic models: SearchParams, RepoResult, ProcessingJob, JobStatus
  github_search.py # GitHub API client + search logic
  scoring.py       # Quality score computation
  db.py            # SQLAlchemy engine factory + repositories + processing_jobs Table definitions + migrate_db()
  repository.py    # upsert_repos(), browse_repos(), get_repo_by_id(), save_repo(), get_saved_ids(), remove_repo()
  worker.py        # Background worker: polls queued jobs, git-clones repos, extracts sample_text
  __init__.py      # exports search_repos, SearchParams, RepoResult
api/
  main.py          # FastAPI app factory + CORS + lifespan (creates DB tables)
  routers/
    search.py      # GET /search — live GitHub search
    browse.py      # GET /browse → BrowsePage — queries SQLite index
    index.py       # POST /index, DELETE /index/{repo_id}, GET /index/ids — curation endpoints
    repo.py        # GET /repos/{repo_id} → RepoResult — single repo detail
scripts/
  indexer.py       # DEPRECATED: superseded by the Save workflow in the UI
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
    repos/[id]/page.tsx # repo detail page — all stored data for a single saved repo
  components/
    FilterSidebar.tsx       # filter form (props-driven, no store coupling)
    SearchFilterSidebar.tsx # store wrapper for /search
    BrowseFilterSidebar.tsx # store wrapper for /browse
    RepoTable.tsx           # live search results: checkboxes, Save buttons, New-only toggle
    BrowseTable.tsx         # indexed browse: job status badges, Remove buttons, pagination
    RepoCard.tsx            # single table row (shared; supports save/remove/select/status/detailPath props)
    Nav.tsx                 # header nav with active-link highlighting
    Providers.tsx           # React Query QueryClientProvider wrapper
  hooks/
    useSearch.ts    # React Query hook, enabled after Search is clicked
    useBrowse.ts    # React Query hook, auto-enabled with keepPreviousData
    useSavedIds.ts  # React Query hook, fetches GET /index/ids and syncs to store
    useRepo.ts      # React Query hook, fetches GET /repos/{id} for detail page
  lib/
    types.ts    # RepoResult, FilterState, BrowseFilters, BrowsePage, ProcessingJob, JobStatus
    api.ts      # searchRepos(), browseRepos(), getRepo(), saveRepo(), removeRepo(), getSavedIds()
    store.ts    # Zustand: search filters + browse filters + pagination + curation state
repos.db           # SQLite index (gitignored; populated via the Save workflow in the UI)
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

Repos are saved manually via the Search page UI, which calls `POST /api/index`. The DB path defaults to `./repos.db` and can be overridden with the `DB_PATH` env var.

**`repositories` table** mirrors `RepoResult`. `indexed_at` is nullable — set by a worker when processing completes, null while queued/processing. Topics are stored as a JSON text column.

**`processing_jobs` table** tracks per-repo processing state:

| Column | Notes |
|---|---|
| `repo_id` | FK to repositories.id, UNIQUE (one active job per repo) |
| `status` | queued \| processing \| done \| failed |
| `queued_at` | set on save |
| `started_at / completed_at / error_msg` | set by worker |

`GET /browse` JOINs `repositories` with `processing_jobs` and returns `job_status` on each result. `GET /repos/{id}` returns the same JOIN for a single repo (used by the detail page). `GET /index/ids` returns all repo IDs currently in the system (any job status), used by the Search page to mark already-saved repos.

## Worker (`src/discovery/worker.py`)

Starts as a daemon thread in the FastAPI lifespan. Polls `processing_jobs` for `status=queued` every 5 seconds. For each job:
1. Marks job `processing`
2. `git clone --depth=1` the repo into `clones/<owner>/<repo>/`
3. Finds README.md first, falls back to any source file (`.py`, `.ts`, `.go`, etc.)
4. Reads first 3000 chars into `repositories.sample_text`
5. Sets `indexed_at` on the repo and marks job `done`; sets `failed` + `error_msg` on any exception

Clones are stored in `./clones/` (gitignored). `sample_text` is currently a placeholder — the analysis logic will be replaced in a future phase.

## Next steps

- ~~Phase 2: persistence layer + indexed browse~~ ✓ done
- ~~Phase 3 (partial): manual curation — save repos from Search page~~ ✓ done
- ~~Phase 3 (remaining): worker that clones + extracts sample text, sets `indexed_at`~~ ✓ done
- Phase 4: replace `sample_text` placeholder with real analysis (embeddings, summaries, structured extraction, etc.)
- Optional enrichment pass to fetch per-repo contributor counts
