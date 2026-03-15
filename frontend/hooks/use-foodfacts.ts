import { useQuery } from "react-query";

export function useFoods(food = "pasta") {
  return useQuery(['foodfacts', food], async () => {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(food)}&json=1&page_size=6`
    );
    const data = await res.json();
    return data.products || [];
  });
}

