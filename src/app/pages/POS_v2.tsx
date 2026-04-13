import React, { useEffect, useState } from "react";
import useConsumoApi from "../../hooks/useConsumoApi";
import { useServerTable } from "../../hooks/useServerTable";
import useSession from "../../hooks/useSession";
import ClientesTable from "../../components/POS/ClientesTable";
import PaginationControls from "../../components/POS/PaginationControl";
import Swal from "sweetalert2";
import { Button, CircularProgress } from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import ProductosTable from "../../components/POS/ProductosTable";
import DetalleVentasTable from "../../components/POS/DetalleVentasTable";
import useCantidadesProducto from "../../hooks/useCantidadesProducto";
import CatClientes from "./cat_Clientes/page";
import { Container, Row, Col, Input, Modal, ModalHeader, ModalBody, ModalFooter, Badge, FormGroup, Label, Table } from "reactstrap";

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

const POS_v2: React.FC = () => {
  const { session } = useSession();
  const sucursal = session?.sucursal || 99;
  const cia = session?.cia || 1;
  const { consumoApi } = useConsumoApi();

  const [searchText, setSearchText] = useState("");
  const [modalNuevoClienteOpen, setModalNuevoClienteOpen] = useState(false);
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false);
  const [historialData, setHistorialData] = useState<HistorialItem[]>([]);
  const [historialPage, setHistorialPage] = useState(1);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [hasMoreHistorial, setHasMoreHistorial] = useState(true);
  const [modalHistorialInsumosOpen, setModalHistorialInsumosOpen] = useState(false);
  const [historialInsumosData, setHistorialInsumosData] = useState<InsumoItem[]>([]);
  const [historialInsumosPage, setHistorialInsumosPage] = useState(1);
  const [historialInsumosLoading, setHistorialInsumosLoading] = useState(false);
  const [hasMoreHistorialInsumos, setHasMoreHistorialInsumos] = useState(true);
  const [modalAgregarInsumosOpen, setModalAgregarInsumosOpen] = useState(false);
  const [detalleSeleccionadoInsumos, setDetalleSeleccionadoInsumos] = useState<DetalleVenta | null>(null);
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  const [resultadosInsumos, setResultadosInsumos] = useState<Producto[]>([]);
  const [loadingBusquedaInsumo, setLoadingBusquedaInsumo] = useState(false);
  const [insumosAgregar, setInsumosAgregar] = useState<{clave_prod: string; cantidad: number; d_producto: string}[]>([]);
  const [modalProductoOpen, setModalProductoOpen] = useState(false);
  const [modalInsumosOpen, setModalInsumosOpen] = useState(false);
  const [esInsumo, setEsInsumo] = useState(false);
  const [productoPrincipal, setProductoPrincipal] = useState<Producto | null>(null);
  const [insumoSeleccionadoParaCantidades, setInsmoSeleccionadoParaCantidades] = useState<Producto | null>(null);
  const [insumoCargandoCantidades, setInsmoCargandoCantidades] = useState(false);
  const { loadingCantidades, cantidades, obtenerCantidades } = useCantidadesProducto();
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<{producto: Producto; cantidad: number}[]>([]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [estilistaSeleccionado, setEstilistaSeleccionado] = useState("");
  const [auxiliarSeleccionado, setAuxiliarSeleccionado] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [estilistas, setEstilistas] = useState<Estilista[]>([]);
  const [estilistaAuxiliar, setEstilistaAuxiliar] = useState<Auxiliar[]>([]);
  const [detallesVenta, setDetallesVenta] = useState<DetalleVenta[]>([]);
  const [ventasEnProceso, setVentasEnProceso] = useState<VentaEnProceso[]>([]);
  const [modalVentasEnProcesoOpen, setModalVentasEnProcesoOpen] = useState(false);
  const [loadingVentasEnProceso, setLoadingVentasEnProceso] = useState(false);
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [modalCobroOpen, setModalCobroOpen] = useState(false);
  const [pagosRegistro, setPagosRegistro] = useState<PagoRegistro[]>([]);
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
  const [formaPagoSeleccionada, setFormaPagoSeleccionada] = useState<number | "">("");
  const [importePagado, setImportePagado] = useState("");
  const [finalizandoVenta, setFinalizandoVenta] = useState(false);

  const totalVenta = detallesVenta.reduce((sum, item) => sum + item.importe, 0);
  const totalPagado = pagosRegistro.reduce((sum, item) => sum + item.importe, 0);
  const cambio = totalPagado - totalVenta;
  const puedeFinalizar = totalPagado >= totalVenta && totalPagado > 0;

  const fetchClientes = async (search: string, page: number) => {
    const res = await consumoApi.get(`/api/PuntoDeVenta/sp_cat_clientes_suc_paginado?cia=${cia}&sucursal=${sucursal}&search=${search}&pagina=${page + 1}&registros=20`);
    return { data: res.data, total: res.data[0]?.total_registros ?? 0 };
  };

  const fetchEstilistas = async () => {
    const res = await consumoApi.get(`/api/PuntoDeVenta/sp_pos_estilistas_listado?sucursal=${sucursal}`);
    setEstilistas(res.data ?? []);
    setEstilistaAuxiliar(res.data ?? []);
  };

  const fetchAuxiliares = async () => {
    const res = await consumoApi.get(`/api/PuntoDeVenta/sp_pos_auxiliar_listado?sucursal=${sucursal}`);
    setEstilistaAuxiliar(res.data ?? []);
  };

  const fetchProductos = async (search: string, page: number) => {
    if (!search) return { data: [], total: 0 };
    const res = await consumoApi.get(`/api/PuntoDeVenta/sp_busca_productos_paginado?sucursal=${sucursal}&search=${search}&pagina=${page + 1}&registros=10&es_producto=true&es_servicio=true`);
    return { data: res.data, total: res.data[0]?.total_registros ?? 0 };
  };

  const fetchInsumos = async (search: string, page: number) => {
    if (!search) return { data: [], total: 0 };
    const res = await consumoApi.get(`/api/PuntoDeVenta/sp_busca_productos_paginado?sucursal=${sucursal}&search=${search}&pagina=${page + 1}&registros=10&es_insumo=true`);
    return { data: res.data, total: res.data[0]?.total_registros ?? 0 };
  };

  const fetchHistorial = async (cliente: string, page: number) => {
    const res = await consumoApi.get(`/api/PuntoDeVenta/sp_historial_cte_compras?cia=${cia}&cliente=${cliente}&pagina=${page}&registros=20`);
    return res.data;
  };

  const fetchHistorialInsumos = async (cliente: string, page: number) => {
    const res = await consumoApi.get(`/api/PuntoDeVenta/sp_historial_cte_insumos?cia=${cia}&cliente=${cliente}&pagina=${page}&registros=20`);
    return res.data;
  };

  const fetchFormasPago = async () => {
    const res = await consumoApi.get(`/api/PuntoDeVenta/sp_fw_pos_formas_pago_get?cia=${cia}&sucursal=${sucursal}`);
    setFormasPago(res.data ?? []);
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

  const handleOpenHistorial = async () => {
    if (!clienteSeleccionado) return;
    setModalHistorialOpen(true);
    setHistorialLoading(true);
    try {
      const data = await fetchHistorial(clienteSeleccionado.No_cliente, 1);
      setHistorialData(data);
      setHistorialPage(1);
      setHasMoreHistorial(data.length === 20);
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setHistorialLoading(false);
    }
  };

  const handleLoadMoreHistorial = async () => {
    if (!clienteSeleccionado || historialLoading || !hasMoreHistorial) return;
    setHistorialLoading(true);
    try {
      const data = await fetchHistorial(clienteSeleccionado.No_cliente, historialPage + 1);
      setHistorialData(prev => [...prev, ...data]);
      setHistorialPage(prev => prev + 1);
      setHasMoreHistorial(data.length === 20);
    } catch (error) {
      console.error("Error cargando más historial:", error);
    } finally {
      setHistorialLoading(false);
    }
  };

  const handleOpenHistorialInsumos = async () => {
    if (!clienteSeleccionado) return;
    setModalHistorialInsumosOpen(true);
    setHistorialInsumosLoading(true);
    try {
      const data = await fetchHistorialInsumos(clienteSeleccionado.No_cliente, 1);
      setHistorialInsumosData(data);
      setHistorialInsumosPage(1);
      setHasMoreHistorialInsumos(data.length === 20);
    } catch (error) {
      console.error("Error cargando historial de insumos:", error);
    } finally {
      setHistorialInsumosLoading(false);
    }
  };

  const handleLoadMoreHistorialInsumos = async () => {
    if (!clienteSeleccionado || historialInsumosLoading || !hasMoreHistorialInsumos) return;
    setHistorialInsumosLoading(true);
    try {
      const data = await fetchHistorialInsumos(clienteSeleccionado.No_cliente, historialInsumosPage + 1);
      setHistorialInsumosData(prev => [...prev, ...data]);
      setHistorialInsumosPage(prev => prev + 1);
      setHasMoreHistorialInsumos(data.length === 20);
    } catch (error) {
      console.error("Error cargando más historial de insumos:", error);
    } finally {
      setHistorialInsumosLoading(false);
    }
  };

  const handleCancelarRenglon = (detalle: DetalleVenta) => {
    if (!clienteSeleccionado) {
      alert('Por favor selecciona un cliente');
      return;
    }

    Swal.fire({
      title: '¿Cancelar este renglón?',
      text: `Producto: ${detalle.d_producto}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await consumoApi.post(
            `/api/PuntoDeVenta/sp_fw_pos_cancelar_renglon?cia=${cia}&sucursal=${sucursal}&no_venta=0&cve_cliente=${clienteSeleccionado.No_cliente}&clave_producto=${detalle.clave_prod}&estilista=${detalle.id_estilista || detalle.estilista}`,
            {}
          );
          setDetallesVenta(prev => prev.filter(d => d.id !== detalle.id));
          Swal.fire('Cancelado', 'Renglón cancelado correctamente', 'success');
        } catch (error) {
          Swal.fire('Error', 'No se pudo cancelar el renglón', 'error');
        }
      }
    });
  };

  const handleAbrirAgregarInsumos = (detalle: DetalleVenta) => {
    const productoParaInsumos: Producto = {
      clave_prod: detalle.clave_prod,
      descripcion: detalle.d_producto,
      es_servicio: true,
      controlado: true,
    };
    setProductoPrincipal(productoParaInsumos);
    setInsumosAgregar([]);
    setModalAgregarInsumosOpen(true);
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

    const payload = {
      insumos: insumosAgregar.map(i => ({
        clave_prod: i.clave_prod,
        cantidad: i.cantidad
      }))
    };

    try {
      await consumoApi.post(
        `/api/PuntoDeVenta/sp_fw_pos_agregar_insumos_venta?cia=1&sucursal=${sucursal}&no_venta=0&cve_cliente=${clienteSeleccionado.No_cliente}&clave_producto_venta=${detalleSeleccionadoInsumos.clave_prod}&estilista=${detalleSeleccionadoInsumos.id_estilista}`,
        payload
      );
      Swal.fire('Éxito', 'Insumos agregados correctamente', 'success');
      setModalAgregarInsumosOpen(false);
      setInsumosAgregar([]);
      setDetalleSeleccionadoInsumos(null);
      fetchDetalleVenta(clienteSeleccionado.No_cliente, estilistaSeleccionado);
    } catch (error: any) {
      const msg = error.response?.data?.mensaje || 'Error al agregar insumos';
      Swal.fire('Error', msg, 'error');
    }
  };

  const handleRegistrar = () => {
    if (!estilistaSeleccionado || !productoSeleccionado) {
      alert('Por favor selecciona un estilista y un producto');
      return;
    }

    if (productoSeleccionado.controlado && productoSeleccionado.es_servicio) {
      setProductoPrincipal(productoSeleccionado);
      setModalInsumosOpen(true);
      return;
    }

    registrarProducto(productoSeleccionado);
  };

  const registrarProducto = async (producto: Producto) => {
    if (!clienteSeleccionado) {
      alert('Por favor selecciona un cliente');
      return;
    }
    if (!estilistaSeleccionado) {
      alert('Por favor selecciona un estilista');
      return;
    }

    try {
      const res = await consumoApi.post(
        `/api/PuntoDeVenta/sp_fw_pos_guardar_venta?cia=${cia}&sucursal=${sucursal}&no_venta=0&cve_cliente=${clienteSeleccionado.No_cliente}&estilista=${estilistaSeleccionado}&auxiliar=${auxiliarSeleccionado}`,
        {
          clave_prod: producto.clave_prod,
          cantidad: 1,
          precio: producto.Precio || 0,
          tiempo: producto.tiempo || "00:00"
        }
      );
      
      if (res.data && res.data[0]) {
        if (res.data[0].ok === 1) {
          Swal.fire('Éxito', res.data[0].mensaje, 'success');
          setProductoSeleccionado(null);
          setAuxiliarSeleccionado("");
          fetchDetalleVenta(clienteSeleccionado.No_cliente, estilistaSeleccionado);
        } else {
          Swal.fire('Error', res.data[0].mensaje || 'Error al registrar', 'error');
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.[0]?.mensaje || 'Error al registrar producto';
      Swal.fire('Error', msg, 'error');
    }
  };

  const handleAbrirCobro = () => {
    if (detallesVenta.length === 0) {
      Swal.fire('Atención', 'No hay productos en la venta', 'warning');
      return;
    }
    fetchFormasPago();
    setPagosRegistro([]);
    setFormaPagoSeleccionada("");
    setImportePagado("");
    setModalCobroOpen(true);
  };

  const agregarPago = () => {
    if (!formaPagoSeleccionada || !importePagado) {
      Swal.fire('Atención', 'Selecciona forma de pago e ingresa importe', 'warning');
      return;
    }
    
    const importe = parseFloat(importePagado);
    if (isNaN(importe) || importe <= 0) {
      Swal.fire('Error', 'Importe inválido', 'error');
      return;
    }

    const formaPago = formasPago.find(f => f.tipo === formaPagoSeleccionada);
    
    setPagosRegistro([...pagosRegistro, {
      tipo: formaPagoSeleccionada,
      descripcion: formaPago?.descripcion || '',
      importe
    }]);
    
    setFormaPagoSeleccionada("");
    setImportePagado("");
  };

  const quitarPago = (index: number) => {
    setPagosRegistro(pagosRegistro.filter((_, i) => i !== index));
  };

  const finalizarVenta = async () => {
    if (!puedeFinalizar) {
      Swal.fire('Atención', 'El monto pagado debe ser mayor o igual al total de la venta', 'warning');
      return;
    }

    if (!clienteSeleccionado) {
      Swal.fire('Error', 'No hay cliente seleccionado', 'error');
      return;
    }

    setFinalizandoVenta(true);
    try {
      const res = await consumoApi.post(
        `/api/PuntoDeVenta/sp_bw_pos_finaliza_venta?cia=${cia}&sucursal=${sucursal}&no_venta=0&cve_cliente=${clienteSeleccionado.No_cliente}&estilista=${estilistaSeleccionado}`,
        {
          pagos: pagosRegistro.map(p => ({
            tipo: p.tipo,
            importe: p.importe
          }))
        }
      );

      if (res.data && res.data[0]?.ok === 1) {
        Swal.fire('Éxito', 'Venta finalizada correctamente', 'success').then(() => {
          setClienteSeleccionado(null);
          setEstilistaSeleccionado("");
          setAuxiliarSeleccionado("");
          setProductoSeleccionado(null);
          setDetallesVenta([]);
          setPagosRegistro([]);
          setModalCobroOpen(false);
        });
      } else {
        Swal.fire('Error', res.data?.[0]?.mensaje || 'Error al finalizar venta', 'error');
      }
    } catch (error: any) {
      const msg = error.response?.data?.[0]?.mensaje || 'Error al finalizar venta';
      Swal.fire('Error', msg, 'error');
    } finally {
      setFinalizandoVenta(false);
    }
  };

  const buscarInsumosModal = async (busqueda: string) => {
    if (busqueda.length < 2) {
      setResultadosInsumos([]);
      return;
    }
    setLoadingBusquedaInsumo(true);
    try {
      const response = await consumoApi.get('/api/PuntoDeVenta/sp_busca_productos_paginado', {
        params: { search: busqueda, pagina: 1, pageSize: 20, es_insumo: true }
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

  const handleSelectInsumo = (producto: Producto) => {
    const yaExiste = insumosSeleccionados.some(i => i.producto.clave_prod === producto.clave_prod);
    if (yaExiste) {
      Swal.fire('Info', 'El insumo ya está en la lista', 'info');
      return;
    }
    setInsumosSeleccionados([...insumosSeleccionados, { producto, cantidad: 1 }]);
  };

  const handleRemoveInsumo = (clave_prod: string) => {
    setInsumosSeleccionados(insumosSeleccionados.filter(i => i.producto.clave_prod !== clave_prod));
  };

  const handleQuantityChange = (clave_prod: string, cantidad: number) => {
    if (cantidad <= 0) return;
    setInsumosSeleccionados(insumosSeleccionados.map(i => 
      i.producto.clave_prod === clave_prod ? { ...i, cantidad } : i
    ));
  };

  const handleOpenCantidades = async (producto: Producto) => {
    setInsmoSeleccionadoParaCantidades(producto);
    setInsmoCargandoCantidades(true);
    await obtenerCantidades(producto.clave_prod, cia, sucursal);
    setInsmoCargandoCantidades(false);
  };

  const handleConfirmarInsumos = async () => {
    if (!productoPrincipal || insumosSeleccionados.length === 0) {
      Swal.fire('Atención', 'Agrega al menos un insumo', 'warning');
      return;
    }

    if (!clienteSeleccionado || !estilistaSeleccionado) {
      Swal.fire('Atención', 'Selecciona cliente y estilista', 'warning');
      return;
    }

    try {
      await consumoApi.post(
        `/api/PuntoDeVenta/sp_fw_pos_agregar_insumos_venta?cia=${cia}&sucursal=${sucursal}&no_venta=0&cve_cliente=${clienteSeleccionado?.No_cliente || ''}&clave_producto_venta=${productoPrincipal.clave_prod}&estilista=${estilistaSeleccionado}`,
        {
          insumos: insumosSeleccionados.map(i => ({
            clave_prod: i.producto.clave_prod,
            cantidad: i.cantidad
          }))
        }
      );
      
      registrarProducto(productoPrincipal);
      setModalInsumosOpen(false);
      setInsumosSeleccionados([]);
      setProductoPrincipal(null);
    } catch (error: any) {
      const msg = error.response?.data?.mensaje || 'Error al agregar insumos';
      Swal.fire('Error', msg, 'error');
    }
  };

  return (
    <><Container fluid className="p-3">

      <Row className="mb-3 align-items-center">
        <Col md="8">
          <Input
            type="text"
            readOnly
            value={clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.ap_paterno || ''} ${clienteSeleccionado.ap_materno || ''}`.trim() : ""}
            placeholder="Seleccionar cliente" />
        </Col>
        <Col md="4" className="d-flex gap-2">
          <Button color="primary" onClick={() => { setSearchText(""); setSearch(""); setPage(0); setModalClienteOpen(true); } }>
            Seleccionar
          </Button>
          <Button variant="outlined" color="primary" onClick={() => setModalNuevoClienteOpen(true)}>+</Button>
          <Button variant="outlined" color="primary" onClick={handleOpenHistorial} disabled={!clienteSeleccionado}>
            <HistoryIcon />
          </Button>
        </Col>
      </Row>

      <hr />


      <Row className="mb-3">
        <Col md="3">
          <FormGroup>
            <Input type="select" value={estilistaSeleccionado} onChange={(e) => setEstilistaSeleccionado(e.target.value)}>
              <option value="">Selecciona estilista</option>
              {estilistas.map((est) => (
                <option key={est.clave_empleado} value={est.clave_empleado}>{est.nombre}</option>
              ))}
            </Input>
          </FormGroup>
        </Col>
        <Col md="3">
          <FormGroup>
            <Input type="select" value={auxiliarSeleccionado} onChange={(e) => setAuxiliarSeleccionado(e.target.value)}>
              <option value="">Selecciona auxiliar</option>
              {estilistaAuxiliar?.map((est) => (
                <option key={est.clave_empleado} value={est.clave_empleado}>{est.nombre}</option>
              ))}
            </Input>
          </FormGroup>
        </Col>
        <Col md="4">
          <Input
            type="text"
            readOnly
            value={productoSeleccionado ? productoSeleccionado.descripcion : ""}
            placeholder="Seleccionar producto" />
        </Col>
        <Col md="2" className="d-flex gap-2">
          <Button color="info" onClick={() => { setPageProductos(0); setSearchProductos(""); setEsInsumo(false); setModalProductoOpen(true); } }>
            prod
          </Button>
          <Button color="success" onClick={handleRegistrar}>registrar</Button>
        </Col>
      </Row>

      {/* Tabla de Detalles - Justo después de los formularios */}
      <div className="m-n3 p-3">
        <DetalleVentasTable
          data={detallesVenta}
          onSelect={handleCancelarRenglon}
          onAgregarInsumos={handleAbrirAgregarInsumos} />
      </div>
    </Container>

    {/* Botones de acción - Container separado */}
    <Container fluid className="p-3">
      <Row className="align-items-center">
        <Col>
          <div className="d-flex gap-2 flex-wrap">
            <Button color="secondary" onClick={handleAbrirCobro}>Cobrar</Button>
            <Button color="secondary" onClick={() => { fetchVentasEnProceso(); setModalVentasEnProcesoOpen(true); } }>En proceso</Button>
            <Button color="secondary">Cambiar cliente</Button>
          </div>
        </Col>
        <Col className="text-end">
          <h5 className="mb-0">Total: ${totalVenta.toFixed(2)}</h5>
        </Col>
      </Row>

        <Modal isOpen={modalClienteOpen} toggle={() => setModalClienteOpen(false)} size="lg">
          <ModalHeader toggle={() => setModalClienteOpen(false)}>Seleccionar Cliente</ModalHeader>
          <ModalBody>
            <FormGroup>
              <Input
                type="text"
                placeholder="Buscar cliente"
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setSearch(e.target.value); setPage(0); } } />
            </FormGroup>
            <ClientesTable
              data={clients}
              onSelect={(cliente) => { setClienteSeleccionado(cliente); setModalClienteOpen(false); } } />
            <PaginationControls page={page} total={total} pageSize={pageSize} onChange={setPage} />
          </ModalBody>
        </Modal>


        <Modal isOpen={modalHistorialOpen} toggle={() => setModalHistorialOpen(false)} size="lg">
          <ModalHeader toggle={() => setModalHistorialOpen(false)}>
            Historial de Compras - {clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.ap_paterno || ''}` : ''}
          </ModalHeader>
          <ModalBody>
            <Button color="info" size="sm" className="mb-2" onClick={handleOpenHistorialInsumos}>Ver Insumos</Button>
            {historialLoading ? <CircularProgress /> : (
              historialData.length === 0 ? <p>No hay historial</p> : (
                <>
                  <Table responsive size="sm">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Cant</th>
                        <th>Precio</th>
                        <th>Estilista</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialData.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.fecha}</td>
                          <td>{item.clave_prod} - {item.prod_serv}</td>
                          <td>{item.cant_producto}</td>
                          <td>${item.Precio.toFixed(2)}</td>
                          <td>{item.estilista}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {hasMoreHistorial && (
                    <Button color="primary" size="sm" onClick={handleLoadMoreHistorial} disabled={historialLoading}>
                      Cargar más
                    </Button>
                  )}
                </>
              )
            )}
          </ModalBody>
        </Modal>


        <Modal isOpen={modalHistorialInsumosOpen} toggle={() => setModalHistorialInsumosOpen(false)} size="lg">
          <ModalHeader toggle={() => setModalHistorialInsumosOpen(false)}>Historial de Insumos</ModalHeader>
          <ModalBody>
            {historialInsumosLoading ? <CircularProgress /> : (
              historialInsumosData.length === 0 ? <p>No hay historial de insumos</p> : (
                <>
                  <Table responsive size="sm">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Producto Venta</th>
                        <th>Insumo</th>
                        <th>Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialInsumosData.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.fecha}</td>
                          <td>{item.producto_venta}</td>
                          <td>{item.producto_insumo}</td>
                          <td>{item.cantidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {hasMoreHistorialInsumos && (
                    <Button color="primary" size="sm" onClick={handleLoadMoreHistorialInsumos} disabled={historialInsumosLoading}>
                      Cargar más
                    </Button>
                  )}
                </>
              )
            )}
          </ModalBody>
        </Modal>


        <Modal isOpen={modalAgregarInsumosOpen} toggle={() => setModalAgregarInsumosOpen(false)} size="lg">
          <ModalHeader>Agregar Insumos - {detalleSeleccionadoInsumos?.d_producto}</ModalHeader>
          <ModalBody>
            <FormGroup>
              <Input
                type="text"
                placeholder="Buscar insumo"
                value={busquedaInsumo}
                onChange={(e) => { setBusquedaInsumo(e.target.value); buscarInsumos(e.target.value); } } />
            </FormGroup>
            {loadingBusquedaInsumo && <CircularProgress />}
            {resultadosInsumos.length > 0 && (
              <div className="border rounded p-2 mb-3" style={{ maxHeight: 200, overflow: 'auto' }}>
                {resultadosInsumos.map((producto) => (
                  <div key={producto.clave_prod} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                    <span>{producto.clave_prod} - {producto.descripcion}</span>
                    <Button size="sm" outline onClick={() => agregarInsumoALista(producto)}>Agregar</Button>
                  </div>
                ))}
              </div>
            )}
            <h6>Insumos a agregar:</h6>
            {insumosAgregar.length === 0 ? (
              <p className="text-muted">No hay insumos en la lista</p>
            ) : (
              <Table size="sm">
                <thead>
                  <tr>
                    <th>Clave</th>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {insumosAgregar.map((insumo) => (
                    <tr key={insumo.clave_prod}>
                      <td>{insumo.clave_prod}</td>
                      <td>{insumo.d_producto}</td>
                      <td>
                        <Input
                          type="number"
                          value={insumo.cantidad}
                          onChange={(e) => actualizarCantidadInsumo(insumo.clave_prod, parseFloat(e.target.value) || 0)}
                          style={{ width: 80 }}
                          min="0.01"
                          step="0.01" />
                      </td>
                      <td>
                        <Button color="danger" size="sm" onClick={() => quitarInsumoDeLista(insumo.clave_prod)}>✕</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={guardarInsumosVenta} disabled={insumosAgregar.length === 0}>Confirmar</Button>
            <Button color="secondary" onClick={() => setModalAgregarInsumosOpen(false)}>Cancelar</Button>
          </ModalFooter>
        </Modal>


        <Modal isOpen={modalProductoOpen} toggle={() => setModalProductoOpen(false)} size="lg">
          <ModalHeader>Buscar Producto</ModalHeader>
          <ModalBody>
            <FormGroup>
              <Input
                type="text"
                placeholder="Buscar..."
                onChange={(e) => { setSearchProductos(e.target.value); setPageProductos(0); } } />
            </FormGroup>
            <ProductosTable
              data={productos}
              onSelect={(producto) => { setProductoSeleccionado(producto); setModalProductoOpen(false); } } />
            <PaginationControls page={pageProductos} total={totalProductos} pageSize={pageSizeProductos} onChange={setPageProductos} />
          </ModalBody>
        </Modal>


        <Modal isOpen={modalInsumosOpen} toggle={() => setModalInsumosOpen(false)} size="lg">
          <ModalHeader>Agregar Insumos - {productoPrincipal?.descripcion}</ModalHeader>
          <ModalBody>
            <FormGroup>
              <Input
                type="text"
                placeholder="Buscar insumo"
                value={busquedaInsumo}
                onChange={(e) => { setBusquedaInsumo(e.target.value); buscarInsumosModal(e.target.value); } } />
            </FormGroup>
            {loadingBusquedaInsumo && <CircularProgress />}
            {resultadosInsumos.length > 0 && (
              <div className="border rounded p-2 mb-3" style={{ maxHeight: 200, overflow: 'auto' }}>
                {resultadosInsumos.map((producto) => (
                  <div key={producto.clave_prod} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                    <span>{producto.clave_prod} - {producto.descripcion}</span>
                    <Button size="sm" outline onClick={() => handleSelectInsumo(producto)}>Agregar</Button>
                  </div>
                ))}
              </div>
            )}
            <h6>Insumos a agregar:</h6>
            {insumosSeleccionados.length === 0 ? (
              <p className="text-muted">No hay insumos en la lista</p>
            ) : (
              <Table size="sm">
                <thead>
                  <tr>
                    <th>Clave</th>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {insumosSeleccionados.map((insumo) => (
                    <tr key={insumo.producto.clave_prod}>
                      <td>{insumo.producto.clave_prod}</td>
                      <td>{insumo.producto.descripcion}</td>
                      <td>
                        <Input
                          type="number"
                          value={insumo.cantidad}
                          onChange={(e) => handleQuantityChange(insumo.producto.clave_prod, parseFloat(e.target.value) || 0)}
                          style={{ width: 80 }}
                          min="0.01"
                          step="0.01" />
                      </td>
                      <td>
                        <Button color="danger" size="sm" onClick={() => handleRemoveInsumo(insumo.producto.clave_prod)}>✕</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={handleConfirmarInsumos} disabled={insumosSeleccionados.length === 0}>
              Confirmar Insumos ({insumosSeleccionados.length})
            </Button>
            <Button color="secondary" onClick={() => { setModalInsumosOpen(false); setInsumosSeleccionados([]); setProductoPrincipal(null); } }>Cancelar</Button>
          </ModalFooter>
        </Modal>


        <Modal isOpen={modalVentasEnProcesoOpen} toggle={() => setModalVentasEnProcesoOpen(false)} size="lg">
          <ModalHeader>Ventas en Proceso</ModalHeader>
          <ModalBody>
            {loadingVentasEnProceso ? <CircularProgress /> : (
              ventasEnProceso.length === 0 ? <p>No hay ventas en proceso</p> : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Estilista</th>
                      <th>Importe</th>
                      <th>Sucursal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasEnProceso.map((venta, idx) => (
                      <tr key={idx}>
                        <td>{venta.d_cliente}</td>
                        <td>{venta.d_estilista}</td>
                        <td>${venta.importe.toFixed(2)}</td>
                        <td>{venta.sucursal}</td>
                        <td>
                          <Button size="sm" color="primary" onClick={() => fetchDetalleVenta(venta.cve_cliente, venta.user)}>
                            Cargar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )
            )}
          </ModalBody>
        </Modal>


        <Modal isOpen={modalCobroOpen} toggle={() => setModalCobroOpen(false)} size="lg">
          <ModalHeader>Cobrar Venta - Total: ${totalVenta.toFixed(2)}</ModalHeader>
          <ModalBody>
            <Row className="mb-3">
              <Col md="6">
                <FormGroup>
                  <Label>Forma de Pago</Label>
                  <Input type="select" value={formaPagoSeleccionada} onChange={(e) => setFormaPagoSeleccionada(e.target.value as any)}>
                    <option value="">Selecciona...</option>
                    {formasPago.map((fp) => (
                      <option key={fp.tipo} value={fp.tipo}>{fp.descripcion}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label>Importe</Label>
                  <Input type="number" value={importePagado} onChange={(e) => setImportePagado(e.target.value)} min="0" step="0.01" />
                </FormGroup>
              </Col>
              <Col md="2" className="d-flex align-items-end">
                <Button color="primary" onClick={agregarPago}>Agregar</Button>
              </Col>
            </Row>

            <h6>Pagos registrados:</h6>
            {pagosRegistro.length === 0 ? (
              <p className="text-muted">No hay pagos registrados</p>
            ) : (
              <Table size="sm">
                <thead>
                  <tr>
                    <th>Forma de Pago</th>
                    <th className="text-right">Importe</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pagosRegistro.map((pago, idx) => (
                    <tr key={idx}>
                      <td>{pago.descripcion}</td>
                      <td className="text-right">${pago.importe.toFixed(2)}</td>
                      <td>
                        <Button color="danger" size="sm" onClick={() => quitarPago(idx)}>✕</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total Pagado:</strong></td>
                    <td className="text-right"><strong>${totalPagado.toFixed(2)}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
            )}

            {totalPagado < totalVenta && (
              <div className="alert alert-warning">Faltan ${(totalVenta - totalPagado).toFixed(2)} para cubrir la venta</div>
            )}
            {totalPagado > totalVenta && cambio > 0 && (
              <div className="alert alert-success">Cambio: ${cambio.toFixed(2)}</div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="success" onClick={finalizarVenta} disabled={!puedeFinalizar || finalizandoVenta}>
              {finalizandoVenta ? "Finalizando..." : "Finalizar Venta"}
            </Button>
            <Button color="secondary" onClick={() => setModalCobroOpen(false)}>Cancelar</Button>
          </ModalFooter>
        </Modal>


        <Modal isOpen={modalNuevoClienteOpen} toggle={() => setModalNuevoClienteOpen(false)} size="lg">
          <ModalHeader>Nuevo Cliente</ModalHeader>
          <ModalBody>
            <CatClientes />
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModalNuevoClienteOpen(false)}>Cerrar</Button>
          </ModalFooter>
        </Modal>

      </Container></>
  );
};

export default POS_v2;