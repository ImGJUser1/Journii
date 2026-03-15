import redis.asyncio as aioredis
from app.core.config import settings
from typing import Optional

redis_client: Optional[aioredis.Redis] = None


async def init_redis():
    global redis_client
    redis_client = await aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True
    )


async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()


async def get_redis() -> aioredis.Redis:
    if not redis_client:
        await init_redis()
    return redis_client


# Cache decorators
async def cache_get(key: str) -> Optional[str]:
    r = await get_redis()
    return await r.get(key)


async def cache_set(key: str, value: str, expire: int = 300):
    r = await get_redis()
    await r.set(key, value, ex=expire)


async def cache_delete(key: str):
    r = await get_redis()
    await r.delete(key)


async def cache_exists(key: str) -> bool:
    r = await get_redis()
    return await r.exists(key) > 0