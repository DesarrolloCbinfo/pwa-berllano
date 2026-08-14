import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
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
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useAuth } from "../../../context/AuthContext";

type TipoMovimiento = {
  tipo_movto: number;
  descripcion: string;
  movto_salida: boolean;
  blnSucursal: boolean;
  blnProveedor: boolean;
};

type ProductoSelector = {
  clave_prod: string;
  descripcion: string;
};

type RenglonAjuste = {
  id: number;
  clave: string;
  descripcion: string;
  existenciaActual: number;
  entrada: number;
  salida: number;
  costo: number;
  tasa: number;
  nuevaExistencia: number;
};

type AjusteHistorial = {
  folio: number;
  fecha: string;
  usuario: string;
  total: number;
  estado: string;
};

type AjusteBusquedaRow = {
  folio: number;
  fecha: string;
  usuario: string;
  entradas: number;
  salidas: number;
  costo: number;
  estado?: string;
};

const obtenerValor = (obj: any, ...nombres: string[]) => {
  if (!obj || typeof obj !== "object") return undefined;
  const keys = Object.keys(obj);
  for (const nombre of nombres) {
    const key = keys.find((k) => k.toLowerCase() === nombre.toLowerCase());
    if (key !== undefined && obj[key] != null && obj[key] !== "") {
      return obj[key];
    }
  }
  return undefined;
};

function formatoMoneda(valor: number) {
  return `$${(valor || 0).toFixed(2)}`;
}

const formatearFechaInput = (fecha: Date = new Date()) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const crearRenglonVacio = (): RenglonAjuste => ({
  id: Date.now(),
  clave: "",
  descripcion: "",
  existenciaActual: 0,
  entrada: 0,
  salida: 0,
  costo: 0,
  tasa: 0,
  nuevaExistencia: 0,
});

