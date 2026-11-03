import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
import CapturaEscaneo from "../../../features/RecepcionMercanciaProveedor/components/CapturaEscaneo";
import EdicionPartidasTable from "../../../features/RecepcionMercanciaProveedor/components/EdicionPartidasTable";
import EditarPartidaDialog from "../../../features/RecepcionMercanciaProveedor/components/EditarPartidaDialog";
import FinalizarRecepcionDialog from "../../../features/RecepcionMercanciaProveedor/components/FinalizarRecepcionDialog";
import PedidosPendientesTable from "../../../features/RecepcionMercanciaProveedor/components/PedidosPendientesTable";
import { RecepcionMercanciaApis } from "../../../features/RecepcionMercanciaProveedor/apis/RecepcionMercanciaApis";
import type {
  ActualizarPartidaPayload,
  AgregarPartidaPayload,
  FinalizarRecepcionPayload,
  FinalizarRecepcionResponse,
  OperacionPartidaResponse,
  PartidaCapturada,
  PartidaIntermedia,
  PedidoARecepcionar,
  PedidosARecepcionarPaginado,
  RegistrarPartidaResponse,
  ValidacionClaveResponse,
} from "../../../features/RecepcionMercanciaProveedor/types/RecepcionMercanciaTypes";
import {
  esConflicto,
  obtenerMensajeError,
} from "../../../features/RecepcionMercanciaProveedor/utils/errores";
import { colorEstatus } from "../../../features/RecepcionMercanciaProveedor/utils/estatus";
import type { ResultadoAlta } from "../../../features/RecepcionMercanciaProveedor/components/CapturaEscaneo";

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

function normalizarFecha(valor: string) {
  const texto = valor.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : "";
}

interface Notificacion {
  open: boolean;
  severity: "success" | "warning" | "error";
  message: string;
}

