"""
DEPRECATED: This script is superseded by the manual curation workflow in the web UI.
Use the Search page to find repos and save them individually via POST /api/index.
This file is kept for reference only.

Populate the repos.db index by running search_repos() across predefined
SearchParams combos and upserting results.

Usage:
    uv run python scripts/indexer.py
    uv run python scripts/indexer.py --dry-run
    uv run python scripts/indexer.py --db-path /path/to/repos.db
"""

import argparse
import sys
import time
from datetime import date
from pathlib import Path

# allow imports from the project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table

load_dotenv()

from src.discovery.db import create_tables, get_engine
from src.discovery.github_search import search_repos
from src.discovery.models import SearchParams
from src.discovery.repository import upsert_repos

console = Console()

COMBOS: list[SearchParams] = []

# Group 1: broad sweeps (no language filter)
for stars in [1000, 5000, 10000]:
    for size_kb in [None, 50_000, 100_000]:
        COMBOS.append(SearchParams(min_stars=stars, min_size_kb=size_kb, limit=100))

# Group 2: per-language sweeps
for lang in ["python", "typescript", "go", "rust", "java", "c++", "ruby", "c"]:
    for stars in [1000, 5000]:
        COMBOS.append(SearchParams(language=lang, min_stars=stars, limit=100))

# Group 3: recency sweeps
for pushed in [date(2023, 1, 1), date(2024, 1, 1)]:
    COMBOS.append(SearchParams(min_stars=500, pushed_after=pushed, limit=100))


def _label(p: SearchParams) -> str:
    parts = []
    if p.language:
        parts.append(p.language)
    parts.append(f">={p.min_stars}★")
    if p.min_size_kb:
        parts.append(f">={p.min_size_kb//1000}MB")
    if p.pushed_after:
        parts.append(f"pushed>{p.pushed_after}")
    return " ".join(parts) or "all"


def run(dry_run: bool, db_path: str | None) -> None:
    if dry_run:
        console.print(f"[bold]Dry run — {len(COMBOS)} combos, no DB writes[/bold]\n")
        t = Table("#", "Combo")
        for i, p in enumerate(COMBOS, 1):
            t.add_row(str(i), _label(p))
        console.print(t)
        return

    engine = get_engine(db_path)
    create_tables(engine)

    summary = Table("#", "Combo", "Fetched", "Upserted")
    total_upserted = 0

    for i, params in enumerate(COMBOS, 1):
        label = _label(params)
        console.print(f"[{i}/{len(COMBOS)}] {label} … ", end="")
        try:
            repos = search_repos(params)
        except Exception as exc:
            console.print(f"[red]ERROR: {exc}[/red]")
            summary.add_row(str(i), label, "err", "err")
            continue

        fetched = len(repos)
        upserted = upsert_repos(repos, engine)
        total_upserted += upserted
        console.print(f"[green]{fetched} fetched, {upserted} upserted[/green]")
        summary.add_row(str(i), label, str(fetched), str(upserted))

        if i < len(COMBOS):
            time.sleep(2)

    console.print("\n")
    console.print(summary)
    console.print(f"\n[bold]Total upserted this run:[/bold] {total_upserted}")

    with engine.connect() as conn:
        from sqlalchemy import text
        total_db = conn.execute(text("SELECT COUNT(*) FROM repositories")).scalar()
    console.print(f"[bold]Total unique repos in DB:[/bold] {total_db}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Index repos into repos.db")
    parser.add_argument("--dry-run", action="store_true", help="Print combos without writing")
    parser.add_argument("--db-path", default=None, help="Path to SQLite DB file")
    args = parser.parse_args()
    run(dry_run=args.dry_run, db_path=args.db_path)


if __name__ == "__main__":
    main()
