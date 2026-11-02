import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAllOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/SearchOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { useAuth } from "../../../context/AuthContext";
import useConsumoApi from "../../../hooks/useConsumoApi";
import useSession from "../../../hooks/useSession";
import ProveedorSelector from "../../../components/selectores/ProveedorSelector";
import SucursalSelector from "../../../components/selectores/SucursalSelector";
import type { ProveedorOption } from "../../../components/selectores/ProveedorSelector";
import type { SucursalOption } from "../../../components/selectores/SucursalSelector";
import CapturaPartidasTable from "../../../features/RecepcionMercanciaProveedor/components/CapturaPartidasTable";
import EdicionPartidasTable from "../../../features/RecepcionMercanciaProveedor/components/EdicionPartidasTable";
import EditarPartidaDialog from "../../../features/RecepcionMercanciaProveedor/components/EditarPartidaDialog";
import FinalizarRecepcionDialog from "../../../features/RecepcionMercanciaProveedor/components/FinalizarRecepcionDialog";
import PedidosPendientesTable from "../../../features/RecepcionMercanciaProveedor/components/PedidosPendientesTable";
import { RecepcionMercanciaApis } from "../../../features/RecepcionMercanciaProveedor/apis/RecepcionMercanciaApis";
import type {
  ActualizarPartidaPayload,
  AgregarPartidaPayload,
  FinalizarRecepcionResponse,
  OperacionPartidaResponse,
  PartidaIntermedia,
  PedidoARecepcionar,
  PedidoDetalle,
  PedidosARecepcionarPaginado,
} from "../../../features/RecepcionMercanciaProveedor/types/RecepcionMercanciaTypes";
import { obtenerMensajeError } from "../../../features/RecepcionMercanciaProveedor/utils/errores";

