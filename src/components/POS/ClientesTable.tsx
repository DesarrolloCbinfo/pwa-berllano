import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";

type Cliente = {
  No_cliente: string;
  nombre: string;
  ap_paterno?: string | null;
  ap_materno?: string | null;
};

type Props = {
  data: Cliente[];
  onSelect: (cliente: Cliente) => void;
};

export default function ClientesTable({ data, onSelect }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Clave</TableCell>
              <TableCell sx={{ minWidth: { xs: 120, sm: 200 } }}>Nombre</TableCell>
              {!isMobile && (
                <>
                  <TableCell sx={{ minWidth: 150 }}>Paterno</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Materno</TableCell>
                </>
              )}
              <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }} align="center">
                Acción
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((c) => (
              <TableRow key={c.No_cliente} hover>
                <TableCell>{c.No_cliente}</TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {c.nombre}
                  </Typography>
                </TableCell>
                {!isMobile && (
                  <>
                    <TableCell>{c.ap_paterno}</TableCell>
                    <TableCell>{c.ap_materno}</TableCell>
                  </>
                )}
                <TableCell align="center">
                  <Button
                    size={isMobile ? "small" : "medium"}
                    variant="contained"
                    onClick={() => onSelect(c)}
                    sx={{ minWidth: { xs: 60, sm: 80 } }}
                  >
                    {isMobile ? "✓" : "Seleccionar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {data.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={isMobile ? 3 : 5} 
                  align="center"
                  sx={{ py: { xs: 2, sm: 3 } }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Sin resultados
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
