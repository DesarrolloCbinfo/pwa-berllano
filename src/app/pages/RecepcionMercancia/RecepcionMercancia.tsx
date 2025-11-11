import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import DoneAllIcon from "@mui/icons-material/DoneAllOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import PaymentsIcon from "@mui/icons-material/PaymentsOutlined";
import SearchIcon from "@mui/icons-material/SearchOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import useConsumoApi from "../../../hooks/useConsumoApi";
import AddProductoDialog from "../../../features/RecepcionMercancia/AddProductoDialog";
import CargosVariosDialog from "../../../features/RecepcionMercancia/CargosVariosDialog";

export type TemporalRMRow = {
  id?: number;
  folioPedido: number;
  folioRecepcion?: number;
  numeroFactura?: string;
  totalFactura?: number;
  claveProd: string;
  descripcion?: string;
  proveedor?: string;
  nombre?: string; // nombre proveedor
  cantidad: number;
  cantidadPedido?: number;
  sucursal?: number;
  usuario?: string;
  usuarioPedido?: string;
  costoUnitario?: number;
  tasaIva?: number;
};

export default function RecepcionMercancia() {
  // ==================== HOOKS ====================
  const { consumoApi } = useConsumoApi();
  const { token } = useAuth();
  const qc = useQueryClient();

  // ==================== ESTADO LOCAL ====================
  // Filtros de búsqueda
  const [folioPedido, setFolioPedido] = useState<number>(0);
  const [sucursal, setSucursal] = useState<number>(0);

  // Diálogos
  const [openAdd, setOpenAdd] = useState(false);
  const [openCargos, setOpenCargos] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TemporalRMRow | undefined>(undefined);

  // Notificaciones
  const [notif, setNotif] = useState<{ open: boolean; severity: "success" | "error"; message: string }>({
    open: false,
    severity: "success",
    message: "",
  });

  // Inicializar sucursal desde localStorage
  useEffect(() => {
    const tokenData = localStorage.getItem("token");
    if (tokenData) {
      const parsedToken = JSON.parse(tokenData);
      setSucursal(parsedToken.claveDepartamento);
    }
  }, []);

  // ==================== QUERIES ====================
  const queryKey = useMemo(() => ["temporal_rm", folioPedido, sucursal], [folioPedido, sucursal]);

  // Query de productos del pedido
  const {
    data: listado,
    refetch,
    isFetching,
  } = useQuery<TemporalRMRow[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await consumoApi.get(`/api/TemporalData/sp_temporal_rm_get/${folioPedido}/${sucursal}`);
      return data;
    },
    enabled: false,
  });

  // Query de cargos adicionales
  const { data: cargos } = useQuery({
    queryKey: ["temporal_cargos", folioPedido, sucursal],
    queryFn: async () => {
      const { data } = await consumoApi.get(`/api/TemporalData/sp_temporal_cargos_get/${folioPedido}/${sucursal}`);
      return data as Array<{ id: number; total: number }>;
    },
    enabled: !!(folioPedido && sucursal && listado && listado.length > 0),
  });

  // ==================== MUTATIONS ====================
  const delRow = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await consumoApi.delete(`/api/TemporalData/sp_temporal_rm_delete/${id}/1`);
      return data as { codigo: number; mensaje: string };
    },
    onSuccess: (res) => {
      const isSuccess = res.codigo === 1;
      setNotif({ open: true, severity: isSuccess ? "success" : "error", message: res.mensaje || "" });
      qc.invalidateQueries({ queryKey });
      refetch();
    },
    onError: (e: any) => {
      setNotif({ open: true, severity: "error", message: e?.message || "Error al eliminar" });
    },
  });

  // ==================== VALORES CALCULADOS ====================
  const encabezado = useMemo(() => {
    if (!listado || listado.length === 0) {
      return { numeroFactura: "", totalFactura: 0, proveedor: "", fechaPedido: "" };
    }
    const primerProducto: any = listado[0];
    return {
      numeroFactura: primerProducto?.numeroFactura ?? "",
      totalFactura: primerProducto?.totalFactura ?? 0,
      proveedor: primerProducto?.nombre ?? primerProducto?.proveedor ?? "",
      fechaPedido: primerProducto?.fechaPedido ?? "",
    };
  }, [listado]);

  const totalPedido = useMemo(() => {
    if (!listado) return 0;
    return listado.reduce((total, producto) => {
      return total + Number(producto.cantidad) * Number(producto.costoUnitario || 0);
    }, 0);
  }, [listado]);

  const totalCargo = useMemo(() => {
    if (!cargos || cargos.length === 0) return 0;
    return cargos.reduce((total, cargo) => total + Number(cargo.total || 0), 0);
  }, [cargos]);

  // ==================== HANDLERS ====================
  const handleConsultar = async () => {
    if (!folioPedido || !sucursal) {
      setNotif({ open: true, severity: "error", message: "Captura folio y sucursal" });
      return;
    }
    await refetch();
  };

  const handleEditProducto = (producto: TemporalRMRow) => {
    setSelectedRow(producto);
    setOpenAdd(true);
  };

  const handleDeleteProducto = (id: number | undefined) => {
    if (id != null) {
      delRow.mutate(id);
    }
  };

  const handleCloseAddDialog = () => {
    setOpenAdd(false);
    setSelectedRow(undefined);
  };

  const handleProductoSuccess = async (mensaje: string) => {
    handleCloseAddDialog();
    setNotif({ open: true, severity: "success", message: mensaje });
    qc.invalidateQueries({ queryKey });
    await refetch();
  };

  const handleProductoError = (mensaje: string) => {
    setNotif({ open: true, severity: "error", message: mensaje });
  };

  const handleCloseNotif = () => {
    setNotif((prev) => ({ ...prev, open: false }));
  };

  // ==================== HELPERS PARA UI ====================
  const hasData = listado && listado.length >= 0;
  const cantidadProductos = listado?.length || 0;

  return (
    <Stack spacing={3}>
      {/* HEADER CARD - Consulta */}
      <Card elevation={0} sx={{ border: "2px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={3}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SearchIcon sx={{ fontSize: 28, color: "primary.main" }} />
              <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: "0.02em" }}>
                Recepción de mercancía
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
              <TextField
                label="Folio pedido"
                type="number"
                value={folioPedido || ""}
                onChange={(e) => setFolioPedido(Number(e.target.value))}
                InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }}
                sx={{ width: 200 }}
                size="small"
              />
              <TextField
                label="Sucursal"
                type="number"
                value={sucursal || ""}
                onChange={(e) => setSucursal(Number(e.target.value))}
                sx={{ width: 150 }}
                size="small"
              />
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleConsultar}
                disabled={isFetching}
                sx={{ height: 40, minWidth: 140 }}
              >
                Consultar
              </Button>
            </Stack>

            {/* INFO CHIPS */}
            {hasData && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap">
                <Chip
                  avatar={<Avatar sx={{ bgcolor: "primary.main", color: "white" }}>U</Avatar>}
                  label={`Usuario: ${token?.usuario ?? ""}`}
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
                <Chip
                  label={`No. Factura: ${encabezado.numeroFactura || "Sin factura"}`}
                  variant="outlined"
                  color="secondary"
                  sx={{ fontWeight: 500 }}
                />
                <Chip
                  label={`Total Factura: $${Number(encabezado.totalFactura || 0).toFixed(2)}`}
                  variant="filled"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label={`Proveedor: ${encabezado.proveedor || "N/A"}`}
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* PRODUCTOS CARD */}
      {hasData && (
        <Card elevation={0} sx={{ border: "2px solid", borderColor: "divider" }}>
          <CardContent>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AddIcon sx={{ color: "primary.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Productos del pedido
                  </Typography>
                  <Chip label={`${cantidadProductos} items`} size="small" color="primary" sx={{ ml: 1 }} />
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAdd(true)}
                  size="small"
                  sx={{ textTransform: "none" }}
                >
                  Agregar producto
                </Button>
              </Box>

              <TableContainer
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <Table
                  size="small"
                  sx={{
                    "& .MuiTableHead-root": {
                      bgcolor: "grey.50",
                    },
                    "& .MuiTableBody-root .MuiTableRow-root:hover": {
                      bgcolor: "action.hover",
                      cursor: "pointer",
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell align="left" sx={{ fontWeight: 600 }}>
                        Acciones
                      </TableCell>
                      <TableCell align="left" sx={{ fontWeight: 600 }}>
                        Clave
                      </TableCell>
                      <TableCell align="left" sx={{ fontWeight: 600 }}>
                        Descripción
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Cantidad
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Costo unitario
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Importe
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(listado ?? []).map((row) => (
                      <TableRow key={`${row.claveProd}-${row.id ?? Math.random()}`}>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditProducto(row)}
                              sx={{ "&:hover": { bgcolor: "primary.light", color: "white" } }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDeleteProducto(row.id)}
                              size="small"
                              color="error"
                              disabled={row.id == null || delRow.isPending}
                              sx={{ "&:hover": { bgcolor: "error.light", color: "white" } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip label={row.claveProd} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>{row.descripcion}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.cantidad}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            ${row.costoUnitario?.toFixed?.(2) ?? "-"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                            ${((row.cantidad || 0) * (row.costoUnitario || 0)).toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />

              {/* TOTALES Y ACCIONES */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", md: "center" },
                  gap: 2,
                  p: 2,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    Total del pedido
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
                    {totalPedido.toLocaleString(undefined, { style: "currency", currency: "MXN" })}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    Total del cargo
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
                    {totalCargo.toLocaleString(undefined, { style: "currency", currency: "MXN" })}
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    variant="outlined"
                    startIcon={<PaymentsIcon />}
                    onClick={() => setOpenCargos(true)}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Cargos varios
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DoneAllIcon />}
                    disabled
                    size="large"
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Terminar recepción
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* DIÁLOGOS */}
      <AddProductoDialog
        open={openAdd}
        onClose={handleCloseAddDialog}
        folioPedido={folioPedido}
        sucursal={sucursal}
        usuario={token?.usuario ?? ""}
        row={selectedRow}
        onSuccess={handleProductoSuccess}
        onError={handleProductoError}
      />

      <CargosVariosDialog
        open={openCargos}
        onClose={() => setOpenCargos(false)}
        pedido={folioPedido}
        sucursal={sucursal}
        usuario={token?.usuario ?? ""}
      />

      {/* NOTIFICACIONES */}
      <Snackbar open={notif.open} autoHideDuration={4000} onClose={handleCloseNotif}>
        <Alert onClose={handleCloseNotif} severity={notif.severity} variant="outlined" sx={{ width: "100%" }}>
          {notif.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
