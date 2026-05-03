from unittest.mock import MagicMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient

from api.main import app
from src.discovery.models import RepoResult

client = TestClient(app)


@pytest.fixture
def sample_repo() -> RepoResult:
    return RepoResult(
        id=1,
        full_name="org/repo",
        description="A test repo",
        url="https://github.com/org/repo",
        homepage=None,
        stars=5000,
        forks=200,
        watchers=5000,
        open_issues=10,
        size=100000,
        language="Python",
        topics=[],
        license_name="MIT",
        has_issues=True,
        has_wiki=True,
        created_at="2020-01-01T00:00:00Z",
        pushed_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        quality_score=75.0,
    )


def test_search_returns_results(sample_repo: RepoResult) -> None:
    with patch("api.routers.search.search_repos", return_value=[sample_repo]):
        response = client.get("/search?language=python&min_stars=5000")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["full_name"] == "org/repo"
    assert data[0]["quality_score"] == 75.0


def test_search_returns_empty_list() -> None:
    with patch("api.routers.search.search_repos", return_value=[]):
        response = client.get("/search")
    assert response.status_code == 200
    assert response.json() == []


def test_search_github_http_error_returns_502() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 403
    mock_response.text = "rate limited"
    error = httpx.HTTPStatusError("403", request=MagicMock(), response=mock_response)
    with patch("api.routers.search.search_repos", side_effect=error):
        response = client.get("/search")
    assert response.status_code == 502


def test_search_timeout_returns_504() -> None:
    with patch(
        "api.routers.search.search_repos",
        side_effect=httpx.TimeoutException("timeout"),
    ):
        response = client.get("/search")
    assert response.status_code == 504


def test_search_invalid_limit_too_high_returns_422() -> None:
    response = client.get("/search?limit=999")
    assert response.status_code == 422


def test_search_invalid_limit_zero_returns_422() -> None:
    response = client.get("/search?limit=0")
    assert response.status_code == 422
