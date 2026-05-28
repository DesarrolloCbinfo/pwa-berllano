import React, { useEffect } from "react";
import TextField from "@mui/material/TextField";
import useConsumoApi from "../../hooks/useConsumoApi";
import { useServerTable } from "../../hooks/useServerTable";
import useSession from "../../hooks/useSession";
import ClientesTable from "../../components/POS/ClientesTable";
import PaginationControls from "../../components/POS/PaginationControl";
import Swal from "sweetalert2";
import { Box, Button, Dialog, DialogContent, DialogTitle, Divider, FormControl, InputLabel, MenuItem, Select, useTheme, useMediaQuery, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, IconButton } from "@mui/material";
import ProductosTable from "../../components/POS/ProductosTable";
import DetalleVentasTable from "../../components/POS/DetalleVentasTable";
import useCantidadesProducto from "../../hooks/useCantidadesProducto";
import CatClientes from "./cat_Clientes/page";
import { History } from "@mui/icons-material";


type Cliente = {
  No_cliente: string;
  nombre: string;
  ap_paterno?: string | null;
  ap_materno?: string | null;
  total_registros?: number;
};

type Estilista = {
  clave_empleado: string;
  nombre: string;
};

type Producto = {
  clave_prod: string;
  descripcion: string;
  Precio?:number;
  costo_unitario?: number;
  tasa_iva?: number;
  inventariable?: boolean;
  es_insumo?: boolean;
  es_servicio?: boolean;
  es_producto?: boolean;
  controlado?: boolean;
  tiempo?: string;
  total_registros?: number;

};

type Auxiliar = {
  clave_empleado: string;
  nombre: string;
};

type HistorialItem = {
  no_venta: number;
  nombre: string;
  cve_sucursal: number;
  fecha: string;
  clave_prod: string;
  prod_serv: string;
  es_servicio: boolean;
  es_producto: boolean;
  cant_producto: number;
  Precio: number;
  estilista: string;
  descuento: number;
  no_cliente: string;
  cliente: string;
  forma_pago: string;
};

type InsumoItem = {
  cia: number;
  cliente: string;
  producto_venta: string;
  fecha: string;
  sucursal: string;
  estilista: string;
  producto_insumo: string;
  cantidad: number;
  obs: string;
};

type InsumoDetalle = {
  clave_prod: string;
  d_producto: string;
  cantidad: number;
  precio: number;
  importe: number;
};

type ProductoVenta = {
  clave_prod: string;
  d_producto: string;
  cantidad: number;
  precio: number;
  importe: number;
  tiempo: string;
  id_estilista: string;
  d_estilista: string;
  id_auxiliar: string;
  d_estilista_auxiliar: string | null;
  hora: string;
  insumos: InsumoDetalle[];
};

type VentaEnProceso = {
  cve_cliente: string;
  d_cliente: string;
  user: string;
  d_estilista: string;
  importe: number;
  sucursal: number;
  productos: ProductoVenta[];
};

type DetalleVenta = {
  id: string;
  estilista: string;
  id_estilista?: string;
  d_estilista: string;
  hora: string;
  clave_prod: string;
  d_producto: string;
  tiempo: string;
  Cant: number;
  precio: number;
  importe: number;
  descuento: number;
  auxiliar: string;
  d_auxiliar: string;
  insumos?: DetalleVenta[];
};

type FormaPago = {
  tipo: number;
  descripcion: string;
};

type PagoRegistro = {
  tipo: number;
  descripcion: string;
  importe: number;
};

