"""
Custom middleware for request processing, logging, and headers.
"""

import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.logging import get_logger

logger = get_logger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Add unique request ID to all requests for tracing.
    """
    
    async def dispatch(self, request: Request, call_next: Callable):
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id
        
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        
        # Add headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time:.3f}s"
        
        # Log request
        logger.info(
            f"Request {request_id} | {request.method} {request.url.path} | "
            f"{response.status_code} | {process_time:.3f}s"
        )
        
        return response


class RateLimitHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add rate limit headers to responses.
    """
    
    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)
        
        # Add rate limit info if available
        if hasattr(request.state, 'rate_limit'):
            metadata = request.state.rate_limit
            response.headers["X-RateLimit-Limit"] = str(metadata["limit"])
            response.headers["X-RateLimit-Remaining"] = str(metadata["remaining"])
            response.headers["X-RateLimit-Reset"] = str(metadata["reset"])
        
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses.
    """
    
    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), camera=(self), microphone=(self)"
        
        # Remove server identification
        response.headers.pop("Server", None)
        
        return response


class CORSMiddleware:
    """
    Custom CORS middleware if needed beyond FastAPI's built-in.
    Usually not needed - use FastAPI's add_middleware(CORSMiddleware).
    """
    pass