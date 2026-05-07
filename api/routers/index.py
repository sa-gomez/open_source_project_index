from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.engine import Engine

from src.discovery.db import get_engine
from src.discovery.models import ProcessingJob, RepoResult
from src.discovery.repository import get_saved_ids, remove_repo, save_repo

router = APIRouter(prefix="/index")


def get_engine_dep() -> Engine:
    return get_engine()


@router.get("/ids")
def saved_ids(engine: Engine = Depends(get_engine_dep)) -> dict:
    ids = get_saved_ids(engine)
    return {"ids": list(ids)}


@router.post("", response_model=ProcessingJob, status_code=201)
def save(repo: RepoResult, engine: Engine = Depends(get_engine_dep)) -> ProcessingJob:
    try:
        return save_repo(repo, engine)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.delete("/{repo_id}", status_code=204)
def remove(repo_id: int, engine: Engine = Depends(get_engine_dep)) -> None:
    found = remove_repo(repo_id, engine)
    if not found:
        raise HTTPException(status_code=404, detail="Repo not found")
