from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
def root() -> dict:
    return {"message": "event-horizon api", "docs": "/docs", "health": "/api/health"}


@router.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
