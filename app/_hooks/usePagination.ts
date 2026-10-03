import { useRouter, useSearchParams } from "next/navigation";

export function usePagination(defaultLimit = 20) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const limit = defaultLimit;
  const offset = (page - 1) * limit;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`, { scroll: true });
  };

  return { page, limit, offset, handlePageChange };
}
