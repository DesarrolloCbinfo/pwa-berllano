import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
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
import {
  DeleteOutline,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useSessionContext } from "../../../context/SessionProvider";
import { useAuth } from "../../../context/AuthContext";

type CuentaRetiro = {
  Cuenta: string;
  Descripcion: string;
  Cia: string | number;
};

type SucursalOption = {
  id: number;
  nombre: string;
};

type ProveedorAdmonOption = {
  nombre: string;
};

type CategoriaErogacionOption = {
  id: number;
  descripcion: string;
};

type SubcategoriaErogacionOption = {
  id: number;
  descripcion: string;
};

type SubSubcategoriaErogacionOption = {
  id: number;
  descripcion: string;
};

type ErogacionRow = {
  id: number;
  centroCosto: string;
  folioDocumento: string;
  fechaDocumento: string;
  categoria: string;
  subcategoria: string;
  subSubcategoria: string;
  subtotal: number;
  iva: number;
  total: number;
  observaciones: string;
};

type ErogacionBusqueda = {
  folio: number;
  fecha?: string;
  descripcion_general?: string;
  usuario_registra?: string;
  registrado?: number;
  validado?: number;
  autorizado?: number;
};

const fechaActual = () => {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const moneda = (value: number) =>
  Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });

let consecutivoFila = 0;

const filaVacia = (id?: number): ErogacionRow => ({
  id: id ?? ++consecutivoFila,
  centroCosto: "",
  folioDocumento: "",
  fechaDocumento: fechaActual(),
  categoria: "",
  subcategoria: "",
  subSubcategoria: "",
  subtotal: 0,
  iva: 0.16,
  total: 0,
  observaciones: "",
});

