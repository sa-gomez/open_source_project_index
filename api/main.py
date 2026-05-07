from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.discovery.db import create_tables, get_engine

from .routers.browse import router as browse_router
from .routers.index import router as index_router
from .routers.search import router as search_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables(get_engine())
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
