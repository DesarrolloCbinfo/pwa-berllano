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

type Producto = {
  clave_prod: string;
  descripcion: string;
  Precio?:number;
  costo_unitario?: number;
  tasa_iva?: number;
  total_registros?: number;
};

type Props = {
  data: Producto[];
  onSelect: (producto: Producto) => void;
};

export default function ProductosTable({ data, onSelect }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Clave</TableCell>
              <TableCell sx={{ minWidth: { xs: 150, sm: 250 } }}>Descripcion</TableCell>
              <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Precio</TableCell>
              <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }} align="center">
                Acción
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((c) => (
              <TableRow key={c.clave_prod} hover>
                <TableCell>{c.clave_prod}</TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {c.descripcion}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    ${c.Precio?.toFixed(2) || '0.00'}
                  </Typography>
                </TableCell>
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
                  colSpan={4} 
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