export default function AdministracionErogaciones() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();
  const { token } = useAuth();
  const usuarioSesion =
    token?.usuario ||
    (typeof window !== "undefined" ? localStorage.getItem("usuario") || "" : "") ||
    String(session?.claveEmpleado || session?.nombre || "");
  const [folio, setFolio] = useState("");
  const [concepto, setConcepto] = useState("");
  const [fechaAlta, setFechaAlta] = useState(fechaActual());
  const [fechaVencimiento, setFechaVencimiento] = useState(fechaActual());
  const [cuentaRetiro, setCuentaRetiro] = useState("");
  const [cuentasRetiro, setCuentasRetiro] = useState<CuentaRetiro[]>([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(false);
  const [sucursales, setSucursales] = useState<SucursalOption[]>([]);
  const [cargandoSucursales, setCargandoSucursales] = useState(false);
  const [proveedoresAdmon, setProveedoresAdmon] = useState<ProveedorAdmonOption[]>([]);
  const [cargandoProveedoresAdmon, setCargandoProveedoresAdmon] = useState(false);
  const [categoriasErogacion, setCategoriasErogacion] = useState<CategoriaErogacionOption[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [subcategoriasPorCategoria, setSubcategoriasPorCategoria] = useState<Record<string, SubcategoriaErogacionOption[]>>({});
  const [cargandoSubcategoria, setCargandoSubcategoria] = useState<number | null>(null);
  const [subsubcategoriasPorSubcategoria, setSubsubcategoriasPorSubcategoria] = useState<Record<string, SubSubcategoriaErogacionOption[]>>({});
  const [cargandoSubsubcategoria, setCargandoSubsubcategoria] = useState<number | null>(null);
  const [erogacionRegistrada, setErogacionRegistrada] = useState(false);
  const [estadoErogacion, setEstadoErogacion] = useState("PENDIENTE");
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [busquedaFolio, setBusquedaFolio] = useState("");
  const [busquedaFechaInicio, setBusquedaFechaInicio] = useState(fechaActual());
  const [busquedaFechaFin, setBusquedaFechaFin] = useState(fechaActual());
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ErogacionBusqueda[]>([]);
  const [buscandoErogaciones, setBuscandoErogaciones] = useState(false);
  const [filas, setFilas] = useState<ErogacionRow[]>(() => [filaVacia()]);
  const [corte, setCorte] = useState<number | null>(null);
  const [corteParcial, setCorteParcial] = useState<number | null>(null);
  const encabezadoGuardadoRef = useRef(false);
  const guardandoEncabezadoRef = useRef(false);
  const detalleGuardadoRef = useRef<Record<number, {
    sucursal_origen: number;
    folio_docto: string;
    id_gasto: number;
    id_subgasto: number;
    id_subsubgasto: number;
  }>>({});
  const temporizadoresDetalleRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const cargarSiguienteFolio = async () => {
    const sucursalSesion = Number(session?.sucursal || 0);
    if (sucursalSesion <= 0) {
      setFolio("");
      return;
    }

    try {
      const response = await consumoApi.get(
        "/api/AdministracionErogaciones/sp_bw_ObtenerSiguienteFolioErogaciones",
        { params: { sucursal: sucursalSesion } },
      );
      setFolio(String(response.data?.siguiente_folio ?? ""));
    } catch (error) {
      console.error("Error al obtener el folio de erogaciones:", error);
      setFolio("");
    }
  };

  useEffect(() => {
    void cargarSiguienteFolio();
  }, [session?.sucursal]);

  useEffect(() => {
    const cargarCorteActual = async () => {
      const sucursalSesion = session?.sucursal;
      if (!sucursalSesion) {
        setCorte(null);
        setCorteParcial(null);
        return;
      }

      try {
        const response = await consumoApi.get(
          "/api/AdministracionErogaciones/sp_bw_ObtenerCorteActual",
          { params: { sucursal: String(sucursalSesion) } },
        );
        setCorte(response.data?.corte ?? null);
        setCorteParcial(response.data?.corte_parcial ?? null);
      } catch (error) {
        console.error("Error al obtener el corte actual:", error);
        setCorte(null);
        setCorteParcial(null);
      }
    };

    cargarCorteActual();
  }, [session?.sucursal]);

  useEffect(() => {
    const texto = concepto.trim();
    if (
      guardandoEncabezadoRef.current ||
      !texto ||
      !session?.sucursal ||
      !fechaAlta ||
      !usuarioSesion.trim()
    ) {
      return;
    }

    const timer = setTimeout(async () => {
      guardandoEncabezadoRef.current = true;
      try {
        const encabezado = {
          sucursal: String(session.sucursal),
          fecha: fechaAlta,
          descripcion_general: texto,
          fecha_vencimiento: fechaVencimiento || null,
          corte,
          corte_parcial: corteParcial,
        };

        if (!encabezadoGuardadoRef.current) {
          await consumoApi.post(
            "/api/AdministracionErogaciones/sp_bw_detalle_erogacion_add",
            { ...encabezado, usuario_registra: usuarioSesion },
          );
          encabezadoGuardadoRef.current = true;
        } else {
          const folioNum = Number(folio);
          if (folioNum > 0) {
            await consumoApi.post(
              "/api/AdministracionErogaciones/sp_bw_detalle_erogacion_upd",
              { ...encabezado, folio: folioNum },
            );
          }
        }
      } catch (error: any) {
        console.error("Error al guardar el encabezado de la erogación:", error);
        const respuesta = error?.response?.data;
        Swal.fire({
          title: "No se pudo guardar",
          text: [respuesta?.mensaje, respuesta?.detalle]
            .filter(Boolean)
            .join("\n") || "No fue posible guardar el encabezado de la erogación.",
          icon: "error",
          confirmButtonColor: "#111",
        });
      } finally {
        guardandoEncabezadoRef.current = false;
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [concepto, fechaAlta, fechaVencimiento, session?.sucursal, corte, corteParcial, folio]);

  useEffect(() => {
    const cargarCuentasRetiro = async () => {
      setCargandoCuentas(true);
      try {
        const response = await consumoApi.get(
          "/api/AdministracionErogaciones/sp_bw_ObtenerCuentasBancarias",
          { params: { cia: "1" } },
        );
        setCuentasRetiro(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error al cargar las cuentas de retiro:", error);
        setCuentasRetiro([]);
      } finally {
        setCargandoCuentas(false);
      }
    };

    cargarCuentasRetiro();
  }, []);

  useEffect(() => {
    const cargarSucursales = async () => {
      setCargandoSucursales(true);
      try {
        const response = await consumoApi.get(
          "/api/CatSucursales/sp_bw_cat_sucursales_sel",
          { params: { cve_sucursal: 0 } },
        );
        const data = Array.isArray(response.data) ? response.data : [];
        setSucursales(
          data
            .filter((item: any) => Number(item.cve_sucursal) > 0)
            .map((item: any) => ({
              id: Number(item.cve_sucursal),
              nombre: String(item.nombre ?? ""),
            })),
        );
      } catch (error) {
        console.error("Error al cargar las sucursales:", error);
        setSucursales([]);
      } finally {
        setCargandoSucursales(false);
      }
    };

    cargarSucursales();
  }, []);

  useEffect(() => {
    const cargarProveedoresAdmon = async () => {
      setCargandoProveedoresAdmon(true);
      try {
        const response = await consumoApi.get(
          "/api/AdministracionErogaciones/sp_bw_ObtenerProveedoresAdmon",
        );
        const data = Array.isArray(response.data) ? response.data : [];
        setProveedoresAdmon(
          data.map((item: any) => ({
            nombre: String(item.nombre ?? ""),
          })),
        );
      } catch (error) {
        console.error("Error al cargar los proveedores administrativos:", error);
        setProveedoresAdmon([]);
      } finally {
        setCargandoProveedoresAdmon(false);
      }
    };

    cargarProveedoresAdmon();
  }, []);

  useEffect(() => {
    const cargarCategoriasErogacion = async () => {
      setCargandoCategorias(true);
      try {
        const response = await consumoApi.get(
          "/api/AdministracionErogaciones/sp_bw_cat_categorias_sel",
        );
        const data = Array.isArray(response.data) ? response.data : [];
        setCategoriasErogacion(
          data.map((item: any) => ({
            id: Number(item.id_gasto ?? 0),
            descripcion: String(item.descripcion ?? ""),
          })),
        );
      } catch (error) {
        console.error("Error al cargar las categorías de erogaciones:", error);
        setCategoriasErogacion([]);
      } finally {
        setCargandoCategorias(false);
      }
    };

    cargarCategoriasErogacion();
  }, []);

  const subtotal = useMemo(
    () => filas.reduce((sum, row) => sum + Number(row.subtotal || 0), 0),
    [filas],
  );
  const iva = useMemo(
    () => filas.reduce(
      (sum, row) => sum + Number(row.subtotal || 0) * Number(row.iva || 0),
      0,
    ),
    [filas],
  );
  const total = useMemo(
    () => filas.reduce((sum, row) => sum + Number(row.total || 0), 0),
    [filas],
  );
  const encabezadoCompleto =
    Number(folio) > 0 &&
    concepto.trim() !== "" &&
    fechaAlta !== "" &&
    fechaVencimiento !== "";

  const estaRegistrada =
    erogacionRegistrada ||
    ["REGISTRADO", "VALIDADO", "AUTORIZADO"].includes(estadoErogacion);

  const programarGuardadoDetalle = (row: ErogacionRow) => {
    if (erogacionRegistrada || !encabezadoCompleto) return;

    const sucursalSesion = Number(session?.sucursal || 0);
    const folioNumerico = Number(folio || 0);
    const sucursalOrigen = Number(row.centroCosto || 0);
    const idGasto = Number(row.categoria || 0);
    const idSubgasto = Number(row.subcategoria || 0);
    const idSubsubgasto = Number(row.subSubcategoria || 0);

    if (
      sucursalSesion <= 0 ||
      folioNumerico <= 0 ||
      sucursalOrigen <= 0 ||
      !row.folioDocumento.trim() ||
      idGasto <= 0 ||
      idSubgasto <= 0 ||
      idSubsubgasto <= 0
    ) {
      return;
    }

    const anterior = detalleGuardadoRef.current[row.id];

    clearTimeout(temporizadoresDetalleRef.current[row.id]);
    temporizadoresDetalleRef.current[row.id] = setTimeout(async () => {
      try {
        const datosNuevos = {
          sucursal_origen_nuevo: sucursalOrigen,
          folio_docto_nuevo: row.folioDocumento.trim(),
          fecha_docto: `${row.fechaDocumento}T00:00:00`,
          id_gasto_nuevo: idGasto,
          id_subgasto_nuevo: idSubgasto,
          id_subsubgasto_nuevo: idSubsubgasto,
          subtotal_egreso: Number(row.subtotal || 0),
          iva_egreso: Number(row.subtotal || 0) * Number(row.iva || 0),
          observacion: row.observaciones || "",
          total: Number(row.total || 0),
        };

        if (anterior) {
          await consumoApi.put(
            "/api/AdministracionErogaciones/sp_bw_detalle_erogaciones_categorias_upd",
            {
              sucursal: sucursalSesion,
              folio: folioNumerico,
              sucursal_origen_original: anterior.sucursal_origen,
              folio_docto_original: anterior.folio_docto,
              id_gasto_original: anterior.id_gasto,
              id_subgasto_original: anterior.id_subgasto,
              id_subsubgasto_original: anterior.id_subsubgasto,
              cia: 1,
              ...datosNuevos,
            },
          );
        } else {
          await consumoApi.post(
            "/api/AdministracionErogaciones/sp_bw_detalle_erogaciones__categorias_add",
            {
              sucursal: sucursalSesion,
              folio: folioNumerico,
              sucursal_origen: sucursalOrigen,
              folio_docto: row.folioDocumento.trim(),
              fecha_docto: `${row.fechaDocumento}T00:00:00`,
              id_gasto: idGasto,
              id_subgasto: idSubgasto,
              id_subsubgasto: idSubsubgasto,
              subtotal_egreso: Number(row.subtotal || 0),
              iva_egreso: Number(row.subtotal || 0) * Number(row.iva || 0),
              observacion: row.observaciones || "",
              total: Number(row.total || 0),
              cia: 1,
            },
          );
        }

        detalleGuardadoRef.current[row.id] = {
          sucursal_origen: sucursalOrigen,
          folio_docto: row.folioDocumento.trim(),
          id_gasto: idGasto,
          id_subgasto: idSubgasto,
          id_subsubgasto: idSubsubgasto,
        };
      } catch (error: any) {
        console.error("Error al guardar la partida de la erogación:", error);
        Swal.fire({
          title: "No se pudo guardar la partida",
          text:
            [error?.response?.data?.mensaje, error?.response?.data?.detalle]
              .filter(Boolean)
              .join("\n") || "No fue posible guardar el detalle.",
          icon: "error",
          confirmButtonColor: "#111",
        });
      }
    }, 800);
  };

  useEffect(() => {
    if (erogacionRegistrada || !encabezadoCompleto) return;
    filas.forEach(programarGuardadoDetalle);
  }, [filas, encabezadoCompleto, erogacionRegistrada, folio, session?.sucursal]);

  const actualizarFila = (
    id: number,
    campo: keyof ErogacionRow,
    valor: string | number,
  ) => {
    if (erogacionRegistrada) return;

    setFilas((actuales) =>
      actuales.map((row) => {
        if (row.id !== id) return row;
        const actualizada = { ...row, [campo]: valor };
        const subtotalActual = Number(actualizada.subtotal || 0);
        const ivaActual = Number(actualizada.iva || 0);

        if (campo === "total") {
          actualizada.subtotal =
            ivaActual === -1 ? 0 : Number(valor || 0) / (1 + ivaActual);
        } else if (campo === "subtotal" || campo === "iva") {
          actualizada.total = subtotalActual * (1 + ivaActual);
        }
        return actualizada;
      }),
    );
  };

  const handleCategoriaChange = async (rowId: number, idGasto: string) => {
    if (erogacionRegistrada) return;

    setFilas((actuales) =>
      actuales.map((row) =>
        row.id === rowId
          ? { ...row, categoria: idGasto, subcategoria: "" }
          : row,
      ),
    );

    if (!idGasto || subcategoriasPorCategoria[idGasto]) return;

    setCargandoSubcategoria(rowId);
    try {
      const response = await consumoApi.get(
        "/api/AdministracionErogaciones/sp_bw_subcategorias_gasto",
        { params: { idGasto: Number(idGasto) } },
      );
      const data = Array.isArray(response.data) ? response.data : [];
      setSubcategoriasPorCategoria((actuales) => ({
        ...actuales,
        [idGasto]: data.map((item: any) => ({
          id: Number(item.id_subgasto ?? 0),
          descripcion: String(item.descripcion ?? ""),
        })),
      }));
    } catch (error) {
      console.error("Error al cargar las subcategorías de gasto:", error);
      setSubcategoriasPorCategoria((actuales) => ({
        ...actuales,
        [idGasto]: [],
      }));
    } finally {
      setCargandoSubcategoria(null);
    }
  };

  const handleSubcategoriaChange = async (
    rowId: number,
    idGasto: string,
    idSubgasto: string,
  ) => {
    if (erogacionRegistrada) return;

    setFilas((actuales) =>
      actuales.map((row) =>
        row.id === rowId
          ? { ...row, subcategoria: idSubgasto, subSubcategoria: "" }
          : row,
      ),
    );

    if (!idGasto || !idSubgasto) return;

    const cacheKey = `${idGasto}-${idSubgasto}`;
    if (subsubcategoriasPorSubcategoria[cacheKey]) return;

    setCargandoSubsubcategoria(rowId);
    try {
      const response = await consumoApi.get(
        "/api/AdministracionErogaciones/sp_bw_SubSubcategorias",
        {
          params: {
            idGasto: Number(idGasto),
            idSubgasto: Number(idSubgasto),
          },
        },
      );
      const data = Array.isArray(response.data) ? response.data : [];
      setSubsubcategoriasPorSubcategoria((actuales) => ({
        ...actuales,
        [cacheKey]: data.map((item: any) => ({
          id: Number(item.id_subsubgasto ?? 0),
          descripcion: String(item.descripcion ?? ""),
        })),
      }));
    } catch (error) {
      console.error("Error al cargar las sub-subcategorías:", error);
      setSubsubcategoriasPorSubcategoria((actuales) => ({
        ...actuales,
        [cacheKey]: [],
      }));
    } finally {
      setCargandoSubsubcategoria(null);
    }
  };

  const nuevaRecepcion = () => {
    Object.values(temporizadoresDetalleRef.current).forEach((timer) => clearTimeout(timer));
    temporizadoresDetalleRef.current = {};
    detalleGuardadoRef.current = {};
    encabezadoGuardadoRef.current = false;
    guardandoEncabezadoRef.current = false;

    setErogacionRegistrada(false);
    setEstadoErogacion("PENDIENTE");
    setFolio("");
    setConcepto("");
    setFechaAlta(fechaActual());
    setFechaVencimiento(fechaActual());
    setCuentaRetiro("");
    setFilas([filaVacia()]);
    setBusquedaAbierta(false);
    setBusquedaFolio("");
    setResultadosBusqueda([]);

    void cargarSiguienteFolio();
  };

  const agregarRenglon = () => {
    if (erogacionRegistrada) return;

    setFilas((actuales) => [...actuales, filaVacia()]);
  };

  const eliminarRenglon = async (row: ErogacionRow) => {
    if (erogacionRegistrada) {
      aviso("Erogación registrada", "Esta erogación solo puede consultarse; no se puede editar ni eliminar.");
      return;
    }

    const eliminarLocal = () => {
      setFilas((actuales) => {
        const restantes = actuales.filter((actual) => actual.id !== row.id);
        return restantes.length > 0 ? restantes : [filaVacia()];
      });
    };

    const sucursalSesion = Number(session?.sucursal || 0);
    const datosCompletos =
      Number(folio) > 0 &&
      sucursalSesion > 0 &&
      Number(row.categoria) > 0 &&
      Number(row.subcategoria) > 0 &&
      Number(row.subSubcategoria) > 0 &&
      row.folioDocumento.trim() !== "";

    if (!datosCompletos) {
      eliminarLocal();
      return;
    }

    const confirmacion = await Swal.fire({
      title: "Eliminar categoría",
      text: "¿Deseas eliminar esta categoría de la erogación?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No",
      confirmButtonColor: "#111",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await consumoApi.delete(
        "/api/AdministracionErogaciones/sp_bw_detalle_erogacion_categoria_del",
        {
          data: {
            sucursal: sucursalSesion,
            folio: Number(folio),
            sucursal_origen: sucursalSesion,
            folio_docto: row.folioDocumento.trim(),
            id_gasto: Number(row.categoria),
            id_subgasto: Number(row.subcategoria),
            id_subsubgasto: Number(row.subSubcategoria),
            cia: 1,
          },
        },
      );
      eliminarLocal();
      aviso("Categoría eliminada", "La categoría se eliminó correctamente.");
    } catch (error: any) {
      Swal.fire(
        "No se pudo eliminar",
        error?.response?.data?.mensaje ||
          error?.response?.data?.detalle ||
          "No fue posible eliminar la categoría.",
        "error",
      );
    }
  };

  const aviso = (titulo: string, mensaje: string) => {
    Swal.fire({
      title: titulo,
      text: mensaje,
      icon: "info",
      confirmButtonColor: "#111",
    });
  };

  const handleVistaPrevia = () => {
    aviso("Vista previa", "La vista previa se habilitará al conectar el procedimiento de impresión.");
  };

  const handleValidacion = async () => {
    if (erogacionRegistrada) {
      aviso("Erogación registrada", "Esta erogación ya está registrada y solo permite lectura.");
      return;
    }

    const sucursalSesion = Number(session?.sucursal || 0);
    const usuario = usuarioSesion.trim();
    const folioNumerico = Number(folio || 0);

    if (sucursalSesion <= 0 || folioNumerico <= 0 || !usuario) {
      aviso("Datos incompletos", "Captura el folio y valida la sesión antes de continuar.");
      return;
    }

    try {
      const response = await consumoApi.post(
        "/api/AdministracionErogaciones/sp_bw_registrar_detalle_erogacion_upd",
        {
          sucursal: sucursalSesion,
          folio: folioNumerico,
          usuario_registra: usuario,
          cia: 1,
          OSUserName: "",
          OSMachineName: "",
          IPAddress: "",
        },
      );

      Swal.fire(
        "Erogación validada",
        response.data?.mensaje || "La erogación fue validada correctamente.",
        "success",
      );
      setErogacionRegistrada(true);
      void refrescarEstado(folioNumerico);
    } catch (error: any) {
      Swal.fire(
        "No se pudo validar",
        error?.response?.data?.mensaje ||
          error?.response?.data?.detalle ||
          "No fue posible validar la erogación.",
        "error",
      );
    }
  };

  const handleValidar = async () => {
    if (!estaRegistrada) {
      aviso(
        "Erogación no registrada",
        "Primero debes registrar la erogación antes de validarla.",
      );
      return;
    }

    if (estadoErogacion === "AUTORIZADO") {
      aviso("Erogación autorizada", "Esta erogación ya fue autorizada.");
      return;
    }

    const sucursalSesion = Number(session?.sucursal || 0);
    const usuario = usuarioSesion.trim();
    const folioNumerico = Number(folio || 0);

    if (sucursalSesion <= 0 || folioNumerico <= 0 || !usuario) {
      aviso("Datos incompletos", "Captura el folio y valida la sesión antes de continuar.");
      return;
    }

    try {
      const response = await consumoApi.post(
        "/api/AdministracionErogaciones/sp_bw_validar_detalle_erogaciones_upd",
        {
          sucursal: sucursalSesion,
          folio: folioNumerico,
          usuario,
          cia: 1,
          OSUserName: "",
          OSMachineName: "",
          IPAddress: "",
        },
      );

      const tienePermisoAutoriza =
        Number(response.data?.resultado?.TienePermisoAutoriza ?? 0) === 1;

      Swal.fire({
        title: "Erogación validada",
        text: tienePermisoAutoriza
          ? "La erogación fue validada y autorizada correctamente."
          : "La erogación fue validada correctamente.",
        icon: "success",
        confirmButtonColor: "#111",
      });
      void refrescarEstado(folioNumerico);
    } catch (error: any) {
      Swal.fire(
        "No se pudo validar",
        error?.response?.data?.mensaje ||
          error?.response?.data?.detalle ||
          "No fue posible validar la erogación.",
        "error",
      );
    }
  };

  const handleAutorizar = async () => {
    if (!estaRegistrada) {
      aviso(
        "Erogación no registrada",
        "Primero debes registrar la erogación antes de autorizarla.",
      );
      return;
    }

    if (estadoErogacion === "AUTORIZADO") {
      aviso("Erogación autorizada", "Esta erogación ya fue autorizada.");
      return;
    }

    const sucursalSesion = Number(session?.sucursal || 0);
    const usuario = usuarioSesion.trim();
    const folioNumerico = Number(folio || 0);

    if (sucursalSesion <= 0 || folioNumerico <= 0 || !usuario || !cuentaRetiro) {
      aviso(
        "Datos incompletos",
        "Captura el folio, selecciona la cuenta de retiro y valida la sesión antes de continuar.",
      );
      return;
    }

    try {
      const response = await consumoApi.post(
        "/api/AdministracionErogaciones/sp_bw_autorizar_detalle_erogacion_upd",
        {
          sucursal: sucursalSesion,
          folio: folioNumerico,
          usuario,
          cuenta_bancaria: cuentaRetiro,
          cia: 1,
          OSUserName: "",
          OSMachineName: "",
          IPAddress: "",
        },
      );

      Swal.fire(
        "Erogación autorizada",
        response.data?.mensaje || "La erogación fue autorizada correctamente.",
        "success",
      );
      void refrescarEstado(folioNumerico);
    } catch (error: any) {
      Swal.fire(
        "No se pudo autorizar",
        error?.response?.data?.mensaje ||
          error?.response?.data?.detalle ||
          "No fue posible autorizar la erogación.",
        "error",
      );
    }
  };

  const refrescarEstado = async (folioNumerico: number) => {
    const sucursalSesion = Number(session?.sucursal || 0);
    if (sucursalSesion <= 0 || folioNumerico <= 0) return;

    try {
      const response = await consumoApi.get(
        "/api/AdministracionErogaciones/sp_bw_buscar_Erogaciones_sel",
        { params: { sucursal: sucursalSesion, folio: folioNumerico, cia: 1 } },
      );
      const estado = String(response.data?.cabecera?.[0]?.estado ?? "").trim();
      if (estado) setEstadoErogacion(estado.toUpperCase());
    } catch (error) {
      console.error("Error al refrescar el estado de la erogación:", error);
    }
  };

  const aplicarErogacionBuscada = (cabecera: any, detalles: any[]) => {
    const fechaInput = (valor: unknown) =>
      valor ? String(valor).slice(0, 10) : fechaActual();

    detalleGuardadoRef.current = {};
    const filasBuscadas: ErogacionRow[] = detalles.map((detalle: any) => {
      const idFila = ++consecutivoFila;
      const subtotalDetalle = Number(detalle.subtotal_egreso ?? 0);
      const ivaDetalle = Number(detalle.iva_egreso ?? 0);

      detalleGuardadoRef.current[idFila] = {
        sucursal_origen: Number(detalle.sucursal_origen ?? 0),
        folio_docto: String(detalle.folio_docto ?? ""),
        id_gasto: Number(detalle.id_gasto ?? 0),
        id_subgasto: Number(detalle.id_subgasto ?? 0),
        id_subsubgasto: Number(detalle.id_subsubgasto ?? 0),
      };

      return {
        id: idFila,
        centroCosto: String(detalle.sucursal_origen ?? ""),
        folioDocumento: String(detalle.folio_docto ?? ""),
        fechaDocumento: fechaInput(detalle.fecha_docto),
        categoria: String(detalle.id_gasto ?? ""),
        subcategoria: String(detalle.id_subgasto ?? ""),
        subSubcategoria: String(detalle.id_subsubgasto ?? ""),
        subtotal: subtotalDetalle,
        iva: subtotalDetalle > 0 ? ivaDetalle / subtotalDetalle : 0,
        total: Number(detalle.total ?? subtotalDetalle + ivaDetalle),
        observaciones: String(detalle.observacion ?? ""),
      };
    });

    setFolio(String(cabecera.folio ?? ""));
    setConcepto(String(cabecera.descripcion_general ?? ""));
    setFechaAlta(fechaInput(cabecera.fecha));
    setFechaVencimiento(fechaInput(cabecera.fecha_vencimiento));
    setCuentaRetiro(String(cabecera.Cuenta_bancaria ?? ""));
    setEstadoErogacion(String(cabecera.estado ?? "").trim().toUpperCase() || "PENDIENTE");
    setFilas(filasBuscadas.length > 0 ? filasBuscadas : [filaVacia()]);
    setErogacionRegistrada(Number(cabecera.registrado ?? 0) === 1);
  };

  const cargarOpcionesDeDetalles = async (detalles: any[]) => {
    const categorias = [
      ...new Set(
        detalles
          .map((detalle) => Number(detalle.id_gasto ?? 0))
          .filter((id) => id > 0),
      ),
    ];
    const subcategorias = [
      ...new Set(
        detalles
          .map((detalle) => ({
            idGasto: Number(detalle.id_gasto ?? 0),
            idSubgasto: Number(detalle.id_subgasto ?? 0),
          }))
          .filter((item) => item.idGasto > 0 && item.idSubgasto > 0)
          .map((item) => `${item.idGasto}-${item.idSubgasto}`),
      ),
    ];

    const subcategoriasCargadas = await Promise.all(
      categorias.map(async (idGasto) => {
        const response = await consumoApi.get(
          "/api/AdministracionErogaciones/sp_bw_subcategorias_gasto",
          { params: { idGasto } },
        );
        return {
          idGasto,
          opciones: (Array.isArray(response.data) ? response.data : []).map(
            (item: any) => ({
              id: Number(item.id_subgasto ?? 0),
              descripcion: String(item.descripcion ?? ""),
            }),
          ),
        };
      }),
    );

    const subsubcategoriasCargadas = await Promise.all(
      subcategorias.map(async (clave) => {
        const [idGasto, idSubgasto] = clave.split("-").map(Number);
        const response = await consumoApi.get(
          "/api/AdministracionErogaciones/sp_bw_SubSubcategorias",
          { params: { idGasto, idSubgasto } },
        );
        return {
          clave,
          opciones: (Array.isArray(response.data) ? response.data : []).map(
            (item: any) => ({
              id: Number(item.id_subsubgasto ?? 0),
              descripcion: String(item.descripcion ?? ""),
            }),
          ),
        };
      }),
    );

    setSubcategoriasPorCategoria((actuales) => ({
      ...actuales,
      ...Object.fromEntries(
        subcategoriasCargadas.map((item) => [String(item.idGasto), item.opciones]),
      ),
    }));
    setSubsubcategoriasPorSubcategoria((actuales) => ({
      ...actuales,
      ...Object.fromEntries(
        subsubcategoriasCargadas.map((item) => [item.clave, item.opciones]),
      ),
    }));
  };

  const abrirBusqueda = () => {
    setBusquedaFolio("");
    setBusquedaFechaInicio(fechaActual());
    setBusquedaFechaFin(fechaActual());
    setResultadosBusqueda([]);
    setBusquedaAbierta(true);
  };

  const ejecutarBusqueda = async () => {
    const sucursalSesion = Number(session?.sucursal || 0);
    if (sucursalSesion <= 0) {
      aviso("Datos incompletos", "No se pudo determinar la sucursal de la sesión.");
      return;
    }

    setBuscandoErogaciones(true);
    try {
      const folioBuscado = Number(busquedaFolio || 0);
      const params = folioBuscado > 0
        ? { sucursal: sucursalSesion, folio: folioBuscado, cia: 1 }
        : {
            sucursal: sucursalSesion,
            fecha_inicio: busquedaFechaInicio || undefined,
            fecha_fin: busquedaFechaFin || undefined,
            cia: 1,
          };
      const response = await consumoApi.get(
        "/api/AdministracionErogaciones/sp_bw_buscar_Erogaciones_sel",
        { params },
      );
      const cabeceras = Array.isArray(response.data?.cabecera)
        ? response.data.cabecera
        : [];
      setResultadosBusqueda(cabeceras);
    } catch (error: any) {
      Swal.fire(
        "No se pudo buscar",
        error?.response?.data?.mensaje ||
          error?.response?.data?.detalle ||
          "No fue posible buscar las erogaciones.",
        "error",
      );
    } finally {
      setBuscandoErogaciones(false);
    }
  };

  const seleccionarErogacion = async (folioSeleccionado: number) => {
    const sucursalSesion = Number(session?.sucursal || 0);
    try {
      const response = await consumoApi.get(
        "/api/AdministracionErogaciones/sp_bw_buscar_Erogaciones_sel",
        { params: { sucursal: sucursalSesion, folio: folioSeleccionado, cia: 1 } },
      );
      const cabecera = response.data?.cabecera?.[0];
      if (!cabecera) {
        aviso("Sin resultados", "No se encontró la erogación seleccionada.");
        return;
      }
      const detalles = Array.isArray(response.data?.detalles)
        ? response.data.detalles
        : [];
      await cargarOpcionesDeDetalles(detalles);
      aplicarErogacionBuscada(
        cabecera,
        detalles,
      );
      setBusquedaAbierta(false);
    } catch (error: any) {
      Swal.fire(
        "No se pudo cargar",
        error?.response?.data?.mensaje ||
          error?.response?.data?.detalle ||
          "No fue posible cargar la erogación.",
        "error",
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        bgcolor: "#eef0f2",
        p: { xs: 0.75, sm: 1.5 },
      }}
    >
      <Card
        elevation={0}
        sx={{
          border: "1px solid #8c8c8c",
          borderRadius: 0,
          bgcolor: "#fff",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: { xs: 1, sm: 1.5 }, "&:last-child": { pb: 1.5 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            border: "1px solid #59636d",
            borderRadius: 1,
            px: { xs: 1, sm: 1.2 },
            py: 0.8,
          }}
        >
          <Typography
            sx={{
              color: "#111",
              fontWeight: 800,
              fontSize: { xs: "1.1rem", sm: "1.35rem" },
              lineHeight: 1,
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            Administracion de Erogaciones
          </Typography>
          <Typography
            sx={{
              color: "#333",
              fontSize: { xs: "0.7rem", sm: "0.8rem" },
              whiteSpace: "nowrap",
            }}
          >
            {new Date(`${fechaAlta}T00:00:00`).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
              year: "2-digit",
            })}
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
          <Grid container spacing={1} alignItems="center" sx={{ display: "none" }}>
            <Grid size={{ xs: 12, sm: 3, md: 2 }}>
              <TextField
                label="Folio"
                value={folio}
                size="small"
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 5, md: 4 }}>
              <TextField
                label="Concepto"
                value={concepto}
                onChange={(event) => setConcepto(event.target.value)}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <TextField
                label="Fecha Alta"
                type="date"
                value={fechaAlta}
                onChange={(event) => setFechaAlta(event.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <TextField
                label="Fecha Vencimiento"
                type="date"
                value={fechaVencimiento}
                onChange={(event) => setFechaVencimiento(event.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8, md: 2 }}>
              <Select
                displayEmpty
                value={cuentaRetiro}
                onChange={(event) => setCuentaRetiro(event.target.value)}
                size="small"
                fullWidth
                disabled={cargandoCuentas}
                renderValue={(value) =>
                  cuentasRetiro.find((cuenta) => cuenta.Cuenta === value)?.Descripcion ||
                  (value || "Cuenta de Retiro")
                }
              >
                <MenuItem value="">Seleccionar cuenta</MenuItem>
                {cuentasRetiro.map((cuenta) => (
                  <MenuItem key={`${cuenta.Cia}-${cuenta.Cuenta}`} value={cuenta.Cuenta}>
                    {cuenta.Cuenta} - {cuenta.Descripcion}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
          </Grid>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              gap: 1.5,
              py: 0.8,
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={0.7} flexWrap="wrap">
              <Button  onClick={nuevaRecepcion} size="small" variant="contained" sx={{ bgcolor: "#000000", color: "#ffffff", textTransform: "none", boxShadow: "none" }}>Nueva recepción</Button>
              <Button onClick={abrirBusqueda} size="small" variant="contained" sx={{ bgcolor: "#000000", color: "#ffffff", textTransform: "none", boxShadow: "none" }}>Buscar</Button>
              <Button onClick={handleVistaPrevia} size="small" variant="contained" sx={{ bgcolor: "#000000", color: "#ffffff", textTransform: "none", boxShadow: "none" }}>Vista Previa</Button>
              <Button  onClick={handleValidacion} size="small" variant="contained" sx={{ bgcolor: "#000000", color: "#ffffff", textTransform: "none", boxShadow: "none" }}>Registrar</Button>
              <Button  onClick={handleValidar} disabled={!estaRegistrada || estadoErogacion === "AUTORIZADO"} size="small" variant="contained" sx={{ bgcolor: "#000000", color: "#ffffff", textTransform: "none", boxShadow: "none", "&.Mui-disabled": { bgcolor: "#9e9e9e", color: "#fff" } }}>Validar</Button>
              <Button onClick={handleAutorizar} disabled={!estaRegistrada || estadoErogacion === "AUTORIZADO"} size="small" variant="contained" sx={{ bgcolor: "#000000", color: "#ffffff", textTransform: "none", boxShadow: "none", "&.Mui-disabled": { bgcolor: "#9e9e9e", color: "#fff" } }}>Autorizar</Button>
              <Button  onClick={() => window.history.back()} size="small" variant="contained" sx={{ bgcolor: "#000000", color: "#ffffff", textTransform: "none", boxShadow: "none" }}>Salir</Button>
            </Stack>
            <TextField
              label="Estado"
              value={estadoErogacion}
              size="small"
              InputProps={{ readOnly: true }}
              sx={{ minWidth: { xs: "100%", sm: 170 }, bgcolor: "#fff" }}
            />
          </Box>
          </Box>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: "1px solid #8c8c8c", borderRadius: 0, bgcolor: "#fff", overflow: "hidden" }}>
        <CardContent sx={{ p: { xs: 1, sm: 1.5 }, "&:last-child": { pb: 1.5 } }}>
          <Grid container spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <Grid size={{ xs: 12, sm: 3, md: 2 }}>
              <TextField label="Folio" value={folio} size="small" fullWidth InputProps={{ readOnly: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 5, md: 4 }}>
              <TextField label="Concepto" value={concepto} onChange={(event) => setConcepto(event.target.value)} size="small" fullWidth disabled={erogacionRegistrada} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <TextField label="Fecha Alta" type="date" value={fechaAlta} onChange={(event) => setFechaAlta(event.target.value)} size="small" fullWidth disabled={erogacionRegistrada} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <TextField label="Fecha Vencimiento" type="date" value={fechaVencimiento} onChange={(event) => setFechaVencimiento(event.target.value)} size="small" fullWidth disabled={erogacionRegistrada} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8, md: 2 }}>
              <Select
                displayEmpty
                value={cuentaRetiro}
                onChange={(event) => setCuentaRetiro(event.target.value)}
                size="small"
                fullWidth
                disabled={cargandoCuentas || erogacionRegistrada}
                renderValue={(value) => cuentasRetiro.find((cuenta) => cuenta.Cuenta === value)?.Descripcion || (value || "Cuenta de Retiro")}
              >
                <MenuItem value="">Seleccionar cuenta</MenuItem>
                {cuentasRetiro.map((cuenta) => (
                  <MenuItem key={`${cuenta.Cia}-${cuenta.Cuenta}`} value={cuenta.Cuenta}>
                    {cuenta.Cuenta} - {cuenta.Descripcion}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Box sx={{ minWidth: { md: 200 }, textAlign: { xs: "left", md: "right" } }}>
              <Typography>Subtotal: <b>{moneda(subtotal)}</b></Typography>
              <Typography>IVA: <b>{moneda(iva)}</b></Typography>
              <Typography sx={{ borderTop: "1px solid #777", pt: 0.2, fontWeight: 700 }}>Total: <b>{moneda(total)}</b></Typography>
            </Box>
          </Box>

          <fieldset
            disabled={erogacionRegistrada || !encabezadoCompleto}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
          >
          {!encabezadoCompleto && !erogacionRegistrada && (
            <Typography sx={{ color: "#777", fontSize: "0.85rem", mb: 1 }}>
              Completa Folio, Concepto y fechas para habilitar el detalle.
            </Typography>
          )}

          <Typography sx={{ fontWeight: 700, mt: 1.5, mb: 0.5 }}>
            Detalle de Erogaciones
          </Typography>

          <TableContainer
            sx={{
              border: "1px solid #777",
              maxHeight: { xs: 390, md: 500 },
              overflow: "auto",
            }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 1120 }}>
              <TableHead>
                <TableRow>
                  {[
                    "Ctro. Costo",
                    "Folio Doc",
                    "Fecha Docto.",
                    "Categoría",
                    "Subcategoría",
                    "Sub Subcategoría",
                    "Subtotal",
                    "IVA",
                    "Total",
                    "Observaciones",
                    "",
                  ].map((header) => (
                    <TableCell
                      key={header || "acciones"}
                      sx={{
                        bgcolor: "#e1e8ef",
                        border: "1px solid #aeb9c4",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        px: 0.8,
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filas.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ minWidth: 125, p: 0.35 }}>
                      <TextField
                        select
                        value={row.centroCosto}
                        onChange={(event) => actualizarFila(row.id, "centroCosto", event.target.value)}
                        variant="standard"
                        size="small"
                        fullWidth
                        disabled={cargandoSucursales}
                        >
                          <MenuItem value="">Seleccionar</MenuItem>
                          {sucursales.map((sucursal) => (
                            <MenuItem key={sucursal.id} value={String(sucursal.id)}>
                              {sucursal.nombre}
                            </MenuItem>
                          ))}
                        </TextField>
                    </TableCell>
                    <TableCell sx={{ minWidth: 110, p: 0.35 }}>
                      <TextField
                        value={row.folioDocumento}
                        onChange={(event) => actualizarFila(row.id, "folioDocumento", event.target.value)}
                        variant="standard"
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 130, p: 0.35 }}>
                      <TextField
                        type="date"
                        value={row.fechaDocumento}
                        onChange={(event) => actualizarFila(row.id, "fechaDocumento", event.target.value)}
                        variant="standard"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 145, p: 0.35 }}>
                      <TextField
                        select
                        value={row.categoria}
                        onChange={(event) => handleCategoriaChange(row.id, event.target.value)}
                        variant="standard"
                        size="small"
                        fullWidth
                        disabled={cargandoCategorias}
                      >
                        <MenuItem value="">Seleccionar</MenuItem>
                        {categoriasErogacion.map((categoria) => (
                          <MenuItem key={categoria.id} value={String(categoria.id)}>
                            {categoria.descripcion}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell sx={{ minWidth: 145, p: 0.35 }}>
                      <TextField
                        select
                        value={row.subcategoria}
                        onChange={(event) => handleSubcategoriaChange(row.id, row.categoria, event.target.value)}
                        variant="standard"
                        size="small"
                        fullWidth
                        disabled={!row.categoria || cargandoSubcategoria === row.id}
                      >
                        <MenuItem value="">Seleccionar</MenuItem>
                        {(subcategoriasPorCategoria[row.categoria] || []).map((subcategoria) => (
                          <MenuItem key={subcategoria.id} value={String(subcategoria.id)}>
                            {subcategoria.descripcion}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell sx={{ minWidth: 145, p: 0.35 }}>
                      <TextField
                        select
                        value={row.subSubcategoria}
                        onChange={(event) => actualizarFila(row.id, "subSubcategoria", event.target.value)}
                        variant="standard"
                        size="small"
                        fullWidth
                        disabled={!row.subcategoria || cargandoSubsubcategoria === row.id}
                      >
                        <MenuItem value="">Seleccionar</MenuItem>
                        {(subsubcategoriasPorSubcategoria[`${row.categoria}-${row.subcategoria}`] || []).map((subsubcategoria) => (
                          <MenuItem key={subsubcategoria.id} value={String(subsubcategoria.id)}>
                            {subsubcategoria.descripcion}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell sx={{ minWidth: 105, p: 0.35 }}>
                      <TextField
                        type="number"
                        value={row.subtotal}
                        onChange={(event) => actualizarFila(row.id, "subtotal", Number(event.target.value) || 0)}
                        variant="standard"
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 85, p: 0.35 }}>
                      <TextField
                        type="number"
                        value={row.iva}
                        onChange={(event) => actualizarFila(row.id, "iva", Number(event.target.value) || 0)}
                        variant="standard"
                        size="small"
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 105, p: 0.35 }}>
                      <TextField
                        type="number"
                        value={row.total}
                        onChange={(event) => actualizarFila(row.id, "total", Number(event.target.value) || 0)}
                        variant="standard"
                        size="small"
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 220, p: 0.35 }}>
                      <TextField
                        select
                        value={row.observaciones}
                        onChange={(event) => actualizarFila(row.id, "observaciones", event.target.value)}
                        variant="standard"
                        size="small"
                        fullWidth
                        disabled={cargandoProveedoresAdmon}
                      >
                        <MenuItem value="">Seleccionar proveedor</MenuItem>
                        {proveedoresAdmon.map((proveedor) => (
                          <MenuItem key={proveedor.nombre} value={proveedor.nombre}>
                            {proveedor.nombre}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell sx={{ minWidth: 48, textAlign: "center", p: 0.25 }}>
                      <IconButton color="error" size="small" onClick={() => void eliminarRenglon(row)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
            <Button
              size="small"
              variant="contained"
              onClick={agregarRenglon}
              disabled={erogacionRegistrada}
              sx={{ bgcolor: "#111", textTransform: "none", "&:hover": { bgcolor: "#333" } }}
            >
              + Agregar renglón
            </Button>
          </Box>
          </fieldset>
        </CardContent>
      </Card>

      <Dialog
        open={busquedaAbierta}
        onClose={() => setBusquedaAbierta(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 0,
            border: "1px solid #8c8c8c",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#000",
            color: "#fff",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 700,
            fontSize: "1rem",
            py: 1,
          }}
        >
          Búsqueda de erogaciones
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "#fff" }}>
          <Grid container spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <Grid size={{ xs: 12, sm: 3, md: 2 }}>
              <TextField
                label="Folio"
                placeholder="Todos"
                value={busquedaFolio}
                onChange={(event) => setBusquedaFolio(event.target.value)}
                type="number"
                size="small"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                label="Fecha inicio"
                type="date"
                value={busquedaFechaInicio}
                onChange={(event) => setBusquedaFechaInicio(event.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                label="Fecha fin"
                type="date"
                value={busquedaFechaFin}
                onChange={(event) => setBusquedaFechaFin(event.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3, md: 2 }}>
              <Button
                onClick={() => void ejecutarBusqueda()}
                variant="contained"
                fullWidth
                disabled={buscandoErogaciones}
                sx={{
                  bgcolor: "#111",
                  color: "#fff",
                  borderRadius: 0,
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#333" },
                }}
              >
                BUSCAR
              </Button>
            </Grid>
          </Grid>

          <TableContainer sx={{ border: "1px solid #d0d0d0" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  {["Folio", "Concepto", "Fecha", "Usuario", "Estado", "Acción"].map((header) => (
                    <TableCell key={header} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {resultadosBusqueda.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 1.5 }}>
                      {buscandoErogaciones ? "Buscando..." : "Sin resultados"}
                    </TableCell>
                  </TableRow>
                ) : (
                  resultadosBusqueda.map((resultado) => (
                    <TableRow key={resultado.folio} hover>
                      <TableCell>{resultado.folio}</TableCell>
                      <TableCell>{resultado.descripcion_general || ""}</TableCell>
                      <TableCell>
                        {resultado.fecha
                          ? new Date(resultado.fecha).toLocaleDateString("es-MX")
                          : ""}
                      </TableCell>
                      <TableCell>{resultado.usuario_registra || ""}</TableCell>
                      <TableCell>
                        {Number(resultado.autorizado ?? 0) === 1
                          ? "Autorizado"
                          : Number(resultado.validado ?? 0) === 1
                            ? "Validado"
                            : Number(resultado.registrado ?? 0) === 1
                              ? "Registrado"
                              : "Pendiente"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => void seleccionarErogacion(Number(resultado.folio))}
                          sx={{ color: "#111", fontWeight: 700 }}
                        >
                          Cargar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.2, bgcolor: "#fff" }}>
          <Button
            onClick={() => setBusquedaAbierta(false)}
            variant="outlined"
            sx={{ borderColor: "#555", color: "#222", borderRadius: 0 }}
          >
            CERRAR
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
