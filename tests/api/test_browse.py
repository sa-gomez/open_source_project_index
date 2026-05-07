from unittest.mock import patch

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
        topics=["ml"],
        license_name="MIT",
        has_issues=True,
        has_wiki=True,
        created_at="2020-01-01T00:00:00Z",
        pushed_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        quality_score=75.0,
    )


def test_browse_returns_results(sample_repo: RepoResult) -> None:
    with patch("api.routers.browse.browse_repos", return_value=([sample_repo], 1)):
        response = client.get("/browse?language=python&min_stars=5000")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["limit"] == 20
    assert data["offset"] == 0
    assert len(data["results"]) == 1
    assert data["results"][0]["full_name"] == "org/repo"
    assert data["results"][0]["quality_score"] == 75.0


def test_browse_empty_db_returns_200_with_empty_results() -> None:
    with patch("api.routers.browse.browse_repos", return_value=([], 0)):
        response = client.get("/browse")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["results"] == []


def test_browse_pagination_params_passed_through() -> None:
    with patch("api.routers.browse.browse_repos", return_value=([], 0)) as mock:
        response = client.get("/browse?limit=10&offset=30")
    assert response.status_code == 200
    data = response.json()
    assert data["limit"] == 10
    assert data["offset"] == 30
    _, kwargs = mock.call_args
    assert kwargs["limit"] == 10
    assert kwargs["offset"] == 30


def test_browse_invalid_limit_too_high_returns_422() -> None:
    response = client.get("/browse?limit=999")
    assert response.status_code == 422


def test_browse_invalid_limit_zero_returns_422() -> None:
    response = client.get("/browse?limit=0")
    assert response.status_code == 422


def test_browse_negative_offset_returns_422() -> None:
    response = client.get("/browse?offset=-1")
    assert response.status_code == 422
