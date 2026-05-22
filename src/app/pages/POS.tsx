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
  const [selectedVenta, setSelectedVenta] = React.useState<{cliente: string, suc: number, venta: number, serv: string} | null>(null);

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
const [importePago, setImportePago] = React.useState<string>("");
const [finalizandoVenta, setFinalizandoVenta] = React.useState(false);

// Calcular total de la venta
const totalVenta = detallesVenta.reduce((sum, item) => sum + item.importe, 0);
const totalPagado = pagosRegistro.reduce((sum, item) => sum + item.importe, 0);
const cambio = totalPagado - totalVenta;
const puedeFinalizar = totalPagado >= totalVenta && totalPagado > 0;

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
      serv: item.clave_prod
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
    setPagosRegistro([]);
    setFormaPagoSeleccionada("");
    setImportePago("");
    fetchFormasPago();
    setModalCobroOpen(true);
  };

  const handleAgregarPago = () => {
    if (!formaPagoSeleccionada) {
      alert('Selecciona una forma de pago');
      return;
    }
    const importe = parseFloat(importePago);
    if (isNaN(importe) || importe <= 0) {
      alert('Ingresa un importe válido');
      return;
    }

    const formaPago = formasPago.find(f => f.tipo === formaPagoSeleccionada);
    setPagosRegistro(prev => [...prev, {
      tipo: formaPagoSeleccionada as number,
      descripcion: formaPago?.descripcion || '',
      importe
    }]);
    setImportePago("");
  };

  const handleEliminarPago = (index: number) => {
    setPagosRegistro(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalizarVenta = async () => {
    if (!clienteSeleccionado || !estilistaSeleccionado) {
      alert('Faltan datos para finalizar la venta');
      return;
    }

    setFinalizandoVenta(true);
    try {
      // Ajustar los pagos para que el total sea exactamente igual a la venta
      // El último pago (generalmente efectivo) debe cubrir exactamente lo que falta
      let pagosAjustados = [...pagosRegistro];
      const totalPagadoOriginal = pagosAjustados.reduce((sum, p) => sum + p.importe, 0);
      
      if (totalPagadoOriginal > totalVenta && pagosAjustados.length > 0) {
        // Encontrar el último pago en efectivo (tipo 1 generalmente es efectivo)
        // o usar el último pago registrado
        const ultimoPagoIndex = pagosAjustados.length - 1;
        const pagosAnteriores = pagosAjustados.slice(0, ultimoPagoIndex);
        const totalAnteriores = pagosAnteriores.reduce((sum, p) => sum + p.importe, 0);
        
        // El último pago debe ser exactamente lo que falta para cubrir la venta
        const importeUltimoPago = totalVenta - totalAnteriores;
        
        // Actualizar el último pago con el importe ajustado
        pagosAjustados[ultimoPagoIndex] = {
          ...pagosAjustados[ultimoPagoIndex],
          importe: Math.max(0, importeUltimoPago)
        };
      }

      const payload = {
        cia: 1,
        sucursal: sucursal,
        caja: 1,
        cve_Cliente: clienteSeleccionado.No_cliente,
        estilista: estilistaSeleccionado,
        usuario: session?.id || '',
        pagos: pagosAjustados.map(p => ({
          tipo_Pago: p.tipo,
          referencia: p.descripcion,
          importe: p.importe
        }))
      };

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
        setModalCobroOpen(false);
        setDetallesVenta([]);
        setClienteSeleccionado(null);
        setEstilistaSeleccionado('');
        setAuxiliarSeleccionado('');
        setPagosRegistro([]);
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
      const productoDetalle: DetalleVenta = {
        id: `${producto.clave_prod}-${Date.now()}-${Math.random()}`,
        estilista: producto.id_estilista,
        d_estilista: producto.d_estilista,
        hora: producto.hora,
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
          hora: producto.hora,
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

<Box sx={{ p: { xs: 2, sm: 3 } }}>
  {/* Sección de cliente */}
  <Box sx={{ 
    display: 'flex', 
    flexDirection: { xs: 'column', sm: 'row' },
    gap: { xs: 2, sm: 2 }, 
    alignItems: { xs: 'stretch', sm: 'center' },
    mb: { xs: 3, sm: 4 }
  }}>
    <TextField
      size={isMobile ? "medium" : "small"}
      label="Cliente"
      value={clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.ap_paterno || ''} ${clienteSeleccionado.ap_materno || ''}`.trim() : ""}
      fullWidth
      sx={{ 
        flex: 1,
        '& .MuiInputBase-root': {
          height: { xs: 56, sm: 40 }, // Altura consistente
        }
      }}
    />
    <Box sx={{ 
      display: 'flex', 
      gap: { xs: 1, sm: 2 },
      flexDirection: { xs: 'row', sm: 'row' }
    }}>
      <Button
        size={isMobile ? "medium" : "small"}
        variant="contained"
        onClick={() => {
          setSearchText("");
          setSearch("");
          setPage(0);
          setModalClienteOpen(true);
        }}
        sx={{ 
          minWidth: { xs: 120, sm: 'auto' },
          height: { xs: 56, sm: 'auto' }
        }}
      >
        Seleccionar
      </Button>
      <Button 
        size={isMobile ? "medium" : "small"} 
        variant="outlined" 
        onClick={() => setModalNuevoClienteOpen(true)}
        sx={{ 
          minWidth: { xs: 56, sm: 'auto' },
          height: { xs: 56, sm: 'auto' }
        }}
      >
        +
      </Button>
      <IconButton 
        color="primary"
        onClick={handleOpenHistorial}
        disabled={!clienteSeleccionado}
        sx={{ 
          height: { xs: 56, sm: 40 },
          width: { xs: 56, sm: 40 },
          border: '1px solid',
          borderColor: clienteSeleccionado ? 'primary.main' : 'grey.300',
          borderRadius: 1,
          opacity: clienteSeleccionado ? 1 : 0.5
        }}
      >
        <History />
      </IconButton>
    </Box>
  </Box>

  <Divider sx={{ mb: { xs: 3, sm: 4 } }} />

  {/* Sección de agregar venta */}
  <Box sx={{ mb: { xs: 3, sm: 4 } }}>
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { 
        xs: '1fr', 
        sm: 'repeat(2, 1fr)', 
        lg: 'repeat(3, 1fr)' 
      }, 
      gap: { xs: 2, sm: 2 } 
    }}>
      {/* Estilista */}
      <Box>
        <FormControl size={isMobile ? "medium" : "small"} fullWidth>
          <InputLabel id="estilista-label">Estilista</InputLabel>
          <Select
            labelId="estilista-label"
            label="Estilista"
            value={estilistaSeleccionado}
            onChange={(e) => setEstilistaSeleccionado(e.target.value)}
            sx={{
              '& .MuiInputBase-root': {
                height: { xs: 56, sm: 40 },
              }
            }}
          >
            <MenuItem value="">
              <em>Selecciona</em>
            </MenuItem>
            {estilistas.map((est) => (
              <MenuItem key={est.clave_empleado} value={est.clave_empleado}>
                {est.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Producto */}
      <Box sx={{ display: "flex", gap: { xs: 1, sm: 1 }, alignItems: "center" }}>
        <TextField
          size={isMobile ? "medium" : "small"}
          type="text"
          value={productoSeleccionado ? `${productoSeleccionado.descripcion}  ` : ""}
          fullWidth
          placeholder="Seleccionar producto"
          sx={{
            '& .MuiInputBase-root': {
              height: { xs: 56, sm: 40 },
            }
          }}
        />
        <Button 
          size={isMobile ? "medium" : "small"} 
          variant="outlined" 
          onClick={() => {
            setPageProductos(0);
            setSearchProductos("");
            setEsInsumo(false);
            setModalProductoOpen(true);
          }}
          sx={{ 
            minWidth: { xs: 80, sm: 'auto' },
            height: { xs: 56, sm: 'auto' },
            whiteSpace: 'nowrap'
          }}
        >
          prod
        </Button>
      </Box>

      {/* Auxiliar */}
      <Box sx={{ display: "flex", gap: { xs: 1, sm: 1 }, alignItems: "center" }}>
        <FormControl size={isMobile ? "medium" : "small"} fullWidth>
          <InputLabel id="auxiliar-label">Auxiliar</InputLabel>
          <Select
            labelId="auxiliar-label"
            label="Auxiliar"
            value={auxiliarSeleccionado}
            onChange={(e) => setAuxiliarSeleccionado(e.target.value)}
            sx={{
              '& .MuiInputBase-root': {
                height: { xs: 56, sm: 40 },
              }
            }}
          >
            <MenuItem value="">
              <em>Selecciona</em>
            </MenuItem>
            {estilistaAuxiliar?.map((est) => (
              <MenuItem key={est.clave_empleado} value={est.clave_empleado}>
                {est.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button 
          size={isMobile ? "medium" : "small"} 
          variant="outlined"
          onClick={handleRegistrar}
          sx={{ 
            minWidth: { xs: 100, sm: 'auto' },
            height: { xs: 56, sm: 'auto' },
            whiteSpace: 'nowrap'
          }}
        >
          registrar
        </Button>
      </Box>
    </Box>
  </Box>

  {/* Tabla de detalles - responsive */}
  <Box sx={{ 
    overflowX: 'auto', // Para scroll horizontal en móviles
    '& .MuiPaper-root': {
      minWidth: { xs: 600, sm: 'auto' } // Ancho mínimo para la tabla
    }
  }}>
<DetalleVentasTable 
      data={detallesVenta} 
      onSelect={handleCancelarRenglon}
      onAgregarInsumos={handleAbrirAgregarInsumos}
      onEditarRenglon={handleEditarRenglon} 
    />

<Box sx={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "flex-end",
      mt: { xs: 2, sm: 3 },
      gap: { xs: 2, sm: 3 }
    }}>
      <Box sx={{ 
        display: "flex", 
        gap: { xs: 1, sm: 2 }, 
        flexWrap: "wrap" 
      }}>
        <Button
          variant="contained" 
          sx={{ 
            backgroundColor: 'grey.500',
            color: 'black',
            '&:hover': {
              backgroundColor: 'grey.600',
            }
          }}
          onClick={handleAbrirCobro}
        >
          Cobrar
        </Button>
        {/* <Button 
          variant="contained" 
          sx={{ 
            backgroundColor: 'grey.500',
            color: 'black',
            '&:hover': {
              backgroundColor: 'grey.600',
            }
          }}
          
        >
          Cobrar varios Ctes Tc
        </Button> */}
        <Button 
          variant="contained" 
          sx={{ 
            backgroundColor: 'grey.500',
            color: 'black',
            '&:hover': {
              backgroundColor: 'grey.600',
            }
          }}
          onClick={() => {
            fetchVentasEnProceso();
            setModalVentasEnProcesoOpen(true);
          }}
        >
          En proceso
        </Button>
        <Button 
          variant="contained" 
          sx={{ 
            backgroundColor: 'grey.500',
            color: 'black',
            '&:hover': {
              backgroundColor: 'grey.600',
            }
          }}
        >
          Cambiar cliente
        </Button>
        {/* <Button 
          variant="contained" 
          sx={{ 
            backgroundColor: 'grey.500',
            color: 'black',
            '&:hover': {
              backgroundColor: 'grey.600',
            }
          }}
        >
          Salir
        </Button> */}
        {/* <Button 
          variant="contained" 
          color="warning"
          onClick={cargarDatosDesdeArchivo}
          sx={{ 
            '&:hover': {
              backgroundColor: 'orange.700',
            }
          }}
        >
          Cargar Archivo
        </Button> */}
      </Box>
      
<Typography variant="h6" sx={{ fontWeight: "bold" }}>
  TOTAL: ${totalVenta.toFixed(2)}  
</Typography>
    </Box>

    
  </Box>
</Box>

{/* modals */}
<Dialog 
  maxWidth={isMobile ? "sm" : "lg"} 
  fullWidth
  open={modalClienteOpen} 
  onClose={() => setModalClienteOpen(false)}
  PaperProps={{
    sx: {
      m: { xs: 1, sm: 2 },
      maxHeight: { xs: '90vh', sm: '85vh' }
    }
  }}
>
  <DialogTitle>Seleccionar Cliente</DialogTitle>
  <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
    <TextField
      size={isMobile ? "medium" : "small"}
      label="Buscar cliente"
      fullWidth
      sx={{ 
        mb: { xs: 2, sm: 2 },
        '& .MuiInputBase-root': {
          height: { xs: 56, sm: 40 },
        }
      }}
      value={searchText}
      onChange={(e) => {
        const value = e.target.value;
        setSearchText(value);
        setPage(0);
        setSearch(value);
      }}
    />
    <Box sx={{ mb: { xs: 2, sm: 2 } }}>
      <ClientesTable
        data={clients}
        onSelect={(cliente) => {
          setClienteSeleccionado(cliente);
          setModalClienteOpen(false);
        }}
      />
    </Box>
    <PaginationControls
      page={page}
      total={total}
      pageSize={pageSize}
      onChange={setPage}
    />
  </DialogContent>
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
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>No. Venta</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Cant.</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Precio</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Estilista</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Forma Pago</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Insumos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historialData.map((item, index) => (
                <TableRow key={`${item.no_venta}-${item.clave_prod}-${index}`}>
                  <TableCell>{new Date(item.fecha).toLocaleDateString()}</TableCell>
                  <TableCell>{item.no_venta}</TableCell>
                  <TableCell>{item.prod_serv}</TableCell>
                  <TableCell>{item.cant_producto}</TableCell>
                  <TableCell>${item.Precio?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{item.estilista}</TableCell>
                  <TableCell>{item.forma_pago}</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => handleOpenInsumos(item)}
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
  <DialogTitle>
    Insumos de Venta #{selectedVenta?.venta}
  </DialogTitle>
  <DialogContent>
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

{/* Modal de Cobro */}
<Dialog 
  maxWidth="sm" 
  fullWidth
  open={modalCobroOpen} 
  onClose={() => setModalCobroOpen(false)}
  PaperProps={{
    sx: {
      m: { xs: 1, sm: 2 },
      maxHeight: { xs: '90vh', sm: '85vh' }
    }
  }}
>
  <DialogTitle>
    Cobrar Venta - Total: ${totalVenta.toFixed(2)}
  </DialogTitle>
  <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
    {loadingFormasPago ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    ) : (
      <>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            Agregar Pago
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ flex: 1, minWidth: 150 }}>
              <InputLabel>Forma de Pago</InputLabel>
              <Select
                value={formaPagoSeleccionada}
                label="Forma de Pago"
                onChange={(e) => setFormaPagoSeleccionada(e.target.value as number)}
              >
                {formasPago.map((fp) => (
                  <MenuItem key={fp.tipo} value={fp.tipo}>
                    {fp.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Importe"
              type="number"
              value={importePago}
              onChange={(e) => setImportePago(e.target.value)}
              sx={{ width: 120 }}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <Button 
              variant="contained" 
              onClick={handleAgregarPago}
              disabled={!formaPagoSeleccionada || !importePago}
            >
              Agregar
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            Pagos Registrados
          </Typography>
          {pagosRegistro.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay pagos registrados
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Forma de Pago</TableCell>
                    <TableCell align="right">Importe</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosRegistro.map((pago, index) => (
                    <TableRow key={index}>
                      <TableCell>{pago.descripcion}</TableCell>
                      <TableCell align="right">${pago.importe.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Button 
                          color="error" 
                          size="small"
                          onClick={() => handleEliminarPago(index)}
                        >
                          X
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">Total Venta:</Typography>
            <Typography variant="body1" fontWeight="bold">${totalVenta.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">Total Pagado:</Typography>
            <Typography variant="body1" fontWeight="bold" color={totalPagado >= totalVenta ? 'success.main' : 'text.primary'}>
              ${totalPagado.toFixed(2)}
            </Typography>
          </Box>
          {cambio > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">Cambio:</Typography>
              <Typography variant="body1" fontWeight="bold" color="error.main">
                ${cambio.toFixed(2)}
              </Typography>
            </Box>
          )}
          {totalPagado < totalVenta && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              Faltan ${(totalVenta - totalPagado).toFixed(2)} para cubrir la venta
            </Typography>
          )}
          {totalPagado > totalVenta && cambio === 0 && (
            <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
              Precaución: El total pagado excede el total de la venta sin efectivo
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            onClick={() => setModalCobroOpen(false)}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleFinalizarVenta}
            disabled={!puedeFinalizar || finalizandoVenta}
          >
            {finalizandoVenta ? 'Finalizando...' : 'Finalizar Venta'}
          </Button>
        </Box>
      </>
    )}
  </DialogContent>
</Dialog>

    </>


  );
}
