import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
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
import DeleteIcon from "@mui/icons-material/Delete";
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
  costo?: number;
  tasa_iva?: number;
  existencia?: number;
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
  total?: number;
  estado?: string;
};

const obtenerValor = (obj: any, ...nombres: string[]) => {
  if (!obj || typeof obj !== "object") return undefined;
  const keys = Object.keys(obj);
  for (const nombre of nombres) {
    const key = keys.find((k) =>
      k.toLowerCase().includes(nombre.toLowerCase())
    );
    if (key !== undefined && obj[key] != null && obj[key] !== "") {
      return obj[key];
    }
  }
  return undefined;
};

function formatoMoneda(valor: number) {
  return `$${(valor || 0).toFixed(2)}`;
}

const normalizarCosto = (valor: number) => Number((Number(valor) || 0).toFixed(2));
const normalizarTasa = (valor: number) => {
  let n = Number(valor) || 0;
  if (n > 1) n = n / 100;
  return Number(n.toFixed(4));
};

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
  const [tipoMovtoBuscar, setTipoMovtoBuscar] = useState<number | "">("");
  const [historialAjustes, setHistorialAjustes] = useState<AjusteHistorial[]>([]);
  const [historialAjustesRaw, setHistorialAjustesRaw] = useState<AjusteBusquedaRow[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [ajusteSeleccionado, setAjusteSeleccionado] = useState<AjusteHistorial | null>(null);
  const [usuarioAjuste, setUsuarioAjuste] = useState<string>("");
  const [estadoAjuste, setEstadoAjuste] = useState<string>("");
  const [abrirVistaPrevia, setAbrirVistaPrevia] = useState(false);
  const [vistaPreviaGuardar, setVistaPreviaGuardar] = useState(false);

  const [renglones, setRenglones] = useState<RenglonAjuste[]>([crearRenglonVacio()]);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(renglones[0].id);
  const temporalGuardadoRef = useRef<Record<string, { entradas: number; salidas: number }>>({});

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
          "/api/CatAjustes/sp_bw_obtener_productos_activos_ajustes_sel"
        );
        const productosRaw = Array.isArray(response.data) ? response.data : [];
      setProductosSelector(
        productosRaw.map((item: any) => ({
          clave_prod: String(
            obtenerValor(item, "clave_prod", "cve_prod", "producto", "clave") || ""
          ),
          descripcion: String(
            obtenerValor(item, "descripcion", "descrip", "nombre", "desc") || ""
          ),
          costo: normalizarCosto(obtenerValor(item, "costo", "costo_promedio", "costoProm")),
          tasa_iva: normalizarTasa(obtenerValor(item, "tasa_iva", "tasaIva", "iva")),
          existencia: Number(obtenerValor(item, "existencia", "exis", "stock", "disponible") || 0),
        }))
      );
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
      renglones.reduce((sum, r) => {
        const cantidad =
          (Number(r.entrada) || 0) + (Number(r.salida) || 0);
        const costo = Number(r.costo) || 0;
        const tasaRaw = Number(r.tasa) || 0;
        const tasa = tasaRaw <= 1 ? tasaRaw : tasaRaw / 100;
        return sum + cantidad * costo * (1 + tasa);
      }, 0),
    [renglones]
  );
  const ajusteBloqueado = useMemo(
    () => estadoAjuste.toLowerCase() === "finalizado",
    [estadoAjuste]
  );

  const recalcularNuevaExistencia = (r: RenglonAjuste): number =>
    (Number(r.existenciaActual) || 0) +
    (Number(r.entrada) || 0) -
    (Number(r.salida) || 0);

  const updateRenglon = (
    id: number,
    field: keyof RenglonAjuste,
    value: string | number
  ) => {
    if (ajusteBloqueado) return;
    setRenglones((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const rawValue =
          field === "entrada" || field === "salida"
            ? Math.max(0, Number(value) || 0)
            : Number(value) || 0;
        const actualizado = { ...r, [field]: rawValue } as RenglonAjuste;
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
    if (ajusteBloqueado) return;
    if (!tipoMovimiento) {
      Swal.fire({
        icon: "warning",
        title: "Tipo de movimiento requerido",
        text: "Selecciona el tipo de movimiento antes de capturar un producto.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    const claveInput = producto.clave_prod.trim();
    const costo = normalizarCosto(obtenerValor(producto, "costo", "costo_promedio", "costoProm"));
    const tasa = normalizarTasa(obtenerValor(producto, "tasa_iva", "tasaIva", "iva"));
    let existencia =
      Number(obtenerValor(producto, "existencia", "exis", "stock", "disponible") || 0);

    // Si se cambia el producto de un renglón, eliminar el temporal del producto anterior
    if (
      row.clave.trim() &&
      row.clave.trim() !== claveInput &&
      tipoMovimiento
    ) {
      try {
        await consumoApi.delete("/api/CatAjustes/sp_bw_eliminar_ajuste_temporal", {
          params: {
            sucursal: sucursalSesion,
            usuario: usuarioSesion,
            claveProd: row.clave.trim(),
            tipoMovto: Number(tipoMovimiento),
          },
        });
        const llaveAnterior = `${row.id}:${row.clave.trim()}:${tipoMovimiento}`;
        delete temporalGuardadoRef.current[llaveAnterior];
      } catch (err) {
        console.error("Error al eliminar temporal anterior:", err);
      }
    }

    setValidandoClaveId(row.id);
    try {
      const response = await consumoApi.post(
        "/api/CatTraspasoSalida/sp_validar_y_cargar_producto_traspaso",
        {
          cia: 1,
          sucursal: Number(sucursalSesion) || 0,
          sucOrigen: Number(sucursalSesion) || 0,
          sucursalOrigen: Number(sucursalSesion) || 0,
          sucursalDestino: Number(sucursalSesion) || 0,
          usuario: usuarioSesion,
          claveInput,
          claveProd: claveInput,
          claveProdAnterior: row.clave.trim() || null,
          cantidad: 0,
          costo: 0,
          tasaIva: 0,
          precioMenudeo: 0,
          ultimoCosto: 0,
          folio: Number(folio) || 0,
          validarExistenciaEstricta: false,
          version: "",
          unidad: "",
          observaciones: "",
        }
      );
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      if (data && typeof data === "object" && !data.mensaje) {
        existencia =
          Number(obtenerValor(data, "existencia", "exis", "stock", "disponible") || existencia);
      }
    } catch (err) {
      console.error("Error al consultar existencia:", err);
    } finally {
      setValidandoClaveId(null);
    }

    setRenglones((prev) => {
      const actualizadas = prev.map((r) => {
        if (r.id !== row.id) return r;
        const actualizado: RenglonAjuste = {
          ...r,
          clave: claveInput,
          descripcion: producto.descripcion,
          existenciaActual: existencia,
          costo,
          tasa,
        };
        actualizado.nuevaExistencia = recalcularNuevaExistencia(actualizado);
        return actualizado;
      });
      const esUltima = actualizadas[actualizadas.length - 1]?.id === row.id;
      return esUltima ? [...actualizadas, crearRenglonVacio()] : actualizadas;
    });
  };

  const handleNuevo = () => {
    temporalGuardadoRef.current = {};
    setVistaPreviaGuardar(false);
    setFolio((prev) => prev + 1);
    setFolioDocumento("");
    setTipoMovimiento("");
    setUsuarioAjuste("");
    setEstadoAjuste("");

    const nueva = crearRenglonVacio();
    setRenglones([nueva]);
    setSelectedRowId(nueva.id);
  };

  const handleCambioTipoMovimiento = async (e: SelectChangeEvent<number | "">) => {
    if (ajusteBloqueado) return;
    const nuevoValor = e.target.value === "" ? "" : Number(e.target.value);

    const movimientoSeleccionado = tiposMovimiento.find(
      (t) => t.tipo_movto === Number(nuevoValor)
    );

    if (movimientoSeleccionado) {
      const blnSucursal = Boolean((movimientoSeleccionado as any).blnSucursal);
      const blnProveedor = Boolean((movimientoSeleccionado as any).blnProveedor);

      if (blnSucursal === blnProveedor) {
        await Swal.fire({
          icon: "warning",
          title: "Atención",
          text: "El origen definido para este tipo de ajuste no es coherente.\n\nFavor de verificarlo.",
          confirmButtonColor: "#000000",
        });
        return;
      }
    }

    const renglonesCapturados = renglones.filter((r) => r.clave.trim() !== "");

    if (renglonesCapturados.length > 0) {
      const resultado = await Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Se va a eliminar la lista actual de productos.\n¿Desea continuar?",
        showCancelButton: true,
        confirmButtonText: "Sí",
        cancelButtonText: "No",
        confirmButtonColor: "#000000",
        cancelButtonColor: "#6c757d",
      });

      if (!resultado.isConfirmed) {
        return;
      }

      try {
        await consumoApi.delete(
          "/api/CatAjustes/sp_bw_eliminar_ajustes_temporales_usuario",
          {
            params: { sucursal: sucursalSesion, usuario: usuarioSesion },
          }
        );
      } catch (err) {
        console.error("Error al limpiar temporales:", err);
      }
    }

    const nueva = crearRenglonVacio();
    setRenglones([nueva]);
    setSelectedRowId(nueva.id);
    temporalGuardadoRef.current = {};

    setTipoMovimiento(nuevoValor);
  };

  const guardarRenglonTemporal = async (row: RenglonAjuste) => {
    if (!tipoMovimiento) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Por favor, seleccione un tipo de movimiento antes de capturar productos.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    const entradasValue = Number(row.entrada) || 0;
    const salidasValue = Number(row.salida) || 0;

    if (
      sucursalSesion <= 0 ||
      !row.clave.trim() ||
      (entradasValue === 0 && salidasValue === 0)
    ) {
      return;
    }

    const llave = `${row.id}:${row.clave.trim()}:${tipoMovimiento}`;
    const anterior = temporalGuardadoRef.current[llave] || { entradas: 0, salidas: 0 };

    // Si ya se guardó la misma combinación, no volver a llamar
    if (
      anterior.entradas === entradasValue &&
      anterior.salidas === salidasValue
    ) {
      return;
    }

    const payload = {
      sucursal: sucursalSesion,
      usuario: usuarioSesion,
      claveProd: row.clave.trim(),
      tipoMovto: Number(tipoMovimiento),
      entradas: entradasValue,
      salidas: salidasValue,
      costo: normalizarCosto(row.costo),
      tasaIva: normalizarTasa(row.tasa),
      sucursalOrigen: sucursalSesion,
      cveProveedor: null,
      folioDocto: folioDocumento.trim() || null,
      observacion: "",
    };

    try {
      await consumoApi.post(
        "/api/CatAjustes/sp_bw_guardar_ajuste_temporal",
        payload
      );
      temporalGuardadoRef.current[llave] = {
        entradas: entradasValue,
        salidas: salidasValue,
      };
    } catch (error: any) {
      const mensajeError =
        error.response?.data?.mensaje ||
        error.response?.data?.error ||
        error.message;
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `No se pudo agregar el producto: ${mensajeError}`,
        confirmButtonColor: "#000000",
      });
    }
  };

  const handleGuardar = async () => {
    if (guardando) return;
    if (ajusteBloqueado) return;
    const tipoMovto = Number(tipoMovimiento);
    const almacen = 1;

    if (sucursalSesion <= 0 || tipoMovto <= 0 || almacen <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Ingrese datos para guardar el ajuste",
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

    const renglonSinExistencia = renglonesValidos.find((r) => Number(r.nuevaExistencia) < 0);
    if (renglonSinExistencia) {
      Swal.fire({
        icon: "warning",
        title: "Existencia insuficiente",
        text: `El producto ${renglonSinExistencia.descripcion || renglonSinExistencia.clave} no cuenta con existencia suficiente para ajustar.`,
        confirmButtonColor: "#000000",
      });
      return;
    }

    setGuardando(true);
    try {
      await Promise.all(renglonesValidos.map((row) => guardarRenglonTemporal(row)));

      const response = await consumoApi.post(
        "/api/CatAjustes/sp_bw_guardar_ajuste_definitivo",
        {
          sucursal: sucursalSesion,
          usuario: usuarioSesion,
          fechaOrden: new Date().toISOString(),
          tipoMovto,
          folioDocto: folioDocumento.trim(),
          sucursalOrigen: sucursalSesion,
          cveProveedor: null,
          almacen: 1,
        }
      );

      const folioGenerado = Number(response.data?.folioGenerado) || 0;
      if (folioGenerado > 0) setFolio(folioGenerado);

      const confirmarImpresion = await Swal.fire({
        icon: "success",
        title: "Ajuste guardado",
        text:
          (response.data?.mensaje || "Ajuste guardado correctamente.") +
          " ¿Deseas imprimir?",
        showCancelButton: true,
        confirmButtonText: "Sí, imprimir",
        cancelButtonText: "No",
        confirmButtonColor: "#000000",
        cancelButtonColor: "#6c757d",
      });

      if (confirmarImpresion.isConfirmed) {
        setVistaPreviaGuardar(true);
        setAbrirVistaPrevia(true);
      } else {
        handleNuevo();
      }
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
    const renglonesAjuste = historialAjustesRaw.filter(
      (r) => Number(r.folio) === Number(ajuste.folio)
    );

    if (renglonesAjuste.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin renglones",
        text: "No se encontraron renglones para este ajuste.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    if (ajuste.usuario && ajuste.usuario !== usuarioSesion) {
      Swal.fire({
        icon: "warning",
        title: "Ajuste de otro usuario",
        text: "No puedes editar un ajuste capturado por otro usuario.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    if (ajuste.estado?.toLowerCase() === "cancelado") {
      Swal.fire({
        icon: "warning",
        title: "Ajuste cancelado",
        text: "No puedes editar un ajuste cancelado.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    const tipoMovtoAjuste = Number(
      obtenerValor(renglonesAjuste[0], "tipo_movto", "tipo_movimiento")
    );
    if (
      tipoMovimiento !== "" &&
      tipoMovtoAjuste > 0 &&
      tipoMovtoAjuste !== Number(tipoMovimiento)
    ) {
      Swal.fire({
        icon: "warning",
        title: "Tipo de movimiento diferente",
        text: "No puedes seleccionar un ajuste de otro tipo de movimiento.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    setUsuarioAjuste(ajuste.usuario || "");
    setEstadoAjuste(ajuste.estado || "");

    const nuevosRenglones: RenglonAjuste[] = renglonesAjuste.map((row, idx) => {
      const existenciaActualRaw =
        Number(obtenerValor(row, "existencia", "exis", "existenciaActual")) || 0;
      const entradas = Number(obtenerValor(row, "entradas", "entrada")) || 0;
      const salidas = Number(obtenerValor(row, "salidas", "salida")) || 0;
      const costo = normalizarCosto(obtenerValor(row, "costo", "costoProm"));
      const clave = String(
        obtenerValor(row, "clave", "clave_prod", "claveProd", "cve_prod", "producto") || ""
      );
      const producto = productosSelector.find(
        (p) => p.clave_prod.trim() === clave.trim()
      );
      const descripcion = String(
        obtenerValor(row, "descripcion", "descrip", "nombre", "desc") ||
        producto?.descripcion ||
        ""
      );
      const existenciaActual =
        existenciaActualRaw || Number(producto?.existencia) || 0;
      const tasa = normalizarTasa(obtenerValor(row, "tasa", "tasaIva", "tasa_iva"));

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

    setFolio(Number(ajuste.folio));
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
            usuario: usuarioSesion,
            fechaInicio: fechaInicioBuscar,
            fechaFin: fechaFinBuscar,
            ...(tipoMovtoBuscar !== "" ? { tipoMovto: tipoMovtoBuscar } : {}),
          },
        }
      );

      const raw: AjusteBusquedaRow[] = Array.isArray(response.data)
        ? response.data
        : [];

      const agrupados = raw.reduce<Record<number, AjusteHistorial>>(
        (acc, row) => {
          const folioNum = Number(row.folio) || 0;
          const movimiento =
            (Number(row.entradas) || 0) - (Number(row.salidas) || 0);
          const importe =
            Number(row.total) || Math.abs(movimiento) * (Number(row.costo) || 0);

          if (acc[folioNum]) {
            acc[folioNum].total += importe;
          } else {
            acc[folioNum] = {
              folio: folioNum,
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
    if (renglones.filter((r) => r.clave.trim()).length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Nada que mostrar",
        text: "Captura al menos un producto para generar la vista previa.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    setAbrirVistaPrevia(true);
  };

  const handleCerrarVistaPrevia = () => {
    setAbrirVistaPrevia(false);
    if (vistaPreviaGuardar) {
      setVistaPreviaGuardar(false);
      handleNuevo();
    }
  };

  const handleSalir = () => {
    window.location.href = "/";
  };

  const handleCancelar = async () => {
    if (guardando) return;
    if (usuarioAjuste && usuarioAjuste !== usuarioSesion) {
      Swal.fire({
        icon: "warning",
        title: "Ajuste de otro usuario",
        text: "No puedes cancelar un ajuste capturado por otro usuario.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    const folioACancelar = Number(folio);
    const tipoMovto = Number(tipoMovimiento);

    if (sucursalSesion <= 0 || folioACancelar <= 0 || tipoMovto <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Selecciona o carga un ajuste definitivo antes de cancelarlo.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: "warning",
      title: "Cancelar ajuste",
      text: `¿Deseas cancelar el folio ${folioACancelar}? Se generará un contra-movimiento.`,
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
      confirmButtonColor: "#000000",
    });

    if (!confirmacion.isConfirmed) return;

    setGuardando(true);
    try {
      const response = await consumoApi.post(
        "/api/CatAjustes/sp_bw_cancelar_ajuste",
        {
          sucursal: sucursalSesion,
          usuario: usuarioSesion,
          folioACancelar,
          tipoMovto,
          almacen: 1,
        }
      );

      Swal.fire({
        icon: "success",
        title: "Ajuste cancelado",
        text: response.data?.mensaje || "Ajuste cancelado correctamente.",
        confirmButtonColor: "#000000",
      });
      handleNuevo();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error al cancelar",
        text:
          err.response?.data?.mensaje ||
          "No fue posible cancelar el ajuste.",
        confirmButtonColor: "#000000",
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleAgregarRenglon = () => {
    if (ajusteBloqueado) return;
    if (!tipoMovimiento) {
      Swal.fire({
        icon: "warning",
        title: "Tipo de movimiento requerido",
        text: "Selecciona el tipo de movimiento antes de agregar un producto.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    const ultima = renglones[renglones.length - 1];
    if (renglones.length > 0 && !ultima?.clave.trim()) {
      setSelectedRowId(ultima.id);
      return;
    }
    const nueva = crearRenglonVacio();
    setRenglones([...renglones, nueva]);
    setSelectedRowId(nueva.id);
  };

  const handleEliminarRenglon = async (id: number) => {
    if (ajusteBloqueado) return;
    const row = renglones.find((r) => r.id === id);
    const llave = row
      ? `${row.id}:${row.clave.trim()}:${tipoMovimiento}`
      : "";
    const existeGuardadoTemporal = Boolean(
      row?.clave.trim() && tipoMovimiento && temporalGuardadoRef.current[llave]
    );

    if (existeGuardadoTemporal) {
      try {
        await consumoApi.delete(
          "/api/CatAjustes/sp_bw_eliminar_ajuste_temporal",
          {
            params: {
              sucursal: sucursalSesion,
              usuario: usuarioSesion,
              claveProd: row!.clave.trim(),
              tipoMovto: Number(tipoMovimiento),
            },
          }
        );
        delete temporalGuardadoRef.current[llave];
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Error al eliminar",
          text:
            err.response?.data?.mensaje ||
            "No fue posible eliminar el registro temporal.",
          confirmButtonColor: "#000000",
        });
        return;
      }
    }

    setRenglones((prev) => {
      const restantes = prev.filter((r) => r.id !== id);
      return restantes.length > 0 ? restantes : [crearRenglonVacio()];
    });
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

              <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, maxWidth: 560 }}>
                <Typography sx={{ fontWeight: "bold", minWidth: 80 }}>
                  Tipo de movimiento:
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    displayEmpty
                    value={tipoMovimiento}
                    onChange={handleCambioTipoMovimiento}
                    disabled={ajusteBloqueado}
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
                      { name: "", width: 50 },
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
                          disabled={ajusteBloqueado}
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
                          disabled={ajusteBloqueado}
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
                          disabled={esMovimientoSalida === true || ajusteBloqueado}
                          InputProps={{ disableUnderline: true }}
                          inputProps={{ min: 0 }}
                          onChange={(e) =>
                            updateRenglon(row.id, "entrada", Number(e.target.value) || 0)
                          }
                          onBlur={() => guardarRenglonTemporal(row)}
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
                          disabled={esMovimientoSalida === false || ajusteBloqueado}
                          InputProps={{ disableUnderline: true }}
                          inputProps={{ min: 0 }}
                          onChange={(e) =>
                            updateRenglon(row.id, "salida", Number(e.target.value) || 0)
                          }
                          onBlur={() => guardarRenglonTemporal(row)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && idx === renglones.length - 1) {
                              handleAgregarRenglon();
                            }
                          }}
                          sx={{ width: "100%" }}
                        />
                      </TableCell>
                      <TableCell sx={cellSx}>{formatoMoneda(row.costo)}</TableCell>
                      <TableCell sx={cellSx}>
                        {(row.tasa <= 1 ? row.tasa * 100 : row.tasa).toFixed(0)}%
                      </TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: "bold" }}>
                        {row.nuevaExistencia}
                      </TableCell>
                      <TableCell sx={{ ...cellSx, textAlign: "center" }}>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={ajusteBloqueado}
                          onClick={() => void handleEliminarRenglon(row.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
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
                disabled={ajusteBloqueado}
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
                disabled={guardando || ajusteBloqueado}
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
                onClick={handleCancelar}
                disabled={guardando || (usuarioAjuste && usuarioAjuste !== usuarioSesion)}
                sx={{
                  bgcolor: "#d9d9d9",
                  color: "#000",
                  fontWeight: "bold",
                  boxShadow: "none",
                  minWidth: 100,
                  "&:hover": { bgcolor: "#c7c7c7", boxShadow: "none" },
                }}
              >
                Cancelar
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
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <Select
                value={tipoMovtoBuscar}
                displayEmpty
                onChange={(e) => setTipoMovtoBuscar(e.target.value as number | "")}
              >
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {tiposMovimiento.map((t) => (
                  <MenuItem key={t.tipo_movto} value={t.tipo_movto}>
                    {t.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                          disabled={
                            ajuste.usuario !== usuarioSesion ||
                            ajuste.estado?.toLowerCase() === "cancelado"
                          }
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
              disabled={
                !ajusteSeleccionado ||
                ajusteSeleccionado.usuario !== usuarioSesion ||
                ajusteSeleccionado.estado?.toLowerCase() === "cancelado"
              }
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

      {/* Diálogo de vista previa */}
      <Dialog
        open={abrirVistaPrevia}
        onClose={handleCerrarVistaPrevia}
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
          Vista previa del ajuste
          <IconButton
            aria-label="close"
            onClick={handleCerrarVistaPrevia}
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
          <Box sx={{ p: 2 }}>
            <Typography
              variant="h6"
              align="center"
              sx={{ fontWeight: "bold", mb: 1 }}
            >
              Berllano
            </Typography>
            <Typography align="center" sx={{ mb: 2 }}>
              Ajuste al inventario de mercancías
            </Typography>

            <Box sx={{ borderTop: "1px dashed #bdbdbd", my: 1 }} />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
                mb: 2,
              }}
            >
              <Typography>
                <strong>FOLIO:</strong> {folio}
              </Typography>
              <Typography sx={{ textAlign: "right" }}>
                <strong>Fecha:</strong> {new Date().toLocaleDateString("es-MX")}
              </Typography>
              <Typography>
                <strong>Sucursal:</strong> {sucursalSesion || "—"}
              </Typography>
              <Typography sx={{ textAlign: "right" }}>
                <strong>Tipo de ajuste:</strong>{" "}
                {tiposMovimiento
                  .find((t) => t.tipo_movto === Number(tipoMovimiento))
                  ?.descripcion?.toUpperCase() || "—"}
              </Typography>
              <Typography>
                <strong>Origen del ajuste:</strong> {sucursalSesion || "—"}
              </Typography>
              <Typography sx={{ textAlign: "right" }}>
                <strong>Documento:</strong> {folioDocumento.trim() || "—"}
              </Typography>
            </Box>
            <Box sx={{ borderTop: "1px dashed #bdbdbd", my: 1 }} />

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Clave</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Descripción</TableCell>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>
                      Exist. anterior
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>
                      Entradas
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>
                      Salidas
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {renglones
                    .filter((r) => r.clave.trim())
                    .map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.clave}</TableCell>
                        <TableCell>{r.descripcion}</TableCell>
                        <TableCell align="right">
                          {Number(r.existenciaActual) || 0}
                        </TableCell>
                        <TableCell align="right">
                          {Number(r.entrada) || 0}
                        </TableCell>
                        <TableCell align="right">
                          {Number(r.salida) || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ borderTop: "1px dashed #bdbdbd", my: 1 }} />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
                mb: 2,
              }}
            >
              <Typography>
                <strong>Total de registros:</strong>{" "}
                {renglones.filter((r) => r.clave.trim()).length}
              </Typography>
              <Typography sx={{ textAlign: "right" }}>
                <strong>Costo total:</strong> {formatoMoneda(total)}
              </Typography>
              <Typography>
                <strong>Capturado por:</strong>{" "}
                {usuarioAjuste || usuarioSesion || "—"}
              </Typography>
              <Typography sx={{ textAlign: "right" }}>
                <strong>Página 1 de 1</strong>
              </Typography>
            </Box>
            <Box sx={{ borderTop: "1px dashed #bdbdbd", my: 1 }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => window.print()}
            variant="contained"
            sx={{
              bgcolor: "#000000",
              color: "#fff",
              textTransform: "none",
              fontWeight: "bold",
              boxShadow: "none",
              mr: 1,
              "&:hover": { bgcolor: "#424242" },
            }}
          >
            Imprimir
          </Button>
          <Button
            onClick={handleCerrarVistaPrevia}
            variant="contained"
            sx={{
              bgcolor: "#d9d9d9",
              color: "#000",
              textTransform: "none",
              fontWeight: "bold",
              boxShadow: "none",
              "&:hover": { bgcolor: "#c7c7c7" },
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