export default function POS() {
  const { consumoApi } = useConsumoApi();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [searchText, setSearchText] = React.useState("");
  const [modalClienteOpen, setModalClienteOpen] = React.useState(false);
  const [modalNuevoClienteOpen, setModalNuevoClienteOpen] = React.useState(false);
  const [modalHistorialOpen, setModalHistorialOpen] = React.useState(false);
  const [historialData, setHistorialData] = React.useState<HistorialItem[]>([]);
  const [historialPage, setHistorialPage] = React.useState(1);
  const [historialLoading, setHistorialLoading] = React.useState(false);
  const [hasMoreHistorial, setHasMoreHistorial] = React.useState(true);
  const [modalHistorialInsumosOpen, setModalHistorialInsumosOpen] = React.useState(false);
  const [historialInsumosData, setHistorialInsumosData] = React.useState<InsumoItem[]>([]);
  const [historialInsumosLoading, setHistorialInsumosLoading] = React.useState(false);
  const [historialInsumosPage, setHistorialInsumosPage] = React.useState(1);
  const [hasMoreHistorialInsumos, setHasMoreHistorialInsumos] = React.useState(true);
  
 const [selectedVenta, setSelectedVenta] = React.useState<{
    cliente: string, 
    suc: number, 
    venta: number, 
    serv: string,
    clienteNombre?: string,
    servDesc?: string,
    fecha?: string,
    estilista?: string
  } | null>(null);
  const [modalAgregarInsumosOpen, setModalAgregarInsumosOpen] = React.useState(false);
  const [detalleSeleccionadoInsumos, setDetalleSeleccionadoInsumos] = React.useState<DetalleVenta | null>(null);
  const [busquedaInsumo, setBusquedaInsumo] = React.useState("");
  const [resultadosInsumos, setResultadosInsumos] = React.useState<Producto[]>([]);
  const [insumosAgregar, setInsumosAgregar] = React.useState<Array<{clave_prod: string, cantidad: number, d_producto: string}>>([]);
  const [loadingBusquedaInsumo, setLoadingBusquedaInsumo] = React.useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = React.useState<Producto | null>(null);
  const [modalProductoOpen, setModalProductoOpen] = React.useState(false);
  const [modalInsumosOpen, setModalInsumosOpen] = React.useState(false);
  const [productoPrincipal, setProductoPrincipal] = React.useState<Producto | null>(null);
  const [insumosSeleccionados, setInsumosSeleccionados] = React.useState<Array<{producto: Producto, cantidad: number}>>([]);
  const [insumoSeleccionadoParaCantidades, setInsumoSeleccionadoParaCantidades] = React.useState<string | null>(null);
  const [cantidadesCache, setCantidadesCache] = React.useState<Record<string, number[]>>({});
  const [insumoCargandoCantidades, setInsumoCargandoCantidades] = React.useState<string | null>(null);
 
  
  // Hook para obtener cantidades disponibles del insumo seleccionado
  const { cantidades, loading: loadingCantidades } = useCantidadesProducto(insumoSeleccionadoParaCantidades);

  // Cache de cantidades para evitar múltiples llamadas
  React.useEffect(() => {
    if (insumoSeleccionadoParaCantidades && cantidades.length > 0) {
      setCantidadesCache(prev => ({
        ...prev,
        [insumoSeleccionadoParaCantidades]: cantidades
      }));
      setInsumoCargandoCantidades(null);
    }
  }, [insumoSeleccionadoParaCantidades, cantidades]);

  // Efecto para cargar cantidades cuando se selecciona un insumo nuevo (no está en cache)
  React.useEffect(() => {
    if (insumosSeleccionados.length > 0) {
      // Buscar el último insumo que no tenga cantidades en cache
      const insumoSinCache = [...insumosSeleccionados].reverse().find(
        item => !cantidadesCache[item.producto.clave_prod]
      );
      if (insumoSinCache) {
        setInsumoCargandoCantidades(insumoSinCache.producto.clave_prod);
        setInsumoSeleccionadoParaCantidades(insumoSinCache.producto.clave_prod);
      }
    }
  }, [insumosSeleccionados, cantidadesCache]);

  // Efecto para actualizar la cantidad inicial cuando lleguen las cantidades del API
  React.useEffect(() => {
    if (insumoSeleccionadoParaCantidades && cantidades.length > 0) {
      // Verificar si el insumo actual tiene cantidad inicial que no está en las cantidades disponibles
      setInsumosSeleccionados(prev => 
        prev.map(item => {
          if (item.producto.clave_prod === insumoSeleccionadoParaCantidades) {
            // Si la cantidad actual no está en las nuevas cantidades, usar la primera disponible
            if (!cantidades.includes(item.cantidad)) {
              return { ...item, cantidad: cantidades[0] };
            }
          }
          return item;
        })
      );
    }
  }, [insumoSeleccionadoParaCantidades, cantidades]);

  

  const [clienteSeleccionado, setClienteSeleccionado] = React.useState<
  Cliente | null
>(null);

const [estilistas, setEstilistas] = React.useState<Estilista[]>([]);
const [estilistaSeleccionado, setEstilistaSeleccionado] = React.useState("");
const [estilistaAuxiliar,setEstilistaAuxiliar] = React.useState<Auxiliar[]>([]);
const [auxiliarSeleccionado,setAuxiliarSeleccionado] = React.useState<string>("");
const [esInsumo, setEsInsumo] = React.useState(false);

const [detallesVenta, setDetallesVenta] = React.useState<DetalleVenta[]>([]);

const session = useSession();
const sucursal = session?.sucursal || 1;

const [ventasEnProceso, setVentasEnProceso] = React.useState<VentaEnProceso[]>([]);
const [modalVentasEnProcesoOpen, setModalVentasEnProcesoOpen] = React.useState(false);
const [loadingVentasEnProceso, setLoadingVentasEnProceso] = React.useState(false);

// Estados para el modal de cobro
const [modalCobroOpen, setModalCobroOpen] = React.useState(false);
const [formasPago, setFormasPago] = React.useState<FormaPago[]>([]);
const [loadingFormasPago, setLoadingFormasPago] = React.useState(false);
const [pagosRegistro, setPagosRegistro] = React.useState<PagoRegistro[]>([]);
const [formaPagoSeleccionada, setFormaPagoSeleccionada] = React.useState<number | "">("");
const [importePago, setImportePago] = React.useState(""); 
  const [autorizacionInput, setAutorizacionInput] = React.useState(""); // 🔥 Estado para la caja de autorización editable
  const [isCredito, setIsCredito] = React.useState(false); 
  const [cuentaPuntos, setCuentaPuntos] = React.useState("");      
  const [puntosPago, setPuntosPago] = React.useState<number>(0);     // 🔥 Ahora es una cantidad editable manual
  const [pagoEfectivo, setPagoEfectivo] = React.useState<number>(0); // 🔥 Ahora es una cantidad editable manual
  const [sumaManual, setSumaManual] = React.useState<number>(0);     // 🔥 Ahora es una cantidad editable manual
  const [saldoPuntosCte, setSaldoPuntosCte] = React.useState<number>(0); 
  const [cuentaRecompensa, setCuentaRecompensa] = React.useState(""); 
  const [puntosGanados, setPuntosGanados] = React.useState<number>(0); 
  const [nc, setNc] = React.useState<number>(0);
const [bonificacion, setBonificacion] = React.useState<number>(0);
const [folioDev, setFolioDev] = React.useState<string>("");
  const [finalizandoVenta, setFinalizandoVenta] = React.useState(false);
  const [clientePreview, setClientePreview] = React.useState<Cliente | null>(null);
  const [tmpPuntosPago, setTmpPuntosPago] = React.useState<number | string>(0);
  const [tmpPagoEfectivo, setTmpPagoEfectivo] = React.useState<number | string>(0);

  const [modalTabuladorOpen, setModalTabuladorOpen] = React.useState(false);
const [denominaciones, setDenominaciones] = React.useState<Record<string, number>>({
  "1000": 0, "500": 0, "200": 0, "100": 0, "50": 0, "20": 0, "10": 0, "5": 0, "2": 0, "1": 0, "0.50": 0, "0.20": 0, "0.10": 0, "vales": 0
});

const listaDenominaciones = ["1000", "500", "200", "100", "50", "20", "10", "5", "2", "1", "0.50", "0.20", "0.10", "vales"];

const totalTabulador = Object.entries(denominaciones).reduce((sum, [key, cant]) => {
  const factor = key === "vales" ? 1 : parseFloat(key);
  return sum + (factor * cant);
}, 0);
  

  // 🔥 MATEMÁTICA DE TOTALES CONTROLADOS MANUALMENTE
  const totalVenta = detallesVenta.reduce((sum, item) => sum + item.importe, 0);
  
  // El total recibido suma la caja manual de tarjetas, el efectivo y el canje de puntos
  const totalPagado = isCredito ? 0 : (sumaManual + pagoEfectivo + puntosPago);
  const cambio = isCredito ? 0 : (totalPagado - totalVenta > 0 ? totalPagado - totalVenta : 0);
  const puedeFinalizar = isCredito ? true : (totalPagado >= totalVenta && totalPagado > 0);


// 🔥 CÁLCULO AUTOMÁTICO DE RECOMPENSA (PUNTOS GANADOS)
React.useEffect(() => {
  if (!modalCobroOpen || !clienteSeleccionado) return;

  // 💡 REGLA DE MODALIDADES: Si no se ha ingresado dinero ni activado crédito,
  // la recompensa se queda en 0.00 y no hace peticiones al servidor.
  if (pagoEfectivo === 0 && sumaManual === 0 && puntosPago === 0 && !isCredito) {
    setPuntosGanados(0);
    return;
  }

  const calcularPuntos = async () => {
    try {
      const efectivoNeto = (pagoEfectivo - cambio) > 0 ? (pagoEfectivo - cambio) : 0;

      const res = await consumoApi.get('/api/PuntoDeVenta/sp_obtiene_ptos_vta', {
        params: {
          sucursal: sucursal,
          cliente: clienteSeleccionado.No_cliente,
          efectivo: efectivoNeto,
          tarjeta: sumaManual,
          puntos: puntosPago,
          isCredito: isCredito ? 1 : 0
        }
      });
      
      if (res.data && res.data.ptos_totales !== undefined) {
        setPuntosGanados(res.data.ptos_totales);
      }
    } catch (error) {
      console.error("Error al calcular puntos de recompensa:", error);
    }
  };

  const timer = setTimeout(() => {
    calcularPuntos();
  }, 500);

  return () => clearTimeout(timer);
  
}, [pagoEfectivo, sumaManual, puntosPago, isCredito, modalCobroOpen, cambio]);
  // Función para cargar desde archivo JSON externo
  const cargarDatosDesdeArchivo = async () => {
    try {
      const response = await fetch('/datos-ejemplo.json');
      const datos = await response.json();
      setDetallesVenta(datos);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos');
    }
  };

  const fetchHistorial = async (cliente: string, pagina: number) => {
    setHistorialLoading(true);
    try {
      const response = await consumoApi.get('/api/PuntoDeVenta/sp_historial_cte_compras', {
        params: { cliente, pagina },
        timeout: 60000
      });
      return response.data || response || [];
    } catch (error: any) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('Timeout en historial de compras');
      } else {
        console.error('Error fetching historial:', error);
      }
      return [];
    } finally {
      setHistorialLoading(false);
    }
  };

  const handleOpenHistorial = async () => {
    if (!clienteSeleccionado) return;
    setHistorialPage(1);
    setHasMoreHistorial(true);
    const data = await fetchHistorial(clienteSeleccionado.No_cliente, 1);
    setHistorialData(data);
    setModalHistorialOpen(true);
  };

  const handlePrevPage = async () => {
    if (!clienteSeleccionado || historialPage <= 1) return;
    const newPage = historialPage - 1;
    const data = await fetchHistorial(clienteSeleccionado.No_cliente, newPage);
    if (data.length > 0) {
      setHistorialData(data);
      setHistorialPage(newPage);
    }
  };

  const handleNextPage = async () => {
    if (!clienteSeleccionado || !hasMoreHistorial) return;
    const newPage = historialPage + 1;
    const data = await fetchHistorial(clienteSeleccionado.No_cliente, newPage);
    if (data.length > 0) {
      setHistorialData(data);
      setHistorialPage(newPage);
    } else {
      setHasMoreHistorial(false);
    }
  };

  const fetchInsumosVenta = async (cliente: string, suc: number, venta: number, serv: string, pagina: number) => {
    setHistorialInsumosLoading(true);
    try {
      const response = await consumoApi.get('/api/PuntoDeVenta/sp_historial_cte_insumos', {
        params: { cliente, suc, venta, serv, pagina },
        timeout: 60000
      });
      return response.data || response || [];
    } catch (error) {
      console.error('Error fetching insumos:', error);
      return [];
    } finally {
      setHistorialInsumosLoading(false);
    }
  };

 const handleOpenInsumos = async (item: HistorialItem) => {
    if (!clienteSeleccionado) return;
    setSelectedVenta({
      cliente: clienteSeleccionado.No_cliente,
      suc: item.cve_sucursal,
      venta: item.no_venta,
      serv: item.clave_prod,
      // 🔥 Nuevos datos para pintar el encabezado tipo Access
      clienteNombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.ap_paterno || ''} ${clienteSeleccionado.ap_materno || ''}`.trim(),
      servDesc: item.prod_serv,
      fecha: item.fecha,
      estilista: item.estilista
    });
    setHistorialInsumosPage(1);
    setHasMoreHistorialInsumos(true);
    const data = await fetchInsumosVenta(
      clienteSeleccionado.No_cliente,
      item.cve_sucursal,
      item.no_venta,
      item.clave_prod,
      1
    );
    setHistorialInsumosData(data);
    setModalHistorialInsumosOpen(true);
  };

  const handlePrevInsumos = async () => {
    if (!selectedVenta || historialInsumosPage <= 1) return;
    const newPage = historialInsumosPage - 1;
    const data = await fetchInsumosVenta(selectedVenta.cliente, selectedVenta.suc, selectedVenta.venta, selectedVenta.serv, newPage);
    if (data.length > 0) {
      setHistorialInsumosData(data);
      setHistorialInsumosPage(newPage);
    }
  };

  const handleNextInsumos = async () => {
    if (!selectedVenta || !hasMoreHistorialInsumos) return;
    const newPage = historialInsumosPage + 1;
    const data = await fetchInsumosVenta(selectedVenta.cliente, selectedVenta.suc, selectedVenta.venta, selectedVenta.serv, newPage);
    if (data.length > 0) {
      setHistorialInsumosData(data);
      setHistorialInsumosPage(newPage);
    } else {
      setHasMoreHistorialInsumos(false);
    }
  };

  const handleAbrirAgregarInsumos = (detalle: DetalleVenta) => {
    // Convertir el detalle a un producto para el modal de insumos
    const productoParaInsumos: Producto = {
      clave_prod: detalle.clave_prod,
      descripcion: detalle.d_producto,
      es_servicio: true,
      controlado: true,
    };
    setProductoPrincipal(productoParaInsumos);
    setInsumosSeleccionados([]);
    setModalInsumosOpen(true);
  };

  const buscarInsumos = async (busqueda: string) => {
    if (busqueda.length < 2) {
      setResultadosInsumos([]);
      return;
    }
    setLoadingBusquedaInsumo(true);
    try {
      const response = await consumoApi.get('/api/PuntoDeVenta/sp_busca_productos_paginado', {
        params: { search: busqueda, pagina: 1, pageSize: 20 }
      });
      const data = response.data || response.data?.data || [];
      setResultadosInsumos(data);
    } catch (error) {
      console.error('Error buscando insumos:', error);
      setResultadosInsumos([]);
    } finally {
      setLoadingBusquedaInsumo(false);
    }
  };

  const agregarInsumoALista = (producto: Producto) => {
    const yaExiste = insumosAgregar.some(i => i.clave_prod === producto.clave_prod);
    if (yaExiste) {
      Swal.fire('Info', 'El insumo ya está en la lista', 'info');
      return;
    }
    setInsumosAgregar([...insumosAgregar, { 
      clave_prod: producto.clave_prod, 
      cantidad: 1, 
      d_producto: producto.descripcion 
    }]);
  };

  const quitarInsumoDeLista = (clave_prod: string) => {
    setInsumosAgregar(insumosAgregar.filter(i => i.clave_prod !== clave_prod));
  };

  const actualizarCantidadInsumo = (clave_prod: string, cantidad: number) => {
    if (cantidad <= 0) return;
    setInsumosAgregar(insumosAgregar.map(i => 
      i.clave_prod === clave_prod ? { ...i, cantidad } : i
    ));
  };

  const guardarInsumosVenta = async () => {
    if (!detalleSeleccionadoInsumos || insumosAgregar.length === 0) {
      Swal.fire('Atención', 'Agrega al menos un insumo', 'warning');
      return;
    }

    if (!clienteSeleccionado) {
      Swal.fire('Atención', 'Selecciona un cliente', 'warning');
      return;
    }

    const payload = insumosAgregar.map(i => ({
      clave_prod: i.clave_prod,
      cantidad: i.cantidad
    }));

    try {
      await consumoApi.post(
        `/api/PuntoDeVenta/sp_fw_pos_agregar_insumos_venta?cia=1&sucursal=${sucursal}&no_venta=0&cve_cliente=${clienteSeleccionado.No_cliente}&clave_producto_venta=${detalleSeleccionadoInsumos.clave_prod}&estilista=${detalleSeleccionadoInsumos.id_estilista}`,
        payload
      );
      Swal.fire('Éxito', 'Insumos agregados correctamente', 'success');
      setModalAgregarInsumosOpen(false);
      setInsumosAgregar([]);
      setDetalleSeleccionadoInsumos(null);
    } catch (error: any) {
      const msg = error.response?.data?.mensaje || 'Error al agregar insumos';
      Swal.fire('Error', msg, 'error');
    }
  };

  const handleRegistrar = () => {
    // Validar que se hayan seleccionado los datos necesarios
    if (!estilistaSeleccionado || !productoSeleccionado) {
      alert('Por favor selecciona un estilista y un producto');
      return;
    }

    // Verificar si el producto es controlado y es servicio
    if (productoSeleccionado.controlado && productoSeleccionado.es_servicio) {
      // Guardar el producto principal y abrir modal de insumos
      setProductoPrincipal(productoSeleccionado);
      setModalInsumosOpen(true);
      return;
    }

    // Si no es controlado, proceder normalmente
    registrarProducto(productoSeleccionado);
  };

  const guardarProductoIndividual = async (detalle: DetalleVenta) => {
    if (!clienteSeleccionado) {
      alert('Por favor selecciona un cliente');
      return false;
    }

    try {
      const payload = {
        sucursal: sucursal,
        cve_cliente: clienteSeleccionado.No_cliente,
        estilista: detalle.estilista,
        auxiliar: detalle.auxiliar || '',
        productos: [{
          clave_prod: detalle.clave_prod,
          cantidad: detalle.Cant,
          precio: detalle.precio,
          descuento: detalle.descuento,
          tiempo: detalle.tiempo != null ? String(detalle.tiempo) : "00:00",
          hora: detalle.hora,
          insumos: (detalle.insumos || []).map(insumo => ({
            clave_prod: insumo.clave_prod,
            cantidad: insumo.Cant
          }))
        }]
      };

      const res = await consumoApi.post(
        '/api/PuntoDeVenta/sp_fw_pos_guardar_venta',
        payload
      );

      if (res.data?.ok === 1) {
        return true;
      } else {
        alert(res.data?.mensaje || 'Error al guardar el producto');
        return false;
      }
    } catch (error: any) {
      console.error('Error guardando producto:', error);
      alert(error.response?.data?.mensaje || 'Error al guardar el producto');
      return false;
    }
  };

  const registrarProducto = async (producto: Producto, esInsumoAdicional = false) => {
    // Validar que haya cliente seleccionado
    if (!clienteSeleccionado) {
      alert('Por favor selecciona un cliente primero');
      return;
    }

    // Obtener nombres del estilista y auxiliar
    const estilistaNombre = estilistas.find((e: Estilista) => e.clave_empleado === estilistaSeleccionado)?.nombre || '';
    const auxiliarNombre = auxiliarSeleccionado ? 
      estilistaAuxiliar?.find((e: Auxiliar) => e.clave_empleado === auxiliarSeleccionado)?.nombre || '' : '';

    // Crear nuevo detalle de venta
    const nuevoDetalle: DetalleVenta = {
      id: Date.now().toString(), // ID único temporal
      estilista: estilistaSeleccionado,
      d_estilista: estilistaNombre,
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      clave_prod: producto.clave_prod,
      d_producto: producto.descripcion,
      tiempo: producto.tiempo || '00:00', // Usar tiempo del producto o por defecto
      Cant: 1,
      precio: producto.Precio || 0,
      importe: producto.Precio || 0,
      descuento: 0,
      auxiliar: auxiliarSeleccionado || '',
      d_auxiliar: auxiliarNombre,
    };

    // Agregar a la lista de detalles temporalmente para mostrar
    setDetallesVenta(prev => [...prev, nuevoDetalle]);

    // Guardar inmediatamente en la base de datos
    const guardoExito = await guardarProductoIndividual(nuevoDetalle);
    
    if (!guardoExito) {
      // Si hubo error, quitamos el detalle de la lista
      setDetallesVenta(prev => prev.filter(d => d.id !== nuevoDetalle.id));
    }

    // Limpiar selección de producto para poder agregar otro
    setProductoSeleccionado(null);
    
    // Si era un insumo adicional, cerrar el modal
    if (esInsumoAdicional) {
      setModalInsumosOpen(false);
      setProductoPrincipal(null);
    }
  };

  const fetchFormasPago = async () => {
    setLoadingFormasPago(true);
    try {
      const res = await consumoApi.get(
        `/api/PuntoDeVenta/sp_fw_pos_formas_pago_get?sucursal=${sucursal}`
      );
      setFormasPago(res.data || []);
    } catch (error) {
      console.error('Error cargando formas de pago:', error);
      alert('Error al cargar las formas de pago');
    } finally {
      setLoadingFormasPago(false);
    }
  };

  const handleCancelarRenglon = async (detalle: DetalleVenta) => {
    if (!clienteSeleccionado) {
      alert('No hay cliente seleccionado');
      return;
    }

    const confirm = await Swal.fire({
      title: 'Cancelar renglón',
      text: `¿Estás seguro de cancelar "${detalle.d_producto}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      confirmButtonColor: '#d32f2f',
    });

    if (!confirm.isConfirmed) return;

    try {
      const params = new URLSearchParams({
        cia: '1',
        sucursal: sucursal.toString(),
        cve_cliente: clienteSeleccionado.No_cliente,
        clave_prod: detalle.clave_prod,
        hora: 'xx',
        estilista: detalle.estilista,
        auxiliar: detalle.auxiliar || '0'
      });

      const res = await consumoApi.put(
        `/api/PuntoDeVenta/sp_fw_pos_cancelar_renglon?${params.toString()}`
      );

      // La API devuelve un array, tomamos el primer elemento
      const responseData = Array.isArray(res.data) ? res.data[0] : res.data;

      if (responseData?.ok === 1) {
        Swal.fire({
          icon: 'success',
          title: 'Cancelado',
          text: responseData?.mensaje || 'Renglón cancelado',
          confirmButtonText: 'Aceptar'
        });
        // Eliminar de la lista local
        setDetallesVenta(prev => prev.filter(d => d.id !== detalle.id));
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: responseData?.mensaje || 'Error al cancelar el renglón',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error: any) {
      console.error('Error cancelando renglón:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'Error al cancelar el renglón',
        confirmButtonText: 'Aceptar'
      });
    }
  };
  

