"""
Tests for media upload and processing.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_initiate_upload(client, auth_headers):
    """Test upload initiation."""
    response = await client.post(
        "/v1/media/upload/initiate",
        json={
            "filename": "test-video.mp4",
            "media_type": "video",
            "file_size_bytes": 1024 * 1024 * 10,  # 10MB
            "duration_seconds": 30.0,
            "width": 1920,
            "height": 1080
        },
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "media_id" in data["data"]
    assert "upload_url" in data["data"]


@pytest.mark.asyncio
async def test_upload_unauthorized(client):
    """Test upload without auth fails."""
    response = await client.post(
        "/v1/media/upload/initiate",
        json={
            "filename": "test.jpg",
            "media_type": "image",
            "file_size_bytes": 1024
        }
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_invalid_file_type(client, auth_headers):
    """Test upload with invalid file type."""
    response = await client.post(
        "/v1/media/upload/initiate",
        json={
            "filename": "test.exe",
            "media_type": "video",
            "file_size_bytes": 1024
        },
        headers=auth_headers
    )
    
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_feed(client, auth_headers):
    """Test feed retrieval."""
    response = await client.get(
        "/v1/media/reels/feed",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "items" in data["data"]