from fastapi import HTTPException
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handle_api_error(error: Exception) -> None:
    if isinstance(error, HTTPException):
        raise error
    elif isinstance(error, ValueError):
        logger.error(f"Data validation error: {str(error)}")
        raise HTTPException(status_code=400, detail=f"Invalid data: {str(error)}")
    else:
        logger.error(f"Unexpected error: {str(error)}")
        raise HTTPException(status_code=500, detail="Internal server error")