const handleAbrirCobro = () => {
  if (detallesVenta.length === 0) {
    alert('No hay productos para cobrar');
    return;
  }

  // 🧹 LIMPIEZA TOTAL DE ESTADOS (Emula el Form_Open de Access)
  setPagosRegistro([]);
  setFormaPagoSeleccionada("");
  setImportePago("");
  setAutorizacionInput("");
  setIsCredito(false);
  
  // Limpieza de cajas de texto e inputs
  setCuentaPuntos("");
  setCuentaRecompensa("");
  setPagoEfectivo(0);
  setSumaManual(0);
  
  // Limpieza del motor de monedero
  setSaldoPuntosCte(0);
  setPuntosPago(0);    // Puntos reales aplicados
  setTmpPuntosPago(""); // Buffer temporal para la caja de texto
  setPuntosGanados(0);

  // Cargar formas de pago de la API y desplegar modal
  fetchFormasPago();
  setModalCobroOpen(true);
};

const handleAgregarPago = () => {
    const importe = parseFloat(importePago);
    if (isNaN(importe) || importe <= 0) {
      alert('Ingresa un importe válido');
      return;
    }

    // Access rule: Al presionar "+", empaqueta el nombre y el número de autorización tipeado
    const descConAutorizacion = autorizacionInput ? `TC CLIP - AUT: ${autorizacionInput}` : "TC CLIP";

    setPagosRegistro(prev => [...prev, {
      tipo: 7, // Código de tipo para tarjetas
      descripcion: descConAutorizacion,
      importe
    }]);

    // 🔥 Acumula automáticamente el valor en el campo de "Suma" al vuelo
    setSumaManual(prev => prev + importe);
    setImportePago("");
    setAutorizacionInput(""); // Limpia la caja
  };

  const handleEliminarPago = (index: number) => {
    setPagosRegistro(prev => prev.filter((_, i) => i !== index));
  };

// ... aquí termina tu función handleEliminarPago ...

  // 🔴 ASEGÚRATE DE QUE ESTAS TRES QUEDEN AQUÍ ADENTRO:
  const handleKeyDownPuntos = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const puntosAIntercambiar = parseFloat(String(tmpPuntosPago)) || 0;

      if (puntosAIntercambiar > saldoPuntosCte) {
        Swal.fire("Saldo Insuficiente", "El cliente no cuenta con los puntos suficientes.", "warning");
        setTmpPuntosPago(0);
        setPuntosPago(0);
        return;
      }
      setPuntosPago(puntosAIntercambiar);
    }
  };

  const handleKeyDownCuentaPuntos = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!cuentaPuntos) return;

      try {
        const res = await consumoApi.get('/api/PuntoDeVenta/obtiene_puntos_cliente', {
          params: { cuenta: cuentaPuntos }
        });
        setSaldoPuntosCte(res.data.puntosDisponibles || 0);
        setTmpPuntosPago(0); 
        setPuntosPago(0);     
      } catch (error) {
        console.error("Error al validar tarjeta de lealtad:", error);
        Swal.fire("Error", "No se pudo validar la cuenta de puntos.", "error");
        setSaldoPuntosCte(0);
      }
    }
  };

const handleKeyDownEfectivo = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const montoDigitado = parseFloat(String(tmpPagoEfectivo)) || 0;
    
    if (montoDigitado <= 0) {
      Swal.fire("Atención", "Ingrese una cantidad válida de efectivo.", "warning");
      return;
    }

    setDenominaciones({
      "1000": 0, "500": 0, "200": 0, "100": 0, "50": 0, "20": 0, "10": 0, "5": 0, "2": 0, "1": 0, "0.50": 0, "0.20": 0, "0.10": 0, "vales": 0
    });

    setModalTabuladorOpen(true);
  }
};

const handleAceptarTabulador = () => {
  const montoEsperado = parseFloat(String(tmpPagoEfectivo)) || 0;

  if (Math.round(totalTabulador * 100) !== Math.round(montoEsperado * 100)) {
    // 💥 CAMBIAMOS A CONFIGURACIÓN DE OBJETO EN SWAL PARA INYECTAR EL Z-INDEX:
    Swal.fire({
      title: "Arqueo de Efectivo",
      text: `Los importes de efectivo no coinciden. El desglose suma $${totalTabulador.toFixed(2)} pero indicaste que recibiste $${montoEsperado.toFixed(2)}. ¡Verifique!`,
      icon: "error",
      confirmButtonText: "Aceptar",
      // 🔥 TRUCO: Fuerza a SweetAlert a ponerse por encima de cualquier modal de Material UI
      willOpen: () => {
        const container = Swal.getContainer();
        if (container) {
          container.style.zIndex = "9999";
        }
      }
    });
    return;
  }

  setPagoEfectivo(montoEsperado);
  setModalTabuladorOpen(false);
};


const handleCancelarTabulador = () => {
  setModalTabuladorOpen(false);
  setTmpPagoEfectivo(0);
  setPagoEfectivo(0);
};

// 🔥 FUNCIÓN DE VALIDACIÓN RESTAURADA
const verificaDatosVenta = () => {
  if (detallesVenta.length === 0) {
    Swal.fire("Atención", "No hay productos o servicios para cobrar.", "warning");
    return false;
  }
  
  // Evitar Cantidades o Precios en Cero
  const tieneCeros = detallesVenta.some(d => d.Cant <= 0 || d.precio <= 0);
  if (tieneCeros) {
    Swal.fire("Error", "Hay productos o servicios con cantidad o precio en Cero. Verifique.", "error");
    return false;
  }
  
  // Evitar crédito a Público en General
  if (isCredito && clienteSeleccionado?.No_cliente === "00001") {
    Swal.fire("Atención", "Seleccione un cliente válido para el crédito. No aplica a Público en General.", "warning");
    return false;
  }

  // Validar saldo de puntos
  if (puntosPago > saldoPuntosCte) {
    Swal.fire("Atención", "El saldo del cliente es insuficiente para pagar con los puntos indicados.", "warning");
    return false;
  }

  return true;
};

