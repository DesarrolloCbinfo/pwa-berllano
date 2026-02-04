import { Box, Button } from "@mui/material";

type Props = {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
};

export default function PaginationControls({
  page,
  total,
  pageSize,
  onChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = Math.max(0, page - 4);
  const end = Math.min(totalPages, start + 10);

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}>
      <Button disabled={page === 0} onClick={() => onChange(page - 1)}>
        ⬅
      </Button>

      {Array.from({ length: end - start }, (_, i) => {
        const p = start + i;
        return (
          <Button
            key={p}
            size="small"
            variant={p === page ? "contained" : "outlined"}
            onClick={() => onChange(p)}
          >
            {p + 1}
          </Button>
        );
      })}

      <Button
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        ➡
      </Button>
    </Box>
  );
}
