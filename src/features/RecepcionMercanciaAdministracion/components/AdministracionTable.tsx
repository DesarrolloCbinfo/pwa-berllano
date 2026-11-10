import {
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { RecepcionAdministracionRow } from "../types/RecepcionMercanciaAdministracionTypes";

interface Props {
  rows: RecepcionAdministracionRow[];
  cargando: boolean;
}

function formatearFecha(valor: string | null) {
  if (!valor) return "-";
  const [fecha] = valor.split("T");
  if (!fecha) return valor;
  const [anio, mes, dia] = fecha.split("-");
  if (!anio || !mes || !dia) return valor;
  return `${dia}/${mes}/${anio}`;
}

function formatoNumero(valor: number | null) {
  if (valor == null) return "-";
  return Number(valor).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function colorEstatus(estatus: string) {
  const valor = estatus.trim().toLowerCase();
  if (valor === "edicion") return "warning";
  if (valor === "aplicadas") return "success";
  if (valor === "finalizadas") return "default";
  return "info";
}

const columnas = [
  "Folio",
  "Fecha pedido",
  "Fecha recepción",
  "Clave",
  "Descripción",
  "Proveedor",
  "Cantidad",
  "Cant. admón.",
  "Diferencia",
  "Bonif. R",
  "Bonif. P",
  "Bonif. admin",
  "Costo sin IVA",
  "Costo total",
  "Costo factura",
  "Precio venta",
  "Estatus",
  "Factura",
  "Fecha factura",
  "Fecha registro",
  "Observaciones",
];

export default function AdministracionTable({ rows, cargando }: Props) {
  return (
    <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 1800 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            {columnas.map((columna) => (
              <TableCell key={columna} sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                {columna}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {cargando && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columnas.length} align="center" sx={{ py: 4 }}>
                <CircularProgress size={24} />
              </TableCell>
            </TableRow>
          )}

          {!cargando && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columnas.length} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay recepciones para los filtros seleccionados.
                </Typography>
              </TableCell>
            </TableRow>
          )}

          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{row.folio}</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>
                {formatearFecha(row.fecha_pedido)}
              </TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>
                {formatearFecha(row.fecha_recepcion)}
              </TableCell>
              <TableCell>
                <Chip label={row.clave_prod} size="small" variant="outlined" />
              </TableCell>
              <TableCell sx={{ maxWidth: 260 }}>{row.descripcion || "-"}</TableCell>
              <TableCell>{row.proveedor || "-"}</TableCell>
              <TableCell align="right">{row.cantidad}</TableCell>
              <TableCell align="right">{row.cantidad_administracion}</TableCell>
              <TableCell align="right">{row.diferencia}</TableCell>
              <TableCell align="right">{row.cantidad_bonificacion_r ?? "-"}</TableCell>
              <TableCell align="right">{row.cantidad_bonificacion_p ?? "-"}</TableCell>
              <TableCell align="right">
                {row.cantidad_bonificacion_admin ?? "-"}
              </TableCell>
              <TableCell align="right">{formatoNumero(row.costo_sin_iva)}</TableCell>
              <TableCell align="right">{formatoNumero(row.costo_total)}</TableCell>
              <TableCell align="right">{formatoNumero(row.costoFactura1)}</TableCell>
              <TableCell align="right">{formatoNumero(row.precioVenta)}</TableCell>
              <TableCell>
                <Chip
                  label={row.estatus || "Pendiente"}
                  size="small"
                  color={colorEstatus(row.estatus)}
                />
              </TableCell>
              <TableCell>{row.folio_docto || "-"}</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>
                {formatearFecha(row.fecha_factura)}
              </TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>
                {formatearFecha(row.fecha_registro)}
              </TableCell>
              <TableCell sx={{ maxWidth: 220 }}>
                {row.observaciones || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
