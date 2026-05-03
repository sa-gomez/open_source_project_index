from datetime import date

from rich.console import Console
from rich.table import Table

from src.discovery import SearchParams, search_repos

console = Console()


def main():
    params = SearchParams(
        query="",
        language="python",
        min_stars=5000,
        min_size_kb=50_000,  # 50MB floor — filters out list/script repos at the API level
        pushed_after=date(2024, 1, 1),
        limit=20,
    )

    console.print(f"[bold]Searching GitHub...[/bold] query={repr(params.model_dump(exclude_none=True))}\n")

    repos = search_repos(params)

    table = Table(show_header=True, header_style="bold cyan", expand=False)
    table.add_column("#", style="dim", width=3)
    table.add_column("Repository", max_width=36, no_wrap=False)
    table.add_column("Stars", justify="right", width=8)
    table.add_column("Forks", justify="right", width=7)
    table.add_column("Lang", width=8)
    table.add_column("Last Push", width=11)
    table.add_column("Size", justify="right", width=7)
    table.add_column("Score", justify="right", width=6, style="green")

    for i, repo in enumerate(repos, 1):
        size_kb = repo.size
        if size_kb >= 1_000_000:
            size_str = f"{size_kb / 1_000_000:.1f}GB"
        elif size_kb >= 1_000:
            size_str = f"{size_kb / 1_000:.1f}MB"
        else:
            size_str = f"{size_kb}KB"

        table.add_row(
            str(i),
            repo.full_name,
            f"{repo.stars:,}",
            f"{repo.forks:,}",
            repo.language or "—",
            repo.pushed_at.strftime("%Y-%m-%d"),
            size_str,
            f"{repo.quality_score:.1f}",
        )

    console.print(table)
    console.print(f"\n[dim]Returned {len(repos)} results[/dim]")


if __name__ == "__main__":
    main()