export default function AjustesInventario() {
  const { consumoApi } = useConsumoApi();
  const { token } = useAuth();
  const usuarioSesion =
    token?.usuario ||
    (typeof window !== "undefined" ? localStorage.getItem("usuario") || "" : "") ||
    "ADMIN";

  const sucursalSesion = useMemo(() => {
    if (token && (token as any).sucursal) {
      return Number((token as any).sucursal) || 0;
    }
    if (token?.claveDepartamento) {
      return Number(token.claveDepartamento) || 0;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("token") || "{}");
        return Number(stored.sucursal || stored.claveDepartamento || 0) || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }, [token]);

  const ahora = new Date();
  const fechaHoraActual = ahora.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const [folio, setFolio] = useState<number>(218);
  const [folioDocumento, setFolioDocumento] = useState("");
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([]);
  const [tipoMovimiento, setTipoMovimiento] = useState<number | "">("");
  const [mostrarExistencias, setMostrarExistencias] = useState(true);
  const [productosSelector, setProductosSelector] = useState<ProductoSelector[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [validandoClaveId, setValidandoClaveId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [abrirDialogoBuscar, setAbrirDialogoBuscar] = useState(false);
  const [fechaInicioBuscar, setFechaInicioBuscar] = useState(formatearFechaInput);
  const [fechaFinBuscar, setFechaFinBuscar] = useState(formatearFechaInput);
  const [historialAjustes, setHistorialAjustes] = useState<AjusteHistorial[]>([]);
  const [historialAjustesRaw, setHistorialAjustesRaw] = useState<AjusteBusquedaRow[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [ajusteSeleccionado, setAjusteSeleccionado] = useState<AjusteHistorial | null>(null);

  const [renglones, setRenglones] = useState<RenglonAjuste[]>([crearRenglonVacio()]);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(renglones[0].id);

  useEffect(() => {
    const fetchTiposMovimiento = async () => {
      try {
        const response = await consumoApi.get(
          "/api/CatAjustes/sp_fw_ajustes"
        );
        setTiposMovimiento(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error al cargar tipos de movimiento:", err);
      }
    };
    fetchTiposMovimiento();
  }, []);

  useEffect(() => {
    const fetchProductosSelector = async () => {
      try {
        setCargandoProductos(true);
        const response = await consumoApi.get(
          "/api/CatAjustes/sp_fw_obtener_productos_activos"
        );
        setProductosSelector(response.data || []);
      } catch (err) {
        console.error("Error al cargar el selector de productos:", err);
      } finally {
        setCargandoProductos(false);
      }
    };
    fetchProductosSelector();
  }, []);

  useEffect(() => {
    if (abrirDialogoBuscar) {
      const hoy = formatearFechaInput();
      setFechaInicioBuscar(hoy);
      setFechaFinBuscar(hoy);
      setHistorialAjustes([]);
      setHistorialAjustesRaw([]);
      setAjusteSeleccionado(null);
    }
  }, [abrirDialogoBuscar]);

  const tipoMovimientoSeleccionado = useMemo(
    () => tiposMovimiento.find((t) => t.tipo_movto === tipoMovimiento) || null,
    [tiposMovimiento, tipoMovimiento]
  );
  const esMovimientoSalida = tipoMovimientoSeleccionado?.movto_salida ?? null;

  const total = useMemo(
    () =>
      renglones.reduce(
        (sum, r) => sum + (r.entrada - r.salida) * (r.costo || 0),
        0
      ),
    [renglones]
  );

  const recalcularNuevaExistencia = (r: RenglonAjuste): number =>
    (r.existenciaActual || 0) + (r.entrada || 0) - (r.salida || 0);

  const updateRenglon = (
    id: number,
    field: keyof RenglonAjuste,
    value: string | number
  ) => {
    setRenglones((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const actualizado = { ...r, [field]: value } as RenglonAjuste;
        if (["entrada", "salida", "existenciaActual"].includes(field as string)) {
          actualizado.nuevaExistencia = recalcularNuevaExistencia(actualizado);
        }
        return actualizado;
      })
    );
  };

  const handleSeleccionarProducto = async (
    row: RenglonAjuste,
    producto: ProductoSelector
  ) => {
    const claveInput = producto.clave_prod.trim();
    updateRenglon(row.id, "clave", claveInput);
    updateRenglon(row.id, "descripcion", producto.descripcion);
    await handleSeleccionarClave(row, claveInput, producto.descripcion);
  };

  const handleSeleccionarClave = async (
    row: RenglonAjuste,
    claveSeleccionada: string,
    descripcionSeleccionada: string
  ) => {
    const claveInput = claveSeleccionada.trim();
    if (!claveInput || validandoClaveId === row.id) return;

    setValidandoClaveId(row.id);
    try {
      const response = await consumoApi.get(
        "/api/CatAjusteInventario/sp_obtener_producto_para_ajuste",
        { params: { claveInput } }
      );
      const data = Array.isArray(response.data) ? response.data[0] : response.data;

      if (!data) {
        setValidandoClaveId(null);
        return;
      }

      const descripcion = descripcionSeleccionada;
      const existencia = Number(obtenerValor(data, "existencia", "exist_act") || 0);
      const costo = Number(obtenerValor(data, "costo", "costoProm") || 0);

      setRenglones((prev) => {
        const actualizadas = prev.map((r) => {
          if (r.id !== row.id) return r;
          const actualizado: RenglonAjuste = {
            ...r,
            clave: claveInput,
            descripcion,
            existenciaActual: existencia,
            costo,
          };
          actualizado.nuevaExistencia = recalcularNuevaExistencia(actualizado);
          return actualizado;
        });
        const esUltima = actualizadas[actualizadas.length - 1]?.id === row.id;
        if (esUltima) {
          const nueva = crearRenglonVacio();
          return [...actualizadas, nueva];
        }
        return actualizadas;
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error al validar producto",
        text:
          err.response?.data?.mensaje ||
          "No fue posible validar la clave del producto.",
        confirmButtonColor: "#000000",
      });
    } finally {
      setValidandoClaveId(null);
    }
  };

  const handleNuevo = () => {
    setFolio((prev) => prev + 1);
    setFolioDocumento("");
    setTipoMovimiento("");

    const nueva = crearRenglonVacio();
    setRenglones([nueva]);
    setSelectedRowId(nueva.id);
  };

  const handleGuardar = async () => {
    if (!tipoMovimiento) {
      Swal.fire({
        icon: "warning",
        title: "Tipo de movimiento requerido",
        text: "Selecciona el tipo de movimiento antes de guardar.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    const renglonesValidos = renglones.filter((r) => r.clave.trim());
    if (renglonesValidos.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin renglones",
        text: "Captura al menos un producto para ajustar.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    setGuardando(true);
    try {
      const response = await consumoApi.post(
        "/api/CatAjusteInventario/sp_bw_guardar_ajuste_inventario",
        {
          folio,
          folioDocumento: folioDocumento || null,
          tipoMovimiento,
          usuario: usuarioSesion,
          renglones: renglonesValidos,
        }
      );

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: response.data?.mensaje || "Ajuste guardado correctamente.",
        confirmButtonColor: "#000000",
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text:
          err.response?.data?.mensaje ||
          "No fue posible guardar el ajuste de inventario.",
        confirmButtonColor: "#000000",
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleBuscar = () => {
    setAbrirDialogoBuscar(true);
  };

  const handleCerrarDialogoBuscar = () => {
    setAbrirDialogoBuscar(false);
    setAjusteSeleccionado(null);
  };

  const seleccionarAjuste = (ajuste: AjusteHistorial) => {
    const renglonesAjuste = historialAjustesRaw.filter((r) => r.folio === ajuste.folio);

    if (renglonesAjuste.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin renglones",
        text: "No se encontraron renglones para este ajuste.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    const nuevosRenglones: RenglonAjuste[] = renglonesAjuste.map((row, idx) => {
      const existenciaActual =
        Number(obtenerValor(row, "existencia", "exis", "existenciaActual")) || 0;
      const entradas = Number(obtenerValor(row, "entradas", "entrada")) || 0;
      const salidas = Number(obtenerValor(row, "salidas", "salida")) || 0;
      const costo = Number(obtenerValor(row, "costo", "costoProm")) || 0;
      const clave = String(obtenerValor(row, "clave", "clave_prod", "claveProd") || "");
      const descripcion = String(obtenerValor(row, "descripcion", "descrip", "nombre") || "");
      const tasa = Number(obtenerValor(row, "tasa", "tasaIva", "tasa_iva")) || 0;

      return {
        id: Date.now() + idx,
        clave,
        descripcion,
        existenciaActual,
        entrada: entradas,
        salida: salidas,
        costo,
        tasa,
        nuevaExistencia: existenciaActual + entradas - salidas,
      };
    });

    const tipoMovtoRaw = obtenerValor(renglonesAjuste[0], "tipo_movto", "tipo_movimiento");
    if (tipoMovtoRaw != null) {
      setTipoMovimiento(Number(tipoMovtoRaw));
    }

    setFolio(ajuste.folio);
    setRenglones(nuevosRenglones);
    setSelectedRowId(nuevosRenglones[0]?.id ?? null);
    setAjusteSeleccionado(null);
    setAbrirDialogoBuscar(false);
  };

  const handleAceptarAjuste = () => {
    if (ajusteSeleccionado) {
      seleccionarAjuste(ajusteSeleccionado);
    }
  };

  const handleBuscarHistorial = async () => {
    if (!sucursalSesion) {
      Swal.fire({
        icon: "warning",
        title: "Sucursal no disponible",
        text: "No se pudo determinar la sucursal del usuario.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    setCargandoHistorial(true);
    try {
      const response = await consumoApi.get(
        "/api/CatAjustes/sp_fw_buscar_ajustes_por_fechas",
        {
          params: {
            sucursal: sucursalSesion,
            fechaInicio: fechaInicioBuscar,
            fechaFin: fechaFinBuscar,
          },
        }
      );

      const raw: AjusteBusquedaRow[] = Array.isArray(response.data)
        ? response.data
        : [];

      const agrupados = raw.reduce<Record<number, AjusteHistorial>>(
        (acc, row) => {
          const movimiento =
            (Number(row.entradas) || 0) - (Number(row.salidas) || 0);
          const importe = Math.abs(movimiento) * (Number(row.costo) || 0);

          if (acc[row.folio]) {
            acc[row.folio].total += importe;
          } else {
            acc[row.folio] = {
              folio: row.folio,
              fecha: row.fecha,
              usuario: row.usuario,
              total: importe,
              estado: row.estado || "",
            };
          }
          return acc;
        },
        {}
      );

      setHistorialAjustesRaw(raw);
      setHistorialAjustes(Object.values(agrupados));
    } catch (err) {
      console.error("Error al buscar historial de ajustes:", err);
      setHistorialAjustes([]);
      setHistorialAjustesRaw([]);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleVistaPrevia = () => {
    if (renglones.filter((r) => r.clave).length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Nada que mostrar",
        text: "Captura al menos un producto para generar la vista previa.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    window.print();
  };

  const handleSalir = () => {
    handleNuevo();
  };

  const handleAgregarRenglon = () => {
    const ultima = renglones[renglones.length - 1];
    if (renglones.length > 0 && !ultima?.clave.trim()) {
      setSelectedRowId(ultima.id);
      return;
    }
    const nueva = crearRenglonVacio();
    setRenglones([...renglones, nueva]);
    setSelectedRowId(nueva.id);
  };

  const cellSx = {
    border: "1px solid #b0b0b0",
    p: 0.5,
    fontSize: "0.82rem",
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f3f4f6", minHeight: "100vh" }}>
      <Box sx={{ width: "100%", maxWidth: 960, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #9e9e9e",
            borderRadius: 1,
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          {/* Encabezado estilo Access */}
          <Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
            <Typography
              sx={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "1.6rem",
                color: "#9e9e9e",
                lineHeight: 1.1,
              }}
            >
              Alta de
            </Typography>
            <Typography
              sx={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontWeight: 900,
                fontSize: "2.1rem",
                color: "#000",
                lineHeight: 1.1,
              }}
            >
              Ajustes al Inventario
            </Typography>
          </Box>
          <Box sx={{ height: 6, bgcolor: "#000" }} />

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Typography sx={{ fontWeight: "bold", mb: 1.5 }}>
              Datos del origen del ajuste:
            </Typography>

            {/* Fila: Folio / Tipo de movimiento */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ mb: 1.5 }}
              alignItems={{ md: "center" }}
              justifyContent="space-between"
            >

              <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, maxWidth: 420 }}>
                <Typography sx={{ fontWeight: "bold", minWidth: 130 }}>
                  Tipo de movimiento:
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    displayEmpty
                    value={tipoMovimiento}
                    onChange={(e) => setTipoMovimiento(Number(e.target.value))}
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {tiposMovimiento.map((t) => (
                      <MenuItem key={t.tipo_movto} value={t.tipo_movto}>
                        {t.descripcion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

            {/* Fila: Fecha / checkbox */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ mb: 1.5 }}
              alignItems={{ md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontWeight: "bold", minWidth: 80 }}>Fecha:</Typography>
                <TextField
                  size="small"
                  value={fechaHoraActual}
                  InputProps={{ readOnly: true }}
                  sx={{ width: 190 }}
                />
              </Stack>

              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={mostrarExistencias}
                    onChange={(e) => setMostrarExistencias(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    Mostrar existencias al capturar un producto.
                  </Typography>
                }
              />
            </Stack>

            {/* Folio del documento */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: "bold", minWidth: 140 }}>
                Folio del documento:
              </Typography>
              <TextField
                size="small"
                value={folioDocumento}
                onChange={(e) => setFolioDocumento(e.target.value)}
                sx={{ flex: 1, maxWidth: 260 }}
              />
            </Stack>

            {/* Tabla */}
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                border: "1px solid #9e9e9e",
                borderRadius: 0,
                boxShadow: "none",
                mb: 2,
                maxHeight: 320,
                overflow: "auto",
              }}
            >
              <Table size="small" stickyHeader sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f0f0f0" }}>
                    {[
                      { name: "Clave", width: 130 },
                      { name: "Descripción", width: 220 },
                      { name: "Exist. act", width: 80 },
                      { name: "Entrada", width: 80 },
                      { name: "Salida", width: 80 },
                      { name: "C", width: 70 },
                      { name: "T", width: 60 },
                      { name: "Nueva exist.", width: 90 },
                    ].map((h, idx) => (
                      <TableCell key={idx} sx={{ ...cellSx, fontWeight: "bold", width: h.width }}>
                        {h.name}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {renglones.map((row, idx) => (
                    <TableRow
                      key={row.id}
                      selected={row.id === selectedRowId}
                      onClick={() => setSelectedRowId(row.id)}
                      sx={{
                        cursor: "pointer",
                        bgcolor: row.id === selectedRowId ? "#b3d9ff" : "inherit",
                      }}
                    >
                      <TableCell sx={cellSx}>
                        <Autocomplete
                          size="small"
                          options={productosSelector}
                          loading={cargandoProductos}
                          value={
                            productosSelector.find(
                              (p) => p.clave_prod.trim() === row.clave
                            ) || null
                          }
                          getOptionLabel={(option) => option?.clave_prod?.trim() || ""}
                          isOptionEqualToValue={(option, value) => option.clave_prod === value.clave_prod}
                          onChange={(_, newValue) => {
                            if (newValue) {
                              handleSeleccionarProducto(row, newValue);
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              InputProps={{
                                ...params.InputProps,
                                disableUnderline: true,
                                endAdornment: (
                                  <>
                                    {validandoClaveId === row.id ? (
                                      <CircularProgress size={14} />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <Autocomplete
                          size="small"
                          options={productosSelector}
                          loading={cargandoProductos}
                          value={
                            productosSelector.find(
                              (p) => p.descripcion === row.descripcion
                            ) || null
                          }
                          getOptionLabel={(option) => option?.descripcion || ""}
                          isOptionEqualToValue={(option, value) => option.clave_prod === value.clave_prod}
                          onChange={(_, newValue) => {
                            if (newValue) {
                              handleSeleccionarProducto(row, newValue);
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              InputProps={{
                                ...params.InputProps,
                                disableUnderline: true,
                                endAdornment: (
                                  <>
                                    {validandoClaveId === row.id ? (
                                      <CircularProgress size={14} />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell sx={cellSx}>{row.existenciaActual}</TableCell>
                      <TableCell sx={cellSx}>
                        <TextField
                          variant="standard"
                          size="small"
                          type="number"
                          value={row.entrada}
                          disabled={esMovimientoSalida === true}
                          InputProps={{ disableUnderline: true }}
                          onChange={(e) =>
                            updateRenglon(row.id, "entrada", Number(e.target.value) || 0)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && idx === renglones.length - 1) {
                              handleAgregarRenglon();
                            }
                          }}
                          sx={{ width: "100%" }}
                        />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField
                          variant="standard"
                          size="small"
                          type="number"
                          value={row.salida}
                          disabled={esMovimientoSalida === false}
                          InputProps={{ disableUnderline: true }}
                          onChange={(e) =>
                            updateRenglon(row.id, "salida", Number(e.target.value) || 0)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && idx === renglones.length - 1) {
                              handleAgregarRenglon();
                            }
                          }}
                          sx={{ width: "100%" }}
                        />
                      </TableCell>
                      <TableCell sx={cellSx}>{formatoMoneda(row.costo)}</TableCell>
                      <TableCell sx={cellSx}>{row.tasa}%</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: "bold" }}>
                        {row.nuevaExistencia}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAgregarRenglon}
                sx={{
                  bgcolor: "#000000",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: "bold",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#424242", boxShadow: "none" },
                }}
              >
                Agregar renglón
              </Button>
            </Stack>

            {/* Botonera */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 2 }}
            >
              <Button
                variant="contained"
                onClick={handleNuevo}
                sx={{
                  bgcolor: "#d9d9d9",
                  color: "#000",
                  fontWeight: "bold",
                  boxShadow: "none",
                  minWidth: 100,
                  "&:hover": { bgcolor: "#c7c7c7", boxShadow: "none" },
                }}
              >
                Nuevo
              </Button>
              <Button
                variant="contained"
                onClick={handleBuscar}
                disabled={buscando}
                sx={{
                  bgcolor: "#d9d9d9",
                  color: "#000",
                  fontWeight: "bold",
                  boxShadow: "none",
                  minWidth: 100,
                  "&:hover": { bgcolor: "#c7c7c7", boxShadow: "none" },
                }}
              >
                Buscar
              </Button>
              <Button
                variant="contained"
                onClick={handleGuardar}
                disabled={guardando}
                sx={{
                  bgcolor: "#d9d9d9",
                  color: "#000",
                  fontWeight: "bold",
                  boxShadow: "none",
                  minWidth: 100,
                  "&:hover": { bgcolor: "#c7c7c7", boxShadow: "none" },
                }}
              >
                {guardando ? <CircularProgress size={18} /> : "Guardar"}
              </Button>
              <Button
                variant="contained"
                onClick={handleVistaPrevia}
                sx={{
                  bgcolor: "#d9d9d9",
                  color: "#000",
                  fontWeight: "bold",
                  boxShadow: "none",
                  minWidth: 100,
                  "&:hover": { bgcolor: "#c7c7c7", boxShadow: "none" },
                }}
              >
                Vista previa
              </Button>
              <Button
                variant="contained"
                onClick={handleSalir}
                sx={{
                  bgcolor: "#d9d9d9",
                  color: "#000",
                  fontWeight: "bold",
                  boxShadow: "none",
                  minWidth: 100,
                  "&:hover": { bgcolor: "#c7c7c7", boxShadow: "none" },
                }}
              >
                Salir
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
              <Typography sx={{ fontWeight: "bold" }}>Total:</Typography>
              <TextField
                size="small"
                value={formatoMoneda(total)}
                InputProps={{ readOnly: true }}
                sx={{ width: 140 }}
              />
            </Stack>
          </Box>
        </Paper>
      </Box>

      {/* Diálogo de búsqueda */}
      <Dialog
        open={abrirDialogoBuscar}
        onClose={handleCerrarDialogoBuscar}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            bgcolor: "#000000",
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          Búsqueda de ajustes de inventario
          <IconButton
            aria-label="close"
            onClick={handleCerrarDialogoBuscar}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "#fff",
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <TextField
              label="Fecha inicio"
              type="date"
              size="small"
              value={fechaInicioBuscar}
              onChange={(e) => setFechaInicioBuscar(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha fin"
              type="date"
              size="small"
              value={fechaFinBuscar}
              onChange={(e) => setFechaFinBuscar(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              onClick={handleBuscarHistorial}
              disabled={cargandoHistorial}
              sx={{
                bgcolor: "#000000",
                color: "#fff",
                textTransform: "none",
                fontWeight: "bold",
                "&:hover": { bgcolor: "#000000" },
              }}
            >
              {cargandoHistorial ? <CircularProgress size={18} color="inherit" /> : "Buscar"}
            </Button>
          </Stack>

          <TableContainer component={Paper} sx={{ maxHeight: 320 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {["Folio", "Fecha", "Usuario", "Total", "Estado", "Acciones"].map((col) => (
                    <TableCell
                      key={col}
                      sx={{
                        fontWeight: "bold",
                        bgcolor: "#e3f2fd",
                        border: "1px solid #b0b0b0",
                      }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {historialAjustes.length === 0 && !cargandoHistorial ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ border: "1px solid #b0b0b0" }}>
                      Sin resultados
                    </TableCell>
                  </TableRow>
                ) : (
                  historialAjustes.map((ajuste) => (
                    <TableRow
                      key={ajuste.folio}
                      onClick={() => setAjusteSeleccionado(ajuste)}
                      sx={{
                        cursor: "pointer",
                        bgcolor:
                          ajusteSeleccionado?.folio === ajuste.folio
                            ? "#e6e6e6"
                            : "inherit",
                        "&:hover": { bgcolor: "#e3f2fd" },
                      }}
                    >
                      <TableCell sx={{ border: "1px solid #b0b0b0" }}>
                        {ajuste.folio}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #b0b0b0" }}>
                        {new Date(ajuste.fecha).toLocaleDateString("es-MX")}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #b0b0b0" }}>
                        {ajuste.usuario}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #b0b0b0" }}>
                        {formatoMoneda(ajuste.total)}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #b0b0b0" }}>
                        {ajuste.estado}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #b0b0b0" }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            seleccionarAjuste(ajuste);
                          }}
                          sx={{
                            textTransform: "none",
                            fontWeight: "bold",
                            borderColor: "#000000",
                            color: "#000000",
                            "&:hover": { bgcolor: "#000000", color: "#fff" },
                          }}
                        >
                          Seleccionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleCerrarDialogoBuscar}
              sx={{
                bgcolor: "#d9d9d9",
                color: "#000",
                fontWeight: "bold",
                boxShadow: "none",
                textTransform: "none",
                "&:hover": { bgcolor: "#c7c7c7", boxShadow: "none" },
              }}
            >
              Cerrar
            </Button>
            <Button
              variant="contained"
              onClick={handleAceptarAjuste}
              disabled={!ajusteSeleccionado}
              sx={{
                bgcolor: "#000000",
                color: "#fff",
                fontWeight: "bold",
                boxShadow: "none",
                textTransform: "none",
                "&:hover": { bgcolor: "#bdbdbd", boxShadow: "none" },
              }}
            >
              Aceptar
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