export default function RecepcionMercanciaProveedorPage() {
  const { consumoApi } = useConsumoApi();
  const { token } = useAuth();
  const session = useSession();
  const qc = useQueryClient();

  const sucursalSesionId =
    Number(session?.sucursal) || Number(token?.claveDepartamento) || 0;

  const [proveedorSeleccionado, setProveedorSeleccionado] =
    useState<ProveedorOption | null>(null);
  const [sucursalSeleccionada, setSucursalSeleccionada] =
    useState<SucursalOption | null>(() =>
      sucursalSesionId > 0
        ? {
            cve_sucursal: sucursalSesionId,
            nombre:
              session?.dSucursal?.trim() || `Sucursal ${sucursalSesionId}`,
          }
        : null
    );
  const [folioFiltro, setFolioFiltro] = useState("");
  const [fechaInicioFiltro, setFechaInicioFiltro] = useState("");
  const [fechaFinFiltro, setFechaFinFiltro] = useState("");
  const [proveedorAplicadoId, setProveedorAplicadoId] = useState("%");
  const [folioAplicado, setFolioAplicado] = useState<number | undefined>(
    undefined
  );
  const [fechaInicioAplicada, setFechaInicioAplicada] = useState("");
  const [fechaFinAplicada, setFechaFinAplicada] = useState("");
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

  const sucursalPreviaRef = useRef<number | null>(null);

  useEffect(() => {
    if (sucursalSesionId <= 0) {
      setSucursalSeleccionada(null);
      return;
    }

    const nombre =
      session?.dSucursal?.trim() || `Sucursal ${sucursalSesionId}`;
    setSucursalSeleccionada({ cve_sucursal: sucursalSesionId, nombre });

    if (
      sucursalPreviaRef.current !== null &&
      sucursalPreviaRef.current !== sucursalSesionId
    ) {
      setPageNumber(1);
      setFolioSeleccionado(null);
      setPedidoSeleccionado(null);
      setPartidaEditando(null);
      setConfirmarFinalizar(false);
    }
    sucursalPreviaRef.current = sucursalSesionId;
  }, [sucursalSesionId, session?.dSucursal]);

  const cveSucursal = sucursalSeleccionada?.cve_sucursal ?? 0;

  const pedidosQuery = useQuery<PedidosARecepcionarPaginado>({
    queryKey: [
      "recepcion-pedidos",
      proveedorAplicadoId,
      cveSucursal,
      folioAplicado,
      fechaInicioAplicada,
      fechaFinAplicada,
      pageNumber,
      pageSize,
    ],
    queryFn: async () => {
      const { data } = await consumoApi.get<
        PedidosARecepcionarPaginado | PedidoARecepcionar[]
      >(
        RecepcionMercanciaApis.pedidosARecepcionar({
          proveedor: proveedorAplicadoId,
          cveSucursal,
          folio: folioAplicado,
          fechaInicio: fechaInicioAplicada,
          fechaFin: fechaFinAplicada,
          pageNumber,
          pageSize,
        })
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
      await qc.invalidateQueries({ queryKey: ["recepcion-pedidos"] });
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
      await qc.invalidateQueries({ queryKey: ["recepcion-pedidos"] });
    },
  });

  const finalizarMutation = useMutation({
    mutationFn: async (datos: FinalizarRecepcionPayload) => {
      if (folioSeleccionado == null) {
        throw new Error("No hay pedido seleccionado");
      }
      const { data } = await consumoApi.put<FinalizarRecepcionResponse>(
        RecepcionMercanciaApis.finalizar,
        {
          folio: folioSeleccionado,
          cve_sucursal: cveSucursal,
          ...datos,
        }
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
    if (sucursal.cve_sucursal !== sucursalSesionId) return;
    setSucursalSeleccionada(sucursal);
  };

  const handleProveedorChange = (proveedor: ProveedorOption | null) => {
    setProveedorSeleccionado(proveedor);
  };

  const handleLimpiarFiltros = () => {
    setProveedorSeleccionado(null);
    setFolioFiltro("");
    setFechaInicioFiltro("");
    setFechaFinFiltro("");
  };

  const handleBuscar = () => {
    const folioTexto = folioFiltro.trim();
    let folioNumero: number | undefined;

    if (folioTexto !== "") {
      if (!/^\d+$/.test(folioTexto)) {
        setNotif({
          open: true,
          severity: "error",
          message: "El folio debe ser un número mayor o igual a 0.",
        });
        return;
      }
      const numero = Number(folioTexto);
      if (numero > 0) folioNumero = numero;
    }

    const inicio = normalizarFecha(fechaInicioFiltro);
    const fin = normalizarFecha(fechaFinFiltro);

    if (inicio && fin && inicio > fin) {
      setNotif({
        open: true,
        severity: "error",
        message: "La fecha de inicio no puede ser mayor que la fecha fin.",
      });
      return;
    }

    setProveedorAplicadoId(proveedorSeleccionado?.id?.trim() || "%");
    setFolioAplicado(folioNumero);
    setFechaInicioAplicada(inicio);
    setFechaFinAplicada(fin);
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

  const handleCloseRecepcion = () => {
    if (finalizarMutation.isPending) return;
    setFolioSeleccionado(null);
    setPedidoSeleccionado(null);
    setPartidaEditando(null);
    setConfirmarFinalizar(false);
  };

  const handlePageSizeChange = (nuevoPageSize: number) => {
    setPageSize(nuevoPageSize);
    setPageNumber(1);
  };

  const handleValidarClave = async (clave: string) => {
    const { data } = await consumoApi.get<ValidacionClaveResponse>(
      RecepcionMercanciaApis.validarClave(clave)
    );
    return data;
  };

  const handleAgregarPartida = async (
    partida: PartidaCapturada
  ): Promise<ResultadoAlta> => {
    if (folioSeleccionado == null || cveSucursal <= 0) return "error";

    const payload: AgregarPartidaPayload = {
      sucursal_destino: cveSucursal,
      folio: folioSeleccionado,
      clave_prod: partida.clave_prod,
      descripcion: partida.descripcion,
      proveedor: pedidoSeleccionado?.clave_proveedor || "",
      cantidad: partida.cantidad,
      observaciones: partida.observaciones,
    };

    try {
      const { data } = await consumoApi.post<RegistrarPartidaResponse>(
        RecepcionMercanciaApis.intermediaBase,
        payload
      );
      setNotif({
        open: true,
        severity: "success",
        message: data?.mensaje || "Producto registrado exitosamente.",
      });
      await qc.invalidateQueries({
        queryKey: ["recepcion-intermedia", folioSeleccionado, cveSucursal],
      });
      await qc.invalidateQueries({ queryKey: ["recepcion-pedidos"] });
      return "ok";
    } catch (error) {
      const duplicado = esConflicto(error);
      setNotif({
        open: true,
        severity: duplicado ? "warning" : "error",
        message: obtenerMensajeError(
          error,
          duplicado
            ? "Ya se registró este producto."
            : "No se pudo agregar la partida"
        ),
      });
      if (duplicado) {
        await qc.invalidateQueries({
          queryKey: ["recepcion-intermedia", folioSeleccionado, cveSucursal],
        });
        await qc.invalidateQueries({ queryKey: ["recepcion-pedidos"] });
        return "duplicado";
      }
      return "error";
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
              flexWrap="wrap"
              useFlexGap
            >
              <SucursalSelector
                value={sucursalSeleccionada}
                onChange={handleSucursalChange}
                label="Sucursal de la sesión"
                disabled
                autoSelect={false}
                sx={{ width: { xs: "100%", sm: 240 } }}
              />
              <ProveedorSelector
                value={proveedorSeleccionado}
                onChange={handleProveedorChange}
                sx={{ width: { xs: "100%", sm: 320 } }}
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
                sx={{ width: { xs: "100%", sm: 130 } }}
              />
              <TextField
                label="Fecha inicio"
                type="date"
                size="small"
                value={fechaInicioFiltro}
                onChange={(event) => setFechaInicioFiltro(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleBuscar();
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: "100%", sm: 170 } }}
              />
              <TextField
                label="Fecha fin"
                type="date"
                size="small"
                value={fechaFinFiltro}
                onChange={(event) => setFechaFinFiltro(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleBuscar();
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: "100%", sm: 170 } }}
              />
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleBuscar}
                disabled={cveSucursal <= 0 || pedidosQuery.isFetching}
                sx={{ textTransform: "none" }}
              >
                Buscar
              </Button>
              <Button
                variant="text"
                onClick={handleLimpiarFiltros}
                disabled={
                  !proveedorSeleccionado &&
                  !folioFiltro &&
                  !fechaInicioFiltro &&
                  !fechaFinFiltro
                }
                title="Limpia los campos; presiona Buscar para actualizar el listado"
                sx={{ textTransform: "none" }}
              >
                Limpiar campos
              </Button>
            </Stack>

            {cveSucursal <= 0 && (
              <Alert severity="error">
                No se pudo determinar la sucursal de la sesión.
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
        <Dialog
          open
          onClose={handleCloseRecepcion}
          fullWidth
          maxWidth="lg"
          scroll="paper"
          disableEscapeKeyDown={finalizarMutation.isPending}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <Stack spacing={1}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recepción pedido #{folioSeleccionado}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  <Chip
                    label={`Proveedor: ${
                      pedidoSeleccionado?.nombre_proveedor ||
                      pedidoSeleccionado?.clave_proveedor ||
                      "N/A"
                    }`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Usuario: ${
                      pedidoSeleccionado?.nombre_usuario ||
                      pedidoSeleccionado?.clave_usuario ||
                      "N/A"
                    }`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Fecha: ${formatearFecha(pedidoSeleccionado?.fecha ?? "")}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Estatus: ${
                      pedidoSeleccionado?.estatus || "Pendiente"
                    }`}
                    size="small"
                    color={colorEstatus(
                      pedidoSeleccionado?.estatus || "Pendiente"
                    )}
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
              </Stack>
              <IconButton
                aria-label="Cerrar recepción"
                onClick={handleCloseRecepcion}
                disabled={finalizarMutation.isPending}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent dividers sx={{ bgcolor: "grey.50" }}>
            <Stack spacing={3}>
              <Card elevation={0} sx={{ border: "2px solid", borderColor: "divider" }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <SearchIcon sx={{ color: "primary.main" }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Capturar producto
                      </Typography>
                    </Box>
                    <CapturaEscaneo
                      folio={folioSeleccionado}
                      onValidar={handleValidarClave}
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
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={handleCloseRecepcion}
              disabled={finalizarMutation.isPending}
              sx={{ textTransform: "none" }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
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
        onConfirmar={(datos) => finalizarMutation.mutate(datos)}
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
