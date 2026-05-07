from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel


class SearchParams(BaseModel):
    query: str = ""
    language: str | None = None
    topics: list[str] = []
    min_stars: int = 1000
    min_size_kb: int | None = None
    pushed_after: date | None = None
    limit: int = 20


class JobStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    done = "done"
    failed = "failed"


class ProcessingJob(BaseModel):
    id: int
    repo_id: int
    status: JobStatus
    queued_at: str
    started_at: str | None = None
    completed_at: str | None = None
    error_msg: str | None = None


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
    indexed_at: str | None = None
    job_status: JobStatus | None = None
