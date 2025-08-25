import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.transit import TransitRequest, TransitPreferences

client = TestClient(app)

@pytest.mark.asyncio
async def test_get_transit_routes():
    request = TransitRequest(
        start_location="40.7128,-74.0060",
        end_location="40.7484,-73.9857",
        preferences=TransitPreferences(
            max_time=60,
            max_cost=10.0,
            avoid_crowds=True,
            preferred_modes=["subway"]
        )
    )
    response = client.post("/transit/routes", json=request.dict())
    assert response.status_code == 200
    assert isinstance(response.json(), list)