import { Box, Button, useTheme, useMediaQuery } from "@mui/material";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = Math.max(0, page - (isMobile ? 2 : 4));
  const end = Math.min(totalPages, start + (isMobile ? 5 : 10));

  return (
    <Box sx={{ 
      display: "flex", 
      gap: { xs: 0.5, sm: 1 }, 
      alignItems: "center", 
      mt: { xs: 1, sm: 2 },
      flexWrap: { xs: 'wrap', sm: 'nowrap' },
      justifyContent: 'center'
    }}>
      <Button 
        disabled={page === 0} 
        onClick={() => onChange(page - 1)}
        size={isMobile ? "small" : "medium"}
        sx={{ minWidth: { xs: 32, sm: 40 } }}
      >
        ⬅
      </Button>

      {Array.from({ length: end - start }, (_, i) => {
        const p = start + i;
        return (
          <Button
            key={p}
            size={isMobile ? "small" : "medium"}
            variant={p === page ? "contained" : "outlined"}
            onClick={() => onChange(p)}
            sx={{ 
              minWidth: { xs: 32, sm: 40 },
              px: { xs: 1, sm: 1.5 }
            }}
          >
            {p + 1}
          </Button>
        );
      })}

      <Button
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
        size={isMobile ? "small" : "medium"}
        sx={{ minWidth: { xs: 32, sm: 40 } }}
      >
        ➡
      </Button>
    </Box>
  );
}
