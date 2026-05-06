import os

from sqlalchemy import (
    Boolean,
    Column,
    Float,
    Index,
    Integer,
    MetaData,
    Table,
    Text,
    create_engine,
)
from sqlalchemy.engine import Engine

metadata = MetaData()

repositories = Table(
    "repositories",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("full_name", Text, nullable=False),
    Column("description", Text),
    Column("url", Text, nullable=False),
    Column("homepage", Text),
    Column("stars", Integer, nullable=False),
    Column("forks", Integer, nullable=False),
    Column("watchers", Integer, nullable=False),
    Column("open_issues", Integer, nullable=False),
    Column("size", Integer, nullable=False),
    Column("language", Text),
    Column("topics", Text, nullable=False),  # JSON array
    Column("license_name", Text),
    Column("has_issues", Boolean, nullable=False),
    Column("has_wiki", Boolean, nullable=False),
    Column("created_at", Text, nullable=False),
    Column("pushed_at", Text, nullable=False),
    Column("updated_at", Text, nullable=False),
    Column("quality_score", Float, nullable=False, server_default="0.0"),
    Column("indexed_at", Text, nullable=False),
    Index("idx_repos_language", "language"),
    Index("idx_repos_stars", "stars"),
    Index("idx_repos_pushed_at", "pushed_at"),
    Index("idx_repos_size", "size"),
    Index("idx_repos_quality_score", "quality_score"),
)

_engine: Engine | None = None


def get_engine(db_path: str | None = None) -> Engine:
    global _engine
    if _engine is None:
        path = db_path or os.environ.get("DB_PATH", "repos.db")
        _engine = create_engine(
            f"sqlite:///{path}",
            connect_args={"check_same_thread": False},
        )
    return _engine


def create_tables(engine: Engine) -> None:
    metadata.create_all(engine)
