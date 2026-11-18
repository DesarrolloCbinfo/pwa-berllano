import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAllOutlined";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import SaveIcon from "@mui/icons-material/SaveOutlined";
import SearchIcon from "@mui/icons-material/SearchOutlined";
import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useAuth } from "../../../context/AuthContext";
import useSession from "../../../hooks/useSession";
import SucursalSelector from "../../../components/selectores/SucursalSelector";
import type { SucursalOption } from "../../../components/selectores/SucursalSelector";
import AdministracionTable from "../../../features/RecepcionMercanciaAdministracion/components/AdministracionTable";
import type { AdministracionTableHandle } from "../../../features/RecepcionMercanciaAdministracion/components/AdministracionTable";
import { RecepcionMercanciaAdministracionApis } from "../../../features/RecepcionMercanciaAdministracion/apis/RecepcionMercanciaAdministracionApis";
import type {
  ActualizarRecepcionAdministracionPayload,
  FinalizarAdministracionPayload,
  RecepcionAdministracionRow,
} from "../../../features/RecepcionMercanciaAdministracion/types/RecepcionMercanciaAdministracionTypes";
import { obtenerMensajeError } from "../../../features/RecepcionMercanciaAdministracion/utils/errores";

interface Notificacion {
  open: boolean;
  severity: "success" | "error";
  message: string;
}

function normalizarRespuesta(data: unknown): RecepcionAdministracionRow[] {
  if (!Array.isArray(data)) return [];
  if (data.length > 0 && Array.isArray(data[0])) {
    return data[0] as RecepcionAdministracionRow[];
  }
  return data as RecepcionAdministracionRow[];
}

function formatearMoneda(valor: number) {
  return Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function formatearFecha(valor: string | null) {
  if (!valor) return "-";
  const [fecha] = valor.split("T");
  if (!fecha) return valor;
  const [anio, mes, dia] = fecha.split("-");
  if (!anio || !mes || !dia) return valor;
  return `${dia}/${mes}/${anio}`;
}

function CampoResumen({
  etiqueta,
  valor,
  cellSx,
}: {
  etiqueta: string;
  valor: string;
  cellSx?: object;
}) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        px: 2,
        py: 1.25,
        ...cellSx,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {etiqueta}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
        {valor}
      </Typography>
    </Box>
  );
}

function FilaTotal({
  etiqueta,
  valor,
  destacado = false,
}: {
  etiqueta: string;
  valor: number;
  destacado?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        gap: 3,
        py: 0.25,
      }}
    >
      <Typography
        variant={destacado ? "subtitle1" : "body2"}
        color={destacado ? "text.primary" : "text.secondary"}
        sx={{ fontWeight: destacado ? 700 : 400 }}
      >
        {etiqueta}
      </Typography>
      <Typography
        variant={destacado ? "subtitle1" : "body2"}
        sx={{ fontWeight: destacado ? 700 : 600, fontVariantNumeric: "tabular-nums" }}
      >
        {formatearMoneda(valor)}
      </Typography>
    </Box>
  );
}

