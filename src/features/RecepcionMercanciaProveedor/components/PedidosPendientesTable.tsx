import {
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import type { PedidoARecepcionar } from "../types/RecepcionMercanciaTypes";
import { colorEstatus } from "../utils/estatus";

interface Props {
  pedidos: PedidoARecepcionar[];
  cargando: boolean;
  folioSeleccionado: number | null;
  pageNumber: number;
  pageSize: number;
  totalRegistros: number;
  onSeleccionar: (pedido: PedidoARecepcionar) => void;
  onPageChange: (pageNumber: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function formatearFecha(valor: string) {
  if (!valor) return "-";
  const [fecha] = valor.split("T");
  if (!fecha) return valor;
  const [anio, mes, dia] = fecha.split("-");
  if (!anio || !mes || !dia) return valor;
  return `${dia}/${mes}/${anio}`;
}

export default function PedidosPendientesTable({
  pedidos,
  cargando,
  folioSeleccionado,
  pageNumber,
  pageSize,
  totalRegistros,
  onSeleccionar,
  onPageChange,
  onPageSizeChange,
}: Props) {
  return (
    <>
      <TableContainer
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
      >
        <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 600 }}>Folio</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Proveedor</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Estatus</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              Acción
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cargando && pedidos.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <CircularProgress size={24} />
              </TableCell>
            </TableRow>
          )}

          {!cargando && pedidos.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay pedidos pendientes de recepción.
                </Typography>
              </TableCell>
            </TableRow>
          )}

          {pedidos.map((pedido) => {
            const seleccionado = pedido.folio === folioSeleccionado;
            return (
              <TableRow
                key={pedido.folio}
                hover
                selected={seleccionado}
                onClick={() => onSeleccionar(pedido)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>
                  <Chip label={`#${pedido.folio}`} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{formatearFecha(pedido.fecha)}</TableCell>
                <TableCell sx={{ minWidth: 180 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {pedido.nombre_proveedor || pedido.clave_proveedor || "-"}
                  </Typography>
                  {pedido.clave_proveedor && (
                    <Typography variant="caption" color="text.secondary">
                      {pedido.clave_proveedor}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ minWidth: 160 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {pedido.nombre_usuario || pedido.clave_usuario || "-"}
                  </Typography>
                  {pedido.clave_usuario && (
                    <Typography variant="caption" color="text.secondary">
                      {pedido.clave_usuario}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={pedido.estatus || "Pendiente"}
                    size="small"
                    color={colorEstatus(pedido.estatus)}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant={seleccionado ? "contained" : "outlined"}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSeleccionar(pedido);
                    }}
                    sx={{ textTransform: "none" }}
                  >
                    {seleccionado ? "Seleccionado" : "Recepcionar"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalRegistros}
        page={Math.max(0, pageNumber - 1)}
        onPageChange={(_, nuevaPagina) => onPageChange(nuevaPagina + 1)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => onPageSizeChange(Number(event.target.value))}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        labelRowsPerPage="Filas por página"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </>
  );
}
