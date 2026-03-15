import httpx
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import ExternalAPIException
from app.services.gemini_service import gemini_service

logger = get_logger(__name__)

class TransitService:
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.aclose()
    
    async def get_routes_from_google_maps(
        self,
        origin: Dict[str, float],
        destination: Dict[str, float],
        mode: str = "transit",
        alternatives: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Fetch routes from Google Maps Directions API
        """
        try:
            url = "https://maps.googleapis.com/maps/api/directions/json"
            
            params = {
                "origin": f"{origin['lat']},{origin['lng']}",
                "destination": f"{destination['lat']},{destination['lng']}",
                "mode": mode,
                "alternatives": "true" if alternatives else "false",
                "key": settings.GOOGLE_MAPS_API_KEY,
            }
            
            response = await self.http_client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("status") != "OK":
                logger.error(f"Google Maps API error: {data.get('status')}")
                return []
            
            routes = []
            for route in data.get("routes", []):
                parsed = self._parse_google_route(route)
                routes.append(parsed)
            
            return routes
            
        except httpx.HTTPError as e:
            logger.error(f"Google Maps API error: {str(e)}")
            raise ExternalAPIException("Google Maps", str(e))
    
    def _parse_google_route(self, route: Dict) -> Dict[str, Any]:
        """Parse Google Maps route into our format"""
        legs = route.get("legs", [{}])[0]
        
        steps = []
        for step in legs.get("steps", []):
            parsed_step = {
                "instruction": step.get("html_instructions", ""),
                "distance": step.get("distance", {}).get("text", ""),
                "distance_meters": step.get("distance", {}).get("value", 0),
                "duration": step.get("duration", {}).get("text", ""),
                "duration_seconds": step.get("duration", {}).get("value", 0),
                "mode": self._map_travel_mode(step.get("travel_mode", "")),
                "polyline": step.get("polyline", {}).get("points"),
            }
            
            # Add transit-specific details
            if "transit_details" in step:
                transit = step["transit_details"]
                parsed_step.update({
                    "departure_stop": transit.get("departure_stop", {}).get("name"),
                    "arrival_stop": transit.get("arrival_stop", {}).get("name"),
                    "line_name": transit.get("line", {}).get("short_name"),
                    "line_color": transit.get("line", {}).get("color"),
                    "vehicle_type": transit.get("line", {}).get("vehicle", {}).get("type"),
                    "num_stops": transit.get("num_stops"),
                    "departure_time": transit.get("departure_time", {}).get("text"),
                    "arrival_time": transit.get("arrival_time", {}).get("text"),
                })
            
            steps.append(parsed_step)
        
        return {
            "route_id": f"gm_{hash(route.get('summary', ''))}",
            "provider": "google_maps",
            "summary": route.get("summary", ""),
            "total_distance": legs.get("distance", {}).get("text", ""),
            "total_distance_meters": legs.get("distance", {}).get("value", 0),
            "total_duration": legs.get("duration", {}).get("text", ""),
            "total_duration_seconds": legs.get("duration", {}).get("value", 0),
            "start_address": legs.get("start_address", ""),
            "end_address": legs.get("end_address", ""),
            "steps": steps,
            "polyline": route.get("overview_polyline", {}).get("points"),
            "warnings": route.get("warnings", []),
        }
    
    def _map_travel_mode(self, mode: str) -> str:
        """Map Google travel mode to our modes"""
        mapping = {
            "TRANSIT": "transit",
            "BUS": "bus",
            "SUBWAY": "subway",
            "TRAIN": "train",
            "WALKING": "walk",
            "DRIVING": "car",
            "BICYCLING": "bike",
        }
        return mapping.get(mode, mode.lower())
    
    async def get_routes_from_mapbox(
        self,
        origin: Dict[str, float],
        destination: Dict[str, float],
        profile: str = "mapbox/walking"
    ) -> List[Dict[str, Any]]:
        """
        Fetch routes from Mapbox Directions API (for walking/cycling)
        """
        if not settings.MAPBOX_TOKEN:
            return []
        
        try:
            url = f"https://api.mapbox.com/directions/v5/{profile}/{origin['lng']},{origin['lat']};{destination['lng']},{destination['lat']}"
            
            params = {
                "access_token": settings.MAPBOX_TOKEN,
                "geometries": "geojson",
                "overview": "full",
                "alternatives": "true",
            }
            
            response = await self.http_client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            routes = []
            
            for route in data.get("routes", []):
                parsed = {
                    "route_id": f"mb_{route.get('weight_name', 'default')}_{hash(str(route.get('geometry')))}",
                    "provider": "mapbox",
                    "summary": f"{profile.replace('mapbox/', '').title()} route",
                    "total_distance": f"{route.get('distance', 0) / 1000:.1f} km",
                    "total_distance_meters": route.get("distance", 0),
                    "total_duration": f"{route.get('duration', 0) / 60:.0f} min",
                    "total_duration_seconds": route.get("duration", 0),
                    "steps": self._parse_mapbox_steps(route.get("legs", [{}])[0].get("steps", [])),
                    "geometry": route.get("geometry"),
                }
                routes.append(parsed)
            
            return routes
            
        except httpx.HTTPError as e:
            logger.error(f"Mapbox API error: {str(e)}")
            return []  # Fail silently for optional service
    
    def _parse_mapbox_steps(self, steps: List[Dict]) -> List[Dict]:
        """Parse Mapbox steps"""
        parsed = []
        for step in steps:
            parsed.append({
                "instruction": step.get("maneuver", {}).get("instruction", ""),
                "distance": f"{step.get('distance', 0)} m",
                "distance_meters": step.get("distance", 0),
                "duration": f"{step.get('duration', 0) / 60:.0f} min",
                "duration_seconds": step.get("duration", 0),
                "mode": step.get("mode", "walk"),
            })
        return parsed
    
    async def get_optimized_routes(
        self,
        origin: Dict[str, float],
        destination: Dict[str, float],
        preferences: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Get optimized routes combining multiple sources and AI analysis
        """
        # Fetch from multiple sources in parallel
        tasks = [
            self.get_routes_from_google_maps(origin, destination, "transit"),
            self.get_routes_from_google_maps(origin, destination, "walking", alternatives=False),
        ]
        
        if settings.MAPBOX_TOKEN:
            tasks.append(self.get_routes_from_mapbox(origin, destination, "mapbox/walking"))
            tasks.append(self.get_routes_from_mapbox(origin, destination, "mapbox/cycling"))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_routes = []
        for result in results:
            if isinstance(result, list):
                all_routes.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Route provider failed: {result}")
        
        if not all_routes:
            raise ExternalAPIException("Transit", "No routes available from any provider")
        
        # Enhance with AI analysis
        try:
            ai_analysis = await gemini_service.analyze_transit_options(
                origin=f"{origin['lat']},{origin['lng']}",
                destination=f"{destination['lat']},{destination['lng']}",
                available_routes=all_routes,
                preferences=preferences
            )
            
            # Merge AI analysis with routes
            for route in all_routes:
                analysis = next(
                    (a for a in ai_analysis.get("analyzed_routes", []) if a.get("route_id") == route["route_id"]),
                    None
                )
                if analysis:
                    route["ai_score"] = analysis.get("ai_recommendation_score", 50)
                    route["ai_reason"] = analysis.get("recommendation_reason", "")
                    route["highlights"] = analysis.get("highlights", [])
                    route["warnings"] = analysis.get("warnings", [])
                    route["cultural_sights"] = analysis.get("cultural_sights", [])
                    route["local_tips"] = analysis.get("local_tips", "")
                    route["crowd_forecast"] = analysis.get("crowd_forecast", "unknown")
                else:
                    route["ai_score"] = 50
            
            # Sort by AI score
            all_routes.sort(key=lambda x: x["ai_score"], reverse=True)
            
        except Exception as e:
            logger.warning(f"AI analysis failed, using basic routing: {e}")
        
        return all_routes[:5]  # Return top 5 routes

transit_service = TransitService()