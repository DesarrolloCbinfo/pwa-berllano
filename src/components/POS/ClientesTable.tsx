import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
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
  validado?: string | boolean | null;
  fecha_ultima_visita?: string | null;
  no_visitas?: number | null;
  visitas?: number | null;
  num_visitas?: number | null;
  cant_visitas?: number | null;
  tarjeta?: string | null;
  fecha_asignacion?: string | null;
  [key: string]: any;
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
      <Box sx={{ overflowX: 'auto', maxHeight: 300 }}>
        <Table stickyHeader size={isMobile ? "small" : "small"}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 80, fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>No. Cliente</TableCell>
              <TableCell sx={{ minWidth: 200, fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Nombre Completo</TableCell>
              <TableCell sx={{ minWidth: 90, fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Validado</TableCell>
              <TableCell sx={{ minWidth: 120, fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Última Visita</TableCell>
              <TableCell sx={{ minWidth: 90, fontWeight: 'bold', backgroundColor: '#f5f5f5', textAlign: 'center' }}>Visitas</TableCell>
              <TableCell sx={{ minWidth: 120, fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Tarjeta</TableCell>
              <TableCell sx={{ minWidth: 120, fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>F. Asignación</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((c) => {
              const nombreCompleto = `${c.nombre || ''} ${c.ap_paterno || ''} ${c.ap_materno || ''}`.trim();

              return (
                <TableRow 
                  key={c.No_cliente} 
                  hover 
                  onClick={() => onSelect(c)}
                  sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { backgroundColor: 'action.hover' } 
                  }}
                >
                  <TableCell>{c.No_cliente}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap fontWeight="medium">
                      {nombreCompleto}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {c.validado === true || c.validado === '1' || c.validado === 1 ? 'Sí' : 'No'}
                  </TableCell>
                  <TableCell>
                    {c.fecha_ultima_visita ? new Date(c.fecha_ultima_visita).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {c.no_visitas ?? c.visitas ?? c.num_visitas ?? c.cant_visitas ?? 0}
                  </TableCell>
                  <TableCell>
                    {c.tarjeta
                      ? c.tarjeta.length > 4
                        ? `${'*'.repeat(c.tarjeta.length - 4)}${c.tarjeta.slice(-4)}`
                        : c.tarjeta
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {c.fecha_asignacion ? new Date(c.fecha_asignacion).toLocaleDateString() : '-'}
                  </TableCell>
                </TableRow>
              );
            })}

            {data.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={7} 
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Sin resultados. Escribe un nombre o RFC para buscar.
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