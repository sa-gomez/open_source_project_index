import math
from datetime import datetime, timezone

from .models import RepoResult


def _log_scale(value: int) -> float:
    return math.log1p(max(value, 0))


def _recency_score(pushed_at: datetime) -> float:
    days_since = (datetime.now(timezone.utc) - pushed_at).days
    return max(0.0, 100.0 * math.exp(-days_since / 365))


def _size_score(size_kb: int) -> float:
    # Sigmoid centered at 100MB (100_000 KB), steep enough that:
    #   5MB  → ~2,  50MB → ~27,  100MB → 50,  300MB → ~88,  1GB+ → ~99
    center = 100_000
    scale = 40_000
    return 100 / (1 + math.exp(-(size_kb - center) / scale))


def _completeness_score(repo: RepoResult) -> float:
    score = 0.0
    if repo.license_name:
        score += 34
    if repo.topics:
        score += 33
    if repo.homepage:
        score += 33
    return score


def _issues_score(open_issues: int) -> float:
    # Log-scaled; rewards an active issue tracker without over-rewarding bug-ridden repos
    return min(_log_scale(open_issues) / _log_scale(1_000) * 100, 100)


def _community_proxy(repo: RepoResult) -> float:
    if repo.stars == 0:
        return 0.0
    ratio = repo.forks / repo.stars
    return min(ratio / 0.3, 1.0) * 100


def compute_raw_scores(repos: list[RepoResult]) -> list[dict]:
    return [
        {
            "stars": _log_scale(r.stars),
            "forks": _log_scale(r.forks),
            "recency": _recency_score(r.pushed_at),
            "community": _community_proxy(r),
            "completeness": _completeness_score(r),
            "size": _size_score(r.size),
            "issues": _issues_score(r.open_issues),
        }
        for r in repos
    ]


def _normalize(values: list[float]) -> list[float]:
    max_v = max(values) if values else 1.0
    if max_v == 0:
        return [0.0] * len(values)
    return [v / max_v for v in values]


def score_repos(repos: list[RepoResult]) -> list[RepoResult]:
    if not repos:
        return repos

    raw = compute_raw_scores(repos)
    weights = {
        "size":         0.30,
        "completeness": 0.20,
        "forks":        0.15,
        "recency":      0.15,
        "issues":       0.10,
        "stars":        0.05,
        "community":    0.05,
    }

    normalized: dict[str, list[float]] = {
        key: _normalize([r[key] for r in raw]) for key in weights
    }

    for i, repo in enumerate(repos):
        score = sum(weights[k] * normalized[k][i] * 100 for k in weights)
        repos[i] = repo.model_copy(update={"quality_score": round(score, 1)})

    return repos
