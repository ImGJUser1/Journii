import { useQuery } from "react-query";

export function useFlights() {
  return useQuery(['opensky'], async () => {
    const res = await fetch('https://opensky-network.org/api/states/all');
    return await res.json();
  });
}
