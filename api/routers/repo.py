from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.engine import Engine

from src.discovery.db import get_engine
from src.discovery.models import RepoResult
from src.discovery.repository import get_repo_by_id

router = APIRouter()


def get_engine_dep() -> Engine:
    return get_engine()


@router.get("/repos/{repo_id}", response_model=RepoResult)
def get_repo(repo_id: int, engine: Engine = Depends(get_engine_dep)) -> RepoResult:
    repo = get_repo_by_id(repo_id, engine)
    if repo is None:
        raise HTTPException(status_code=404, detail="Repo not found")
    return repo