const handleFinalizarVenta = async () => {
  // 1. Validaciones previas de Access
  if (!verificaDatosVenta()) return;

 const handleFinalizarVenta = async () => {
    // 1. Validaciones previas de Access
    if (!verificaDatosVenta()) return; 
    if (!clienteSeleccionado || !estilistaSeleccionado) {
      alert('Faltan datos para finalizar la venta');
      return;
    }

    // Regla Access: Validar que no pague con más puntos de los que tiene
    if (puntosPago > saldoPuntosCte) {
      Swal.fire("Atención", "El saldo del cliente es insuficiente para pagar con los puntos indicados. Verifique.", "warning");
      setPuntosPago(0);
      return;
    }

    setFinalizandoVenta(true);
    try {
      // 2. Construir el arreglo de pagos exactamente como lo hace Access (detalle_ventas_medios_pagos)
      let pagosFinales: any[] = [];

      if (isCredito) {
        // Si es crédito, Access manda un solo pago Tipo 10 por el Total a Pagar
        pagosFinales.push({
          tipo_Pago: 10,
          referencia: "Venta a crédito",
          importe: totalVenta
        });
      } else {
        // A. Agregar Tarjetas CLIP (Tipo 7)
        pagosRegistro.forEach(p => {
          pagosFinales.push({
            tipo_Pago: 7, 
            referencia: p.descripcion || "TC CLIP",
            importe: p.importe
          });
        });

        // B. Agregar Efectivo (Tipo 1) -> Importe exacto cobrado (Efectivo - Cambio)
        const efectivoNeto = pagoEfectivo - cambio;
        if (efectivoNeto > 0) {
          pagosFinales.push({
            tipo_Pago: 1,
            referencia: "Pago en efectivo",
            importe: efectivoNeto
          });
        }

        // C. Agregar Pago con Puntos (Tipo 5)
        if (puntosPago > 0) {
          pagosFinales.push({
            tipo_Pago: 5,
            referencia: "Pago con puntos",
            importe: puntosPago
          });
        }
        
        // (Nota: Si tu backend necesita recibir la NC o Bonificación como "Forma de pago",
        // se agregarían aquí con sus respectivos tipos).
      }

      // 3. Empaquetar todo el payload expandido para el Stored Procedure Web
      const payload = {
        cia: 1,
        sucursal: sucursal,
        caja: 1,
        cve_Cliente: clienteSeleccionado.No_cliente,
        estilista: estilistaSeleccionado,
        usuario: session?.id || '',
        
        // Banderas y datos descubiertos en VBA:
        isCredito: isCredito ? 1 : 0,
        cuentaPuntos: cuentaPuntos || "",
        cuentaRecompensa: cuentaRecompensa || "",
        puntosGanados: puntosGanados,
        folioDev: folioDev || "",
        notaCredito: nc || 0,
        bonificacion: bonificacion || 0,

        pagos: pagosFinales
      };

      // 4. Disparar a la API
      const res = await consumoApi.post(
        '/api/PuntoDeVenta/sp_bw_pos_finaliza_venta',
        payload
      );

      if (res.data?.ok === 1) {
        Swal.fire({
          icon: 'success',
          title: 'Venta finalizada',
          text: `${res.data?.mensaje} - Folio: ${res.data?.folio}`,
          confirmButtonText: 'Aceptar'
        });
        
        // Limpieza de pantalla (Emula inicializa_pantalla() de Access)
        setModalCobroOpen(false);
        setDetallesVenta([]);
        setClienteSeleccionado(null);
        setEstilistaSeleccionado('');
        setAuxiliarSeleccionado('');
        setPagosRegistro([]);
        setSumaManual(0);
        setPagoEfectivo(0);
        setPuntosPago(0);
        setCuentaPuntos("");
        setCuentaRecompensa("");
        setNc(0);
        setBonificacion(0);
        setFolioDev("");
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res.data?.mensaje || 'Error al finalizar la venta',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error: any) {
      console.error('Error finalizando venta:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'Error al finalizar la venta',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setFinalizandoVenta(false);
    }
  };

  const handleSeleccionarInsumo = (insumo: Producto) => {
    // Verificar si el insumo ya está seleccionado
    const existe = insumosSeleccionados.some(item => item.producto.clave_prod === insumo.clave_prod);
    
    if (existe) {
      // Eliminar de la selección
      setInsumosSeleccionados(prev => prev.filter(item => item.producto.clave_prod !== insumo.clave_prod));
    } else {
      // Agregar a la selección con cantidad 1
      setInsumosSeleccionados(prev => [...prev, { producto: insumo, cantidad: 1 }]);
      // Establecer el insumo seleccionado para cargar sus cantidades disponibles
      setInsumoSeleccionadoParaCantidades(insumo.clave_prod);
    }
  };

  const handleCantidadInsumo = (clave_prod: string, cantidad: number) => {
    setInsumosSeleccionados(prev => 
      prev.map(item => 
        item.producto.clave_prod === clave_prod 
          ? { ...item, cantidad: Math.max(0.001, cantidad) }
          : item
      )
    );
  };

  const handleConfirmarInsumos = async () => {
    if (!productoPrincipal || insumosSeleccionados.length === 0) {
      alert('Por favor selecciona al menos un insumo');
      return;
    }

    // Primero registrar el producto principal si no está ya registrado
    const productoYaRegistrado = detallesVenta.some(d => d.clave_prod === productoPrincipal.clave_prod);
    
    let productoActualizado: DetalleVenta;
    if (!productoYaRegistrado) {
      // Crear el producto principal con los insumos seleccionados
      productoActualizado = {
        id: Date.now().toString(),
        estilista: estilistaSeleccionado,
        d_estilista: estilistas.find((e: Estilista) => e.clave_empleado === estilistaSeleccionado)?.nombre || '',
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        clave_prod: productoPrincipal.clave_prod,
        d_producto: productoPrincipal.descripcion,
        tiempo: productoPrincipal.tiempo || '00:00',
        Cant: 1,
        precio: productoPrincipal.Precio || 0,
        importe: productoPrincipal.Precio || 0,
        descuento: 0,
        auxiliar: auxiliarSeleccionado || '',
        d_auxiliar: auxiliarSeleccionado ? 
          estilistaAuxiliar?.find((e: Auxiliar) => e.clave_empleado === auxiliarSeleccionado)?.nombre || '' : '',
        insumos: insumosSeleccionados.map(item => ({
          id: Date.now().toString() + Math.random(),
          estilista: estilistaSeleccionado,
          d_estilista: estilistas.find((e: Estilista) => e.clave_empleado === estilistaSeleccionado)?.nombre || '',
          hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          clave_prod: item.producto.clave_prod,
          d_producto: item.producto.descripcion,
          tiempo: item.producto.tiempo || '00:00',
          Cant: item.cantidad,
          precio: item.producto.Precio || 0,
          importe: (item.producto.Precio || 0) * item.cantidad,
          descuento: 0,
          auxiliar: auxiliarSeleccionado || '',
          d_auxiliar: auxiliarSeleccionado ? 
            estilistaAuxiliar?.find((e: Auxiliar) => e.clave_empleado === auxiliarSeleccionado)?.nombre || '' : '',
        }))
      };
      
      // Agregar el producto principal a la lista
      setDetallesVenta(prev => [...prev, productoActualizado]);

      // Guardar en la base de datos
      const guardoExito = await guardarProductoIndividual(productoActualizado);
      
      if (!guardoExito) {
        // Si hubo error, quitamos el detalle de la lista
        setDetallesVenta(prev => prev.filter(d => d.id !== productoActualizado.id));
        return;
      }

      // Enviar insumos a la API
      try {
        const payloadInsumos = insumosSeleccionados.map(item => ({
          clave_prod: item.producto.clave_prod,
          cantidad: item.cantidad
        }));
        await consumoApi.post(
          `/api/PuntoDeVenta/sp_fw_pos_agregar_insumos_venta?cia=1&sucursal=${sucursal}&no_venta=0&cve_cliente=${clienteSeleccionado?.No_cliente || ''}&clave_producto_venta=${productoPrincipal.clave_prod}&estilista=${estilistaSeleccionado}`,
          payloadInsumos
        );
      } catch (error) {
        console.error('Error guardando insumos en API:', error);
      }
    } else {
      // Encontrar el producto principal existente y agregarle los insumos
      setDetallesVenta(prev => prev.map(detalle => {
        if (detalle.clave_prod === productoPrincipal.clave_prod) {
          const nuevosInsumos = insumosSeleccionados.map(item => ({
            id: Date.now().toString() + Math.random(),
            estilista: estilistaSeleccionado,
            d_estilista: estilistas.find((e: Estilista) => e.clave_empleado === estilistaSeleccionado)?.nombre || '',
            hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            clave_prod: item.producto.clave_prod,
            d_producto: item.producto.descripcion,
            tiempo: item.producto.tiempo || '00:00',
            Cant: item.cantidad,
            precio: item.producto.Precio || 0,
            importe: (item.producto.Precio || 0) * item.cantidad,
            descuento: 0,
            auxiliar: auxiliarSeleccionado || '',
            d_auxiliar: auxiliarSeleccionado ? 
              estilistaAuxiliar?.find((e: Auxiliar) => e.clave_empleado === auxiliarSeleccionado)?.nombre || '' : '',
          }));
          
        return {
          ...detalle,
          insumos: [...(detalle.insumos || []), ...nuevosInsumos]
        };
      }
      return detalle;
    }));

    // Enviar insumos a la API para productos existentes
    try {
      const payloadInsumos = insumosSeleccionados.map(item => ({
        clave_prod: item.producto.clave_prod,
        cantidad: item.cantidad
      }));
      await consumoApi.post(
        `/api/PuntoDeVenta/sp_fw_pos_agregar_insumos_venta?cia=1&sucursal=${sucursal}&no_venta=0&cve_cliente=${clienteSeleccionado?.No_cliente || ''}&clave_producto_venta=${productoPrincipal.clave_prod}&estilista=${estilistaSeleccionado}`,
        payloadInsumos
      );
    } catch (error) {
      console.error('Error guardando insumos en API:', error);
    }
  }
    
    // Limpiar selección de producto
    setProductoSeleccionado(null);
    
    // Cerrar el modal y limpiar estados
    setModalInsumosOpen(false);
    setProductoPrincipal(null);
    setInsumosSeleccionados([]);
  };

  const fetchClientes = async ({ page, pageSize, search }: any) => {
    try {
      const res = await consumoApi.get(
        `/api/PuntoDeVenta/sp_cat_clientes_suc_paginado?pagina=${page}&registros=${pageSize}&Busqueda=${encodeURIComponent(search)}`
      );

      const data = res.data ?? [];
      return {
        data,
        total: data[0]?.total_registros ?? 0,
      };
    } catch (error) {
      console.error('Error fetching clientes, usando cliente por defecto:', error);
      // Retornar cliente Público en General (00001) si hay timeout o error
      const clienteDefault: Cliente = {
        No_cliente: '00001',
        nombre: 'PÚBLICO EN GENERAL',
        ap_paterno: null,
        ap_materno: null,
        total_registros: 1
      };
      return {
        data: [clienteDefault],
        total: 1,
      };
    }
  };


 const fetchEstilistas = async () => {
  const res = await consumoApi.get(`/api/PuntoDeVenta/sp_pos_estilistas_listado?sucursal=${sucursal}`);
  setEstilistas(res.data ?? []);
 };

  const fetchAuxiliares = async () => {
  const res = await consumoApi.get(`/api/PuntoDeVenta/sp_pos_auxiliar_listado?sucursal=${sucursal}`);
  setEstilistaAuxiliar(res.data ?? []);
 };


 
const fetchProductos = async ({ page, pageSize, search }: any) => {
  const res = await consumoApi.get(
    `/api/PuntoDeVenta/sp_busca_productos_paginado?clave_desc=${encodeURIComponent(search)}&insumo=${esInsumo ? 'true' : 'false'}&pagina=${page}&registros=${pageSize}`
  );

  const data = res.data ?? [];
  return {
    data,
    total: data[0]?.total_registros ?? 0,
  };
};

const fetchInsumos = async ({ page, pageSize, search }: any) => {
  const res = await consumoApi.get(
    `/api/PuntoDeVenta/sp_busca_productos_paginado?clave_desc=${encodeURIComponent(search)}&insumo=true&pagina=${page}&registros=${pageSize}`
  );

  const data = res.data ?? [];
  return {
    data,
    total: data[0]?.total_registros ?? 0,
  };
};

const fetchVentasEnProceso = async () => {
  setLoadingVentasEnProceso(true);
  try {
    const res = await consumoApi.get(
      `/api/PuntoDeVenta/sp_bw_pos_ventas_en_proceso?sucursal=${sucursal}`
    );
    setVentasEnProceso(res.data ?? []);
  } catch (error) {
    console.error("Error al cargar ventas en proceso:", error);
    setVentasEnProceso([]);
  } finally {
    setLoadingVentasEnProceso(false);
  }
};

const fetchDetalleVenta = async (cliente: string, estilista: string) => {
  setLoadingVentasEnProceso(true);
  try {
    const res = await consumoApi.get(
      `/api/PuntoDeVenta/sp_fw_pos_recupera_detalle_venta?sucursal=${sucursal}&cliente=${cliente}&estilista=${estilista}`
    );
    const venta: VentaEnProceso = res.data;
    
    // Convertir la estructura del DTO a DetalleVenta[]
    const detalles: DetalleVenta[] = [];
    
    for (const producto of venta.productos) {
      // Función para extraer solo HH:MM si viene como "HH:MM:SS" o desde un formato DateTime completo
      const limpiarHora = (h: string) => {
        if (!h) return '00:00';
        const soloTiempo = h.includes('T') ? h.split('T')[1] : (h.includes(' ') ? h.split(' ')[1] : h);
        return soloTiempo ? soloTiempo.substring(0, 5) : h.substring(0, 5);
      };
      const horaLimpia = limpiarHora(producto.hora);

      const productoDetalle: DetalleVenta = {
        id: `${producto.clave_prod}-${Date.now()}-${Math.random()}`,
        estilista: producto.id_estilista,
        d_estilista: producto.d_estilista,
        hora: horaLimpia, // Usa la hora recortada HH:MM
        clave_prod: producto.clave_prod,
        d_producto: producto.d_producto,
        tiempo: producto.tiempo || '00:00',
        Cant: producto.cantidad,
        precio: producto.precio,
        importe: producto.importe,
        descuento: 0,
        auxiliar: producto.id_auxiliar || '',
        d_auxiliar: producto.d_estilista_auxiliar || '',
        insumos: producto.insumos?.map(insumo => ({
          id: `${insumo.clave_prod}-${Date.now()}-${Math.random()}`,
          estilista: producto.id_estilista,
          d_estilista: producto.d_estilista,
          hora: horaLimpia, // Usa la hora recortada HH:MM
          clave_prod: insumo.clave_prod,
          d_producto: insumo.d_producto,
          tiempo: '00:00',
          Cant: insumo.cantidad,
          precio: insumo.precio,
          importe: insumo.importe,
          descuento: 0,
          auxiliar: producto.id_auxiliar || '',
          d_auxiliar: producto.d_estilista_auxiliar || '',
        }))
      };
      detalles.push(productoDetalle);
    }
    
    setDetallesVenta(detalles);
    
    // También configurar el cliente y estilista seleccionados
    setClienteSeleccionado({
      No_cliente: venta.cve_cliente,
      nombre: venta.d_cliente,
      ap_paterno: null,
      ap_materno: null
    });
    setEstilistaSeleccionado(venta.user);
    
    setModalVentasEnProcesoOpen(false);
  } catch (error) {
    console.error("Error al cargar detalle de venta:", error);
  } finally {
    setLoadingVentasEnProceso(false);
  }
};


 useEffect(() => {
  fetchEstilistas();
  fetchAuxiliares();
 }, []);

  const {
    data: clients,
    page,
    pageSize,
    total,
    setPage,
    setSearch,
  } = useServerTable<Cliente>(fetchClientes, 20);


  const {
  data: productos,
  page: pageProductos,
  pageSize: pageSizeProductos,
  total: totalProductos,
  setPage: setPageProductos,
  setSearch: setSearchProductos,
} = useServerTable<Producto>(fetchProductos, 10);

const {
  data: insumos,
  page: pageInsumos,
  pageSize: pageSizeInsumos,
  total: totalInsumos,
  setPage: setPageInsumos,
  setSearch: setSearchInsumos,
} = useServerTable<Producto>(fetchInsumos, 10);

  const handleEditarRenglon = React.useCallback((id: string, campo: string, nuevoValor: any) => {
    setDetallesVenta(prev => prev.map(item => {
      if (item.id === id) {
        const itemActualizado = { ...item, [campo]: nuevoValor };
        itemActualizado.importe = itemActualizado.Cant * itemActualizado.precio;
        return itemActualizado;
      }
      return item;
    }));
  }, []);

return (
    <>
      <Box sx={{ p: 1, maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* === CONTENEDOR SUPERIOR DEL FORMULARIO === */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
          
          {/* Renglón 1: Cliente y Estilista */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, width: '100%', gap: 1 }}>
            <Box sx={{ display: 'flex', flex: 2, gap: 0.5 }}>
              <TextField
                size="small"
                label="Cliente"
                value={clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.ap_paterno || ''} ${clienteSeleccionado.ap_materno || ''}`.trim() : ""}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <Button
                size="small"
                variant="contained"
                sx={{ minWidth: '110px', backgroundColor: '#1a1a1a', color: 'white' }}
                onClick={() => {
                  setSearchText("");
                  setSearch("");
                  setPage(0);
                  setModalClienteOpen(true);
                }}
              >
                Seleccionar
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                sx={{ minWidth: '40px' }}
                onClick={() => setModalNuevoClienteOpen(true)}
              >
                +
              </Button>
              <IconButton 
                size="small"
                color="primary"
                onClick={handleOpenHistorial}
                disabled={!clienteSeleccionado}
                sx={{ border: '1px solid', borderRadius: 1, p: '5px' }}
              >
                <History fontSize="small"/>
              </IconButton>
            </Box>

            <FormControl size="small" sx={{ flex: 1, minWidth: '150px' }}>
              <InputLabel>Estilista</InputLabel>
              <Select
                label="Estilista"
                value={estilistaSeleccionado}
                onChange={(e) => setEstilistaSeleccionado(e.target.value)}
              >
                {estilistas.map((est) => (
                  <MenuItem key={est.clave_empleado} value={est.clave_empleado}>
                    {est.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Renglón 2: Producto, Auxiliar y Registrar */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, width: '100%', gap: 1 }}>
            <Box sx={{ display: "flex", flex: 2, gap: 0.5 }}>
              <TextField
                size="small"
                value={productoSeleccionado ? productoSeleccionado.descripcion : ""}
                fullWidth
                placeholder="Seleccionar producto"
                InputProps={{ readOnly: true }}
              />
              <Button 
                size="small" 
                variant="outlined" 
                sx={{ minWidth: '60px' }}
                onClick={() => {
                  setPageProductos(0);
                  setSearchProductos("");
                  setEsInsumo(false);
                  setModalProductoOpen(true);
                }}
              >
                Prod
              </Button>
            </Box>

            <Box sx={{ display: "flex", flex: 1, gap: 0.5 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Auxiliar</InputLabel>
                <Select
                  label="Auxiliar"
                  value={auxiliarSeleccionado}
                  onChange={(e) => setAuxiliarSeleccionado(e.target.value)}
                >
                  <MenuItem value=""><em>Ninguno</em></MenuItem>
                  {estilistaAuxiliar?.map((est) => (
                    <MenuItem key={est.clave_empleado} value={est.clave_empleado}>
                      {est.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                size="small" 
                variant="contained"
                color="primary"
                sx={{ minWidth: '100px' }}
                onClick={handleRegistrar}
              >
                Registrar
              </Button>
            </Box>
          </Box>

          {/* Renglón 3: Barra de Acciones Intermedia */}
          <Box sx={{ display: "flex", gap: 1, mt: 0.5, mb: 0.5 }}>
            <Button
              size="small"
              variant="contained" 
              sx={{ backgroundColor: '#9e9e9e', color: 'black', fontWeight: 'bold', '&:hover': { backgroundColor: '#757575' } }}
              onClick={handleAbrirCobro}
            >
              Cobrar
            </Button>
            <Button 
              size="small"
              variant="contained" 
              sx={{ backgroundColor: '#9e9e9e', color: 'black', fontWeight: 'bold', '&:hover': { backgroundColor: '#757575' } }}
              onClick={() => {
                fetchVentasEnProceso();
                setModalVentasEnProcesoOpen(true);
              }}
            >
              En Proceso
            </Button>
            <Button 
              size="small"
              variant="contained" 
              sx={{ backgroundColor: '#9e9e9e', color: 'black', fontWeight: 'bold', '&:hover': { backgroundColor: '#757575' } }}
            >
              Cambiar Cliente
            </Button>
          </Box>

        </Box>

        {/* Separador entre el formulario y la tabla */}
        <Divider sx={{ mb: 1 }} />

        {/* === TABLA DE VENTAS === */}
        <Box sx={{ 
          height: 'calc(100vh - 265px)',
          mb: 1,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          backgroundColor: '#fcfcfc',     
          
          '& > *': { height: '100% !important' },
          '& .MuiTableContainer-root': { height: '100% !important', overflowX: 'hidden !important' },
          '& .MuiPaper-root': { height: '100% !important', boxShadow: 'none' },
          
          '& .MuiTableCell-root': {
            padding: '2px 4px !important',
            fontSize: '0.8rem !important',
          },
          
          '& .MuiTableCell-root:nth-of-type(1)': {
            width: '24px !important',
            maxWidth: '24px !important',
            padding: '0 !important',
            textAlign: 'center'
          },

          '& .MuiTableCell-root:nth-of-type(2)': {
            maxWidth: '120px !important',
            overflow: 'hidden !important',
            textOverflow: 'ellipsis !important',
            whiteSpace: 'nowrap !important'
          },

          '& .MuiTableCell-root:nth-of-type(11)': {
            maxWidth: '100px !important',
            overflow: 'hidden !important',
            textOverflow: 'ellipsis !important',
            whiteSpace: 'nowrap !important'
          },
          
          '& .MuiButton-root': {
            minWidth: 'auto !important',
            padding: '1px 5px !important',
            fontSize: '0.72rem !important',
            whiteSpace: 'nowrap !important',
            textTransform: 'none !important'
          }
        }}>
          <DetalleVentasTable 
            data={detallesVenta} 
            estilistasLista={estilistas}          // 🔥 Le pasamos el array de estilistas que ya descargaste
            auxiliaresLista={estilistaAuxiliar}   // 🔥 Le pasamos el array de auxiliares que ya descargaste
            onSelect={handleCancelarRenglon}
            onAgregarInsumos={handleAbrirAgregarInsumos}
            onEditarRenglon={handleEditarRenglon} 
            onBuscarProducto={() => {
              // 🔥 Dispara la apertura del buscador al hacer doble clic
              setPageProductos(0);
              setSearchProductos("");
              setEsInsumo(false);
              setModalProductoOpen(true);
            }}
          />
        </Box>

        {/* === BARRA INFERIOR (Solo Total) === */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: "900" }}>
            TOTAL: ${totalVenta.toFixed(2)}  
          </Typography>
        </Box>

      </Box>


{/* === 1. MODAL BUSCADOR DE CLIENTES === */}
      <Dialog 
        maxWidth="lg" 
        fullWidth
        open={modalClienteOpen} 
        onClose={() => setModalClienteOpen(false)}
        PaperProps={{ sx: { m: { xs: 1, sm: 2 }, height: '90vh', display: 'flex', flexDirection: 'column' } }}
      >
        <DialogTitle sx={{ borderBottom: '2px solid black', mx: 3, mt: 2, p: 0, pb: 1 }}>
          <Typography variant="h5" fontWeight="900" fontStyle="italic">Buscador de Clientes</Typography>
        </DialogTitle>
        
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: { xs: 2, sm: 3 }, overflow: 'hidden' }}>
          
          {/* 🔥 1. BARRA DE BÚSQUEDA Y PAGINACIÓN EN LA MISMA LÍNEA */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography fontWeight="bold">Buscar:</Typography>
              <TextField 
                size="small" 
                variant="standard" 
                sx={{ width: 300 }} 
                value={searchText} 
                onChange={(e) => { 
                  setSearchText(e.target.value); 
                  setPage(0); 
                  setSearch(e.target.value); 
                  setClientePreview(null); 
                  setHistorialData([]); 
                }} 
              />
              <Button variant="contained" size="small" onClick={() => setSearch(searchText)}>Buscar</Button>
            </Box>
            
            {/* Paginación de clientes compactada a la derecha */}
            <Box sx={{ transform: 'scale(0.9)', transformOrigin: 'right center' }}>
              <PaginationControls page={page} total={total} pageSize={pageSize} onChange={setPage} />
            </Box>
          </Box>

          {/* TABLA SUPERIOR */}
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <ClientesTable 
              data={clients} 
              onSelect={async (cliente) => { 
                setClientePreview(cliente); 
                setHistorialPage(1); 
                setHistorialLoading(true); 
                const data = await fetchHistorial(cliente.No_cliente, 1); 
                setHistorialData(data || []); 
                setHistorialLoading(false); 
              }} 
            />
          </Box>

          <Divider sx={{ borderBottomWidth: 3 }} />

          {/* TABLA INFERIOR */}
          <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            
            {/* 🔥 2. TÍTULO HISTORIAL Y PAGINACIÓN EN LA MISMA LÍNEA */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 0.5 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Historial de Visitas {clientePreview ? `- ${clientePreview.nombre || ''}` : ''}
              </Typography>
              
              {/* Botones del historial compactados a la derecha */}
              {clientePreview && historialData.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    sx={{ py: 0, px: 1, minWidth: 'auto', fontSize: '0.75rem', textTransform: 'none' }}
                    onClick={async () => {
                      const newPage = historialPage - 1;
                      setHistorialLoading(true);
                      const data = await fetchHistorial(clientePreview.No_cliente, newPage);
                      setHistorialData(data || []);
                      setHistorialPage(newPage);
                      setHistorialLoading(false);
                    }} 
                    disabled={historialPage === 1 || historialLoading}
                  >
                    Anterior
                  </Button>
                  <Typography variant="caption" fontWeight="bold">Pág. {historialPage}</Typography>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    sx={{ py: 0, px: 1, minWidth: 'auto', fontSize: '0.75rem', textTransform: 'none' }}
                    onClick={async () => {
                      const newPage = historialPage + 1;
                      setHistorialLoading(true);
                      const data = await fetchHistorial(clientePreview.No_cliente, newPage);
                      if (data && data.length > 0) {
                        setHistorialData(data);
                        setHistorialPage(newPage);
                      } else {
                        setHasMoreHistorial(false);
                      }
                      setHistorialLoading(false);
                    }} 
                    disabled={!hasMoreHistorial || historialLoading}
                  >
                    Siguiente
                  </Button>
                </Box>
              )}
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5 }}>Sucursal</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5 }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5 }}>Producto/Servicio</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5 }}>Cant.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5 }}>Precio</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5 }}>Estilista</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5 }}>Forma Pago</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historialLoading ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                  ) : !clientePreview ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>Selecciona un cliente arriba para cargar historial</TableCell></TableRow>
                  ) : historialData.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>Este cliente no tiene historial de visitas</TableCell></TableRow>
                  ) : (
                    historialData.map((item, index) => (
                      <TableRow key={index} hover>
                        <TableCell sx={{ py: 0.25 }}>{item.cve_sucursal}</TableCell>
                        <TableCell sx={{ py: 0.25 }}>{item.fecha ? new Date(item.fecha).toLocaleDateString() : '-'}</TableCell>
                        <TableCell sx={{ py: 0.25 }}>{item.prod_serv}</TableCell>
                        <TableCell sx={{ py: 0.25 }}>{item.cant_producto}</TableCell>
                        <TableCell sx={{ py: 0.25 }}>${item.Precio?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell sx={{ py: 0.25 }}>{item.estilista}</TableCell>
                        <TableCell sx={{ py: 0.25 }}>{item.forma_pago}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        
        {/* BOTONES INFERIORES */}
        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', gap: 4, borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
          <Button variant="contained" color="inherit" disabled={!clientePreview} onClick={() => { if (clientePreview) { setClienteSeleccionado({ No_cliente: clientePreview.No_cliente || '', nombre: clientePreview.nombre || 'PÚBLICO EN GENERAL', ap_paterno: clientePreview.ap_paterno || '', ap_materno: clientePreview.ap_materno || '' }); setModalClienteOpen(false); } }} sx={{ minWidth: 150, fontWeight: 'bold', color: 'black', backgroundColor: '#e0e0e0' }}>Aceptar</Button>
          <Button variant="contained" color="inherit" onClick={() => setModalClienteOpen(false)} sx={{ minWidth: 150, fontWeight: 'bold', color: 'black', backgroundColor: '#e0e0e0' }}>Cerrar</Button>
        </Box>
      </Dialog>

{/* Dialog para crear nuevo cliente */}
<Dialog
  maxWidth="lg"
  fullWidth
  open={modalNuevoClienteOpen}
  onClose={() => setModalNuevoClienteOpen(false)}
  PaperProps={{
    sx: {
      m: { xs: 1, sm: 2 },
      maxHeight: { xs: '90vh', sm: '85vh' }
    }
  }}
>
  <DialogTitle>Nuevo Cliente</DialogTitle>
  <DialogContent sx={{ p: 0 }}>
    <CatClientes
      embedded={true}
      openModal={modalNuevoClienteOpen}
      onOpenModal={(open) => setModalNuevoClienteOpen(open)}
      onClienteGuardado={(cliente) => {
        setClienteSeleccionado({
          No_cliente: cliente.No_cliente || cliente.nombre_completo,
          nombre: cliente.nombre || '',
          ap_paterno: cliente.ap_paterno || null,
          ap_materno: cliente.ap_materno || null
        });
        setModalNuevoClienteOpen(false);
      }}
    />
  </DialogContent>
</Dialog>

{/* Dialog Historial del Cliente */}
<Dialog
  maxWidth="lg"
  fullWidth
  open={modalHistorialOpen}
  onClose={() => setModalHistorialOpen(false)}
  PaperProps={{
    sx: {
      m: { xs: 1, sm: 2 },
      maxHeight: { xs: '90vh', sm: '85vh' }
    }
  }}
>
  <DialogTitle>
    Historial de Compras - {clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.ap_paterno || ''} ${clienteSeleccionado.ap_materno || ''}`.trim() : ''}
  </DialogTitle>
  <DialogContent>
    {historialLoading ? (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, gap: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2">Cargando...</Typography>
      </Box>
    ) : historialData.length === 0 ? (
      <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
        No se encontraron registros de historial
      </Typography>
    ) : (
      <>
 <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {/* Reducimos el padding vertical (py) en los encabezados */}
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5 }}>No. Venta</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5 }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5, textAlign: 'center' }}>Cant.</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5 }}>Precio</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5 }}>Estilista</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5 }}>Forma Pago</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', py: 0.5, textAlign: 'center' }}>Insumos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historialData.map((item, index) => (
                <TableRow key={`${item.no_venta}-${item.clave_prod}-${index}`} hover>
                  {/* Forzamos un padding vertical mínimo (py: 0.25) en cada celda para aplastar las filas */}
                  <TableCell sx={{ py: 0.25 }}>{new Date(item.fecha).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ py: 0.25 }}>{item.no_venta}</TableCell>
                  <TableCell sx={{ py: 0.25 }}>{item.prod_serv}</TableCell>
                  <TableCell sx={{ py: 0.25, textAlign: 'center' }}>{item.cant_producto}</TableCell>
                  <TableCell sx={{ py: 0.25 }}>${item.Precio?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell sx={{ py: 0.25 }}>{item.estilista}</TableCell>
                  <TableCell sx={{ py: 0.25 }}>{item.forma_pago}</TableCell>
                  <TableCell sx={{ py: 0.25, textAlign: 'center' }}>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => handleOpenInsumos(item)}
                      sx={{ 
                        py: 0,             // Elimina el espacio arriba y abajo adentro del botón
                        px: 1,             // Espacio horizontal cómodo
                        minHeight: 0,      // Permite que el botón sea más bajo de lo normal
                        fontSize: '0.75rem', // Letra ligeramente más pequeña tipo sistema de escritorio
                        whiteSpace: 'nowrap', // 🚫 EVITA QUE EL TEXTO SE ROMPA EN DOS LÍNEAS
                        textTransform: 'none' // Evita las mayúsculas toscas de Material UI
                      }}
                    >
                      Ver Insumos
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handlePrevPage}
            disabled={historialPage === 1 || historialLoading}
          >
            Anterior
          </Button>
          <Typography variant="body2">
            Página {historialPage}
          </Typography>
          <Button
            variant="outlined"
            onClick={handleNextPage}
            disabled={!hasMoreHistorial || historialData.length === 0 || historialLoading}
          >
            Siguiente
          </Button>
        </Box>
      </>
    )}
  </DialogContent>
