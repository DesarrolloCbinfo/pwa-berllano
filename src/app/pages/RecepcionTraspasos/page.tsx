import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
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
  CircularProgress,
} from "@mui/material";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Swal from "sweetalert2";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useAuth } from "../../../context/AuthContext";

type Sucursal = {
  cve_sucursal: number;
  nombre: string;
};

type RenglonTraspaso = {
  clave: string;
  descripcion: string;
  cantidad: number;
  costo: number;
  tasaIva: number;
  importe: number;
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

export default function RecepcionTraspasos() {
  const { consumoApi } = useConsumoApi();
  const { token } = useAuth();
  const usuarioSesion =
    token?.usuario ||
    (typeof window !== "undefined" ? localStorage.getItem("usuario") || "" : "") ||
    "ADMIN";

  const ahora = new Date();
  const fechaHoraActual = ahora.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursal, setSucursal] = useState<number | "">("");
  const [folio, setFolio] = useState<string>("");
  const [renglones, setRenglones] = useState<RenglonTraspaso[]>([]);
  const [cargandoRecuperar, setCargandoRecuperar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formatoSalida, setFormatoSalida] = useState<"ticket" | "carta">("ticket");
  const [busqueda, setBusqueda] = useState("");
  const [sinFiltro, setSinFiltro] = useState(true);
  const [registroActual, setRegistroActual] = useState(0);

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
          setSucursal(sucursalSesion.cve_sucursal);
        }
      } catch (err) {
        console.error("Error al cargar sucursales:", err);
      }
    };
    fetchSucursales();
  }, []);

  const nombreSucursal = useMemo(
    () => sucursales.find((s) => s.cve_sucursal === sucursal)?.nombre || "",
    [sucursales, sucursal]
  );

  const { subtotal, iva, total } = useMemo(() => {
    const sub = renglones.reduce((sum, r) => sum + (r.importe || 0), 0);
    const ivaCalc = renglones.reduce(
      (sum, r) => sum + (r.importe || 0) * ((r.tasaIva || 0) / 100),
      0
    );
    return { subtotal: sub, iva: ivaCalc, total: sub + ivaCalc };
  }, [renglones]);

  const handleRecuperar = async () => {
    if (!sucursal) {
      Swal.fire({
        icon: "warning",
        title: "Sucursal requerida",
        text: "Selecciona la sucursal antes de recuperar el folio.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    if (!folio.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Folio requerido",
        text: "Captura el folio del traspaso a recuperar.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    setCargandoRecuperar(true);
    try {
      const response = await consumoApi.get(
        "/api/CatTraspasoEntrada/sp_recuperar_traspaso_recepcion",
        {
          params: {
            folio: folio.trim(),
            sucursal: Number(sucursal),
          },
        }
      );

      const data = Array.isArray(response.data) ? response.data : [];

      if (data.length === 0) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: "No se encontró información para el folio indicado.",
          confirmButtonColor: "#000000",
        });
        setRenglones([]);
        return;
      }

      const mapeados: RenglonTraspaso[] = data.map((item: any) => {
        const cantidad = Number(obtenerValor(item, "cantidad", "cant") || 0);
        const costo = Number(obtenerValor(item, "costo", "costoProm") || 0);
        const tasaIva = Number(obtenerValor(item, "tasaIva", "tasa_iva", "iva") || 0);
        const importe =
          Number(obtenerValor(item, "importe") || 0) || cantidad * costo;
        return {
          clave: String(obtenerValor(item, "clave") || ""),
          descripcion: String(obtenerValor(item, "descripcion") || ""),
          cantidad,
          costo,
          tasaIva,
          importe,
        };
      });

      setRenglones(mapeados);
      setRegistroActual(0);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error al recuperar",
        text:
          err.response?.data?.mensaje ||
          "No fue posible recuperar el traspaso indicado.",
        confirmButtonColor: "#000000",
      });
    } finally {
      setCargandoRecuperar(false);
    }
  };

  const handleGuardar = async () => {
    if (!sucursal || !folio.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Selecciona la sucursal y captura el folio antes de guardar.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    if (renglones.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin renglones",
        text: "Recupera el traspaso antes de guardar la recepción.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    setGuardando(true);
    try {
      const response = await consumoApi.post(
        "/api/CatTraspasoEntrada/sp_guardar_recepcion_traspaso",
        {
          folio: folio.trim(),
          sucursal: Number(sucursal),
          usuario: usuarioSesion,
          renglones,
        }
      );

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: response.data?.mensaje || "Recepción guardada correctamente.",
        confirmButtonColor: "#000000",
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text:
          err.response?.data?.mensaje ||
          "No fue posible guardar la recepción del traspaso.",
        confirmButtonColor: "#000000",
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleBuscar = () => {
    Swal.fire({
      icon: "info",
      title: "Buscar",
      text: "Aquí se abriría el buscador de traspasos pendientes de recepción.",
      confirmButtonColor: "#000000",
    });
  };

  const handleImprimir = () => {
    if (renglones.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Nada que imprimir",
        text: "Recupera un traspaso antes de imprimir.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    window.print();
  };

  const handleCerrar = () => {
    setFolio("");
    setRenglones([]);
    setRegistroActual(0);
  };

  const cellSx = {
    border: "1px solid #b0b0b0",
    p: 0.6,
    fontSize: "0.82rem",
  };

  const totalRegistros = renglones.length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f3f4f6", minHeight: "100vh" }}>
      <Box sx={{ width: "100%", maxWidth: 900, mx: "auto" }}>
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
              Recepción de
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
              Traspasos
            </Typography>
          </Box>
          <Box sx={{ height: 6, bgcolor: "#000" }} />

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Fecha / Sucursal */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mb: 2 }}
              alignItems={{ sm: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontWeight: "bold", minWidth: 55 }}>Fecha:</Typography>
                <TextField
                  size="small"
                  value={fechaHoraActual}
                  InputProps={{ readOnly: true }}
                  sx={{ width: 190 }}
                />
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontWeight: "bold", minWidth: 70 }}>Sucursal:</Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    displayEmpty
                    value={sucursal}
                    onChange={(e) => setSucursal(Number(e.target.value))}
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {sucursales.map((s) => (
                      <MenuItem key={s.cve_sucursal} value={s.cve_sucursal}>
                        {s.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

            {/* Folio + Recuperar */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: "bold", minWidth: 55 }}>Folio:</Typography>
              <TextField
                size="small"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                sx={{ flex: 1, maxWidth: 300 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRecuperar();
                }}
              />
              <Button
                variant="contained"
                onClick={handleRecuperar}
                disabled={cargandoRecuperar}
                sx={{
                  bgcolor: "#d9d9d9",
                  color: "#000",
                  fontWeight: "bold",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#c7c7c7", boxShadow: "none" },
                }}
              >
                {cargandoRecuperar ? <CircularProgress size={18} /> : "Recuperar"}
              </Button>
            </Stack>

            {/* Tabla */}
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ border: "1px solid #9e9e9e", borderRadius: 0, boxShadow: "none", mb: 1 }}
            >
              <Table size="small" sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f0f0f0" }}>
                    {[
                      { name: "Clave", width: 100 },
                      { name: "Descripción", width: 260 },
                      { name: "Cantidad", width: 90 },
                      { name: "Costo", width: 90 },
                      { name: "Tasa I", width: 70 },
                      { name: "Importe", width: 100 },
                    ].map((h, idx) => (
                      <TableCell key={idx} sx={{ ...cellSx, fontWeight: "bold", width: h.width }}>
                        {h.name}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody sx={{ height: 260 }}>
                  {renglones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ ...cellSx, height: 220 }} align="center">
                        <Typography variant="body2" color="text.secondary">
                          {cargandoRecuperar
                            ? "Cargando..."
                            : "Captura un folio y presiona Recuperar."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    renglones.map((row, idx) => (
                      <TableRow
                        key={`${row.clave}-${idx}`}
                        selected={idx === registroActual}
                        onClick={() => setRegistroActual(idx)}
                        sx={{
                          cursor: "pointer",
                          bgcolor: idx === registroActual ? "#cfe8fc" : "inherit",
                        }}
                      >
                        <TableCell sx={cellSx}>{row.clave}</TableCell>
                        <TableCell sx={cellSx}>{row.descripcion}</TableCell>
                        <TableCell sx={cellSx}>
                          <TextField
                            variant="standard"
                            size="small"
                            type="number"
                            value={row.cantidad}
                            InputProps={{ disableUnderline: true }}
                            onChange={(e) => {
                              const nuevaCantidad = Number(e.target.value) || 0;
                              setRenglones((prev) =>
                                prev.map((r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        cantidad: nuevaCantidad,
                                        importe: nuevaCantidad * r.costo,
                                      }
                                    : r
                                )
                              );
                            }}
                            sx={{ width: "100%" }}
                          />
                        </TableCell>
                        <TableCell sx={cellSx}>{formatoMoneda(row.costo)}</TableCell>
                        <TableCell sx={cellSx}>{row.tasaIva}%</TableCell>
                        <TableCell sx={cellSx}>{formatoMoneda(row.importe)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Barra de registro / búsqueda */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ sm: "center" }}
              justifyContent="space-between"
              sx={{ mb: 2, border: "1px solid #d0d0d0", p: 0.75, borderRadius: 0.5 }}
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="caption" sx={{ fontWeight: "bold", mr: 0.5 }}>
                  Registro:
                </Typography>
                <IconButton
                  size="small"
                  disabled={totalRegistros === 0 || registroActual === 0}
                  onClick={() => setRegistroActual(0)}
                >
                  <FirstPageIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={totalRegistros === 0 || registroActual === 0}
                  onClick={() => setRegistroActual((p) => Math.max(0, p - 1))}
                >
                  <NavigateBeforeIcon fontSize="small" />
                </IconButton>
                <TextField
                  size="small"
                  value={totalRegistros === 0 ? "" : registroActual + 1}
                  InputProps={{ readOnly: true }}
                  sx={{ width: 50 }}
                  inputProps={{ style: { textAlign: "center" } }}
                />
                <IconButton
                  size="small"
                  disabled={totalRegistros === 0 || registroActual >= totalRegistros - 1}
                  onClick={() =>
                    setRegistroActual((p) => Math.min(totalRegistros - 1, p + 1))
                  }
                >
                  <NavigateNextIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={totalRegistros === 0 || registroActual >= totalRegistros - 1}
                  onClick={() => setRegistroActual(Math.max(0, totalRegistros - 1))}
                >
                  <LastPageIcon fontSize="small" />
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.3,
                    border: "1px solid #ccc",
                    borderRadius: 0.5,
                    color: sinFiltro ? "#999" : "#000",
                    cursor: "pointer",
                  }}
                  onClick={() => setSinFiltro((v) => !v)}
                >
                  Sin filtro
                </Typography>
              </Stack>

              <TextField
                size="small"
                placeholder="Buscar"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                sx={{ width: { xs: "100%", sm: 220 } }}
              />
            </Stack>

            {/* Botonera + Formato + Totales */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ md: "flex-start" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  variant="contained"
                  onClick={handleGuardar}
                  disabled={guardando}
                  sx={{
                    bgcolor: "#d9d9d9",
                    color: "#000",
                    fontWeight: "bold",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#c7c7c7", boxShadow: "none" },
                  }}
                >
                  {guardando ? <CircularProgress size={18} /> : "Guardar"}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleBuscar}
                  sx={{
                    bgcolor: "#d9d9d9",
                    color: "#000",
                    fontWeight: "bold",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#c7c7c7", boxShadow: "none" },
                  }}
                >
                  Buscar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleImprimir}
                  sx={{
                    bgcolor: "#d9d9d9",
                    color: "#000",
                    fontWeight: "bold",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#c7c7c7", boxShadow: "none" },
                  }}
                >
                  Imprimir
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCerrar}
                  sx={{
                    bgcolor: "#d9d9d9",
                    color: "#000",
                    fontWeight: "bold",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#c7c7c7", boxShadow: "none" },
                  }}
                >
                  Cerrar
                </Button>
              </Stack>

              <Box
                sx={{
                  border: "1px solid #d0d0d0",
                  borderRadius: 0.5,
                  p: 1,
                  minWidth: 180,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: "bold", display: "block", mb: 0.5 }}>
                  Formato de salida
                </Typography>
                <RadioGroup
                  value={formatoSalida}
                  onChange={(e) => setFormatoSalida(e.target.value as "ticket" | "carta")}
                >
                  <FormControlLabel
                    value="ticket"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">Ticket</Typography>}
                  />
                  <FormControlLabel
                    value="carta"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">Carta</Typography>}
                  />
                </RadioGroup>
              </Box>

              <Stack spacing={0.5} sx={{ minWidth: 220 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontWeight: "bold" }}>Subtotal:</Typography>
                  <Typography>{formatoMoneda(subtotal)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontWeight: "bold" }}>IVA:</Typography>
                  <Typography>{formatoMoneda(iva)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontWeight: "bold" }}>Total del traspaso:</Typography>
                  <Typography sx={{ fontWeight: "bold" }}>{formatoMoneda(total)}</Typography>
                </Stack>
              </Stack>
            </Stack>

            <Typography
              variant="caption"
              align="center"
              sx={{ display: "block", mt: 3, fontWeight: "bold" }}
            >
              {`RECEPCIÓN DE TRASPASOS - SUC: ${nombreSucursal || "N/A"}, OFICINA, ${new Date().toLocaleDateString(
                "es-MX"
              )}, USR:${usuarioSesion.toUpperCase()}`}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
