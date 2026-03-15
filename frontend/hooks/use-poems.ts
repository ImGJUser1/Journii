import { useQuery } from "react-query";

export function usePoems(count = 3) {
  return useQuery(['poetrydb', count], async () => {
    const res = await fetch(`https://poetrydb.org/random/${count}`);
    return await res.json();
  });
}
