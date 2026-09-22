import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Checkbox,
  CircularProgress,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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

function valorVerdadero(valor: unknown) {
  const normalizado = String(valor ?? "").trim().toLowerCase();
  return valor === true || valor === 1 || ["true", "1", "si", "sí"].includes(normalizado);
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
  const [sucOrigen, setSucOrigen] = useState<number | "">("");
  const [folio, setFolio] = useState<string>("");
  const [folioBuscar, setFolioBuscar] = useState<string>("");
  const [fechaInicio, setFechaInicio] = useState(fechaHoy);
  const [fechaFin, setFechaFin] = useState(fechaHoy);
  const [renglones, setRenglones] = useState<RenglonTraspaso[]>([]);
  const [dialogoBuscarAbierto, setDialogoBuscarAbierto] = useState(false);
  const [abrirVistaPreviaCarta, setAbrirVistaPreviaCarta] = useState(false);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [seleccionadosDialogo, setSeleccionadosDialogo] = useState<number[]>([]);
  const [cargandoRecuperar, setCargandoRecuperar] = useState(false);
  const [cargandoBuscar, setCargandoBuscar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [registroAceptado, setRegistroAceptado] = useState(false);
  const [formatoSalida, setFormatoSalida] = useState<"ticket" | "carta">("ticket");
  const [registroActual, setRegistroActual] = useState(0);
  const sucursalDestino = useMemo(() => {
    if (token) {
      const s =
        Number((token as any)?.sucursal) ||
        Number((token as any)?.claveDepartamento) ||
        0;
      if (s > 0) return s;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("token") || "{}");
        const s =
          Number(stored.sucursal) || Number(stored.claveDepartamento) || 0;
        return s > 0 ? s : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }, [token]);

  const resultadosBusquedaRef = useRef<any[]>([]);

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

  const nombreSucursalOrigen = useMemo(
    () => sucursales.find((s) => s.cve_sucursal === Number(sucOrigen))?.nombre || String(sucOrigen || "—"),
    [sucursales, sucOrigen]
  );

  const totalCantidadPiezas = useMemo(
    () => renglones.reduce((sum, r) => sum + (Number(r.cantidad) || 0), 0),
    [renglones]
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
    const sucOrigenBusqueda =
      sucOrigenSeleccionado !== undefined
        ? Number(sucOrigenSeleccionado)
        : Number(sucOrigen) || 0;

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
    if (guardando) return;

    if (registroAceptado) {
      Swal.fire({
        icon: "info",
        title: "Recepción ya aceptada",
        text: "Este folio solo puede consultarse o imprimirse; no se puede guardar nuevamente.",
        confirmButtonColor: "#000000",
      });
      return;
    }

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
            sucOrigen: Number(sucOrigen),
            sucDestino: sucursalDestino,
            folio: Number(folio.trim()),
            usuario: usuarioSesion,
          },
        }
      );

      setRenglones([]);
      setFolio("");
      setSucOrigen("");
      setRegistroActual(0);

      await Swal.fire({
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
    if (cia <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Compañía requerida",
        text: "No se ha identificado la compañía de la sesión.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    if (sucursalDestino <= 0 || Number(sucOrigen) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Sucursal requerida",
        text: "Selecciona la sucursal origen antes de buscar.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    setResultadosBusqueda([]);
    setSeleccionadosDialogo([]);
    setRegistroAceptado(false);
    setDialogoBuscarAbierto(true);
    ejecutarBusquedaPendientes();
  };

  const ejecutarBusquedaPendientes = async () => {
    setCargandoBuscar(true);
    try {
      const requestParams = (recibido: boolean) => ({
        cia,
        sucursalDestino,
        sucOrigen: Number(sucOrigen),
        fechaInicio: `${fechaInicio}T00:00:00`,
        fechaFin: `${fechaFin}T00:00:00`,
        recibido,
      });

      const responses = await Promise.all([
        consumoApi.get("/api/Catrecepciontraspasos/sp_bw_buscar_recepcion_por_fecha", {
          params: requestParams(false),
        }),
        consumoApi.get("/api/Catrecepciontraspasos/sp_bw_buscar_recepcion_por_fecha", {
          params: requestParams(true),
        }),
      ]);

      const vistos = new Set<string>();
      const todosResultados = responses
        .flatMap((response) => (Array.isArray(response.data) ? response.data : []))
        .filter((item: any) => Number(obtenerValor(item, "folio") || 0) > 0)
        .filter((item: any) => {
          const key = `${obtenerValor(item, "folio")}-${obtenerValor(item, "suc_origen", "sucOrigen") || 0}`;
          if (vistos.has(key)) return false;
          vistos.add(key);
          return true;
        });

      const folioNum = folioBuscar.trim() !== "" ? Number(folioBuscar.trim()) : null;
      const resultados =
        folioNum !== null && !isNaN(folioNum)
          ? todosResultados.filter(
              (item: any) => Number(obtenerValor(item, "folio") || 0) === folioNum
            )
          : todosResultados;

      setResultadosBusqueda(resultados);
      setSeleccionadosDialogo([]);
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

  const handleCargarSeleccionadosDialogo = async () => {
    if (seleccionadosDialogo.length === 0) return;
    const seleccionados = seleccionadosDialogo.map((idx) => {
      const item = resultadosBusqueda[idx];
      return {
        folio: String(obtenerValor(item, "folio") || "").trim(),
        suc_origen: Number(obtenerValor(item, "suc_origen", "sucOrigen") || sucOrigen),
        recibido: valorVerdadero(obtenerValor(item, "recibido", "Recibido")),
        estado: String(obtenerValor(item, "estado", "Estado") || ""),
      };
    }).filter((x) => x.folio && x.suc_origen > 0);

    setDialogoBuscarAbierto(false);
    setSeleccionadosDialogo([]);
    await handleRecuperarSeleccionados(seleccionados);
  };

  const toggleSeleccionDialogo = (index: number) => {
    setSeleccionadosDialogo((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
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

    setRegistroAceptado(
      traspasos.some(
        (traspaso) =>
          traspaso.recibido ||
          String(traspaso.estado || "").trim().toUpperCase() === "ACEPTADO"
      )
    );

    setCargandoRecuperar(true);
    try {
      const renglonesTotal: RenglonTraspaso[] = [];

      const foliosMap = new Map<string, { folio: string; sucOrigen: number }>();
      for (const t of traspasos) {
        const folio = String(obtenerValor(t, "folio") || "").trim();
        const sucOrigenT = Number(obtenerValor(t, "suc_origen", "sucOrigen") || 0);
        if (!folio || sucOrigenT <= 0) continue;
        const key = `${folio}-${sucOrigenT}`;
        if (!foliosMap.has(key)) {
          foliosMap.set(key, { folio, sucOrigen: sucOrigenT });
        }
      }

      for (const { folio, sucOrigen: sucOrigenItem } of foliosMap.values()) {
        const response = await consumoApi.get(
          "/api/Catrecepciontraspasos/sp_bw_obtener_detalle_recepcion_traspaso",
          {
            params: {
              cia,
              sucursalDestino,
              sucOrigen: sucOrigenItem,
              folio,
            },
          }
        );

        const data = Array.isArray(response.data) ? response.data : [];

        const mapeados: RenglonTraspaso[] = data.map((item: any) => {
          const cantidad = Number(obtenerValor(item, "cantidad", "cant") || 0);
          const costo = Number(obtenerValor(item, "costo", "ultimo_costo", "ultimoCosto", "costoProm") || 0);
          const tasaIva = Number(obtenerValor(item, "tasaIva", "tasa_iva", "iva") || 0);
          const importe = Number(obtenerValor(item, "importe") || 0) || cantidad * costo;
          return {
            clave: String(obtenerValor(item, "clave", "clave_prod") || ""),
            descripcion: String(obtenerValor(item, "descripcion", "descrip", "nombre", "desc") || ""),
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

  const handleImprimir = async () => {
    if (renglones.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Nada que imprimir",
        text: "Recupera un traspaso antes de imprimir.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    if (formatoSalida === "carta") {
      setAbrirVistaPreviaCarta(true);
      return;
    }

    const idUsuario = Number(
      (token as any)?.claveEmpleado ||
      (token as any)?.idUsuario ||
      (token as any)?.id ||
      0
    );

    if (idUsuario <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Usuario no identificado",
        text: "No se pudo obtener la clave del empleado para enviar el ticket a impresión.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    try {
      const response = await consumoApi.post(
        "/api/Catrecepciontraspasos/sp_bw_encolar_ticket_recepcion",
        {
          idUsuario,
          idSucursal: sucursalDestino,
          sucursalDestino,
          sucOrigen: Number(sucOrigen),
          folio: Number(folio),
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Ticket enviado",
        text: response.data?.mensaje || "El ticket quedó en la cola de impresión.",
        confirmButtonColor: "#000000",
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error al enviar ticket",
        text:
          err.response?.data?.mensaje ||
          "No fue posible enviar el ticket a la cola de impresión.",
        confirmButtonColor: "#000000",
      });
    }
    return;

    const ventana = window.open("", "_blank", "width=420,height=700");
    if (!ventana) {
      Swal.fire({
        icon: "warning",
        title: "Ventana bloqueada",
        text: "Permite las ventanas emergentes para imprimir el ticket.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    try {
      const response = await consumoApi.get(
        "/api/Catrecepciontraspasos/sp_bw_ticket_recepcion_traspaso",
        {
          params: {
            sucursalDestino,
            sucOrigen: Number(sucOrigen),
            folio: Number(folio),
          },
        }
      );
      const detalle = Array.isArray(response.data) ? response.data : [];
      const cabecera = detalle[0] || {};
      const fecha = new Date(obtenerValor(cabecera, "fecha") || Date.now());
      const subtotalTicket = detalle.reduce(
        (sum: number, item: any) => sum + Number(obtenerValor(item, "subtotal_renglon") || 0),
        0
      );
      const ivaTicket = detalle.reduce(
        (sum: number, item: any) => sum + Number(obtenerValor(item, "iva_renglon") || 0),
        0
      );
      const totalTicket = detalle.reduce(
        (sum: number, item: any) => sum + Number(obtenerValor(item, "total_renglon") || 0),
        0
      );
      const productosHtml = detalle
        .map((item: any) => `
          <div class="producto">
            <div><strong>${escaparHtml(obtenerValor(item, "clave_prod", "clave"))}</strong></div>
            <div>${escaparHtml(obtenerValor(item, "descripcion"))}</div>
            <div class="producto-total">
              <span>Cant: ${escaparHtml(obtenerValor(item, "cantidad"))}</span>
              <span>${escaparHtml(formatoMoneda(Number(obtenerValor(item, "total_renglon") || 0)))}</span>
            </div>
          </div>`)
        .join("");

      ventana.document.open();
      ventana.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ticket recepción ${escaparHtml(folio)}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body { width: 72mm; margin: 0 auto; color: #000; background: #fff; font-family: "Courier New", monospace; font-size: 11px; }
    .empresa { text-align: center; font-family: Georgia, serif; font-size: 22px; font-weight: 900; letter-spacing: 2px; }
    .titulo { text-align: center; margin: 14px 0 8px; font-weight: bold; font-size: 13px; }
    .linea { border-top: 1px dashed #000; margin: 7px 0; }
    .datos div { display: flex; justify-content: space-between; gap: 8px; }
    .producto { padding: 6px 0; border-bottom: 1px dotted #777; }
    .producto-total, .total { display: flex; justify-content: space-between; gap: 8px; }
    .totales { margin-top: 8px; }
    .total-final { font-size: 13px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; }
    .recibio { margin-top: 15px; text-align: center; }
    .pie { margin-top: 14px; text-align: center; font-family: Georgia, serif; font-weight: bold; }
    @media print { body { width: 72mm; } }
  </style>
</head>
<body>
  <div class="empresa">BERLLANO</div>
  <div class="titulo">RECEPCIÓN DE MERCANCÍAS</div>
  <div class="linea"></div>
  <div class="datos">
    <div><span>Fecha:</span><strong>${escaparHtml(fecha.toLocaleDateString("es-MX"))}</strong></div>
    <div><span>Hora:</span><strong>${escaparHtml(fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }))}</strong></div>
    <div><span>Folio:</span><strong>${escaparHtml(folio)}</strong></div>
    <div><span>Origen:</span><strong>${escaparHtml(nombreSucursalOrigen)}</strong></div>
    <div><span>Destino:</span><strong>${escaparHtml(nombreSucursal)}</strong></div>
  </div>
  <div class="linea"></div>
  <div><strong>PRODUCTOS A RECIBIR</strong></div>
  ${productosHtml}
  <div class="totales">
    <div class="total"><span>Subtotal:</span><span>${escaparHtml(formatoMoneda(subtotalTicket))}</span></div>
    <div class="total"><span>IVA:</span><span>${escaparHtml(formatoMoneda(ivaTicket))}</span></div>
    <div class="total total-final"><span>Total:</span><span>${escaparHtml(formatoMoneda(totalTicket))}</span></div>
  </div>
  <div class="recibio">Recibió: <strong>${escaparHtml(usuarioSesion)}</strong></div>
  <div class="pie">BERLLANO</div>
</body>
</html>`);
      ventana.document.close();
      ventana.focus();
      ventana.onafterprint = () => ventana.close();
      ventana.setTimeout(() => ventana.print(), 700);
    } catch (err: any) {
      ventana.close();
      Swal.fire({
        icon: "error",
        title: "Error al imprimir",
        text: err.response?.data?.mensaje || "No fue posible generar el ticket de recepción.",
        confirmButtonColor: "#000000",
      });
    }
  };

  const ejecutarImpresionCarta = () => {
    window.print();
  };

  const handleCerrar = () => {
    setFolio("");
    setRenglones([]);
    setRegistroActual(0);
    setRegistroAceptado(false);
  };

  const handleCambioSucursalOrigen = (value: number | "") => {
    setSucOrigen(value);
    setFolio("");
    setRenglones([]);
    setRegistroActual(0);
    setRegistroAceptado(false);
    setResultadosBusqueda([]);
    setSeleccionadosDialogo([]);
  };

  const cellSx = {
    border: "1px solid #b0b0b0",
    p: 0.6,
    fontSize: "0.82rem",
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #seccion-impresion-carta, #seccion-impresion-carta * {
            visibility: visible;
          }
          #seccion-impresion-carta {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            margin: 0;
            background: #fff;
          }
          .no-imprimir {
            display: none !important;
          }
        }
      `}</style>
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
                <Typography sx={{ fontWeight: "bold", minWidth: 70 }}>Sucursal origen:</Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    displayEmpty
                    value={sucOrigen}
                    onChange={(e) =>
                      handleCambioSucursalOrigen(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
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
                      .filter((s) => s.cve_sucursal !== sucursalDestino)
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
              sx={{
                border: "1px solid #9e9e9e",
                borderRadius: 0,
                boxShadow: "none",
                mb: 1,
                maxHeight: 340,
                overflowY: "auto",
              }}
            >
              <Table size="small" stickyHeader sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow>
                    {[
                      { name: "Clave", width: 100 },
                      { name: "Descripción", width: 260 },
                      { name: "Cantidad", width: 90 },
                      { name: "Costo", width: 90 },
                      { name: "Tasa I", width: 70 },
                      { name: "Importe", width: 100 },
                    ].map((h, idx) => (
                      <TableCell key={idx} sx={{ ...cellSx, fontWeight: "bold", width: h.width, bgcolor: "#f0f0f0" }}>
                        {h.name}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
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
                            disabled={registroAceptado}
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
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap className="no-imprimir-carta">
                <Button
                  variant="contained"
                  onClick={handleGuardar}
                  disabled={
                    registroAceptado ||
                    guardando ||
                    cargandoRecuperar ||
                    cargandoBuscar ||
                    renglones.length === 0
                  }
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
              </Stack>

              <Box
                className="no-imprimir-carta"
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

      {/* Diálogo de búsqueda de traspasos pendientes */}
      <Dialog
        open={dialogoBuscarAbierto}
        onClose={() => setDialogoBuscarAbierto(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#000000", color: "#ffffff" }}>
          Búsqueda de traspasos pendientes
        </DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1, mb: 2 }}>
            <TextField
              label="Folio"
              type="number"
              size="small"
              sx={{ width: 120 }}
              value={folioBuscar}
              onChange={(e) => setFolioBuscar(e.target.value)}
              placeholder="Todos"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha inicio"
              type="date"
              size="small"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha fin"
              type="date"
              size="small"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              onClick={ejecutarBusquedaPendientes}
              disabled={cargandoBuscar}
              startIcon={cargandoBuscar ? <CircularProgress size={14} color="inherit" /> : undefined}
              sx={{ bgcolor: "#000000", color: "#fff", "&:hover": { bgcolor: "#333333" } }}
            >
              Buscar
            </Button>
          </Stack>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 380, overflowX: "auto" }}>
            <Table size="small" stickyHeader sx={{ width: "100%", minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f9fafb" }}>
                  <TableCell sx={{ width: 50 }} />
                  <TableCell sx={{ fontWeight: "bold", width: 70 }}>Folio</TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: 90 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: 120 }}>Origen</TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: 120 }}>Destino</TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: 90, textAlign: "center" }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: 80, textAlign: "center" }}>Partidas</TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: 100, textAlign: "right" }}>Subtotal</TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: 80, textAlign: "right" }}>IVA</TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: 100, textAlign: "right" }}>Importe</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resultadosBusqueda.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                      {cargandoBuscar ? "Buscando..." : "Sin resultados"}
                    </TableCell>
                  </TableRow>
                ) : (
                  resultadosBusqueda.map((item, idx) => {
                    const folioResultado = String(obtenerValor(item, "folio") || "");
                    const fechaResultado = obtenerValor(item, "fecha");
                    const fechaTexto = fechaResultado
                      ? new Date(fechaResultado).toLocaleDateString("es-MX")
                      : "";
                    const sucOrigenResultado = obtenerValor(item, "suc_origen", "sucOrigen") || "";
                    const sucDestinoResultado = obtenerValor(item, "suc_destino", "sucDestino") || "";
                    const nombreOrigen =
                      sucursales.find((s) => s.cve_sucursal === Number(sucOrigenResultado))?.nombre ||
                      String(sucOrigenResultado);
                    const nombreDestino =
                      sucursales.find((s) => s.cve_sucursal === Number(sucDestinoResultado))?.nombre ||
                      String(sucDestinoResultado);
                    const partidasResultado = Number(
                      obtenerValor(item, "total_partidas", "partidas", "totalPartidas") || 0
                    );
                    const estadoResultado = valorVerdadero(
                      obtenerValor(item, "recibido", "Recibido")
                    )
                      ? "ACEPTADO"
                      : "PENDIENTE";
                    const subtotalResultado = Number(obtenerValor(item, "subtotal") || 0);
                    const ivaResultado = Number(obtenerValor(item, "total_iva", "iva") || 0);
                    const importeResultado =
                      Number(obtenerValor(item, "total_general", "totalGeneral", "importe") || 0) ||
                      (subtotalResultado + ivaResultado);

                    return (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ textAlign: "center" }}>
                          <Checkbox
                            size="small"
                            checked={seleccionadosDialogo.includes(idx)}
                            onChange={() => toggleSeleccionDialogo(idx)}
                          />
                        </TableCell>
                        <TableCell>{folioResultado}</TableCell>
                        <TableCell>{fechaTexto}</TableCell>
                        <TableCell>{nombreOrigen}</TableCell>
                        <TableCell>{nombreDestino}</TableCell>
                        <TableCell sx={{ textAlign: "center", fontWeight: "bold" }}>
                          {estadoResultado}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>{partidasResultado}</TableCell>
                        <TableCell sx={{ textAlign: "right" }}>{formatoMoneda(subtotalResultado)}</TableCell>
                        <TableCell sx={{ textAlign: "right" }}>{formatoMoneda(ivaResultado)}</TableCell>
                        <TableCell sx={{ textAlign: "right" }}>{formatoMoneda(importeResultado)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoBuscarAbierto(false)} variant="outlined">
            Cerrar
          </Button>
          <Button
            onClick={handleCargarSeleccionadosDialogo}
            variant="contained"
            disabled={seleccionadosDialogo.length === 0}
            sx={{ bgcolor: "#000000", color: "#fff", "&:hover": { bgcolor: "#333333" } }}
          >
            Seleccionar ({seleccionadosDialogo.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de vista previa formato Carta estilizado */}
      <Dialog
        open={abrirVistaPreviaCarta}
        onClose={() => setAbrirVistaPreviaCarta(false)}
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
          Vista previa de recepción de traspaso (Formato Carta)
          <IconButton
            aria-label="close"
            onClick={() => setAbrirVistaPreviaCarta(false)}
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
          <Box id="seccion-impresion-carta" sx={{ p: { xs: 1, sm: 2 }, bgcolor: "#fff" }}>
            <Typography
              variant="h5"
              align="center"
              sx={{ fontWeight: "bold", letterSpacing: 1 }}
            >
              BERLLANO
            </Typography>
            <Typography
              variant="subtitle1"
              align="center"
              sx={{ fontWeight: "bold", color: "#424242", mb: 1.5 }}
            >
              RECEPCIÓN DE TRASPASO DE MERCANCÍAS
            </Typography>

            <Box sx={{ borderTop: "2px solid #000", my: 1 }} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 0.8,
                fontSize: "0.88rem",
                mb: 1.5,
              }}
            >
              <Typography variant="body2">
                <strong>FOLIO TRASPASO:</strong> {folio || "—"}
              </Typography>
              <Typography variant="body2" sx={{ textAlign: { sm: "right" } }}>
                <strong>Fecha recepción:</strong> {new Date().toLocaleDateString("es-MX")} {new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
              </Typography>
              <Typography variant="body2">
                <strong>Sucursal origen:</strong> {nombreSucursalOrigen}
              </Typography>
              <Typography variant="body2" sx={{ textAlign: { sm: "right" } }}>
                <strong>Sucursal destino:</strong> {nombreSucursal || sucursales.find((s) => s.cve_sucursal === sucursalDestino)?.nombre || "—"}
              </Typography>
              <Typography variant="body2">
                <strong>Usuario receptor:</strong> {usuarioSesion}
              </Typography>
              <Typography variant="body2" sx={{ textAlign: { sm: "right" } }}>
                <strong>Compañía:</strong> {cia}
              </Typography>
            </Box>

            <Box sx={{ borderTop: "1px dashed #757575", my: 1 }} />

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 1.5, boxShadow: "none", border: "1px solid #b0b0b0" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: "bold", py: 0.8, border: "1px solid #b0b0b0" }}>Clave</TableCell>
                    <TableCell sx={{ fontWeight: "bold", py: 0.8, border: "1px solid #b0b0b0" }}>Descripción</TableCell>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "right", py: 0.8, border: "1px solid #b0b0b0" }}>Cant.</TableCell>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "right", py: 0.8, border: "1px solid #b0b0b0" }}>Costo U.</TableCell>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "center", py: 0.8, border: "1px solid #b0b0b0" }}>IVA</TableCell>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "right", py: 0.8, border: "1px solid #b0b0b0" }}>Importe</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {renglones.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ border: "1px solid #e0e0e0", py: 0.6 }}>{r.clave}</TableCell>
                      <TableCell sx={{ border: "1px solid #e0e0e0", py: 0.6 }}>{r.descripcion}</TableCell>
                      <TableCell sx={{ border: "1px solid #e0e0e0", textAlign: "right", py: 0.6 }}>{r.cantidad}</TableCell>
                      <TableCell sx={{ border: "1px solid #e0e0e0", textAlign: "right", py: 0.6 }}>{formatoMoneda(r.costo)}</TableCell>
                      <TableCell sx={{ border: "1px solid #e0e0e0", textAlign: "center", py: 0.6 }}>{r.tasaIva}%</TableCell>
                      <TableCell sx={{ border: "1px solid #e0e0e0", textAlign: "right", py: 0.6 }}>{formatoMoneda(r.importe)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ borderTop: "1px dashed #757575", my: 1 }} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="body2">
                  <strong>Total de partidas:</strong> {renglones.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Total de piezas:</strong> {totalCantidadPiezas}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="body2">
                  <strong>Subtotal:</strong> {formatoMoneda(subtotal)}
                </Typography>
                <Typography variant="body2">
                  <strong>IVA:</strong> {formatoMoneda(iva)}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  <strong>TOTAL:</strong> {formatoMoneda(total)}
                </Typography>
              </Box>
            </Box>

            {/* Bloque de firmas */}
            <Box
              sx={{
                mt: 4,
                pt: 3,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
                textAlign: "center",
              }}
            >
              <Box>
                <Box sx={{ borderBottom: "1px solid #000", mb: 1, mx: 3 }} />
                <Typography variant="caption" sx={{ fontWeight: "bold", display: "block" }}>
                  ENTREGÓ (Origen: {nombreSucursalOrigen})
                </Typography>
              </Box>
              <Box>
                <Box sx={{ borderBottom: "1px solid #000", mb: 1, mx: 3 }} />
                <Typography variant="caption" sx={{ fontWeight: "bold", display: "block" }}>
                  RECIBIÓ ({usuarioSesion})
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className="no-imprimir" sx={{ p: 2 }}>
          <Button
            onClick={() => setAbrirVistaPreviaCarta(false)}
            variant="outlined"
          >
            Cerrar
          </Button>
          <Button
            onClick={ejecutarImpresionCarta}
            variant="contained"
            sx={{
              bgcolor: "#000000",
              color: "#fff",
              fontWeight: "bold",
              "&:hover": { bgcolor: "#333333" },
            }}
          >
            Imprimir Formato Carta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </>
  );
}
