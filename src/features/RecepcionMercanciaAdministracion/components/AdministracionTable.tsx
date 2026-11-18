import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { RecepcionAdministracionRow } from "../types/RecepcionMercanciaAdministracionTypes";

export interface AdministracionTableHandle {
  getDatosEditados: () => RecepcionAdministracionRow[];
}

interface Props {
  rows: RecepcionAdministracionRow[];
  cargando: boolean;
  onGuardar?: (datosEditados: RecepcionAdministracionRow[]) => void;
  onFinalizar?: () => void;
  deshabilitarBotones?: boolean;
}

const VERDE_EDITABLE = "#c8e6c9";
const VERDE_FOCUS = "#a5d6a7";
const AMARILLO_EDITABLE = "#fff59d";
const AMARILLO_FOCUS = "#fff176";

const BORDE_CELDA = {
  borderRight: "1px solid",
  borderBottom: "1px solid",
  borderColor: "divider",
} as const;

function formatearFecha(valor: string | null) {
  if (!valor) return "-";
  const [fecha] = valor.split("T");
  if (!fecha) return valor;
  const [anio, mes, dia] = fecha.split("-");
  if (!anio || !mes || !dia) return valor;
  return `${dia}/${mes}/${anio}`;
}

function formatoNumero(valor: number | null | undefined) {
  if (valor == null) return "-";
  return Number(valor).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatoMoneda(valor: number | null | undefined) {
  if (valor == null) return "-";
  return Number(valor).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function colorEstatus(estatus: string) {
  const valor = estatus.trim().toLowerCase();
  if (valor === "edicion") return "warning";
  if (valor === "aplicadas") return "success";
  if (valor === "finalizadas") return "default";
  return "info";
}

const CELDA_NUMERICA = {
  ...BORDE_CELDA,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
} as const;

interface HeaderCeldaProps {
  texto: string;
  titulo: string;
  left?: number;
  align?: "left" | "right" | "center";
}

function HeaderCelda({ texto, titulo, left, align = "left" }: HeaderCeldaProps) {
  const esStickyIzquierda = left != null;
  return (
    <TableCell
      align={align}
      sx={{
        ...BORDE_CELDA,
        borderTop: "1px solid",
        fontWeight: 700,
        bgcolor: "grey.100",
        whiteSpace: "normal",
        lineHeight: 1.2,
        py: 1,
        px: 1,
        position: "sticky",
        top: 0,
        left: esStickyIzquierda ? left : undefined,
        zIndex: esStickyIzquierda ? 4 : 3,
      }}
    >
      <Tooltip title={titulo} placement="top" arrow>
        <span>{texto}</span>
      </Tooltip>
    </TableCell>
  );
}

interface CeldaNumeroProps {
  valor: number | null | undefined;
  alCambiar: (valor: number | null) => void;
  deshabilitado: boolean;
  ancho: number;
  color?: string;
  colorFocus?: string;
  placeholder?: string;
}

function CeldaNumero({
  valor,
  alCambiar,
  deshabilitado,
  ancho,
  color,
  colorFocus,
  placeholder,
}: CeldaNumeroProps) {
  return (
    <TableCell
      align="right"
      sx={{
        ...BORDE_CELDA,
        p: 0,
        minWidth: ancho,
        ...(color
          ? { bgcolor: color, "&:focus-within": { bgcolor: colorFocus } }
          : {}),
      }}
    >
      <TextField
        variant="standard"
        size="small"
        type="number"
        fullWidth
        value={valor ?? ""}
        placeholder={placeholder}
        onChange={(event) => {
          const raw = event.target.value;
          alCambiar(raw === "" ? null : Number(raw));
        }}
        disabled={deshabilitado}
        inputProps={{
          min: 0,
          step: "any",
          style: { textAlign: "right", fontVariantNumeric: "tabular-nums" },
        }}
        sx={{ "& .MuiInputBase-root": { px: 1, py: 0.25 } }}
      />
    </TableCell>
  );
}

const AdministracionTable = forwardRef<AdministracionTableHandle, Props>(
  function AdministracionTable(
    { rows, cargando, deshabilitarBotones = false },
    ref
  ) {
    const [filas, setFilas] = useState<RecepcionAdministracionRow[]>(rows);

    useEffect(() => {
      setFilas(rows);
    }, [rows]);

    useImperativeHandle(
      ref,
      () => ({
        getDatosEditados: () => filas,
      }),
      [filas]
    );

    const bloqueado = rows.some(
      (row) =>
        row.administracion_terminada === true ||
        row.administracion_terminada === 1
    );

    const inputsDeshabilitados =
      bloqueado || deshabilitarBotones || cargando;

    const actualizarCampo = (
      id: number,
      campo: keyof RecepcionAdministracionRow,
      valor: string | number | boolean | null
    ) => {
      setFilas((prev) =>
        prev.map((fila) => {
          if (fila.id !== id) return fila;
          return {
            ...fila,
            [campo]: valor,
          } as RecepcionAdministracionRow;
        })
      );
    };

    return (
      <Box>
        {bloqueado && (
          <Alert
            severity="info"
            sx={{ mb: 2, fontWeight: 700, letterSpacing: "0.04em" }}
          >
            [ FOLIO FINALIZADO - SÓLO LECTURA ]
          </Alert>
        )}

        <TableContainer
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            overflow: "auto",
            maxHeight: 560,
          }}
        >
          <Table
            size="small"
            sx={{ minWidth: 1900, borderCollapse: "separate", borderSpacing: 0 }}
          >
            <TableHead>
              <TableRow>
                <HeaderCelda texto="Clave" titulo="Clave del producto" left={0} />
                <HeaderCelda
                  texto="Descripción"
                  titulo="Descripción del producto"
                  left={120}
                />
                <HeaderCelda texto="Cant. recep." titulo="Cantidad recibida" align="right" />
                <HeaderCelda texto="Cant. pedido" titulo="Cantidad pedida" align="right" />
                <HeaderCelda texto="Diferencia" titulo="Diferencia entre pedido y recepción" align="right" />
                <HeaderCelda texto="Cant. admin." titulo="Cantidad administración" align="right" />
                <HeaderCelda texto="Bonif. recep." titulo="Cantidad bonificación recepción" align="right" />
                <HeaderCelda texto="Bonif. pedido" titulo="Cantidad bonificación en pedido" align="right" />
                <HeaderCelda texto="Bonif. admin" titulo="Cantidad bonificación administración" align="right" />
                <HeaderCelda texto="Costo s/IVA" titulo="Costo sin IVA (catálogo)" align="right" />
                <HeaderCelda texto="Costo total" titulo="Costo total" align="right" />
                <HeaderCelda texto="Act." titulo="Actualizar el catálogo con los nuevos costos de la lista" align="center" />
                <HeaderCelda texto="Costo factura" titulo="Costo factura (con impuestos)" align="right" />
                <HeaderCelda texto="Precio lista 1" titulo="Precio de venta lista 1" align="right" />
                <HeaderCelda texto="Nuevo precio" titulo="Nuevo precio de venta" align="right" />
                <HeaderCelda texto="Estatus" titulo="Estatus del renglón" align="center" />
                <HeaderCelda texto="Observaciones" titulo="Observaciones" />
              </TableRow>
            </TableHead>

            <TableBody>
              {cargando && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={17} align="center" sx={{ ...BORDE_CELDA, py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              )}

              {!cargando && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={17} align="center" sx={{ ...BORDE_CELDA, py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay recepciones para los filtros seleccionados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {filas.map((row) => {
                const diferencia = Number(row.diferencia || 0);
                return (
                  <TableRow key={row.id} hover>
                    <TableCell
                      sx={{
                        ...BORDE_CELDA,
                        fontWeight: 600,
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        bgcolor: "background.paper",
                        minWidth: 120,
                      }}
                    >
                      <Chip label={row.clave_prod} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell
                      sx={{
                        ...BORDE_CELDA,
                        position: "sticky",
                        left: 120,
                        zIndex: 2,
                        bgcolor: "background.paper",
                        minWidth: 240,
                      }}
                    >
                      {row.descripcion || "-"}
                    </TableCell>

                    <TableCell align="right" sx={CELDA_NUMERICA}>{row.cantidad}</TableCell>
                    <TableCell align="right" sx={CELDA_NUMERICA}>{row.cantidad_pedido}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        ...CELDA_NUMERICA,
                        color: diferencia !== 0 ? "error.main" : "text.secondary",
                        fontWeight: diferencia !== 0 ? 700 : 400,
                      }}
                    >
                      {row.diferencia}
                    </TableCell>

                    <CeldaNumero
                      valor={row.cantidad_administracion}
                      alCambiar={(v) => actualizarCampo(row.id, "cantidad_administracion", v)}
                      deshabilitado={inputsDeshabilitados}
                      ancho={100}
                      color={VERDE_EDITABLE}
                      colorFocus={VERDE_FOCUS}
                    />
                    <CeldaNumero
                      valor={row.cantidad_bonificacion_r}
                      alCambiar={(v) => actualizarCampo(row.id, "cantidad_bonificacion_r", v)}
                      deshabilitado={inputsDeshabilitados}
                      ancho={100}
                      color={AMARILLO_EDITABLE}
                      colorFocus={AMARILLO_FOCUS}
                    />
                    <TableCell align="right" sx={CELDA_NUMERICA}>
                      {row.cantidad_bonificacion_p ?? "-"}
                    </TableCell>
                    <CeldaNumero
                      valor={row.cantidad_bonificacion_admin}
                      alCambiar={(v) => actualizarCampo(row.id, "cantidad_bonificacion_admin", v)}
                      deshabilitado={inputsDeshabilitados}
                      ancho={100}
                      color={VERDE_EDITABLE}
                      colorFocus={VERDE_FOCUS}
                    />

                    <CeldaNumero
                      valor={row.costo_sin_iva}
                      alCambiar={(v) => actualizarCampo(row.id, "costo_sin_iva", v)}
                      deshabilitado={inputsDeshabilitados}
                      ancho={110}
                      color={VERDE_EDITABLE}
                      colorFocus={VERDE_FOCUS}
                    />
                    <TableCell align="right" sx={CELDA_NUMERICA}>
                      {formatoNumero(row.costo_total)}
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{
                        ...BORDE_CELDA,
                        bgcolor: VERDE_EDITABLE,
                        "&:focus-within": { bgcolor: VERDE_FOCUS },
                        minWidth: 60,
                        p: 0,
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={Boolean(row.actualizar_catalogo)}
                        onChange={(event) =>
                          actualizarCampo(
                            row.id,
                            "actualizar_catalogo",
                            event.target.checked
                          )
                        }
                        disabled={inputsDeshabilitados}
                        inputProps={{ "aria-label": "Actualizar catálogo" }}
                      />
                    </TableCell>

                    <TableCell align="right" sx={CELDA_NUMERICA}>
                      {formatoMoneda(row.costoFactura1)}
                    </TableCell>
                    <TableCell align="right" sx={CELDA_NUMERICA}>
                      {formatoMoneda(row.precioVenta_actual)}
                    </TableCell>
                    <CeldaNumero
                      valor={row.nuevo_precio}
                      alCambiar={(v) => actualizarCampo(row.id, "nuevo_precio", v)}
                      deshabilitado={inputsDeshabilitados}
                      ancho={110}
                      color={VERDE_EDITABLE}
                      colorFocus={VERDE_FOCUS}
                      placeholder={formatoNumero(row.precioVenta_actual)}
                    />

                    <TableCell align="center" sx={BORDE_CELDA}>
                      <Chip
                        label={row.estatus || "Pendiente"}
                        size="small"
                        color={colorEstatus(row.estatus)}
                      />
                    </TableCell>

                    <TableCell
                      sx={{
                        ...BORDE_CELDA,
                        minWidth: 200,
                        bgcolor: VERDE_EDITABLE,
                        "&:focus-within": { bgcolor: VERDE_FOCUS },
                        p: 0,
                      }}
                    >
                      <TextField
                        variant="standard"
                        size="small"
                        fullWidth
                        value={row.observaciones ?? ""}
                        onChange={(event) =>
                          actualizarCampo(row.id, "observaciones", event.target.value)
                        }
                        disabled={inputsDeshabilitados}
                        sx={{ "& .MuiInputBase-root": { px: 1, py: 0.25 } }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }
);

export default AdministracionTable;
