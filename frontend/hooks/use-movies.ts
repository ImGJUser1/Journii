import { useQuery } from "react-query";

export function useMovies(query: string, apiKey: string) {
  return useQuery(['moviedb', query], async () => {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  });
}
