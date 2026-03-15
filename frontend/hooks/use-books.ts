import { useQuery } from "react-query";

export function useBooks(query: string) {
  return useQuery(['openlibrary', query], async () => {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6`
    );
    const data = await res.json();
    return (data.docs || []).map((book: any) => ({
      title: book.title,
      author: book.author_name?.[0],
      year: book.first_publish_year,
      cover: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : undefined,
    }));
  });
}
