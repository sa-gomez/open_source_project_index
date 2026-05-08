import json
from datetime import date, datetime, timezone

from sqlalchemy import and_, delete, func, select
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.engine import Engine

from .db import processing_jobs, repositories
from .models import JobStatus, ProcessingJob, RepoResult


def upsert_repos(repos: list[RepoResult], engine: Engine) -> int:
    if not repos:
        return 0
    now = datetime.now(timezone.utc).isoformat()
    rows = [
        {
            "id": r.id,
            "full_name": r.full_name,
            "description": r.description,
            "url": r.url,
            "homepage": r.homepage,
            "stars": r.stars,
            "forks": r.forks,
            "watchers": r.watchers,
            "open_issues": r.open_issues,
            "size": r.size,
            "language": r.language,
            "topics": json.dumps(r.topics),
            "license_name": r.license_name,
            "has_issues": r.has_issues,
            "has_wiki": r.has_wiki,
            "created_at": r.created_at.isoformat(),
            "pushed_at": r.pushed_at.isoformat(),
            "updated_at": r.updated_at.isoformat(),
            "quality_score": r.quality_score,
            "indexed_at": now,
        }
        for r in repos
    ]
    stmt = insert(repositories).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["id"],
        set_={
            c.key: stmt.excluded[c.key]
            for c in repositories.c
            if c.key != "id"
        },
    )
    with engine.begin() as conn:
        result = conn.execute(stmt)
    return result.rowcount


def save_repo(repo: RepoResult, engine: Engine) -> ProcessingJob:
    now = datetime.now(timezone.utc).isoformat()
    with engine.begin() as conn:
        existing = conn.execute(
            select(processing_jobs).where(processing_jobs.c.repo_id == repo.id)
        ).first()
        if existing is not None:
            raise ValueError(f"Repo {repo.id} already has a processing job")

        repo_row = {
            "id": repo.id,
            "full_name": repo.full_name,
            "description": repo.description,
            "url": repo.url,
            "homepage": repo.homepage,
            "stars": repo.stars,
            "forks": repo.forks,
            "watchers": repo.watchers,
            "open_issues": repo.open_issues,
            "size": repo.size,
            "language": repo.language,
            "topics": json.dumps(repo.topics),
            "license_name": repo.license_name,
            "has_issues": repo.has_issues,
            "has_wiki": repo.has_wiki,
            "created_at": repo.created_at.isoformat(),
            "pushed_at": repo.pushed_at.isoformat(),
            "updated_at": repo.updated_at.isoformat(),
            "quality_score": repo.quality_score,
            "indexed_at": None,
        }
        repo_stmt = insert(repositories).values([repo_row])
        repo_stmt = repo_stmt.on_conflict_do_update(
            index_elements=["id"],
            set_={c.key: repo_stmt.excluded[c.key] for c in repositories.c if c.key != "id"},
        )
        conn.execute(repo_stmt)

        job_result = conn.execute(
            insert(processing_jobs).values(
                repo_id=repo.id,
                status="queued",
                queued_at=now,
            )
        )
        job_id = job_result.lastrowid

    return ProcessingJob(
        id=job_id,
        repo_id=repo.id,
        status=JobStatus.queued,
        queued_at=now,
    )


def get_saved_ids(engine: Engine) -> set[int]:
    with engine.connect() as conn:
        rows = conn.execute(select(repositories.c.id)).all()
    return {row[0] for row in rows}


def remove_repo(repo_id: int, engine: Engine) -> bool:
    with engine.begin() as conn:
        conn.execute(delete(processing_jobs).where(processing_jobs.c.repo_id == repo_id))
        result = conn.execute(delete(repositories).where(repositories.c.id == repo_id))
    return result.rowcount > 0


def get_repo_by_id(repo_id: int, engine: Engine) -> RepoResult | None:
    j = repositories.outerjoin(processing_jobs, repositories.c.id == processing_jobs.c.repo_id)
    stmt = (
        select(repositories, processing_jobs.c.status.label("job_status"))
        .select_from(j)
        .where(repositories.c.id == repo_id)
    )
    with engine.connect() as conn:
        row = conn.execute(stmt).mappings().first()
    if row is None:
        return None
    return RepoResult(
        id=row["id"],
        full_name=row["full_name"],
        description=row["description"],
        url=row["url"],
        homepage=row["homepage"],
        stars=row["stars"],
        forks=row["forks"],
        watchers=row["watchers"],
        open_issues=row["open_issues"],
        size=row["size"],
        language=row["language"],
        topics=json.loads(row["topics"]),
        license_name=row["license_name"],
        has_issues=bool(row["has_issues"]),
        has_wiki=bool(row["has_wiki"]),
        created_at=row["created_at"],
        pushed_at=row["pushed_at"],
        updated_at=row["updated_at"],
        quality_score=row["quality_score"],
        indexed_at=row["indexed_at"],
        job_status=row["job_status"],
    )


def browse_repos(
    engine: Engine,
    *,
    language: str | None = None,
    min_stars: int = 0,
    min_size_kb: int | None = None,
    pushed_after: date | None = None,
    topics: list[str] | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[RepoResult], int]:
    conditions = []
    if language:
        conditions.append(func.lower(repositories.c.language) == language.lower())
    if min_stars:
        conditions.append(repositories.c.stars >= min_stars)
    if min_size_kb is not None:
        conditions.append(repositories.c.size >= min_size_kb)
    if pushed_after is not None:
        conditions.append(repositories.c.pushed_at >= pushed_after.isoformat())
    for topic in (topics or []):
        conditions.append(repositories.c.topics.contains(f'"{topic}"'))

    where_clause = and_(*conditions) if conditions else True

    j = repositories.outerjoin(processing_jobs, repositories.c.id == processing_jobs.c.repo_id)

    with engine.connect() as conn:
        count_stmt = select(func.count()).select_from(repositories).where(where_clause)
        total = conn.execute(count_stmt).scalar_one()

        rows_stmt = (
            select(repositories, processing_jobs.c.status.label("job_status"))
            .select_from(j)
            .where(where_clause)
            .order_by(repositories.c.quality_score.desc())
            .limit(limit)
            .offset(offset)
        )
        rows = conn.execute(rows_stmt).mappings().all()

    results = [
        RepoResult(
            id=row["id"],
            full_name=row["full_name"],
            description=row["description"],
            url=row["url"],
            homepage=row["homepage"],
            stars=row["stars"],
            forks=row["forks"],
            watchers=row["watchers"],
            open_issues=row["open_issues"],
            size=row["size"],
            language=row["language"],
            topics=json.loads(row["topics"]),
            license_name=row["license_name"],
            has_issues=bool(row["has_issues"]),
            has_wiki=bool(row["has_wiki"]),
            created_at=row["created_at"],
            pushed_at=row["pushed_at"],
            updated_at=row["updated_at"],
            quality_score=row["quality_score"],
            indexed_at=row["indexed_at"],
            job_status=row["job_status"],
        )
        for row in rows
    ]
    return results, total
