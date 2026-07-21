import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
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
  IconButton,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useAuth } from "../../../context/AuthContext";
import Swal from "sweetalert2";

type TraspasoRow = {
  id: number;
  exis: number;
  clave: string;
  descripcion: string;
  cantidad: number;
  costoProm: number;
  importe: number;
  obs: string;
  validado: boolean;
  esFraccion: boolean;
  recuperado: boolean;
  cantidadAnterior: number;
};

type Sucursal = {
  cve_sucursal: number;
  nombre: string;
};

type ProductoSelector = {
  Clave: string;
  Descripcion: string;
};

function formatoMoneda(valor: number) {
  return `$${valor.toFixed(2)}`;
}

const validarCantidad = async (nuevaCantidad: number, producto: any) => {
  if (
    nuevaCantidad === null ||
    nuevaCantidad === undefined ||
    isNaN(nuevaCantidad)
  ) {
    await Swal.fire({
      icon: "warning",
      title: "Cantidad requerida",
      text: "Este campo no puede quedar vacío.",
      confirmButtonColor: "#1f2937",
    });
    return false;
  }

  if (nuevaCantidad <= 0) {
    await Swal.fire({
      icon: "warning",
      title: "Cantidad no válida",
      text: "Ingrese solo valores positivos.",
      confirmButtonColor: "#1f2937",
    });
    return false;
  }

  if (nuevaCantidad > 999999) {
    await Swal.fire({
      icon: "warning",
      title: "Cantidad no válida",
      text: "Ingrese valores de hasta 999999.",
      confirmButtonColor: "#1f2937",
    });
    return false;
  }

  const esEntero = Number.isInteger(nuevaCantidad);
  if (!producto.esFraccion && !esEntero) {
    await Swal.fire({
      icon: "warning",
      title: "Cantidad no válida",
      text: "Valor no válido para este producto. No se aceptan valores decimales.",
      confirmButtonColor: "#1f2937",
    });
    return false;
  }

  let existenciaDisponible = Number(producto.existencia || 0);
  const cantidadAnterior = Number(producto.cantidadAnterior || 0);

  if (producto.recuperado) {
    existenciaDisponible += cantidadAnterior;
  }

  if (nuevaCantidad > existenciaDisponible) {
    await Swal.fire({
      icon: "warning",
      title: "Existencia insuficiente",
      text: `La cantidad ingresada es superior a la existencia actual del artículo [${existenciaDisponible}].\n\nIngrese una cantidad menor.`,
      confirmButtonColor: "#1f2937",
    });
    return false;
  }

  return true;
};

