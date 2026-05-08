import logging
import threading
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.discovery.db import create_tables, get_engine, migrate_db
from src.discovery.worker import run_worker

from .routers.browse import router as browse_router
from .routers.index import router as index_router
from .routers.repo import router as repo_router
from .routers.search import router as search_router

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = get_engine()
    create_tables(engine)
    migrate_db(engine)
    threading.Thread(target=run_worker, args=(engine,), daemon=True).start()
    yield


app = FastAPI(title="Open Source Project Index API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

app.include_router(search_router)
app.include_router(browse_router)
app.include_router(index_router)
app.include_router(repo_router)
