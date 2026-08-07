"""Request middleware: demo scope routing + lightweight demo rate limiting."""
import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from src.auth.security import decode_token, JWT_SECRET, JWT_ALGORITHM, JWT_ISSUER
from src.database.demo import set_demo_scope
from src.core.config import settings


def _extract_is_demo(authorization: str | None) -> bool:
    if not authorization or not authorization.lower().startswith("bearer "):
        return False
    token = authorization.split(" ", 1)[1].strip()
    for expected_type in ("access", "refresh"):
        try:
            payload = decode_token(token, expected_type=expected_type)
            return bool(payload.get("is_demo", False))
        except Exception:
            continue
    return False


class DemoScopeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        is_demo = _extract_is_demo(request.headers.get("Authorization"))
        set_demo_scope(is_demo)
        try:
            response = await call_next(request)
        finally:
            set_demo_scope(False)
        return response


_requests: dict[str, deque] = defaultdict(deque)


class DemoRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        is_demo = _extract_is_demo(request.headers.get("Authorization"))
        if is_demo:
            key = request.client.host if request.client else "unknown"
            now = time.monotonic()
            window = deque((t for t in _requests[key] if t > now - 60), maxlen=settings.DEMO_RATE_LIMIT_PER_MINUTE)
            if len(window) >= settings.DEMO_RATE_LIMIT_PER_MINUTE:
                return JSONResponse(status_code=429, content={"detail": "Demo rate limit exceeded. Please try again later."})
            window.append(now)
            _requests[key] = window
        return await call_next(request)