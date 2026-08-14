import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
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

function escaparHtml(valor: unknown) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function RecepcionTraspasos() {
  const { consumoApi } = useConsumoApi();
  const { token } = useAuth();
  const cia = Number((token as any)?.cia || (token as any)?.idCia) || 1;
  const usuarioSesion =
    token?.usuario ||
    (typeof window !== "undefined" ? localStorage.getItem("usuario") || "" : "") ||
    "ADMIN";

  const ahora = new Date();
  const fechaHoy = ahora
    .toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split("/")
    .reverse()
    .join("-");
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
  const [sucOrigen, setSucOrigen] = useState<number>(0);
  const [folio, setFolio] = useState<string>("");
  const [fechaInicio, setFechaInicio] = useState(fechaHoy);
  const [fechaFin, setFechaFin] = useState(fechaHoy);
  const [renglones, setRenglones] = useState<RenglonTraspaso[]>([]);
  const [cargandoRecuperar, setCargandoRecuperar] = useState(false);
  const [cargandoBuscar, setCargandoBuscar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formatoSalida, setFormatoSalida] = useState<"ticket" | "carta">("ticket");
  const [registroActual, setRegistroActual] = useState(0);
  const sucursalDestino = Number(sucursal) || 0;

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
      } catch (err) {
        console.error("Error al cargar sucursales:", err);
      }
    };
    fetchSucursales();
  }, []);

  const nombreSucursal = useMemo(
    () => sucursales.find((s) => s.cve_sucursal === sucursalDestino)?.nombre || "",
    [sucursales, sucursalDestino]
  );

  const { subtotal, iva, total } = useMemo(() => {
    const sub = renglones.reduce((sum, r) => sum + (r.importe || 0), 0);
    const ivaCalc = renglones.reduce(
      (sum, r) => sum + (r.importe || 0) * ((r.tasaIva || 0) / 100),
      0
    );
    return { subtotal: sub, iva: ivaCalc, total: sub + ivaCalc };
  }, [renglones]);

  const handleRecuperar = async (
    folioSeleccionado?: string,
    sucOrigenSeleccionado?: number
  ) => {
    const folioBusqueda = (folioSeleccionado ?? folio).trim();
    const sucOrigenBusqueda = Number(sucOrigenSeleccionado) || 0;

    if (cia <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Compañía requerida",
        text: "No se ha identificado la compañía de la sesión.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    if (sucursalDestino <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Sucursal requerida",
        text: "Selecciona la sucursal destino antes de recuperar.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    if (Number(folioBusqueda) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Folio requerido",
        text: "El folio del traspaso debe ser mayor a cero.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    if (folioSeleccionado && sucOrigenBusqueda <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Origen requerido",
        text: "El traspaso seleccionado no tiene una sucursal origen válida.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    if (folioSeleccionado) setFolio(folioBusqueda);

    setCargandoRecuperar(true);
    try {
      const response = await consumoApi.get(
        "/api/Catrecepciontraspasos/sp_bw_obtener_detalle_recepcion_traspaso",
        {
          params: {
            cia,
            sucursalDestino,
            sucOrigen: sucOrigenBusqueda,
            folio: folioBusqueda,
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
          clave: String(obtenerValor(item, "clave", "clave_prod") || ""),
          descripcion: String(obtenerValor(item, "descripcion") || ""),
          cantidad,
          costo,
          tasaIva,
          importe,
        };
      });

      setRenglones(mapeados);
      setRegistroActual(0);
      setSucOrigen(sucOrigenBusqueda);
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
    if (cia <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Compañía requerida",
        text: "No se ha identificado la compañía de la sesión.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    if (sucursalDestino <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Selecciona la sucursal y captura el folio antes de guardar.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    if (Number(folio.trim()) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Folio requerido",
        text: "El folio del traspaso debe ser mayor a cero.",
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
    if (sucOrigen <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Origen requerido",
        text: "No se ha identificado la sucursal origen del traspaso.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    setGuardando(true);
    try {
      const response = await consumoApi.post(
        "/api/Catrecepciontraspasos/sp_recepcion_traspaso_bodega",
        null,
        {
          params: {
            sucOrigen,
            sucDestino: sucursalDestino,
            folio: Number(folio.trim()),
            usuario: usuarioSesion,
          },
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

  const handleBuscar = async () => {
    if (cia <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Compañía requerida",
        text: "No se ha identificado la compañía de la sesión.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    if (sucursalDestino <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Sucursal requerida",
        text: "Selecciona la sucursal destino antes de buscar.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    setCargandoBuscar(true);
    try {
      const response = await consumoApi.get(
        "/api/Catrecepciontraspasos/sp_bw_buscar_recepcion_por_fecha",
        {
          params: {
            cia,
            sucursalDestino,
            sucOrigen: 0,
            fechaInicio: `${fechaInicio}T00:00:00`,
            fechaFin: `${fechaFin}T00:00:00`,
            recibido: false,
          },
        }
      );

      const resultados = Array.isArray(response.data) ? response.data : [];


      if (resultados.length === 0) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: "No hay traspasos pendientes de recepción en el rango indicado.",
          confirmButtonColor: "#000000",
        });
        return;
      }

      const filasHtml = resultados
        .map((item: any) => {
          const folioResultado = String(obtenerValor(item, "folio") || "");
          const fechaResultado = obtenerValor(item, "fecha");
          const fechaTexto = fechaResultado
            ? new Date(fechaResultado).toLocaleDateString("es-MX")
            : "";
          const sucOrigenResultado = obtenerValor(item, "suc_origen", "sucOrigen") || "";
          const sucDestinoResultado = obtenerValor(item, "suc_destino", "sucDestino") || "";
          const totalItems = Number(obtenerValor(item, "total_items", "totalItems") || 0);
          const subtotal = Number(obtenerValor(item, "subtotal") || 0);
          const totalIva = Number(obtenerValor(item, "total_iva", "totalIva") || 0);
          const totalGeneral = Number(
            obtenerValor(item, "total_general", "totalGeneral") || 0
          );

          return `
            <tr>
              <td style="padding:6px;border:1px solid #ddd;text-align:center;">
                <input type="checkbox" name="folioRecepcion" value="${escaparHtml(folioResultado)}" />
              </td>
              <td style="padding:6px;border:1px solid #ddd;">${escaparHtml(folioResultado)}</td>
              <td style="padding:6px;border:1px solid #ddd;">${escaparHtml(fechaTexto)}</td>
              <td style="padding:6px;border:1px solid #ddd;text-align:center;">${escaparHtml(sucOrigenResultado)}</td>
              <td style="padding:6px;border:1px solid #ddd;text-align:center;">${escaparHtml(sucDestinoResultado)}</td>
              <td style="padding:6px;border:1px solid #ddd;text-align:center;">${totalItems}</td>
              <td style="padding:6px;border:1px solid #ddd;text-align:right;">${formatoMoneda(subtotal)}</td>
              <td style="padding:6px;border:1px solid #ddd;text-align:right;">${formatoMoneda(totalIva)}</td>
              <td style="padding:6px;border:1px solid #ddd;text-align:right;">${formatoMoneda(totalGeneral)}</td>
            </tr>`;
        })
        .join("");

      const seleccion = await Swal.fire({
        icon: "info",
        title: "Traspasos pendientes",
        html: `
          <div style="max-height:420px;overflow:auto;text-align:left;">
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead>
                <tr style="background:#f0f0f0;">
                  <th style="padding:6px;border:1px solid #ddd;"></th>
                  <th style="padding:6px;border:1px solid #ddd;">Folio</th>
                  <th style="padding:6px;border:1px solid #ddd;">Fecha</th>
                  <th style="padding:6px;border:1px solid #ddd;">Origen</th>
                  <th style="padding:6px;border:1px solid #ddd;">Destino</th>
                  <th style="padding:6px;border:1px solid #ddd;">Artículos</th>
                  <th style="padding:6px;border:1px solid #ddd;">Subtotal</th>
                  <th style="padding:6px;border:1px solid #ddd;">IVA</th>
                  <th style="padding:6px;border:1px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>${filasHtml}</tbody>
            </table>
          </div>
          <p style="margin:12px 0 0;font-size:13px;">Selecciona uno o más traspasos para cargarlos.</p>
        `,
        showCancelButton: true,
        confirmButtonText: "Seleccionar",
        cancelButtonText: "Cerrar",
        confirmButtonColor: "#000000",
        width: "min(95vw, 1000px)",
        preConfirm: () => {
          const seleccionados = Array.from(
            document.querySelectorAll<HTMLInputElement>(
              'input[name="folioRecepcion"]:checked'
            )
          ).map((i) => i.value);
          if (seleccionados.length === 0) {
            Swal.showValidationMessage("Selecciona al menos un traspaso.");
          }
          return seleccionados;
        },
      });

      if (
        seleccion.isConfirmed &&
        Array.isArray(seleccion.value) &&
        seleccion.value.length > 0
      ) {
        const seleccionados = resultados.filter((item: any) => {
          const folioItem = String(obtenerValor(item, "folio") || "");
          return seleccion.value.includes(folioItem);
        });

        await handleRecuperarSeleccionados(seleccionados);
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error al buscar",
        text:
          err.response?.data?.mensaje ||
          "No fue posible buscar los traspasos pendientes de recepción.",
        confirmButtonColor: "#000000",
      });
    } finally {
      setCargandoBuscar(false);
    }
  };

  const handleRecuperarSeleccionados = async (traspasos: any[]) => {
    if (cia <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Compañía requerida",
        text: "No se ha identificado la compañía de la sesión.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    if (sucursalDestino <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Sucursal requerida",
        text: "Selecciona la sucursal destino antes de recuperar.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    if (traspasos.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Traspasos requeridos",
        text: "Selecciona al menos un traspaso.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    setCargandoRecuperar(true);
    try {
      const renglonesTotal: RenglonTraspaso[] = [];
    

      for (const traspaso of traspasos) {
        const folioBusqueda = String(obtenerValor(traspaso, "folio") || "").trim();
        const sucOrigenBusqueda = Number(
          obtenerValor(traspaso, "suc_origen", "sucOrigen") || 0
        );
        if (Number(folioBusqueda) <= 0 || sucOrigenBusqueda <= 0) continue;

        const response = await consumoApi.get(
          "/api/Catrecepciontraspasos/sp_bw_obtener_detalle_recepcion_traspaso",
          {
            params: {
              cia,
              sucursalDestino,
              sucOrigen: sucOrigenBusqueda,
              folio: folioBusqueda,
            },
          }
        );

        const data = Array.isArray(response.data) ? response.data : [];
        const mapeados: RenglonTraspaso[] = data.map((item: any) => {
          const cantidad = Number(obtenerValor(item, "cantidad", "cant") || 0);
          const costo = Number(obtenerValor(item, "costo", "costoProm") || 0);
          const tasaIva = Number(obtenerValor(item, "tasaIva", "tasa_iva", "iva") || 0);
          const importe = Number(obtenerValor(item, "importe") || 0) || cantidad * costo;
          return {
            clave: String(obtenerValor(item, "clave", "clave_prod") || ""),
            descripcion: String(obtenerValor(item, "descripcion") || ""),
            cantidad,
            costo,
            tasaIva,
            importe,
          };
        });

        renglonesTotal.push(...mapeados);
      }

      if (renglonesTotal.length === 0) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: "No se encontró información para los folios seleccionados.",
          confirmButtonColor: "#000000",
        });
        setRenglones([]);
        return;
      }

      setFolio(String(obtenerValor(traspasos[0], "folio") || ""));
      setRenglones(renglonesTotal);
      setRegistroActual(0);
      setSucOrigen(
        Number(obtenerValor(traspasos[0], "suc_origen", "sucOrigen") || 0)
      );
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error al recuperar",
        text:
          err.response?.data?.mensaje ||
          "No fue posible recuperar los traspasos seleccionados.",
        confirmButtonColor: "#000000",
      });
    } finally {
      setCargandoRecuperar(false);
    }
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
                    renderValue={(value) =>
                      value === "" ? (
                        <em>Seleccione...</em>
                      ) : (
                        sucursales.find((s) => s.cve_sucursal === Number(value))?.nombre || ""
                      )
                    }
                  >
                    <MenuItem value="">
                      <em>Seleccione...</em>
                    </MenuItem>
                    {sucursales
                      .filter((s) => s.cve_sucursal !== Number(token?.claveDepartamento))
                      .map((s) => (
                        <MenuItem key={s.cve_sucursal} value={s.cve_sucursal}>
                          {s.nombre}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mb: 2 }}
              alignItems={{ sm: "center" }}
            >
              <Typography sx={{ fontWeight: "bold", minWidth: 110 }}>
                Rango de fechas:
              </Typography>
              <TextField
                size="small"
                type="date"
                label="Desde"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                type="date"
                label="Hasta"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
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
                            : "Busca y selecciona un traspaso pendiente."}
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
                  disabled={cargandoBuscar}
                  sx={{
                    bgcolor: "#d9d9d9",
                    color: "#000",
                    fontWeight: "bold",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#c7c7c7", boxShadow: "none" },
                  }}
                >
                  {cargandoBuscar ? <CircularProgress size={18} /> : "Buscar"}
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
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