function formatoMoneda(valor: number) {
  return Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function formatearFecha(valor: string) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface Notificacion {
  open: boolean;
  severity: "success" | "error";
  message: string;
}

export default function RecepcionMercanciaProveedorPage() {
  const { consumoApi } = useConsumoApi();
  const { token } = useAuth();
  const session = useSession();
  const qc = useQueryClient();

  const [proveedorSeleccionado, setProveedorSeleccionado] =
    useState<ProveedorOption | null>(null);
  const [sucursalSeleccionada, setSucursalSeleccionada] =
    useState<SucursalOption | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [folioSeleccionado, setFolioSeleccionado] = useState<number | null>(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] =
    useState<PedidoARecepcionar | null>(null);
  const [partidaEditando, setPartidaEditando] = useState<PartidaIntermedia | null>(
    null
  );
  const [guardandoPartida, setGuardandoPartida] = useState(false);
  const [confirmarFinalizar, setConfirmarFinalizar] = useState(false);
  const [notif, setNotif] = useState<Notificacion>({
    open: false,
    severity: "success",
    message: "",
  });

  const defaultSucursalId =
    Number(session?.sucursal) || Number(token?.claveDepartamento) || 1;
  const proveedorFiltroId = proveedorSeleccionado?.id ?? "";
  const cveSucursal = sucursalSeleccionada?.cve_sucursal ?? 0;

  const pedidosQuery = useQuery<PedidosARecepcionarPaginado>({
    queryKey: [
      "recepcion-pedidos",
      proveedorFiltroId,
      cveSucursal,
      pageNumber,
      pageSize,
    ],
    queryFn: async () => {
      const { data } = await consumoApi.get<
        PedidosARecepcionarPaginado | PedidoARecepcionar[]
      >(
        RecepcionMercanciaApis.pedidosARecepcionar(
          proveedorFiltroId,
          cveSucursal,
          pageNumber,
          pageSize
        )
      );

      if (Array.isArray(data)) {
        const totalRegistrosArreglo = data.length;
        const inicio = (pageNumber - 1) * pageSize;
        return {
          data: data.slice(inicio, inicio + pageSize),
          pageNumber,
          pageSize,
          totalRegistros: totalRegistrosArreglo,
          totalPaginas:
            totalRegistrosArreglo > 0
              ? Math.ceil(totalRegistrosArreglo / pageSize)
              : 0,
        };
      }

      const lista = Array.isArray(data?.data) ? data.data : [];
      return {
        data: lista,
        pageNumber: Number(data?.pageNumber) || pageNumber,
        pageSize: Number(data?.pageSize) || pageSize,
        totalRegistros: Number(data?.totalRegistros) || lista.length,
        totalPaginas:
          Number(data?.totalPaginas) ||
          (lista.length > 0 ? Math.ceil(lista.length / pageSize) : 0),
      };
    },
    enabled: cveSucursal > 0,
  });

  const detalleQuery = useQuery<PedidoDetalle[]>({
    queryKey: ["recepcion-pedido-detalle", folioSeleccionado, cveSucursal],
    queryFn: async () => {
      if (folioSeleccionado == null || cveSucursal <= 0) return [];
      const { data } = await consumoApi.get<PedidoDetalle[]>(
        RecepcionMercanciaApis.pedidoDetalle(folioSeleccionado, cveSucursal)
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: folioSeleccionado != null && cveSucursal > 0,
  });

  const intermediaQuery = useQuery<PartidaIntermedia[]>({
    queryKey: ["recepcion-intermedia", folioSeleccionado, cveSucursal],
    queryFn: async () => {
      if (folioSeleccionado == null || cveSucursal <= 0) return [];
      const { data } = await consumoApi.get<PartidaIntermedia[]>(
        RecepcionMercanciaApis.intermedia(folioSeleccionado, cveSucursal)
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: folioSeleccionado != null && cveSucursal > 0,
  });

  const pedidos = useMemo(
    () => pedidosQuery.data?.data ?? [],
    [pedidosQuery.data]
  );
  const detalle = useMemo(() => detalleQuery.data ?? [], [detalleQuery.data]);
  const partidas = useMemo(() => intermediaQuery.data ?? [], [intermediaQuery.data]);

  const totalRegistros = pedidosQuery.data?.totalRegistros ?? 0;
  const totalPaginas = pedidosQuery.data?.totalPaginas ?? 0;

  useEffect(() => {
    if (totalPaginas > 0 && pageNumber > totalPaginas) {
      setPageNumber(totalPaginas);
    }
  }, [totalPaginas, pageNumber]);

  const totalPartidas = useMemo(
    () => partidas.reduce((total, partida) => total + Number(partida.cantidad || 0), 0),
    [partidas]
  );

  const totalRecibido = useMemo(
    () =>
      partidas.reduce(
        (total, partida) =>
          total + Number(partida.cantidad || 0) * Number(partida.costo_pedido || 0),
        0
      ),
    [partidas]
  );

  const eliminarMutation = useMutation({
    mutationFn: async (partida: PartidaIntermedia) => {
      const { data } = await consumoApi.delete<OperacionPartidaResponse>(
        RecepcionMercanciaApis.intermediaPorId(partida.id)
      );
      return data;
    },
    onSuccess: async (data) => {
      setNotif({
        open: true,
        severity: "success",
        message: data?.mensaje || "Partida eliminada correctamente.",
      });
      await qc.invalidateQueries({
        queryKey: ["recepcion-intermedia", folioSeleccionado, cveSucursal],
      });
    },
    onError: async (error) => {
      setNotif({
        open: true,
        severity: "error",
        message: obtenerMensajeError(error, "No se pudo eliminar la partida"),
      });
      await qc.invalidateQueries({
        queryKey: ["recepcion-intermedia", folioSeleccionado, cveSucursal],
      });
    },
  });

  const finalizarMutation = useMutation({
    mutationFn: async () => {
      if (folioSeleccionado == null) {
        throw new Error("No hay pedido seleccionado");
      }
      const { data } = await consumoApi.put<FinalizarRecepcionResponse>(
        RecepcionMercanciaApis.finalizar,
        { folio: folioSeleccionado, cve_sucursal: cveSucursal }
      );
      return data;
    },
    onSuccess: async (data) => {
      const folioFinalizado = folioSeleccionado;
      setConfirmarFinalizar(false);
      setFolioSeleccionado(null);
      setPedidoSeleccionado(null);
      setPartidaEditando(null);

      await qc.invalidateQueries({ queryKey: ["recepcion-pedidos"] });
      if (folioFinalizado != null) {
        await qc.invalidateQueries({
          queryKey: ["recepcion-intermedia", folioFinalizado, cveSucursal],
        });
      }

      await Swal.fire({
        title:
          data.estatus === "aplicadas"
            ? "Recepción aplicada"
            : "Recepción finalizada",
        text: data.mensaje,
        icon: "success",
        confirmButtonText: "Aceptar",
      });
    },
    onError: async (error) => {
      setConfirmarFinalizar(false);
      setNotif({
        open: true,
        severity: "error",
        message: obtenerMensajeError(error, "No se pudo finalizar la recepción"),
      });
      await qc.invalidateQueries({
        queryKey: ["recepcion-intermedia", folioSeleccionado, cveSucursal],
      });
    },
  });

  const handleSucursalChange = (sucursal: SucursalOption) => {
    if (sucursal.cve_sucursal === cveSucursal) {
      setSucursalSeleccionada(sucursal);
      return;
    }
    setSucursalSeleccionada(sucursal);
    setPageNumber(1);
    setFolioSeleccionado(null);
    setPedidoSeleccionado(null);
    setPartidaEditando(null);
    setConfirmarFinalizar(false);
  };

  const handleProveedorChange = (proveedor: ProveedorOption | null) => {
    const nuevoId = proveedor?.id ?? "";
    if (nuevoId === proveedorFiltroId) {
      setProveedorSeleccionado(proveedor);
      return;
    }
    setProveedorSeleccionado(proveedor);
    setPageNumber(1);
    setFolioSeleccionado(null);
    setPedidoSeleccionado(null);
    setPartidaEditando(null);
    setConfirmarFinalizar(false);
  };

  const handleLimpiarFiltro = () => {
    if (!proveedorSeleccionado) return;
    setProveedorSeleccionado(null);
    setPageNumber(1);
    setFolioSeleccionado(null);
    setPedidoSeleccionado(null);
    setPartidaEditando(null);
    setConfirmarFinalizar(false);
  };

  const handleSeleccionar = (pedido: PedidoARecepcionar) => {
    if (pedido.folio === folioSeleccionado) return;
    setFolioSeleccionado(pedido.folio);
    setPedidoSeleccionado(pedido);
    setPartidaEditando(null);
  };

  const handlePageSizeChange = (nuevoPageSize: number) => {
    setPageSize(nuevoPageSize);
    setPageNumber(1);
  };

  const handleAgregarPartida = async (
    item: PedidoDetalle,
    cantidad: number,
    observaciones: string
  ) => {
    if (folioSeleccionado == null || cveSucursal <= 0) return false;

    const payload: AgregarPartidaPayload = {
      sucursal_destino: cveSucursal,
      folio: folioSeleccionado,
      clave_prod: item.clave_prod,
      descripcion: item.descripcion,
      proveedor: item.proveedor || pedidoSeleccionado?.proveedor || "",
      cantidad,
      observaciones,
      cantidad_pedido: item.cantidad_pedido,
      costo_pedido: item.costo_pedido,
    };

    try {
      const { data } = await consumoApi.post<OperacionPartidaResponse>(
        RecepcionMercanciaApis.intermediaBase,
        payload
      );
      setNotif({
        open: true,
        severity: "success",
        message: data?.mensaje || "Partida agregada correctamente.",
      });
      await qc.invalidateQueries({
        queryKey: ["recepcion-intermedia", folioSeleccionado, cveSucursal],
      });
      return true;
    } catch (error) {
      setNotif({
        open: true,
        severity: "error",
        message: obtenerMensajeError(error, "No se pudo agregar la partida"),
      });
      return false;
    }
  };

  const handleGuardarPartida = async (payload: ActualizarPartidaPayload) => {
    if (!partidaEditando) return false;

    setGuardandoPartida(true);
    try {
      const { data } = await consumoApi.put<OperacionPartidaResponse>(
        RecepcionMercanciaApis.intermediaPorId(partidaEditando.id),
        payload
      );
      setNotif({
        open: true,
        severity: "success",
        message: data?.mensaje || "Partida actualizada correctamente.",
      });
      setPartidaEditando(null);
      await qc.invalidateQueries({
        queryKey: ["recepcion-intermedia", folioSeleccionado, cveSucursal],
      });
      return true;
    } catch (error) {
      setNotif({
        open: true,
        severity: "error",
        message: obtenerMensajeError(error, "No se pudo actualizar la partida"),
      });
      await qc.invalidateQueries({
        queryKey: ["recepcion-intermedia", folioSeleccionado, cveSucursal],
      });
      return false;
    } finally {
      setGuardandoPartida(false);
    }
  };

  const handleEliminarPartida = async (partida: PartidaIntermedia) => {
    const resultado = await Swal.fire({
      title: "¿Eliminar partida?",
      text: `${partida.clave_prod} - ${partida.descripcion}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (resultado.isConfirmed) {
      eliminarMutation.mutate(partida);
    }
  };

  const handleCloseNotif = () => {
    setNotif((prev) => ({ ...prev, open: false }));
  };

  const refrescarIntermedia = () => {
    void qc.invalidateQueries({
      queryKey: ["recepcion-intermedia", folioSeleccionado, cveSucursal],
    });
  };

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ border: "2px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SearchIcon sx={{ fontSize: 28, color: "primary.main" }} />
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, letterSpacing: "0.02em" }}
              >
                Recepción de mercancía de pedidos
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Selecciona un pedido pendiente, captura sus partidas y finaliza la
              recepción.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <SucursalSelector
                value={sucursalSeleccionada}
                onChange={handleSucursalChange}
                defaultSucursalId={defaultSucursalId}
                sx={{ width: { xs: "100%", sm: 260 } }}
              />
              <ProveedorSelector
                value={proveedorSeleccionado}
                onChange={handleProveedorChange}
                sx={{ width: { xs: "100%", sm: 340 } }}
              />
              <Button
                variant="text"
                onClick={handleLimpiarFiltro}
                disabled={!proveedorSeleccionado || pedidosQuery.isFetching}
                sx={{ textTransform: "none" }}
              >
                Limpiar filtro
              </Button>
            </Stack>

            {cveSucursal <= 0 && (
              <Alert severity="info">
                Selecciona una sucursal para consultar los pedidos pendientes.
              </Alert>
            )}

            {pedidosQuery.isError && (
              <Alert severity="error">
                {obtenerMensajeError(
                  pedidosQuery.error,
                  "No se pudieron cargar los pedidos pendientes"
                )}
              </Alert>
            )}

            <PedidosPendientesTable
              pedidos={pedidos}
              cargando={pedidosQuery.isLoading}
              folioSeleccionado={folioSeleccionado}
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalRegistros={totalRegistros}
              onSeleccionar={handleSeleccionar}
              onPageChange={setPageNumber}
              onPageSizeChange={handlePageSizeChange}
            />
          </Stack>
        </CardContent>
      </Card>

      {folioSeleccionado != null && (
        <>
          <Card elevation={0} sx={{ border: "2px solid", borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Pedido #{folioSeleccionado}
                  </Typography>
                  <Chip
                    label={`Proveedor: ${pedidoSeleccionado?.proveedor ?? "N/A"}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Usuario: ${
                      pedidoSeleccionado?.usuarioRealizaPedido ?? "N/A"
                    }`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Fecha: ${formatearFecha(pedidoSeleccionado?.fecha ?? "")}`}
                    size="small"
                    variant="outlined"
                  />
                  {sucursalSeleccionada && (
                    <Chip
                      label={`Sucursal: ${sucursalSeleccionada.nombre}`}
                      size="small"
                      variant="outlined"
                      color="secondary"
                    />
                  )}
                </Box>

                {detalleQuery.isError && (
                  <Alert severity="error">
                    {obtenerMensajeError(
                      detalleQuery.error,
                      "No se pudo cargar el detalle del pedido"
                    )}
                  </Alert>
                )}

                <CapturaPartidasTable
                  folio={folioSeleccionado}
                  detalle={detalle}
                  cargando={detalleQuery.isLoading}
                  onAgregar={handleAgregarPartida}
                />
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: "2px solid", borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DoneAllIcon sx={{ color: "primary.main" }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Partidas en edición
                    </Typography>
                    <Chip
                      label={`${partidas.length} partidas`}
                      size="small"
                      color="primary"
                    />
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                      onClick={refrescarIntermedia}
                      disabled={intermediaQuery.isFetching}
                      color="primary"
                    >
                      {intermediaQuery.isFetching ? (
                        <CircularProgress size={20} />
                      ) : (
                        <RefreshIcon />
                      )}
                    </IconButton>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<DoneAllIcon />}
                      onClick={() => setConfirmarFinalizar(true)}
                      disabled={
                        partidas.length === 0 ||
                        intermediaQuery.isLoading ||
                        finalizarMutation.isPending
                      }
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Terminar recepción
                    </Button>
                  </Stack>
                </Box>

                {intermediaQuery.isError && (
                  <Alert severity="error">
                    {obtenerMensajeError(
                      intermediaQuery.error,
                      "No se pudieron cargar las partidas en edición"
                    )}
                  </Alert>
                )}

                <EdicionPartidasTable
                  partidas={partidas}
                  cargando={intermediaQuery.isLoading}
                  eliminandoId={
                    eliminarMutation.isPending
                      ? eliminarMutation.variables?.id ?? null
                      : null
                  }
                  onEditar={setPartidaEditando}
                  onEliminar={handleEliminarPartida}
                />

                <Divider />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total piezas
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {totalPartidas}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total recibido
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: "primary.main" }}
                    >
                      {formatoMoneda(totalRecibido)}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </>
      )}

      <EditarPartidaDialog
        open={partidaEditando != null}
        partida={partidaEditando}
        guardando={guardandoPartida}
        onClose={() => {
          if (!guardandoPartida) setPartidaEditando(null);
        }}
        onGuardar={handleGuardarPartida}
      />

      <FinalizarRecepcionDialog
        open={confirmarFinalizar}
        folio={folioSeleccionado}
        finalizando={finalizarMutation.isPending}
        onClose={() => setConfirmarFinalizar(false)}
        onConfirmar={() => finalizarMutation.mutate()}
      />

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