export default function RecepcionMercanciaAdministracionPage() {
  const { consumoApi } = useConsumoApi();
  const { token } = useAuth();
  const session = useSession();

  const tableRef = useRef<AdministracionTableHandle>(null);

  const [sucursalSeleccionada, setSucursalSeleccionada] =
    useState<SucursalOption | null>(null);
  const [folioFiltro, setFolioFiltro] = useState("");
  const [sucursalAplicada, setSucursalAplicada] = useState(0);
  const [folioAplicado, setFolioAplicado] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [notif, setNotif] = useState<Notificacion>({
    open: false,
    severity: "success",
    message: "",
  });

  const sucursalSesionId =
    Number(session?.sucursal) || Number(token?.claveDepartamento) || 0;

  const administracionQuery = useQuery<RecepcionAdministracionRow[]>({
    queryKey: ["recepcion-administracion", sucursalAplicada, folioAplicado],
    queryFn: async () => {
      const { data } = await consumoApi.get<unknown>(
        RecepcionMercanciaAdministracionApis.administracion(
          sucursalAplicada,
          folioAplicado
        )
      );
      return normalizarRespuesta(data);
    },
    enabled: sucursalAplicada > 0 && folioAplicado > 0,
  });

  const rows = useMemo(
    () => administracionQuery.data ?? [],
    [administracionQuery.data]
  );

  const administracionTerminada = useMemo(
    () =>
      rows.some(
        (row) =>
          row.administracion_terminada === true ||
          row.administracion_terminada === 1
      ),
    [rows]
  );

  const totales = useMemo(() => {
    return rows.reduce(
      (acumulado, row) => ({
        piezas: acumulado.piezas + Number(row.cantidad || 0),
        administracion:
          acumulado.administracion + Number(row.cantidad_administracion || 0),
        diferencia: acumulado.diferencia + Number(row.diferencia || 0),
        costo: acumulado.costo + Number(row.costo_total || 0),
      }),
      {
        piezas: 0,
        administracion: 0,
        diferencia: 0,
        costo: 0,
      }
    );
  }, [rows]);

  const handleBuscar = () => {
    const sucursal = sucursalSeleccionada?.cve_sucursal ?? 0;
    const folio = Number(folioFiltro);

    if (sucursal <= 0) {
      setNotif({
        open: true,
        severity: "error",
        message: "Selecciona una sucursal válida.",
      });
      return;
    }

    if (!Number.isInteger(folio) || folio <= 0) {
      setNotif({
        open: true,
        severity: "error",
        message: "El folio debe ser un número mayor a 0.",
      });
      return;
    }

    setSucursalAplicada(sucursal);
    setFolioAplicado(folio);
  };

  const handleLimpiar = () => {
    setFolioFiltro("");
    setSucursalAplicada(0);
    setFolioAplicado(0);
  };

  const handleGuardar = async () => {
    const filasEditadas = tableRef.current?.getDatosEditados() ?? rows;

    if (filasEditadas.length === 0) {
      setNotif({
        open: true,
        severity: "error",
        message: "No hay registros para guardar.",
      });
      return;
    }

    setGuardando(true);
    try {
      await Promise.all(
        filasEditadas.map((fila) => {
          const payload: ActualizarRecepcionAdministracionPayload = {
            id: fila.id,
            cantidad_administracion: Number(
              fila.cantidad_administracion || 0
            ),
            cantidad_bonificacion_admin: Number(
              fila.cantidad_bonificacion_admin || 0
            ),
            cantidad_bonificacion_r: Number(
              fila.cantidad_bonificacion_r || 0
            ),
            costo_administracion: Number(fila.costo_sin_iva || 0),
            porcentaje_iva: Number(fila.porcentaje_iva || 0),
            nuevo_precio: Number(fila.nuevo_precio ?? 0),
            actualizar_catalogo: Boolean(fila.actualizar_catalogo),
            observaciones: fila.observaciones ?? "",
          };

          return consumoApi.put(
            RecepcionMercanciaAdministracionApis.actualizarAdministracion(
              payload
            )
          );
        })
      );

      setNotif({
        open: true,
        severity: "success",
        message: "Progreso guardado correctamente.",
      });
      await administracionQuery.refetch();
    } catch (error) {
      setNotif({
        open: true,
        severity: "error",
        message: obtenerMensajeError(
          error,
          "No se pudo guardar el progreso de la administración"
        ),
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleFinalizar = async () => {
    if (sucursalAplicada <= 0 || folioAplicado <= 0) {
      setNotif({
        open: true,
        severity: "error",
        message: "Selecciona una sucursal y un folio válidos.",
      });
      return;
    }

    const confirmacion = await Swal.fire({
      title: "¿Terminar administración?",
      text: `Se finalizará la administración del folio ${folioAplicado}. Después de finalizar, los registros quedarán en sólo lectura.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, terminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2e7d32",
    });

    if (!confirmacion.isConfirmed) return;

    const payload: FinalizarAdministracionPayload = {
      folio: folioAplicado,
      cve_sucursal: sucursalAplicada,
    };

    setFinalizando(true);
    try {
      await consumoApi.put(
        RecepcionMercanciaAdministracionApis.finalizarAdministracion(
          payload.folio,
          payload.cve_sucursal
        )
      );

      setNotif({
        open: true,
        severity: "success",
        message: "Administración finalizada correctamente.",
      });
      await administracionQuery.refetch();
    } catch (error) {
      setNotif({
        open: true,
        severity: "error",
        message: obtenerMensajeError(
          error,
          "No se pudo finalizar la administración"
        ),
      });
    } finally {
      setFinalizando(false);
    }
  };

  const handleCloseNotif = () => {
    setNotif((prev) => ({ ...prev, open: false }));
  };

  const resumen = rows[0];
  const subtotal = totales.costo;
  const totalFactura = Number(resumen?.total_factura || 0);
  const total = totalFactura > 0 ? totalFactura : subtotal;
  const iva = total - subtotal;

  return (
    <Stack spacing={3}>
      {/* Filtros */}
      <Card elevation={0} sx={{ border: "2px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FactCheckIcon sx={{ fontSize: 28, color: "primary.main" }} />
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, letterSpacing: "0.02em" }}
              >
                Administración de recepción de mercancía
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Consulta los detalles administrativos de una recepción por sucursal
              y folio.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <SucursalSelector
                value={sucursalSeleccionada}
                onChange={setSucursalSeleccionada}
                defaultSucursalId={sucursalSesionId}
                sx={{ width: { xs: "100%", sm: 260 } }}
              />
              <TextField
                label="Folio"
                type="number"
                size="small"
                value={folioFiltro}
                onChange={(event) => setFolioFiltro(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleBuscar();
                }}
                inputProps={{ min: 0, step: 1 }}
                sx={{ width: { xs: "100%", sm: 160 } }}
              />
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleBuscar}
                disabled={administracionQuery.isFetching}
                sx={{ textTransform: "none" }}
              >
                Buscar
              </Button>
              <Button
                variant="text"
                onClick={handleLimpiar}
                disabled={administracionQuery.isFetching}
                sx={{ textTransform: "none" }}
              >
                Limpiar
              </Button>
            </Stack>

            {administracionQuery.isError && (
              <Alert severity="error">
                {obtenerMensajeError(
                  administracionQuery.error,
                  "No se pudo consultar la administración de la recepción"
                )}
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Encabezado de la recepción */}
      {resumen && (
        <Card elevation={0} sx={{ border: "2px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  bgcolor: "grey.100",
                  px: 2,
                  py: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="overline"
                  sx={{ fontWeight: 700, letterSpacing: "0.08em", lineHeight: 1.4 }}
                >
                  Folio {resumen.folio} · Sucursal {sucursalAplicada}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                  gap: "1px",
                  bgcolor: "divider",
                }}
              >
                <CampoResumen etiqueta="No. folio" valor={String(resumen.folio)} />
                <CampoResumen
                  etiqueta="Proveedor"
                  valor={resumen.proveedor || "-"}
                  cellSx={{ gridColumn: { sm: "span 3" } }}
                />
                <CampoResumen
                  etiqueta="Fecha de pedido"
                  valor={formatearFecha(resumen.fecha_pedido)}
                />
                <CampoResumen
                  etiqueta="Fecha de recepción"
                  valor={formatearFecha(resumen.fecha_recepcion)}
                />
                <CampoResumen
                  etiqueta="No. de factura"
                  valor={resumen.folio_docto || "-"}
                />
                <CampoResumen
                  etiqueta="Total factura"
                  valor={formatearMoneda(Number(resumen.total_factura || 0))}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tabla + totales + acciones */}
      <Card elevation={0} sx={{ border: "2px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={2}>
            <AdministracionTable
              ref={tableRef}
              rows={rows}
              cargando={administracionQuery.isLoading}
              deshabilitarBotones={guardando || finalizando}
            />

            {rows.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip label={`Piezas ${totales.piezas}`} size="small" variant="outlined" />
                  <Chip
                    label={`Admón. ${totales.administracion}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Diferencia ${totales.diferencia}`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                <Box sx={{ minWidth: 230 }}>
                  <FilaTotal etiqueta="Subtotal" valor={subtotal} />
                  <FilaTotal etiqueta="IVA" valor={iva} />
                  <Divider sx={{ my: 0.5 }} />
                  <FilaTotal etiqueta="Total" valor={total} destacado />
                </Box>
              </Box>
            )}

            {rows.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleGuardar}
                  disabled={
                    guardando ||
                    finalizando ||
                    administracionQuery.isFetching ||
                    administracionTerminada
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor: "#d81b60",
                    "&:hover": { bgcolor: "#c2185b" },
                  }}
                >
                  {guardando ? "Guardando..." : "Guardar Progreso"}
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<DoneAllIcon />}
                  onClick={handleFinalizar}
                  disabled={
                    guardando ||
                    finalizando ||
                    administracionQuery.isFetching ||
                    administracionTerminada
                  }
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  {finalizando ? "Finalizando..." : "Terminal"}
                </Button>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={notif.open}
        autoHideDuration={4000}
        onClose={handleCloseNotif}
      >
        <Alert
          onClose={handleCloseNotif}
          severity={notif.severity}
          variant="outlined"
          sx={{ width: "100%" }}
        >
          {notif.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
