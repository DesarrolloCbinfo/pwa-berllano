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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useAuth } from "../../../context/AuthContext";
import useSession from "../../../hooks/useSession";
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
  usuario: string;
};

type Sucursal = {
  cve_sucursal: number;
  nombre: string;
};

type ProductoSelector = {
  Clave: string;
  Descripcion: string;
};

type TraspasoBusqueda = {
  exis: number;
  clave: string;
  descripcion: string;
  cantidad: number;
  costoProm: number;
  importe: number;
  obs: string;
  usuario?: string;
  sucOrigen?: number | string;
  sucDestino?: number | string;
};

function formatoMoneda(valor: number) {
  return `$${valor.toFixed(2)}`;
}

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
  const session = useSession();
  const userLoggedRaw =
    typeof window !== "undefined" ? localStorage.getItem("userLoggedv2") : null;
  let userLogged: any = null;
  if (userLoggedRaw) {
    try {
      userLogged = JSON.parse(userLoggedRaw);
    } catch {
      userLogged = null;
    }
  }
  const usuarioSesion =
    userLogged?.claveEmpleado ||
    userLogged?.id?.toString() ||
    userLogged?.nombre ||
    session?.claveEmpleado ||
    session?.id?.toString() ||
    session?.nombre ||
    token?.usuario ||
    (typeof window !== "undefined" ? localStorage.getItem("usuario") || "" : "") ||
    "";

  const esMismoUsuario = (rowUsuario?: string) => {
    const r = (rowUsuario || "").trim().toLowerCase();
    const s = (usuarioSesion || "").trim().toLowerCase();
    if (!r) return true; // renglón nuevo, permite editar
    if (!s) return false; // sesión desconocida, no permite editar renglones ajenos
    return r === s;
  };

  const cantidadAnteriorRef = useRef<Record<number, number>>({});
  const obsAnteriorRef = useRef<Record<number, string>>({});

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

  const hoy = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  const [folio, setFolio] = useState<number>(0);
  const [fecha, setFecha] = useState<string>(fechaHoy);
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
    usuario: usuarioSesion,
  };

  const [rows, setRows] = useState<TraspasoRow[]>([emptyRow]);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(emptyRow.id);

  const [validandoClaveId, setValidandoClaveId] = useState<number | null>(null);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [verNoValidados, setVerNoValidados] = useState(false);
  const [traspasoGuardado, setTraspasoGuardado] = useState(false);
  const [dialogoBuscarAbierto, setDialogoBuscarAbierto] = useState(false);
  const [unidad, setUnidad] = useState<string>("");
  const [guardando, setGuardando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [fecha1, setFecha1] = useState<string>(fechaHoy);
  const [fecha2, setFecha2] = useState<string>(fechaHoy);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<TraspasoBusqueda[]>([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);

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
          cia: 1,
          sucursal: Number(sucOrigen) || 0,
          sucOrigen: Number(sucOrigen) || 0,
          sucursalOrigen: Number(sucOrigen) || 0,
          sucursalDestino: Number(sucDestino) || 0,
          usuario: usuarioSesion,
          claveInput: (row as any).claveProd || row.clave || claveInput,
          claveProd: (row as any).claveProd || row.clave || "",
          cantidad: Number(row.cantidad) || 1,
          costo: 0,
          tasaIva: 0,
          precioMenudeo: 0,
          ultimoCosto: 0,
          folio: Number(folio) || 0,
          validarExistenciaEstricta: true,
          version: (row as any).version || "",
          unidad: (row as any).unidad || "",
          observaciones: (row as any).observaciones || row.obs || "",
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

          const cantidadVal = Number(buscarCampo(["cantidad", "cant"], row.cantidad)) || 0;
          const costoVal =
            Number(
              buscarCampo(
                ["costoProm", "costoPromedio", "costo"],
                row.costoProm
              )
            ) || 0;
          const exisVal =
            Number(
              buscarCampo(
                ["existencia", "exis", "stock", "disponible"],
                row.exis
              )
            ) || 0;
          const claveVal = (buscarCampo(
            ["clave", "claveReal", "claveProd", "clave_producto"],
            row.clave
          ) ?? "").toString().trim();
          const productoEncontrado = productosSelector.find(
            (p) => p.Clave.trim().toLowerCase() === claveVal.toLowerCase()
          );
          const descripcionVal =
            buscarCampo(
              ["descripcion", "descrip", "nombre", "descripcionProd", "descripcionProducto"],
              row.descripcion
            ) ||
            productoEncontrado?.Descripcion?.trim() ||
            "";
          const esFraccionVal = Boolean(
            buscarCampo(
              ["esFraccion", "es_fraccion", "fraccion", "esFraccionado"],
              row.esFraccion
            )
          );
          const recuperadoVal = Boolean(
            buscarCampo(["recuperado", "Recuperado"], row.recuperado)
          );
          const cantidadAnteriorVal =
            Number(
              buscarCampo(
                ["cantidadAnterior", "cantidad_anterior", "cantidad_previa"],
                row.cantidadAnterior
              )
            ) || 0;
          const usuarioVal = String(row.usuario || usuarioSesion || "");
          setRows((prev) =>
            prev.map((r) =>
              r.id !== row.id
                ? r
                : {
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
                    usuario: usuarioVal,
                  }
            )
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
    } catch (error: any) {
      const mensajeReal = error.response?.data?.mensaje || "Error al validar producto";
      alert(mensajeReal);
    } finally {
      setValidandoClaveId(null);
    }
  };

  const handleNuevo = () => {
    setFolio(0);
    setFecha(fechaHoy);
    setSucDestino("");
    setUnidad("");
    const newRow = { ...emptyRow, id: Date.now() };
    setRows([newRow]);
    setSelectedRowId(newRow.id);
    setVerNoValidados(false);
    setTraspasoGuardado(false);
  };

  const handleGuardar = async () => {
    if (!sucDestino) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Indique la sucursal destino.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    const payload = {
      sucOrigen: Number(sucOrigen),
      sucDestino: Number(sucDestino),
      usuario: usuarioSesion,
      unidad: unidad || null,
    };

    try {
      setGuardando(true);
      const response = await consumoApi.post(
        "/api/CatTraspasoSalida/sp_bw_finalizar_traspaso",
        payload
      );

      const folioGenerado = response.data?.folio || response.data?.Folio;
      const mensaje = response.data?.mensaje || response.data?.message || "Traspaso guardado";

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `${mensaje} Folio asignado: ${folioGenerado}`,
        confirmButtonColor: "#000000",
      });

      handleNuevo();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.mensaje ||
          error.response?.data?.message ||
          "Ocurrió un error al procesar el traspaso.",
        confirmButtonColor: "#000000",
      });
    } finally {
      setGuardando(false);
    }
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

  const handleCancelarTraspaso = async () => {
    const confirmar = await Swal.fire({
      icon: "warning",
      title: "ATENCIÓN!",
      text: `Realmente Deseas CANCELAR este Traspaso >${folio}<\ntenga en cuenta que si se envió la tienda no lo podrá recibir.`,
      showCancelButton: true,
      confirmButtonColor: "#d9534f",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });

    if (!confirmar.isConfirmed) return;

    try {
      setCancelando(true);
      const response = await consumoApi.post(
        "/api/CatTraspasoSalida/sp_bw_cancelar_traspaso",
        {
          folio,
          sucursal: Number(sucOrigen),
          usuarioCancelacion: usuarioSesion,
        }
      );

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text:
          response.data?.mensaje ||
          `El Traspaso >${folio}< se Canceló correctamente.`,
        confirmButtonColor: "#000000",
      });

      const newRow = { ...emptyRow, id: Date.now() };
      setRows([newRow]);
      setSelectedRowId(newRow.id);
      setVerNoValidados(false);
      setTraspasoGuardado(false);
      setSucDestino("");
      setUnidad("");
    } catch (error: any) {
      const mensajeReal =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Error al procesar la cancelación.";
      console.error("Error cancelar traspaso:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          typeof mensajeReal === "string" ? mensajeReal : JSON.stringify(mensajeReal),
        confirmButtonColor: "#000000",
      });
    } finally {
      setCancelando(false);
    }
  };

  const handleEliminarFila = async (row: TraspasoRow) => {
    if (row.clave) {
      try {
        const posicion = rows.findIndex((r) => r.id === row.id);
        await consumoApi.delete(
          "/api/CatTraspasoSalida/sp_bw_eliminar_producto_traspaso",
          {
            params: {
              folio,
              cia: Number(userLogged?.cia || session?.cia) || 1,
              sucursal: Number(sucOrigen),
              claveProd: row.clave,
              usuario: usuarioSesion,
              posicion,
            },
          }
        );
        await Swal.fire({
          icon: "success",
          title: "Eliminado",
          text: "Producto eliminado exitosamente.",
          confirmButtonColor: "#000000",
          timer: 1500,
        });
      } catch (err: any) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text:
            err.response?.data?.mensaje || "No se pudo eliminar el producto.",
          confirmButtonColor: "#000000",
        });
        return;
      }
    }

    setRows((prev) => {
      const filtradas = prev.filter((r) => r.id !== row.id);
      if (filtradas.length === 0) {
        const nuevaFila = { ...emptyRow, id: Date.now() };
        setSelectedRowId(nuevaFila.id);
        return [nuevaFila];
      }
      if (selectedRowId === row.id) {
        setSelectedRowId(filtradas[0].id);
      }
      return filtradas;
    });
  };

  const handleEditarCantidad = async (
    claveProd: string,
    nuevaCantidad: number,
    nuevaObs: string
  ) => {
    if (!claveProd) return;

    const fila = rows.find((r) => r.clave === claveProd);
    if (!fila) return;

    try {
      const response = await consumoApi.put(
        "/api/CatTraspasoSalida/sp_bw_actualizar_traspaso_upd",
        {
          folio: Number(folio) || 0,
          sucursal: Number(sucOrigen) || 0,
          claveProd,
          cantidad: Number(nuevaCantidad) || 1,
          observaciones: nuevaObs || fila.obs || "",
          usuario: usuarioSesion,
        }
      );

      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      setRows((prev) =>
        prev.map((item) => {
          if (item.clave !== claveProd) return item;
          const cantidadResp =
            data?.cantidad != null ? Number(data.cantidad) : Number(nuevaCantidad);
          const costoResp =
            data?.costoProm != null
              ? Number(data.costoProm)
              : fila.costoProm;
          const importeResp =
            data?.importe != null
              ? Number(data.importe)
              : cantidadResp * costoResp;
          const obsResp =
            data?.observaciones ?? data?.obs ?? nuevaObs ?? fila.obs;
          return {
            ...item,
            cantidad: cantidadResp,
            costoProm: costoResp,
            importe: importeResp,
            obs: obsResp,
            usuario: data?.usuario ?? item.usuario,
          };
        })
      );
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.mensaje || "No se pudo actualizar",
        confirmButtonColor: "#000000",
      });
    }
  };

  const handleBuscar = () => {
    Swal.fire({
      icon: "info",
      title: "Buscar traspasos",
      text: "Aquí se abriría el diálogo de búsqueda de traspasos.",
      confirmButtonColor: "#000000",
    });
  };

  const handleAbrirBusquedaPorFecha = () => {
    setDialogoBuscarAbierto(true);
    buscarTraspasosPorFecha();
  };

  const handleCerrarBusquedaPorFecha = () => {
    setDialogoBuscarAbierto(false);
  };

  const buscarTraspasosPorFecha = async () => {
    if (!fecha1 || !fecha2) {
      await Swal.fire({
        icon: "warning",
        title: "Fechas requeridas",
        text: "Selecciona ambas fechas para buscar.",
        confirmButtonColor: "#000000",
      });
      return;
    }
    if (!sucOrigen) {
      await Swal.fire({
        icon: "warning",
        title: "Sucursal origen requerida",
        text: "La sucursal origen debe estar definida para filtrar los envíos.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    setCargandoBusqueda(true);
    try {
      const response = await consumoApi.get(
        "/api/CatTraspasoSalida/sp_bw_buscar_traspasos_por_fecha",
        {
          params: {
            fechaInicio: fecha1,
            fechaFin: fecha2,
            sucOrigen,
          },
        }
      );

      const data = Array.isArray(response.data) ? response.data : [];
      console.log("Primer item stringified:", JSON.stringify(data[0]));
      setResultadosBusqueda(
        data.map((item: any) => ({
          exis: Number(obtenerValor(item, "exis") || 0),
          clave: String(obtenerValor(item, "clave") || ""),
          descripcion: String(obtenerValor(item, "descripcion", "descrip") || ""),
          cantidad: Number(obtenerValor(item, "cantidad") || 0),
          costoProm: Number(obtenerValor(item, "costoProm", "costo_prom") || 0),
          importe: Number(obtenerValor(item, "importe") || 0),
          obs: String(obtenerValor(item, "obs") || ""),
          usuario: String(item.usuario ?? item.Usuario ?? ""),
          sucOrigen: item.sucOrigen ?? item.SucOrigen ?? sucOrigen ?? undefined,
          sucDestino: item.sucDestino ?? item.SucDestino ?? undefined,
        }))
      );
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Error al buscar traspasos",
        text:
          err.response?.data?.mensaje ||
          "No fue posible obtener los traspasos por fecha.",
        confirmButtonColor: "#000000",
      });
    } finally {
      setCargandoBusqueda(false);
    }
  };

  const seleccionarTraspaso = (traspaso: TraspasoBusqueda) => {
    const clave = String(traspaso.clave).trim();
    if (rows.some((r) => r.clave === clave)) {
      Swal.fire({
        icon: "warning",
        title: "Producto duplicado",
        text: "El producto ya se encuentra en el traspaso.",
        confirmButtonColor: "#000000",
      });
      return;
    }

    if (traspaso.sucDestino != null && traspaso.sucDestino !== "") {
      const sucDestinoNum = Number(traspaso.sucDestino);
      if (!isNaN(sucDestinoNum)) {
        setSucDestino(sucDestinoNum);
      }
    }

    const nuevaId = Date.now();
    setRows((prev) => {
      const ultima = prev[prev.length - 1];
      const nuevaFila: TraspasoRow = {
        id: nuevaId,
        exis: Number(traspaso.exis) || 0,
        clave: String(traspaso.clave),
        descripcion: String(traspaso.descripcion),
        cantidad: Number(traspaso.cantidad) || 0,
        costoProm: Number(traspaso.costoProm) || 0,
        importe:
          Number(traspaso.importe) ||
          (Number(traspaso.cantidad) || 0) *
            (Number(traspaso.costoProm) || 0),
        obs: String(traspaso.obs),
        validado: false,
        esFraccion: false,
        recuperado: false,
        cantidadAnterior: 0,
        usuario: String(traspaso.usuario || usuarioSesion || ""),
      };
      if (prev.length > 0 && !ultima?.clave) {
        return [...prev.slice(0, -1), nuevaFila];
      }
      return [...prev, nuevaFila];
    });
    setSelectedRowId(nuevaId);
    setDialogoBuscarAbierto(false);
  };

  const handleAgregarRenglon = () => {
    const ultima = displayedRows[displayedRows.length - 1];
    if (displayedRows.length > 0 && !ultima?.clave.trim()) {
      setSelectedRowId(ultima.id);
      return;
    }
    const nueva: TraspasoRow = { ...emptyRow, id: Date.now() };
    setRows([...rows, nueva]);
    setSelectedRowId(nueva.id);
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
                  disabled={Boolean(token)}
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
                type="date"
                value={fecha}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 160 }}
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
                  {[
                    { name: "Exis", width: 60 },
                    { name: "Clave", width: 160 },
                    { name: "Descripción", width: 300 },
                    { name: "Cantidad", width: 80 },
                    { name: "Costo prom", width: 100 },
                    { name: "Importe", width: 100 },
                    { name: "OBS", width: 80 },
                    { name: "Acciones", width: 80 },
                  ].map((h, idx) => (
                    <TableCell key={idx} sx={{ ...cellSx, fontWeight: "bold", width: h.width }}>
                      {h.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedRows.map((row, idx) => (
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
                        disabled={!esMismoUsuario(row.usuario)}
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
                        disabled={sucDestino === "" || !esMismoUsuario(row.usuario)}
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
                            placeholder={sucDestino === "" ? "Sel. suc. destino" : "Seleccionar"}
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
                    <TableCell sx={{ ...cellSx, width: 300 }}>
                      <Autocomplete
                        size="small"
                        disabled={sucDestino === "" || !esMismoUsuario(row.usuario)}
                        options={productosSelector}
                        loading={cargandoProductos}
                        value={productosSelector.find((producto) => producto.Clave.trim() === row.clave) || null}
                        getOptionLabel={(producto) => producto.Descripcion.trim()}
                        isOptionEqualToValue={(option, value) => option.Clave === value.Clave}
                        onChange={(_, producto) => {
                          if (!producto) return;
                          const clave = producto.Clave.trim();
                          updateRow(row.id, "clave", clave);
                          updateRow(row.id, "descripcion", producto.Descripcion.trim());
                          handleSeleccionarClave(row, clave);
                        }}
                        renderOption={(props, producto) => (
                          <li {...props} key={`${producto.Clave}-${producto.Descripcion}`}>
                            {producto.Descripcion.trim()}
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="standard"
                            placeholder={sucDestino === "" ? "Sel. suc. destino" : "Buscar descripción"}
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
                        sx={{ width: "100%", minWidth: 280 }}
                      />
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <TextField
                        variant="standard"
                        size="small"
                        type="number"
                        value={row.cantidad}
                        disabled={!esMismoUsuario(row.usuario)}
                        inputProps={{ min: 0 }}
                        onFocus={() => {
                          cantidadAnteriorRef.current[row.id] = row.cantidad;
                        }}
                        onChange={(e) =>
                          updateRow(row.id, "cantidad", Math.max(0, Number(e.target.value) || 0))
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
                          } else if (nuevaCantidad !== anterior) {
                            handleEditarCantidad(row.clave, nuevaCantidad, row.obs);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && idx === displayedRows.length - 1) {
                            handleAgregarRenglon();
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
                        InputProps={{ disableUnderline: true, readOnly: true }}
                        sx={{ width: "100%" }}
                      />
                    </TableCell>
                    <TableCell sx={cellSx}>{formatoMoneda(row.importe)}</TableCell>
                    <TableCell sx={cellSx}>
                      <TextField
                        variant="standard"
                        size="small"
                        value={row.obs}
                        disabled={!esMismoUsuario(row.usuario)}
                        onFocus={() => {
                          obsAnteriorRef.current[row.id] = row.obs;
                        }}
                        onChange={(e) =>
                          updateRow(row.id, "obs", e.target.value)
                        }
                        onBlur={(e) => {
                          const anterior = obsAnteriorRef.current[row.id] ?? "";
                          if (e.target.value !== anterior) {
                            handleEditarCantidad(row.clave, row.cantidad, e.target.value);
                          }
                        }}
                        InputProps={{ disableUnderline: true }}
                        sx={{ width: "100%" }}
                      />
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={!esMismoUsuario(row.usuario)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarFila(row);
                        }}
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
            <Button
              variant="contained"
              onClick={handleGuardar}
              disabled={guardando}
            >
              {guardando ? "Guardando..." : "FINALIZAR"}
            </Button>
            <Button variant="contained" onClick={handleVistaPrevia}>
              Vista previa
            </Button>
            <Button
              variant="contained"
              onClick={handleCancelarTraspaso}
              disabled={cancelando}
              sx={{ bgcolor: "#d9534f", color: "white" }}
            >
              {cancelando ? "Procesando..." : "Cancelar Traspaso"}
            </Button>
            <Button variant="contained" onClick={handleAbrirBusquedaPorFecha}>
              Buscar por fecha
            </Button>
          </Stack>

          <Dialog
            open={dialogoBuscarAbierto}
            onClose={handleCerrarBusquedaPorFecha}
            maxWidth="lg"
            fullWidth
          >
            <DialogTitle sx={{ bgcolor: "#000000", color: "#ffffff" }}>
              Búsqueda de traspasos por fecha
            </DialogTitle>
            <DialogContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1, mb: 2 }}>
                <TextField
                  label="Fecha inicio"
                  type="date"
                  size="small"
                  value={fecha1}
                  onChange={(e) => setFecha1(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Fecha fin"
                  type="date"
                  size="small"
                  value={fecha2}
                  onChange={(e) => setFecha2(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  variant="contained"
                  onClick={buscarTraspasosPorFecha}
                  disabled={cargandoBusqueda}
                  startIcon={cargandoBusqueda ? <CircularProgress size={14} /> : undefined}
                >
                  Buscar
                </Button>
              </Stack>

              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 1100, tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      {[
                        { name: "Exis", width: 50 },
                        { name: "Clave", width: 80 },
                        { name: "Descripción", width: 260 },
                        { name: "Cantidad", width: 70 },
                        { name: "Costo prom", width: 90 },
                        { name: "Importe", width: 90 },
                        { name: "OBS", width: 70 },
                        { name: "Suc", width: 70 },
                        { name: "Destino", width: 100 },
                        { name: "Usuario", width: 100 },
                        { name: "Acción", width: 90 },
                      ].map((col, idx) => (
                        <TableCell key={idx} sx={{ fontWeight: "bold", width: col.width }}>
                          {col.name}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultadosBusqueda.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} align="center">
                          Sin resultados
                        </TableCell>
                      </TableRow>
                    ) : (
                      resultadosBusqueda.map((t, idx) => (
                        <TableRow key={`${t.clave}-${idx}`}>
                          <TableCell>{t.exis}</TableCell>
                          <TableCell>{t.clave}</TableCell>
                          <TableCell>{t.descripcion}</TableCell>
                          <TableCell>{t.cantidad}</TableCell>
                          <TableCell>{formatoMoneda(t.costoProm)}</TableCell>
                          <TableCell>{formatoMoneda(t.importe)}</TableCell>
                          <TableCell>{t.obs}</TableCell>
                          <TableCell>
                            {(() => {
                              const val = t.sucOrigen ?? sucOrigen;
                              const num = Number(val);
                              const suc = isNaN(num) ? undefined : sucursales.find((s) => s.cve_sucursal === num);
                              return suc ? suc.nombre : String(val ?? "");
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const val = t.sucDestino;
                              const num = Number(val);
                              const suc = isNaN(num) ? undefined : sucursales.find((s) => s.cve_sucursal === num);
                              return suc ? suc.nombre : String(val ?? "");
                            })()}
                          </TableCell>
                          <TableCell>{t.usuario}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => seleccionarTraspaso(t)}
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
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCerrarBusquedaPorFecha} variant="outlined">
                Cerrar
              </Button>
            </DialogActions>
          </Dialog>

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
