from fastapi import HTTPException, status
from typing import Any, Dict, Optional, List


class JourniiException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str = None,
        extra_data: Dict[str, Any] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.extra_data = extra_data or {}


class NotFoundException(JourniiException):
    def __init__(self, resource: str, identifier: Any = None):
        detail = f"{resource} not found"
        if identifier:
            detail += f" with identifier: {identifier}"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="NOT_FOUND"
        )


class ValidationException(JourniiException):
    def __init__(self, detail: str, field_errors: Dict[str, List[str]] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_ERROR",
            extra_data={"field_errors": field_errors} if field_errors else None
        )


class AuthenticationException(JourniiException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTHENTICATION_FAILED"
        )


class AuthorizationException(JourniiException):
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="AUTHORIZATION_FAILED"
        )


class RateLimitException(JourniiException):
    def __init__(self, retry_after: int = 60):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
            error_code="RATE_LIMIT_EXCEEDED",
            extra_data={"retry_after": retry_after}
        )


class ExternalAPIException(JourniiException):
    def __init__(self, service: str, detail: str = None):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail or f"Error communicating with {service}",
            error_code="EXTERNAL_API_ERROR",
            extra_data={"service": service}
        )


class AIProcessingException(JourniiException):
    def __init__(self, detail: str = "AI processing failed"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="AI_PROCESSING_ERROR"
        )