export default function TraspasoMercancia() {
  const navigate = useNavigate();
  const { consumoApi } = useConsumoApi();
  const { token } = useAuth();
  const cantidadAnteriorRef = useRef<Record<number, number>>({});

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [productosSelector, setProductosSelector] = useState<ProductoSelector[]>([]);

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await consumoApi.get(
          "/api/CatSucursales/sp_bw_cat_sucursales_sel",
          { params: { cve_sucursal: 0 } }
        );
        const data = (response.data || []).filter(
          (item: Sucursal) => item.nombre !== "TODAS"
        );
        setSucursales(data);

        const sucursalSesion = data.find(
          (item: Sucursal) => item.cve_sucursal === Number(token?.claveDepartamento)
        );
        if (sucursalSesion) {
          setSucOrigen(sucursalSesion.cve_sucursal);
        }
      } catch (err) {
        console.error("Error al cargar sucursales:", err);
      }
    };
    fetchSucursales();
  }, []);

  const [folio, setFolio] = useState<number>(1278);
  const [fecha, setFecha] = useState<string>(
    new Date().toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  );
  const [sucOrigen, setSucOrigen] = useState<number | "">("");
  const [sucDestino, setSucDestino] = useState<number | "">("");

  const emptyRow: TraspasoRow = {
    id: Date.now(),
    exis: 0,
    clave: "",
    descripcion: "",
    cantidad: 0,
    costoProm: 0,
    importe: 0,
    obs: "",
    validado: false,
    esFraccion: false,
    recuperado: false,
    cantidadAnterior: 0,
  };

  const [rows, setRows] = useState<TraspasoRow[]>([emptyRow]);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(emptyRow.id);
  const [validandoClaveId, setValidandoClaveId] = useState<number | null>(null);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [verNoValidados, setVerNoValidados] = useState(false);

  useEffect(() => {
    const fetchProductosSelector = async () => {
      try {
        setCargandoProductos(true);
        const response = await consumoApi.get(
          "/api/CatTraspasoSalida/sp_obtener_lista_selector_productos"
        );
        setProductosSelector(response.data || []);
      } catch (err) {
        console.error("Error al cargar el selector de productos:", err);
        Swal.fire({
          icon: "error",
          title: "Error al cargar productos",
          text: "No fue posible cargar el listado de claves.",
          confirmButtonColor: "#1f2937",
        });
      } finally {
        setCargandoProductos(false);
      }
    };

    fetchProductosSelector();
  }, []);

  const displayedRows = useMemo(() => {
    if (!verNoValidados) return rows;
    return rows.filter((r) => !r.validado);
  }, [rows, verNoValidados]);

  const { subtotal, iva, total } = useMemo(() => {
    const sub = rows.reduce((sum, r) => sum + r.importe, 0);
    const ivaCalc = sub * 0.16;
    return { subtotal: sub, iva: ivaCalc, total: sub + ivaCalc };
  }, [rows]);

  const updateRow = (
    id: number,
    field: keyof TraspasoRow,
    value: string | number | boolean
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value } as TraspasoRow;
        if (field === "cantidad" || field === "costoProm") {
          updated.importe =
            Number(updated.cantidad || 0) * Number(updated.costoProm || 0);
        }
        return updated;
      })
    );
  };

  const handleSeleccionarClave = async (row: TraspasoRow, claveSeleccionada?: string) => {
    const claveInput = (claveSeleccionada ?? row.clave).trim();
    if (!claveInput || validandoClaveId === row.id) return;

    if (sucOrigen === "" || sucDestino === "") {
      await Swal.fire({
        icon: "warning",
        title: "Sucursales requeridas",
        text: "Selecciona la sucursal de origen y la sucursal de destino antes de capturar la clave.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    setValidandoClaveId(row.id);
    try {
      const response = await consumoApi.post(
        "/api/CatTraspasoSalida/sp_validar_y_cargar_producto_traspaso",
        {
          claveInput,
          sucursalOrigen: sucOrigen,
          sucursalDestino: sucDestino,
          validarExistenciaEstricta: true,
        }
      );

      const data = Array.isArray(response.data) ? response.data[0] : response.data;

      if (data && typeof data === "object") {
        const keys = Object.keys(data);
        const esSoloMensaje = keys.length === 1 && keys[0] === "mensaje";

        if (esSoloMensaje) {
          await Swal.fire({
            icon: "warning",
            title: "Producto no disponible",
            text: data.mensaje,
            confirmButtonColor: "#000000",
          });
        } else {
          const buscarCampo = (nombres: string[], defecto: any) => {
            const keys = Object.keys(data);
            for (const nombre of nombres) {
              const key = keys.find((k) => k.toLowerCase() === nombre.toLowerCase());
              if (key !== undefined && data[key] !== undefined && data[key] !== null) {
                return data[key];
              }
            }
            return defecto;
          };

          setRows((prev) =>
            prev.map((r) => {
              if (r.id !== row.id) return r;

              const cantidadVal = Number(buscarCampo(["cantidad", "cant"], r.cantidad)) || 0;
              const costoVal =
                Number(
                  buscarCampo(
                    ["costoProm", "costoPromedio", "costo"],
                    r.costoProm
                  )
                ) || 0;
              const exisVal =
                Number(
                  buscarCampo(
                    ["existencia", "exis", "stock", "disponible"],
                    r.exis
                  )
                ) || 0;
              const descripcionVal = buscarCampo(["descripcion", "descrip"], r.descripcion);
              const claveVal = (buscarCampo(["clave"], r.clave) ?? "").toString().trim();
              const esFraccionVal = Boolean(
                buscarCampo(
                  ["esFraccion", "es_fraccion", "fraccion", "esFraccionado"],
                  r.esFraccion
                )
              );
              const recuperadoVal = Boolean(
                buscarCampo(["recuperado", "Recuperado"], r.recuperado)
              );
              const cantidadAnteriorVal =
                Number(
                  buscarCampo(
                    ["cantidadAnterior", "cantidad_anterior", "cantidad_previa"],
                    r.cantidadAnterior
                  )
                ) || 0;

              return {
                ...r,
                clave: claveVal,
                descripcion: descripcionVal,
                cantidad: cantidadVal,
                costoProm: costoVal,
                exis: exisVal,
                importe: cantidadVal * costoVal,
                esFraccion: esFraccionVal,
                recuperado: recuperadoVal,
                cantidadAnterior: cantidadAnteriorVal,
              };
            })
          );
        }
      } else if (typeof data === "string" && data.trim()) {
        await Swal.fire({
          icon: "warning",
          title: "Producto no disponible",
          text: data,
          confirmButtonColor: "#000000",
        });
      }
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Error al validar producto",
        text: err.response?.data?.mensaje || "No fue posible validar la clave del producto.",
        confirmButtonColor: "#000000",
      });
    } finally {
      setValidandoClaveId(null);
    }
  };

  const handleNuevo = () => {
    setFolio((prev) => prev + 1);
    setFecha(
      new Date().toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    setSucOrigen("");
    setSucDestino("");
    const newRow = { ...emptyRow, id: Date.now() };
    setRows([newRow]);
    setSelectedRowId(newRow.id);
    setVerNoValidados(false);
  };

  const handleGuardar = () => {
    Swal.fire({
      icon: "success",
      title: "Traspaso guardado",
      text: `Traspaso folio ${folio} guardado con ${rows.length} renglones.`,
      confirmButtonColor: "#000000",
    });
  };

  const handleValidar = () => {
    if (selectedRowId == null) {
      Swal.fire({
        icon: "warning",
        title: "Renglón requerido",
        text: "Selecciona un renglón para validar.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.id === selectedRowId ? { ...r, validado: true } : r))
    );
  };

  const handleCancelarTraspaso = () => {
    const newRow = { ...emptyRow, id: Date.now() };
    setRows([newRow]);
    setSelectedRowId(newRow.id);
    setVerNoValidados(false);
  };

  const handleEliminarFila = (id: number) => {
    setRows((prev) => {
      const filtradas = prev.filter((r) => r.id !== id);
      if (filtradas.length === 0) {
        const nuevaFila = { ...emptyRow, id: Date.now() };
        setSelectedRowId(nuevaFila.id);
        return [nuevaFila];
      }
      if (selectedRowId === id) {
        setSelectedRowId(filtradas[0].id);
      }
      return filtradas;
    });
  };

  const handleBuscar = () => {
    Swal.fire({
      icon: "info",
      title: "Buscar traspasos",
      text: "Aquí se abriría el diálogo de búsqueda de traspasos.",
      confirmButtonColor: "#000000",
    });
  };

  const handleVistaPrevia = () => {
    Swal.fire({
      icon: "info",
      title: "Vista previa",
      text: "Vista previa del traspaso folio " + folio,
      confirmButtonColor: "#1f2937",
    });
  };

  const cellSx = {
    border: "1px solid #b0b0b0",
    p: 0.5,
    fontSize: "0.85rem",
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f3f4f6", minHeight: "100vh" }}>
      <Box sx={{ width: "100%", maxWidth: 1100, mx: "auto" }}>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          overflow: "hidden",
          mb: 2,
          bgcolor: "#fff",
        }}
      >
        {/* Barra de título tipo ventana */}
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid #000000",
              borderRadius: 1,
              px: 1.25,
              py: 0.9,
              bgcolor: "#fff",
            }}
          >
            <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontWeight: 'bold', 
                  color: '#000000',
                  fontSize: '1.1rem',
                  mb: 0.5
                }}
              >
              Traspasos de salida
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "#111827" }}>
              {new Date().toLocaleDateString("es-MX")}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 2, md: 3 }, pb: 2.5 }} />
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: { xs: 2, md: 3 }, bgcolor: "#fff" }}>
          {/* Encabezado de datos */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              mb: 3,
              p: 2,
              border: "1px solid #e5e7eb",
              borderRadius: 1.5,
              bgcolor: "#f9fafb",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontWeight: "bold", minWidth: 90 }}>
                N° de folio:
              </Typography>
              <TextField
                size="small"
                value={folio}
                onChange={(e) => setFolio(Number(e.target.value) || 0)}
                sx={{ width: 120, input: { textAlign: "right" } }}
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontWeight: "bold", color: "blue", minWidth: 100 }}>
                Suc. origen:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="origen-label">Sucursal origen</InputLabel>
                <Select
                  labelId="origen-label"
                  value={sucOrigen}
                  label="Sucursal origen"
                  onChange={(e) => setSucOrigen(Number(e.target.value))}
                >
                  {sucursales.map((s) => (
                    <MenuItem key={s.cve_sucursal} value={s.cve_sucursal}>
                      {s.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontWeight: "bold", minWidth: 90 }}>Fecha:</Typography>
              <TextField
                size="small"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                sx={{ width: 200 }}
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontWeight: "bold", color: "black", minWidth: 100 }}>
                Suc. destino:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="destino-label">Sucursal destino</InputLabel>
                <Select
                  labelId="destino-label"
                  value={sucDestino}
                  label="Sucursal destino"
                  onChange={(e) => setSucDestino(Number(e.target.value))}
                >
                  {sucursales.map((s) => (
                    <MenuItem key={s.cve_sucursal} value={s.cve_sucursal}>
                      {s.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {/* Tabla */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ border: "1px solid #e5e7eb", mb: 3, borderRadius: 1.5, boxShadow: "none" }}
          >
            <Table size="small" sx={{ tableLayout: "fixed" }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f9fafb" }}>
                  {["Exis", "Clave", "Descripción", "Cantidad", "Costo prom", "Importe", "OBS"].map(
                    (h, idx) => (
                      <TableCell key={idx} sx={{ ...cellSx, fontWeight: "bold" }}>
                        {h}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedRows.map((row) => (
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
                      <TextField
                        variant="standard"
                        size="small"
                        type="number"
                        value={row.exis}
                        onChange={(e) =>
                          updateRow(row.id, "exis", Number(e.target.value) || 0)
                        }
                        InputProps={{ disableUnderline: true }}
                        sx={{ width: "100%" }}
                      />
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Autocomplete
                        size="small"
                        options={productosSelector}
                        loading={cargandoProductos}
                        value={productosSelector.find((producto) => producto.Clave.trim() === row.clave) || null}
                        getOptionLabel={(producto) => producto.Clave.trim()}
                        isOptionEqualToValue={(option, value) => option.Clave === value.Clave}
                        onChange={(_, producto) => {
                          if (!producto) return;
                          const clave = producto.Clave.trim();
                          updateRow(row.id, "clave", clave);
                          updateRow(row.id, "descripcion", producto.Descripcion);
                          handleSeleccionarClave(row, clave);
                        }}
                        renderOption={(props, producto) => (
                          <li {...props} key={`${producto.Clave}-${producto.Descripcion}`}>
                            {producto.Clave.trim()}
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="standard"
                            placeholder="Seleccionar"
                            InputProps={{
                              ...params.InputProps,
                              disableUnderline: true,
                              endAdornment: (
                                <>
                                  {validandoClaveId === row.id || cargandoProductos ? <CircularProgress size={14} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                        sx={{ width: "100%", minWidth: 130 }}
                      />
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <TextField
                        variant="standard"
                        size="small"
                        value={row.descripcion}
                        onChange={(e) =>
                          updateRow(row.id, "descripcion", e.target.value)
                        }
                        InputProps={{ disableUnderline: true }}
                        sx={{ width: "100%" }}
                      />
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <TextField
                        variant="standard"
                        size="small"
                        type="number"
                        value={row.cantidad}
                        onFocus={() => {
                          cantidadAnteriorRef.current[row.id] = row.cantidad;
                        }}
                        onChange={(e) =>
                          updateRow(row.id, "cantidad", Number(e.target.value) || 0)
                        }
                        onBlur={async (e) => {
                          const nuevaCantidad = Number(e.target.value) || 0;
                          const anterior = cantidadAnteriorRef.current[row.id] ?? 0;
                          const esValida = await validarCantidad(nuevaCantidad, {
                            existencia: row.exis,
                            esFraccion: row.esFraccion,
                            recuperado: row.recuperado,
                            cantidadAnterior: anterior,
                          });
                          if (!esValida) {
                            updateRow(row.id, "cantidad", anterior);
                          }
                        }}
                        InputProps={{ disableUnderline: true }}
                        sx={{ width: "100%" }}
                      />
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <TextField
                        variant="standard"
                        size="small"
                        type="number"
                        value={row.costoProm}
                        onChange={(e) =>
                          updateRow(row.id, "costoProm", Number(e.target.value))
                        }
                        InputProps={{ disableUnderline: true }}
                        sx={{ width: "100%" }}
                      />
                    </TableCell>
                    <TableCell sx={cellSx}>{formatoMoneda(row.importe)}</TableCell>
                    <TableCell sx={cellSx}>
                      <TextField
                        variant="standard"
                        size="small"
                        value={row.obs}
                        onChange={(e) =>
                          updateRow(row.id, "obs", e.target.value)
                        }
                        InputProps={{ disableUnderline: true }}
                        sx={{ width: "100%" }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Botones */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            flexWrap="wrap"
            sx={{ mb: 3, pt: 2, borderTop: "1px solid #e5e7eb" }} 
          >
            <Button variant="contained" onClick={handleNuevo}>
              Nuevo
            </Button>
            <Button variant="contained" onClick={handleGuardar}>
              Guardar
            </Button>
            <Button variant="contained" onClick={handleVistaPrevia}>
              Vista previa
            </Button>
            <Button variant="contained" onClick={handleCancelarTraspaso}>
              Cancelar Traspaso
            </Button>
            <Button variant="contained" onClick={handleBuscar}>
              Buscar
            </Button>
          </Stack>

          {/* Totales */}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Box sx={{ width: 260, p: 2, borderRadius: 1.5, bgcolor: "#f9fafb", border: "1px solid #e5e7eb" }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography sx={{ fontWeight: "bold" }}>Subtotal:</Typography>
                <Typography>{formatoMoneda(subtotal)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography sx={{ fontWeight: "bold" }}>IVA:</Typography>
                <Typography>{formatoMoneda(iva)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontWeight: "bold" }}>Total:</Typography>
                <Typography>{formatoMoneda(total)}</Typography>
              </Stack>
            </Box>
          </Box>
      </Paper>
      </Box>
    </Box>
  );
}
