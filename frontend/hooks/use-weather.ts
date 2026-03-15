import { useQuery } from "react-query";

export function useWeather(lat: number, lon: number) {
  return useQuery(['openmeteo', lat, lon], async () => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const res = await fetch(url);
    return await res.json();
  });
}
