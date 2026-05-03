# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A tool for discovering and analyzing high-quality, production-grade open source projects. The end goal is a full web UI + backend. The current state is a working discovery backend that queries the GitHub Search API.

Python 3.12, managed with `uv`. Entry point is `main.py`.

## Commands

```bash
uv sync                   # install dependencies
uv run python main.py     # run the demo
uv add <package>          # add a dependency
```

## Architecture

```
src/discovery/
  models.py        # Pydantic models: SearchParams, RepoResult
  github_search.py # GitHub API client + search logic
  scoring.py       # Quality score computation
  __init__.py      # exports search_repos, SearchParams, RepoResult
main.py            # demo runner (rich table output)
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

- Web frontend (new chat/branch)
- Optional enrichment pass to fetch per-repo contributor counts
- Persistence layer to store and index discovered projects
