import os
from datetime import date

import httpx
from dotenv import load_dotenv

from .models import RepoResult, SearchParams
from .scoring import score_repos

load_dotenv()

_SEARCH_URL = "https://api.github.com/search/repositories"


def _build_query(params: SearchParams) -> str:
    parts: list[str] = []

    if params.query:
        parts.append(params.query)

    parts.append(f"stars:>={params.min_stars}")

    if params.language:
        parts.append(f"language:{params.language}")

    for topic in params.topics:
        parts.append(f"topic:{topic}")

    if params.pushed_after:
        parts.append(f"pushed:>={params.pushed_after.isoformat()}")

    return " ".join(parts)


def _parse_repo(item: dict) -> RepoResult:
    return RepoResult(
        id=item["id"],
        full_name=item["full_name"],
        description=item.get("description"),
        url=item["html_url"],
        homepage=item.get("homepage") or None,
        stars=item["stargazers_count"],
        forks=item["forks_count"],
        watchers=item["watchers_count"],
        open_issues=item["open_issues_count"],
        size=item["size"],
        language=item.get("language"),
        topics=item.get("topics", []),
        license_name=item["license"]["name"] if item.get("license") else None,
        has_issues=item["has_issues"],
        has_wiki=item["has_wiki"],
        created_at=item["created_at"],
        pushed_at=item["pushed_at"],
        updated_at=item["updated_at"],
    )


def search_repos(params: SearchParams) -> list[RepoResult]:
    token = os.getenv("GITHUB_TOKEN")
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    query = _build_query(params)
    response = httpx.get(
        _SEARCH_URL,
        headers=headers,
        params={"q": query, "sort": "stars", "order": "desc", "per_page": min(params.limit, 100)},
        timeout=15,
    )
    response.raise_for_status()

    items = response.json().get("items", [])
    repos = [_parse_repo(item) for item in items[: params.limit]]
    return score_repos(repos)
