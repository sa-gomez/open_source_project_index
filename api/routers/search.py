import logging
from datetime import date

import httpx
from fastapi import APIRouter, HTTPException, Query

from src.discovery import RepoResult, SearchParams, search_repos

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/search", response_model=list[RepoResult])
def search(
    query: str = Query(default=""),
    language: str | None = Query(default=None),
    min_stars: int = Query(default=1000),
    min_size_kb: int | None = Query(default=None),
    pushed_after: date | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    topics: list[str] = Query(default=[]),
):
    params = SearchParams(
        query=query,
        language=language,
        min_stars=min_stars,
        min_size_kb=min_size_kb,
        pushed_after=pushed_after,
        limit=limit,
        topics=topics,
    )
    try:
        return search_repos(params)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="GitHub API timed out.")
    except httpx.HTTPStatusError as e:
        logger.error("GitHub API error %s: %s", e.response.status_code, e.response.text)
        raise HTTPException(status_code=502, detail="GitHub API returned an error.")
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Could not reach GitHub API.")