</Dialog>

{/* Dialog Insumos del Historial */}
<Dialog
  maxWidth="md"
  fullWidth
  open={modalHistorialInsumosOpen}
  onClose={() => setModalHistorialInsumosOpen(false)}
  PaperProps={{
    sx: {
      m: { xs: 1, sm: 2 },
      maxHeight: { xs: '90vh', sm: '85vh' }
    }
  }}
>
  <DialogTitle sx={{ fontWeight: '900', fontSize: '1.8rem', pb: 1 }}>
    Detalle de Insumos de la Visita
  </DialogTitle>
  <DialogContent>
    {/* 🔥 Encabezado tipo Access */}
    {selectedVenta && (
      <Box sx={{ mb: 3 }}> {/* <--- ESTA ES LA CAJA QUE FALTABA Y CAUSABA EL ERROR */}
        {/* Renglón 1: Cliente y Servicio */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', mb: 1, px: 2 }}>
          <Typography variant="body1">
            <strong>Cliente:</strong> {selectedVenta.clienteNombre}
          </Typography>
          <Typography variant="body1">
            <strong>Servicio:</strong> {selectedVenta.servDesc}
          </Typography>
        </Box>
        
        {/* Línea gruesa negra */}
        <Divider sx={{ borderBottomWidth: 4, borderColor: 'black', mb: 1 }} />
        
        {/* Renglón 2: Fecha, Sucursal, Atendió */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', mb: 1, px: 2 }}>
          <Typography variant="body2">
            <strong>Fecha:</strong> {selectedVenta.fecha ? new Date(selectedVenta.fecha).toLocaleDateString() : ''}
          </Typography>
          <Typography variant="body2">
            <strong>Sucursal:</strong> {selectedVenta.suc}
          </Typography>
          <Typography variant="body2">
            <strong>Atendió:</strong> {selectedVenta.estilista}
          </Typography>
        </Box>
        
        {/* Línea delgada */}
        <Divider sx={{ mb: 2 }} />
      </Box>
    )}

    {historialInsumosLoading ? (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, gap: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2">Cargando...</Typography>
      </Box>
    ) : historialInsumosData.length === 0 ? (
      <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
        No se encontraron insumos para esta venta
      </Typography>
    ) : (
      <>
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Cantidad</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Observación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historialInsumosData.map((insumo, index) => (
                <TableRow key={index}>
                  <TableCell>{insumo.producto_insumo}</TableCell>
                  <TableCell>{insumo.cantidad}</TableCell>
                  <TableCell>{insumo.obs}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handlePrevInsumos}
            disabled={historialInsumosPage === 1 || historialInsumosLoading}
          >
            Anterior
          </Button>
          <Typography variant="body2">
            Página {historialInsumosPage}
          </Typography>
          <Button
            variant="outlined"
            onClick={handleNextInsumos}
            disabled={!hasMoreHistorialInsumos || historialInsumosData.length === 0 || historialInsumosLoading}
          >
            Siguiente
          </Button>
        </Box>
      </>
    )}
  </DialogContent>
</Dialog>

{/* Dialog Agregar Insumos a Venta */}
<Dialog
  maxWidth="md"
  fullWidth
  open={modalAgregarInsumosOpen}
  onClose={() => setModalAgregarInsumosOpen(false)}
  PaperProps={{
    sx: {
      m: { xs: 1, sm: 2 },
      maxHeight: { xs: '90vh', sm: '85vh' }
    }
  }}
>
  <DialogTitle>
    Agregar Insumos - {detalleSeleccionadoInsumos?.d_producto}
  </DialogTitle>
  <DialogContent>
    <Box sx={{ mb: 2 }}>
      <TextField
        size="small"
        label="Buscar insumo"
        fullWidth
        value={busquedaInsumo}
        onChange={(e) => {
          setBusquedaInsumo(e.target.value);
          buscarInsumos(e.target.value);
        }}
        sx={{ mb: 2 }}
      />
      {loadingBusquedaInsumo && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      {resultadosInsumos.length > 0 && (
        <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
          {resultadosInsumos.map((producto) => (
            <Box
              key={producto.clave_prod}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1,
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
              onClick={() => agregarInsumoALista(producto)}
            >
              <Typography variant="body2">
                {producto.clave_prod} - {producto.descripcion}
              </Typography>
              <Button size="small" variant="outlined">Agregar</Button>
            </Box>
          ))}
        </Paper>
      )}
    </Box>

    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
      Insumos a agregar:
    </Typography>
    {insumosAgregar.length === 0 ? (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
        No hay insumos en la lista
      </Typography>
    ) : (
      <Paper variant="outlined" sx={{ mb: 2 }}>
        {insumosAgregar.map((insumo, index) => (
          <Box
            key={insumo.clave_prod}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1,
              borderBottom: index < insumosAgregar.length - 1 ? '1px solid #eee' : 'none'
            }}
          >
            <Typography variant="body2" sx={{ flex: 1 }}>
              {insumo.clave_prod} - {insumo.d_producto}
            </Typography>
            <TextField
              type="number"
              size="small"
              value={insumo.cantidad}
              onChange={(e) => actualizarCantidadInsumo(insumo.clave_prod, parseInt(e.target.value) || 1)}
              sx={{ width: 80 }}
              inputProps={{ min: 1 }}
            />
            <Button
              color="error"
              size="small"
              onClick={() => quitarInsumoDeLista(insumo.clave_prod)}
            >
              X
            </Button>
          </Box>
        ))}
      </Paper>
    )}

    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
      <Button variant="outlined" onClick={() => setModalAgregarInsumosOpen(false)}>
        Cancelar
      </Button>
      <Button
        variant="contained"
        onClick={guardarInsumosVenta}
        disabled={insumosAgregar.length === 0}
      >
        Guardar
      </Button>
    </Box>
  </DialogContent>
</Dialog>

<Dialog
  maxWidth={isMobile ? "sm" : "lg"} 
  fullWidth
  open={modalProductoOpen} 
  onClose={() => setModalProductoOpen(false)}
  PaperProps={{
    sx: {
      m: { xs: 1, sm: 2 },
      maxHeight: { xs: '90vh', sm: '85vh' }
    }
  }}
>
  <DialogTitle>Seleccionar {esInsumo ? "Insumo" : "Producto"}</DialogTitle>
  <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
    <TextField
      size={isMobile ? "medium" : "small"}
      label="Buscar producto"
      fullWidth
      sx={{ 
        mb: { xs: 2, sm: 2 },
        '& .MuiInputBase-root': {
          height: { xs: 56, sm: 40 },
        }
      }}
      onChange={(e) => {
        setPageProductos(0);
        setSearchProductos(e.target.value);
      }}
    />

    <Box sx={{ mb: { xs: 2, sm: 2 } }}>
      <ProductosTable
        data={productos}
        onSelect={(producto) => {
          setProductoSeleccionado(producto);
          setModalProductoOpen(false);
        }}
      />
    </Box>
    <PaginationControls
      page={pageProductos}
      total={totalProductos}
      pageSize={pageSizeProductos}
      onChange={setPageProductos}
    />
  </DialogContent>
</Dialog>

{/* Modal de selección de insumos para productos controlados */}
<Dialog 
  maxWidth={isMobile ? "md" : "lg"} 
  fullWidth
  open={modalInsumosOpen} 
  onClose={() => {
    setModalInsumosOpen(false);
    setProductoPrincipal(null);
    setInsumosSeleccionados([]);
  }}
  PaperProps={{
    sx: {
      m: { xs: 1, sm: 2 },
      maxHeight: { xs: '90vh', sm: '85vh' }
    }
  }}
>
  <DialogTitle>
    Seleccionar Insumos para: {productoPrincipal?.descripcion}
  </DialogTitle>
  <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Este servicio requiere insumos adicionales. Por favor selecciona los insumos necesarios y ajusta las cantidades.
    </Typography>
    
    <TextField
      size={isMobile ? "medium" : "small"}
      label="Buscar insumo"
      fullWidth
      sx={{ 
        mb: { xs: 2, sm: 2 },
        '& .MuiInputBase-root': {
          height: { xs: 56, sm: 40 },
        }
      }}
      onChange={(e) => {
        setPageInsumos(0);
        setSearchInsumos(e.target.value);
      }}
    />

    {/* Tabla de insumos disponibles */}
    <Box sx={{ mb: { xs: 2, sm: 2 }, maxHeight: 300, overflow: 'auto' }}>
      <ProductosTable
        data={insumos}
        onSelect={handleSeleccionarInsumo}
      />
    </Box>
    <PaginationControls
      page={pageInsumos}
      total={totalInsumos}
      pageSize={pageSizeInsumos}
      onChange={setPageInsumos}
    />

    {/* Lista de insumos seleccionados */}
    {insumosSeleccionados.length > 0 && (
      <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
          Insumos Seleccionados:
        </Typography>
        {insumosSeleccionados.map((item, index) => (
          <Box key={item.producto.clave_prod} sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 1,
            px: 2,
            borderBottom: index < insumosSeleccionados.length - 1 ? '1px solid #e0e0e0' : 'none'
          }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {item.producto.clave_prod} - {item.producto.descripcion}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ width: 100 }}>
                <InputLabel id={`cantidad-label-${item.producto.clave_prod}`}>Cant</InputLabel>
                <Select
                  labelId={`cantidad-label-${item.producto.clave_prod}`}
                  value={item.cantidad}
                  label="Cant"
                  onChange={(e) => handleCantidadInsumo(item.producto.clave_prod, Number(e.target.value))}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      height: 32,
                    }
                  }}
                >
                  {insumoCargandoCantidades === item.producto.clave_prod && loadingCantidades ? (
                    <MenuItem disabled>Cargando...</MenuItem>
                  ) : (
                    (cantidadesCache[item.producto.clave_prod] || [1]).map((cantidad) => (
                      <MenuItem key={cantidad} value={cantidad}>
                        {cantidad}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={() => handleSeleccionarInsumo(item.producto)}
              >
                X
              </Button>
            </Box>
          </Box>
        ))}
        
        <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
          Total Insumos: ${insumosSeleccionados.reduce((sum, item) => sum + (item.producto.Precio || 0) * item.cantidad, 0).toFixed(2)}
        </Typography>
      </Box>
    )}
    
    <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
      <Button 
        variant="outlined" 
        color="secondary"
        onClick={() => {
          if (productoPrincipal) {
            registrarProducto(productoPrincipal);
          }
          setModalInsumosOpen(false);
          setProductoPrincipal(null);
          setInsumosSeleccionados([]);
        }}
      >
        Guardar sin Insumos
      </Button>
      <Button 
        variant="outlined" 
        onClick={() => {
          setModalInsumosOpen(false);
          setProductoPrincipal(null);
          setInsumosSeleccionados([]);
        }}
      >
        Cancelar
      </Button>
      <Button 
        variant="contained" 
        color="primary"
        onClick={handleConfirmarInsumos}
        disabled={insumosSeleccionados.length === 0}
      >
        Confirmar Insumos ({insumosSeleccionados.length})
      </Button>
    </Box>
  </DialogContent>
