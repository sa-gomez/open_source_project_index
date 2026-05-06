from datetime import date

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.engine import Engine

from src.discovery.db import get_engine
from src.discovery.models import RepoResult
from src.discovery.repository import browse_repos

router = APIRouter()


class BrowsePage(BaseModel):
    results: list[RepoResult]
    total: int
    limit: int
    offset: int


def get_engine_dep() -> Engine:
    return get_engine()


@router.get("/browse", response_model=BrowsePage)
def browse(
    language: str | None = Query(default=None),
    min_stars: int = Query(default=0, ge=0),
    min_size_kb: int | None = Query(default=None, ge=0),
    pushed_after: date | None = Query(default=None),
    topics: list[str] = Query(default=[]),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    engine: Engine = Depends(get_engine_dep),
) -> BrowsePage:
    repos, total = browse_repos(
        engine,
        language=language,
        min_stars=min_stars,
        min_size_kb=min_size_kb,
        pushed_after=pushed_after,
        topics=topics,
        limit=limit,
        offset=offset,
    )
    return BrowsePage(results=repos, total=total, limit=limit, offset=offset)
