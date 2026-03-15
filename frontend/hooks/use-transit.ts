import { useQuery } from "react-query";

export function useTransitRoutes(city: string) {
  return useQuery(['transitland', city], async () => {
    const res = await fetch(
      `https://transit.land/api/v2/rest/routes?served_in=${city}`
    );
    return await res.json();
  });
}