</Dialog>

{/* Modal de Ventas en Proceso */}
<Dialog 
  maxWidth="md" 
  fullWidth
  open={modalVentasEnProcesoOpen} 
  onClose={() => setModalVentasEnProcesoOpen(false)}
  PaperProps={{
    sx: {
      m: { xs: 1, sm: 2 },
      maxHeight: { xs: '90vh', sm: '85vh' }
    }
  }}
>
  <DialogTitle>Ventas en Proceso - Sucursal {sucursal}</DialogTitle>
  <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
    {loadingVentasEnProceso ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    ) : ventasEnProceso.length === 0 ? (
      <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
        No hay ventas en proceso
      </Typography>
    ) : (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Estilista</TableCell>
              <TableCell align="right">Importe</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ventasEnProceso.map((venta, index) => (
              <TableRow key={index}>
                <TableCell>{venta.d_cliente}</TableCell>
                <TableCell>{venta.d_estilista}</TableCell>
                <TableCell align="right">${venta.importe.toFixed(2)}</TableCell>
                <TableCell align="center">
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => fetchDetalleVenta(venta.cve_cliente, venta.user)}
                  >
                    Cargar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </DialogContent>
</Dialog>

{/* === 9. DIALOG MODAL DE COBRO (ESTILO ACCESS DE UNA SOLA VISTA SIN SCROLL) === */}
<Dialog 
  maxWidth="md"  // 🌟 Cambiado de "sm" a "md" para dar total libertad horizontal
  fullWidth 
  open={modalCobroOpen} 
  onClose={() => setModalCobroOpen(false)}
  PaperProps={{ sx: { m: { xs: 1, sm: 2 }, backgroundColor: '#9bc2e6', borderRadius: 0, boxShadow: '0px 4px 20px rgba(0,0,0,0.3)', p: 2, width: '820px' } }}
>
  <DialogContent sx={{ p: 0, overflow: 'hidden' }}> {/* 🌟 Bloqueamos el scroll para forzar una sola vista */}
    
    {/* Encabezado Principal */}
    <Typography variant="h4" align="center" sx={{ fontWeight: '900', color: 'black', fontFamily: 'sans-serif', mb: 1, fontSize: '1.8rem' }}>
      Total a pagar: ${totalVenta.toFixed(2)}
    </Typography>

    {/* Barra de Crédito */}
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'black' }}>Formas de pago</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#e2f0d9', border: '1px solid black', px: 1, height: 26 }}>
        <Typography variant="caption" sx={{ mr: 1, color: 'black', fontWeight: 'bold' }}>Venta a Crédito</Typography>
        <input 
          type="checkbox" 
          checked={isCredito} 
          onChange={(e) => { 
            setIsCredito(e.target.checked); 
            if (e.target.checked) { 
              setPagosRegistro([]); 
              setImportePago(""); 
              setPuntosPago(0); 
              setPagoEfectivo(0); 
              setTmpPagoEfectivo(0);
              setSumaManual(0); 
              setCuentaPuntos(""); 
            } 
          }} 
          style={{ cursor: 'pointer' }} 
        />
      </Box>
    </Box>

    {/* Cuerpo del Cobro: Lado Izquierdo (Tablas) y Lado Derecho (Totales) */}
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mb: 1, alignItems: 'stretch' }}>
      
      {/* SECCIÓN IZQUIERDA: Tarjetas y Monedero */}
      <Box sx={{ flex: 1.3, display: 'flex', flexDirection: 'column' }}>
        
        {/* Tabla compacta de registro Clip */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0, border: '1px solid black', mb: 1, backgroundColor: isCredito ? '#e0e0e0' : 'white', opacity: isCredito ? 0.7 : 1, maxHeight: '140px', overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { backgroundColor: '#f2f2f2', fontWeight: 'bold', color: 'black', padding: '3px 6px', fontSize: '0.75rem', borderRight: '1px solid #ccc' } }}>
                <TableCell>Forma Pago</TableCell>
                <TableCell>Autorización</TableCell>
                <TableCell align="right">Importe</TableCell>
                <TableCell align="center" sx={{ width: 30 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow sx={{ '& td': { padding: '2px 4px', borderRight: '1px solid #ccc' } }}>
                <TableCell sx={{ borderRight: '1px solid #ccc', p: '2px 4px' }}>
  <Select 
    variant="standard" 
    size="small" 
    fullWidth 
    disableUnderline 
    disabled={isCredito} 
    value={formaPagoSeleccionada} // 🌟 Cambiado de 7 al estado dinámico para que inicie vacío
    onChange={(e) => setFormaPagoSeleccionada(e.target.value as number | "")} // 🌟 Guarda la selección del usuario
    sx={{ fontSize: '0.8rem', color: 'black', fontWeight: 'bold' }}
  >
    {/* 🌟 Opción en blanco por defecto que emula el inicio vacío de Access */}
    <MenuItem value=""><em></em></MenuItem> 
    <MenuItem value={7}>TC CLIP</MenuItem>
  </Select>
</TableCell>
                <TableCell>
                  <TextField variant="standard" size="small" fullWidth disabled={isCredito} placeholder="Escribir..." value={autorizacionInput} onChange={(e) => setAutorizacionInput(e.target.value)} InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', color: 'black' } }} />
                </TableCell>
                <TableCell>
                  <TextField variant="standard" size="small" type="number" fullWidth disabled={isCredito} placeholder="0.00" value={importePago} onChange={(e) => setImportePago(e.target.value)} InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', textAlign: 'right', color: 'black' } }} />
                </TableCell>
                <TableCell align="center" sx={{ p: 0 }}>
                  <Button size="small" disabled={isCredito} onClick={handleAgregarPago} sx={{ minWidth: 'auto', p: '2px 6px', fontWeight: 'bold', color: 'black', fontSize: '0.8rem' }}>+</Button>
                </TableCell>
              </TableRow>
              {pagosRegistro.map((pago, index) => (
                <TableRow key={index} sx={{ backgroundColor: '#fff9e6', '& td': { padding: '2px 6px', fontSize: '0.8rem', color: 'black' } }}>
                  <TableCell sx={{ borderRight: '1px solid #ccc' }}>{pago.descripcion}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', borderRight: '1px solid #ccc' }} colSpan={2}>${pago.importe.toFixed(2)}</TableCell>
                  <TableCell align="center" sx={{ p: 0 }}><Button size="small" color="error" onClick={() => handleEliminarPago(index)} sx={{ minWidth: 'auto', p: 0, fontSize: '0.75rem' }}>✕</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Módulo de Monedero de alta densidad */}
        <Box sx={{ p: 1, border: '1px dashed black', backgroundColor: '#f2f2f2', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography variant="caption" sx={{ fontWeight: '900', color: 'black', fontSize: '0.65rem', tracking: 1 }}>SISTEMA MONEDERO BERLLANO</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField size="small" label="Cuenta Puntos (Pago)" variant="outlined" disabled={isCredito} value={cuentaPuntos} onChange={(e) => setCuentaPuntos(e.target.value)} onKeyDown={handleKeyDownCuentaPuntos} placeholder="Enter para validar" sx={{ backgroundColor: 'white', flex: 1, '& .MuiInputBase-input': { py: '4px', fontSize: '0.8rem' }, '& .MuiInputLabel-root': { transform: 'translate(14px, 6px) scale(1)', fontSize: '0.8rem' }, '& .MuiInputLabel-shrink': { transform: 'translate(14px, -6px) scale(0.75)' } }} />
            <Typography variant="caption" sx={{ color: 'black', fontWeight: 'bold', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Puntos Canjeados:</Typography>
          </Box>
          <TextField size="small" label="Cuenta Recompensa (Abono)" variant="outlined" disabled={isCredito} value={cuentaRecompensa} onChange={(e) => setCuentaRecompensa(e.target.value)} sx={{ backgroundColor: 'white', '& .MuiInputBase-input': { py: '4px', fontSize: '0.8rem' }, '& .MuiInputLabel-root': { transform: 'translate(14px, 6px) scale(1)', fontSize: '0.8rem' }, '& .MuiInputLabel-shrink': { transform: 'translate(14px, -6px) scale(0.75)' } }} />
        </Box>
      </Box>

      {/* SECCIÓN DERECHA: Entradas de Dinero e Indicadores de Arqueo */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, maxWidth: '280px', marginLeft: 'auto', justifyContent: 'center' }}>
        
        {/* Suma Tarjetas */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'black', mr: 1.5, minWidth: 90, textAlign: 'right', fontSize: '0.8rem' }}>Suma:</Typography>
          <input 
            type="number" 
            disabled={isCredito}
            value={sumaManual || ""} 
            onChange={(e) => setSumaManual(parseFloat(e.target.value) || 0)}
            style={{ width: '110px', backgroundColor: '#d9e1f2', border: '1px solid black', padding: '2px 4px', fontWeight: 'bold', textAlign: 'right', color: 'black', fontSize: '0.85rem' }} 
          />
        </Box>

        {/* Pago Efectivo */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'black', mr: 1.5, minWidth: 90, textAlign: 'right', fontSize: '0.8rem' }}>Pago efectivo:</Typography>
          <input 
            type="number" 
            disabled={isCredito}
            value={tmpPagoEfectivo === 0 ? "" : tmpPagoEfectivo} 
            onChange={(e) => setTmpPagoEfectivo(e.target.value)}
            onKeyDown={handleKeyDownEfectivo}
            placeholder="0"
            style={{ width: '110px', backgroundColor: '#d9e1f2', border: '1px solid black', padding: '2px 4px', fontWeight: 'bold', textAlign: 'right', color: 'black', fontSize: '0.85rem' }} 
          />
        </Box>

        {/* Canje de Puntos Monedero */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'black', mr: 1, minWidth: 90, textAlign: 'right', fontSize: '0.8rem' }}>Puntos:</Typography>
          <Box sx={{ width: 45, backgroundColor: '#d9e1f2', border: '1px solid black', py: '2px', textAlign: 'center', color: 'black', fontSize: '0.75rem', fontWeight: 'bold' }}>{saldoPuntosCte.toFixed(0)}</Box>
          <input 
            type="number" 
            disabled={isCredito || !cuentaPuntos}
            value={tmpPuntosPago === 0 ? "" : tmpPuntosPago} 
            onChange={(e) => setTmpPuntosPago(e.target.value)}
            onKeyDown={handleKeyDownPuntos}
            placeholder="0"
            style={{ width: '110px', backgroundColor: '#d9e1f2', border: '1px solid black', padding: '2px 4px', fontWeight: 'bold', textAlign: 'right', color: 'black', fontSize: '0.85rem' }} 
          />
        </Box>

        <Box sx={{ width: '100%', height: '1.5px', backgroundColor: 'black', my: 0.25 }} />

        {/* Total Recibido Calculado */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'black', mr: 1.5, minWidth: 90, textAlign: 'right', fontSize: '0.8rem' }}>Total recibido:</Typography>
          <Box sx={{ width: 110, backgroundColor: '#d9e1f2', border: '1px solid black', px: 1, py: '2px', fontWeight: '900', textAlign: 'right', color: 'black', fontSize: '0.85rem' }}>${totalPagado.toFixed(2)}</Box>
        </Box>

        {/* Su Cambio Entregado */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'black', mr: 1.5, minWidth: 90, textAlign: 'right', fontSize: '0.8rem' }}>Su cambio:</Typography>
          <Box sx={{ width: 110, backgroundColor: '#d9e1f2', border: '1px solid black', px: 1, py: '2px', fontWeight: '900', textAlign: 'right', color: cambio > 0 ? 'red' : 'black', fontSize: '0.85rem' }}>${cambio.toFixed(2)}</Box>
        </Box>

        {/* Recompensa Calculada Neto */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'black', mr: 1.5, minWidth: 90, textAlign: 'right', fontSize: '0.8rem' }}>Recompensa:</Typography>
          <Box sx={{ width: 110, backgroundColor: '#d9e1f2', border: '1px solid black', px: 1, py: '2px', textAlign: 'right', color: 'green', fontWeight: '900', fontSize: '0.85rem' }}>{puntosGanados.toFixed(2)}</Box>
        </Box>
      </Box>
    </Box>

    {/* Botones de Control Inferiores */}
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1.5 }}>
      <Button variant="contained" disabled={isCredito || finalizandoVenta} onClick={() => alert('Llamando a realiza_pago_tc_banorte...')} sx={{ backgroundColor: '#4a6572', color: 'white', borderRadius: 0, fontWeight: 'bold', textTransform: 'none', minWidth: 130, height: 32, fontSize: '0.85rem', border: '1px solid #34495e', '&:hover': { backgroundColor: '#34495e' } }}>Cobro con Tarjeta</Button>
      <Button variant="contained" onClick={handleFinalizarVenta} disabled={!puedeFinalizar || finalizandoVenta} sx={{ backgroundColor: '#4a6572', color: 'white', borderRadius: 0, fontWeight: 'bold', textTransform: 'none', minWidth: 130, height: 32, fontSize: '0.85rem', border: '1px solid #34495e', '&:hover': { backgroundColor: '#34495e' } }}>{finalizandoVenta ? 'Procesando...' : 'Registrar venta'}</Button>
      <Button variant="contained" onClick={() => setModalCobroOpen(false)} sx={{ backgroundColor: '#4a6572', color: 'white', borderRadius: 0, fontWeight: 'bold', textTransform: 'none', minWidth: 90, height: 32, fontSize: '0.85rem', border: '1px solid #34495e', '&:hover': { backgroundColor: '#34495e' } }}>Salir</Button>
    </Box>
  </DialogContent>
