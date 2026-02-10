// hooks/useServerTable.ts
import { useEffect, useState } from "react";

type FetchFn<T> = (params: {
  page: number;
  pageSize: number;
  search: string;
}) => Promise<{ data: T[]; total: number }>;

export function useServerTable<T>(fetchFn: FetchFn<T>, pageSize = 20) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(0); // MRT usa base 0
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  let active = true;
  setLoading(true);

  fetchFn({
    page: page + 1,
    pageSize,
    search: search || "%",
  })
    .then((res) => {
      if (!active) return;
      setData(res.data);
      setTotal(res.total);
    })
    .finally(() => active && setLoading(false));

  return () => {
    active = false;
  };
}, [page, pageSize, search]); // ✅

const setSearchSafe = (value: string) => {
 
  setSearch(value);
};

return {
  data,
  page,
  pageSize,
  total,
  loading,
  setPage,
  setSearch: setSearchSafe,
};

}
