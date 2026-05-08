import logging
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select, update
from sqlalchemy.engine import Engine

from .db import processing_jobs, repositories

logger = logging.getLogger(__name__)

SOURCE_EXTS = {".py", ".ts", ".js", ".tsx", ".jsx", ".go", ".rs", ".java", ".rb", ".cpp", ".c", ".md"}
SAMPLE_CHARS = 3000
CLONE_ROOT = Path("clones")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _find_sample_file(repo_path: Path) -> Path | None:
    for p in repo_path.rglob("README*"):
        if p.is_file():
            return p
    for p in repo_path.rglob("*"):
        if p.is_file() and p.suffix.lower() in SOURCE_EXTS:
            return p
    return None


def process_job(repo_id: int, full_name: str, url: str, engine: Engine) -> None:
    logger.info("processing %s", full_name)
    with engine.begin() as conn:
        conn.execute(
            update(processing_jobs)
            .where(processing_jobs.c.repo_id == repo_id)
            .values(status="processing", started_at=_now())
        )

    clone_path = CLONE_ROOT / full_name
    try:
        clone_path.parent.mkdir(parents=True, exist_ok=True)
        if not clone_path.exists():
            subprocess.run(
                ["git", "clone", "--depth=1", url, str(clone_path)],
                check=True,
                capture_output=True,
                timeout=120,
            )

        sample_file = _find_sample_file(clone_path)
        sample_text: str | None = None
        if sample_file:
            try:
                sample_text = sample_file.read_text(errors="replace")[:SAMPLE_CHARS]
            except Exception:
                pass

        now = _now()
        with engine.begin() as conn:
            conn.execute(
                update(repositories)
                .where(repositories.c.id == repo_id)
                .values(sample_text=sample_text, indexed_at=now)
            )
            conn.execute(
                update(processing_jobs)
                .where(processing_jobs.c.repo_id == repo_id)
                .values(status="done", completed_at=now)
            )
        logger.info("done processing %s", full_name)

    except Exception as e:
        logger.exception("failed processing %s", full_name)
        with engine.begin() as conn:
            conn.execute(
                update(processing_jobs)
                .where(processing_jobs.c.repo_id == repo_id)
                .values(status="failed", completed_at=_now(), error_msg=str(e))
            )


def run_worker(engine: Engine, poll_interval: int = 5) -> None:
    logger.info("worker started, polling every %ds", poll_interval)
    while True:
        try:
            with engine.connect() as conn:
                row = conn.execute(
                    select(
                        processing_jobs.c.repo_id,
                        repositories.c.full_name,
                        repositories.c.url,
                    )
                    .join(repositories, repositories.c.id == processing_jobs.c.repo_id)
                    .where(processing_jobs.c.status == "queued")
                    .limit(1)
                ).first()

            if row:
                process_job(row.repo_id, row.full_name, row.url, engine)
            else:
                time.sleep(poll_interval)
        except Exception:
            logger.exception("worker loop error")
            time.sleep(poll_interval)