</Dialog>

{/* === MODAL INTERMEDIO: TABULADOR DE DENOMINACIONES (OPTIMIZADO EN 2 COLUMNAS) === */}
      <Dialog 
        open={modalTabuladorOpen} 
        onClose={() => setModalTabuladorOpen(false)}
        disableEscapeKeyDown
        maxWidth="md" // Aumentamos el ancho máximo admitido para las 2 columnas
        PaperProps={{ sx: { borderRadius: 0, border: '1px solid #000', p: 1, width: '720px' } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 0, pt: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: '900', color: 'black' }}>Pagos en Efectivo</Typography>
          <Box sx={{ width: '100%', height: '3px', backgroundColor: 'black', mt: 0.5 }} />
        </DialogTitle>

        <DialogContent sx={{ mt: 1, pb: 1 }}>
          {/* Contenedor principal de rejilla en dos columnas de lado a lado */}
          <Box sx={{ display: 'flex', gap: 3, border: '1px solid #000', p: 1.5, backgroundColor: '#fcfcfc' }}>
            
            {/* COLUMNA IZQUIERDA: Billetes Grandes (1000 a 10) */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {listaDenominaciones.slice(0, 7).map((denom) => {
                const factor = parseFloat(denom);
                const renglonTotal = (denominaciones[denom] || 0) * factor;

                return (
                  <Box key={denom} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 'bold', width: '75px', textAlign: 'right', color: 'black', fontSize: '0.85rem' }}>
                      {`$${factor.toLocaleString('es-MX')} X`}
                    </Typography>
                    <input
                      type="number"
                      value={denominaciones[denom] === 0 ? "" : denominaciones[denom]}
                      placeholder="0"
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setDenominaciones(prev => ({ ...prev, [denom]: val }));
                      }}
                      style={{ width: '55px', textAlign: 'center', backgroundColor: '#d9d9d9', border: 'none', padding: '1px 0', fontWeight: 'bold', fontSize: '0.85rem' }}
                    />
                    <Typography sx={{ fontWeight: 'bold', color: 'black', fontSize: '0.85rem' }}>=</Typography>
                    <Box sx={{ width: '100px', backgroundColor: '#d9d9d9', pr: 1, py: '1px', textAlign: 'right', fontWeight: 'bold', color: 'black', fontSize: '0.85rem' }}>
                      {renglonTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Divisor estructural vertical intermedio */}
            <Divider orientation="vertical" flexItem sx={{ borderRightWidth: 2, borderColor: 'black' }} />

            {/* COLUMNA DERECHA: Monedas Chicas y Vales (5 a Vales) */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {listaDenominaciones.slice(7).map((denom) => {
                const esVales = denom === "vales";
                const factor = esVales ? 1 : parseFloat(denom);
                const renglonTotal = (denominaciones[denom] || 0) * factor;

                return (
                  <Box key={denom} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 'bold', width: '75px', textAlign: 'right', color: 'black', fontSize: '0.85rem' }}>
                      {esVales ? "VALES X" : `$${factor.toLocaleString('es-MX', { minimumFractionDigits: denom.includes('.') ? 2 : 0 })} X`}
                    </Typography>
                    <input
                      type="number"
                      value={denominaciones[denom] === 0 ? "" : denominaciones[denom]}
                      placeholder="0"
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setDenominaciones(prev => ({ ...prev, [denom]: val }));
                      }}
                      style={{ width: '55px', textAlign: 'center', backgroundColor: '#d9d9d9', border: 'none', padding: '1px 0', fontWeight: 'bold', fontSize: '0.85rem' }}
                    />
                    <Typography sx={{ fontWeight: 'bold', color: 'black', fontSize: '0.85rem' }}>=</Typography>
                    <Box sx={{ width: '100px', backgroundColor: '#d9d9d9', pr: 1, py: '1px', textAlign: 'right', fontWeight: 'bold', color: 'black', fontSize: '0.85rem' }}>
                      {renglonTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </Box>
                  </Box>
                );
              })}
            </Box>

          </Box>

          {/* Bloque Inferior del Total de la Denominación */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1.5, px: 2, gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: '900', color: 'black' }}>Total Pago:</Typography>
            <Box sx={{ width: '150px', backgroundColor: '#d9e1f2', border: '1px solid black', pr: 1, py: '3px', textAlign: 'right', fontWeight: '900', color: 'black' }}>
              ${totalTabulador.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Box>
          </Box>

          {/* Botones de acción principales */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 2, mb: 0.5 }}>
            <Button onClick={handleAceptarTabulador} variant="contained" sx={{ backgroundColor: '#e0e0e0', color: 'black', fontWeight: 'bold', borderRadius: 0, textTransform: 'none', px: 4, py: 0.5, border: '1px solid #7f7f7f', '&:hover': { backgroundColor: '#d4d4d4' } }}>Aceptar</Button>
            <Button onClick={handleCancelarTabulador} variant="contained" sx={{ backgroundColor: '#e0e0e0', color: 'black', fontWeight: 'bold', borderRadius: 0, textTransform: 'none', px: 4, py: 0.5, border: '1px solid #7f7f7f', '&:hover': { backgroundColor: '#d4d4d4' } }}>Cancelar</Button>
          </Box>
        </DialogContent>
      </Dialog>

    </>
  );
};