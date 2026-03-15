import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from app.core.config import settings

# Create logs directory
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

# Formatters
detailed_formatter = logging.Formatter(
    "%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s"
)

json_formatter = logging.Formatter(
    '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", '
    '"function": "%(funcName)s", "line": %(lineno)d, "message": "%(message)s"}'
)

# Handlers
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(detailed_formatter)

file_handler = RotatingFileHandler(
    LOG_DIR / "app.log",
    maxBytes=10_000_000,  # 10MB
    backupCount=10
)
file_handler.setFormatter(json_formatter)

error_handler = RotatingFileHandler(
    LOG_DIR / "error.log",
    maxBytes=10_000_000,
    backupCount=10
)
error_handler.setLevel(logging.ERROR)
error_handler.setFormatter(json_formatter)

# Configure root logger
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    handlers=[console_handler, file_handler, error_handler]
)

# Get logger function
def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)