import { useQuery } from "react-query";

export function usePlants(token: string) {
  return useQuery(['trefle', token], async () => {
    const res = await fetch(
      `https://trefle.io/api/v1/species?token=${token}&page_size=6`
    );
    const data = await res.json();
    return data.data || [];
  });
}
