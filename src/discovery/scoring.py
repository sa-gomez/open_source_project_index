import math
from datetime import datetime, timezone

from .models import RepoResult


def _log_scale(value: int) -> float:
    return math.log1p(max(value, 0))


def _recency_score(pushed_at: datetime) -> float:
    days_since = (datetime.now(timezone.utc) - pushed_at).days
    # Score decays: 100 at 0 days, ~50 at 180 days, ~0 at 730 days
    return max(0.0, 100.0 * math.exp(-days_since / 365))


def _completeness_score(repo: RepoResult) -> float:
    score = 0.0
    if repo.license_name:
        score += 40
    if repo.topics:
        score += 30
    if repo.homepage:
        score += 30
    return score


def _community_proxy(repo: RepoResult) -> float:
    if repo.stars == 0:
        return 0.0
    ratio = repo.forks / repo.stars
    # Healthy open-source projects tend to have forks/stars ratio ~0.1–0.4
    return min(ratio / 0.3, 1.0) * 100


def compute_raw_scores(repos: list[RepoResult]) -> list[dict]:
    raw = []
    for r in repos:
        raw.append({
            "stars": _log_scale(r.stars),
            "forks": _log_scale(r.forks),
            "recency": _recency_score(r.pushed_at),
            "community": _community_proxy(r),
            "completeness": _completeness_score(r),
        })
    return raw


def _normalize(values: list[float]) -> list[float]:
    max_v = max(values) if values else 1.0
    if max_v == 0:
        return [0.0] * len(values)
    return [v / max_v for v in values]


def score_repos(repos: list[RepoResult]) -> list[RepoResult]:
    if not repos:
        return repos

    raw = compute_raw_scores(repos)
    weights = {"stars": 0.35, "forks": 0.20, "recency": 0.20, "community": 0.10, "completeness": 0.15}

    normalized: dict[str, list[float]] = {}
    for key in weights:
        normalized[key] = _normalize([r[key] for r in raw])

    for i, repo in enumerate(repos):
        score = sum(weights[k] * normalized[k][i] * 100 for k in weights)
        repos[i] = repo.model_copy(update={"quality_score": round(score, 1)})

    return repos
