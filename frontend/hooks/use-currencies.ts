import { useQuery } from "react-query";

export function useCurrencies(base = 'usd') {
  return useQuery(['currencyapi', base], async () => {
    const res = await fetch(
      `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${base}.json`
    );
    return await res.json();
  });
}
