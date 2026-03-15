"""
Redis client for caching, sessions, rate limiting, and real-time features.
"""

import redis.asyncio as redis
from typing import Optional, Any, Union
import json
import pickle
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis_pool: Optional[redis.Redis] = None


async def init_redis():
    """Initialize Redis connection pool"""
    global _redis_pool
    _redis_pool = redis.from_url(
        str(settings.REDIS_URL),
        encoding="utf-8",
        decode_responses=True,
        max_connections=settings.REDIS_POOL_SIZE,
        socket_connect_timeout=5,
        socket_keepalive=True,
        health_check_interval=30,
    )
    # Test connection
    await _redis_pool.ping()
    logger.info("Redis connection established")


async def close_redis():
    """Close Redis connections"""
    global _redis_pool
    if _redis_pool:
        await _redis_pool.close()
        logger.info("Redis connection closed")


def get_redis() -> redis.Redis:
    """Get Redis client"""
    if _redis_pool is None:
        raise RuntimeError("Redis not initialized. Call init_redis() first.")
    return _redis_pool


class Cache:
    """High-level cache interface"""
    
    @staticmethod
    async def get(key: str) -> Optional[str]:
        """Get string value"""
        r = get_redis()
        return await r.get(key)
    
    @staticmethod
    async def get_json(key: str) -> Optional[Any]:
        """Get and parse JSON value"""
        value = await Cache.get(key)
        return json.loads(value) if value else None
    
    @staticmethod
    async def get_object(key: str) -> Optional[Any]:
        """Get pickled object"""
        r = get_redis()
        value = await r.get(key)
        return pickle.loads(value.encode()) if value else None
    
    @staticmethod
    async def set(
        key: str,
        value: Union[str, bytes, Any],
        ttl: int = None,
        serialize: str = "auto"  # auto, json, pickle, none
    ):
        """Set value with optional serialization"""
        r = get_redis()
        
        if serialize == "auto":
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
                serialize = "json"
            elif not isinstance(value, (str, bytes)):
                value = pickle.dumps(value)
                serialize = "pickle"
        
        elif serialize == "json":
            value = json.dumps(value)
        elif serialize == "pickle":
            value = pickle.dumps(value)
        
        await r.setex(key, ttl or settings.CACHE_TTL_MEDIUM, value)
    
    @staticmethod
    async def delete(key: str):
        """Delete key"""
        r = get_redis()
        await r.delete(key)
    
    @staticmethod
    async def exists(key: str) -> bool:
        """Check if key exists"""
        r = get_redis()
        return await r.exists(key) > 0
    
    @staticmethod
    async def increment(key: str, amount: int = 1) -> int:
        """Atomic increment"""
        r = get_redis()
        return await r.incrby(key, amount)
    
    @staticmethod
    async def expire(key: str, seconds: int):
        """Set expiration"""
        r = get_redis()
        await r.expire(key, seconds)
    
    @staticmethod
    async def acquire_lock(lock_name: str, timeout: int = 10) -> bool:
        """Distributed lock using Redis"""
        r = get_redis()
        lock_key = f"lock:{lock_name}"
        acquired = await r.set(lock_key, "1", nx=True, ex=timeout)
        return acquired
    
    @staticmethod
    async def release_lock(lock_name: str):
        """Release distributed lock"""
        r = get_redis()
        await r.delete(f"lock:{lock_name}")


class RateLimiter:
    """Rate limiting using Redis sliding window"""
    
    @staticmethod
    async def is_allowed(
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> tuple[bool, dict]:
        """
        Check if request is allowed.
        Returns: (allowed, metadata)
        """
        r = get_redis()
        now = await r.time()  # Get Redis server time
        current_time = now[0]
        window_start = current_time - window_seconds
        
        pipe = r.pipeline()
        
        # Remove old entries
        pipe.zremrangebyscore(key, 0, window_start)
        
        # Count current entries
        pipe.zcard(key)
        
        # Add current request
        pipe.zadd(key, {str(current_time): current_time})
        
        # Set expiry on the key
        pipe.expire(key, window_seconds)
        
        results = await pipe.execute()
        current_count = results[1]
        
        allowed = current_count <= max_requests
        remaining = max(0, max_requests - current_count)
        reset_time = current_time + window_seconds
        
        if not allowed:
            # Remove the request we just added
            await r.zrem(key, str(current_time))
        
        return allowed, {
            "limit": max_requests,
            "remaining": remaining,
            "reset": reset_time,
            "window": window_seconds
        }