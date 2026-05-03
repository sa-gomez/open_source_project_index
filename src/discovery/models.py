from datetime import date, datetime
from pydantic import BaseModel


class SearchParams(BaseModel):
    query: str = ""
    language: str | None = None
    topics: list[str] = []
    min_stars: int = 1000
    min_size_kb: int | None = None
    pushed_after: date | None = None
    limit: int = 20


class RepoResult(BaseModel):
    id: int
    full_name: str
    description: str | None
    url: str
    homepage: str | None

    stars: int
    forks: int
    watchers: int
    open_issues: int
    size: int

    language: str | None
    topics: list[str]
    license_name: str | None
    has_issues: bool
    has_wiki: bool

    created_at: datetime
    pushed_at: datetime
    updated_at: datetime

    quality_score: float = 0.0
