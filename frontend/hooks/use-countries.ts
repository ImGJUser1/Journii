import { useQuery } from "react-query";

export function useCountries() {
  return useQuery(['countries'], async () => {
    const res = await fetch('https://restcountries.com/v3.1/all');
    return await res.json();
  });
}
