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
        pushed_after=date(2024, 1, 1),
        limit=20,
    )

    console.print(f"[bold]Searching GitHub...[/bold] query={repr(params.model_dump(exclude_none=True))}\n")

    repos = search_repos(params)

    table = Table(show_header=True, header_style="bold cyan")
    table.add_column("#", style="dim", width=3)
    table.add_column("Repository", min_width=30)
    table.add_column("Stars", justify="right")
    table.add_column("Forks", justify="right")
    table.add_column("Language", width=12)
    table.add_column("Last Push", width=12)
    table.add_column("Score", justify="right", style="green")

    for i, repo in enumerate(repos, 1):
        table.add_row(
            str(i),
            repo.full_name,
            f"{repo.stars:,}",
            f"{repo.forks:,}",
            repo.language or "—",
            repo.pushed_at.strftime("%Y-%m-%d"),
            f"{repo.quality_score:.1f}",
        )

    console.print(table)
    console.print(f"\n[dim]Returned {len(repos)} results[/dim]")


if __name__ == "__main__":
    main()
