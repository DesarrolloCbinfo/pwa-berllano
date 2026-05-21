import React, { useState, useEffect } from "react";
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useServerTable } from "../../../hooks/useServerTable";
import useSession from "../../../hooks/useSession";
import Swal from "sweetalert2";
import { History } from "@mui/icons-material";
import "./POS_v3.css";

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
  Precio?: number;
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
  sucursal?: number;
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

const POS_v3: React.FC = () => {
  const session = useSession();
  const sucursal = session?.sucursal || 99;
  const cia = session?.cia || 1;
  const { consumoApi } = useConsumoApi();

  const [sessionLoaded, setSessionLoaded] = useState(false);

  const [searchText, setSearchText] = useState("");
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
  const [insumosAgregar, setInsumosAgregar] = useState<{ clave_prod: string; cantidad: number; d_producto: string }[]>([]);
  const [modalProductoOpen, setModalProductoOpen] = useState(false);
  const [modalInsumosOpen, setModalInsumosOpen] = useState(false);
  const [productoPrincipal, setProductoPrincipal] = useState<Producto | null>(null);
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<{ producto: Producto; cantidad: number; cantidades: number[]; loadingCantidades: boolean }[]>([]);
  const [insumosPage, setInsumosPage] = useState(1);

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [estilistaSeleccionado, setEstilistaSeleccionado] = useState("");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
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

  const fetchClientes = async ({ page, pageSize, search }: { page: number; pageSize: number; search: string }) => {
    const res = await consumoApi.get(`/api/PuntoDeVenta/sp_cat_clientes_suc_paginado?cia=${cia}&sucursal=${sucursal}&Busqueda=${search}&pagina=${page}&registros=${pageSize}`);
    return { data: res.data, total: res.data[0]?.total_registros ?? 0 };
  };

  const fetchEstilistas = async () => {
    try {
      const res = await consumoApi.get(`/api/PuntoDeVenta/sp_pos_estilistas_listado?sucursal=${sucursal}`);
      setEstilistas(res.data ?? []);
      setEstilistaAuxiliar(res.data ?? []);
    } catch (error) {
      console.error("Error fetching estilistas:", error);
    }
  };

  const fetchAuxiliares = async () => {
    try {
      const res = await consumoApi.get(`/api/PuntoDeVenta/sp_pos_auxiliar_listado?sucursal=${sucursal}`);
      setEstilistaAuxiliar(res.data ?? []);
    } catch (error) {
      console.error("Error fetching auxiliares:", error);
    }
  };

  useEffect(() => {
    if (session && !sessionLoaded) {
      setSessionLoaded(true);
    }
  }, [session, sessionLoaded]);

  useEffect(() => {
    if (sessionLoaded && sucursal) {
      fetchEstilistas();
      fetchAuxiliares();
    }
  }, [sessionLoaded, sucursal]);

  const fetchProductos = async ({ page, pageSize, search }: { page: number; pageSize: number; search: string }) => {
    if (!search) return { data: [], total: 0 };
    const res = await consumoApi.get(`/api/PuntoDeVenta/sp_busca_productos_paginado?clave_desc=${search}&insumo=false&pagina=${page}&registros=${pageSize}`);
    return { data: res.data, total: res.data[0]?.total_registros ?? 0 };
  };

  const fetchHistorial = async (cliente: string, page: number) => {
    const res = await consumoApi.get(`/api/PuntoDeVenta/sp_historial_cte_compras?cia=${cia}&cliente=${cliente}&pagina=${page}&registros=20`);
    return res.data;
  };

  const fetchHistorialInsumos = async (cliente: string, suc: number, venta: number, serv: string, pagina: number) => {
    const res = await consumoApi.get(`/api/PuntoDeVenta/sp_historial_cte_insumos?cliente=${cliente}&suc=${suc}&venta=${venta}&serv=${serv}&pagina=${pagina}`);
    return res.data;
  };

  const {
    data: clients,
    page,
    pageSize,
    setPage,
    setSearch,
  } = useServerTable<Cliente>(fetchClientes, 20);

  const {
    data: productos,
    page: pageProductos,
    pageSize: pageSizeProductos,
    setPage: setPageProductos,
    setSearch: setSearchProductos,
  } = useServerTable<Producto>(fetchProductos, 10);

  const fetchFormasPago = async () => {
    const res = await consumoApi.get(`/api/PuntoDeVenta/sp_fw_pos_formas_pago_get?cia=${cia}&sucursal=${sucursal}`);
    setFormasPago(res.data ?? []);
  };

  const fetchVentasEnProceso = async () => {
    setLoadingVentasEnProceso(true);
    try {
      const res = await consumoApi.get(`/api/PuntoDeVenta/sp_bw_pos_ventas_en_proceso?sucursal=${sucursal}`);
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
    } catch (error) {
      console.error("Error al cargar detalle de venta:", error);
    } finally {
      setLoadingVentasEnProceso(false);
    }
  };

  const toggleExpandedRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

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

  const handlePrevPageHistorial = async () => {
    if (!clienteSeleccionado || historialLoading || historialPage <= 1) return;
    setHistorialLoading(true);
    try {
      const data = await fetchHistorial(clienteSeleccionado.No_cliente, historialPage - 1);
      setHistorialData(data);
      setHistorialPage(prev => prev - 1);
      setHasMoreHistorial(true);
    } catch (error) {
      console.error("Error cargando historial anterior:", error);
    } finally {
      setHistorialLoading(false);
    }
  };

  const handleNextPageHistorial = async () => {
    if (!clienteSeleccionado || historialLoading || !hasMoreHistorial) return;
    setHistorialLoading(true);
    try {
      const data = await fetchHistorial(clienteSeleccionado.No_cliente, historialPage + 1);
      setHistorialData(data);
      setHistorialPage(prev => prev + 1);
      setHasMoreHistorial(data.length >= 20);
    } catch (error) {
      console.error("Error cargando más historial:", error);
    } finally {
      setHistorialLoading(false);
    }
  };

  const handleOpenHistorialInsumos = async (noVenta?: number, claveProd?: string, suc?: number) => {
    setModalHistorialInsumosOpen(true);
    setHistorialInsumosLoading(true);
    try {
      const data = await fetchHistorialInsumos(
        clienteSeleccionado!.No_cliente,
        suc || 0,
        noVenta || 0,
        claveProd || '',
        1
      );
      setHistorialInsumosData(data);
      setHistorialInsumosPage(1);
      setHasMoreHistorialInsumos(data.length === 20);
    } catch (error) {
      console.error("Error cargando historial de insumos:", error);
    } finally {
      setHistorialInsumosLoading(false);
    }
  };

  const handlePrevPageHistorialInsumos = async () => {
    if (!clienteSeleccionado || historialInsumosLoading || historialInsumosPage <= 1) return;
    setHistorialInsumosLoading(true);
    try {
      const data = await fetchHistorialInsumos(
        clienteSeleccionado.No_cliente,
        0,
        0,
        '',
        historialInsumosPage - 1
      );
      setHistorialInsumosData(data);
      setHistorialInsumosPage(prev => prev - 1);
      setHasMoreHistorialInsumos(true);
    } catch (error) {
      console.error("Error cargando historial de insumos anterior:", error);
    } finally {
      setHistorialInsumosLoading(false);
    }
  };

  const handleNextPageHistorialInsumos = async () => {
    if (!clienteSeleccionado || historialInsumosLoading || !hasMoreHistorialInsumos) return;
    setHistorialInsumosLoading(true);
    try {
      const data = await fetchHistorialInsumos(
        clienteSeleccionado.No_cliente,
        0,
        0,
        '',
        historialInsumosPage + 1
      );
      setHistorialInsumosData(data);
      setHistorialInsumosPage(prev => prev + 1);
      setHasMoreHistorialInsumos(data.length >= 20);
    } catch (error) {
      console.error("Error cargando más historial de insumos:", error);
    } finally {
      setHistorialInsumosLoading(false);
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

      const responseData = Array.isArray(res.data) ? res.data[0] : res.data;

      if (responseData?.ok === 1) {
        Swal.fire({
          icon: 'success',
          title: 'Cancelado',
          text: responseData?.mensaje || 'Renglón cancelado',
          confirmButtonText: 'Aceptar'
        });
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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cancelar el renglón',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleAbrirAgregarInsumos = (detalle: DetalleVenta) => {
    const productoParaInsumos: Producto = {
      clave_prod: detalle.clave_prod,
      descripcion: detalle.d_producto,
      es_servicio: true,
      controlado: true,
    };
    setDetalleSeleccionadoInsumos(detalle);
    setProductoPrincipal(productoParaInsumos);
    setInsumosSeleccionados([]);
    setBusquedaInsumo("");
    setModalInsumosOpen(true);
    buscarInsumosModal("%", 1);
  };

  const buscarInsumos = async (busqueda: string) => {
    if (busqueda.length < 2) {
      setResultadosInsumos([]);
      return;
    }
    setLoadingBusquedaInsumo(true);
    try {
      const response = await consumoApi.get(`/api/PuntoDeVenta/sp_busca_productos_paginado?clave_desc=${busqueda}&insumo=true&pagina=1&registros=20`);
      const data = response.data || [];
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
      alert('Por favor seleccione un estilista y un producto');
      return;
    }

    if (productoSeleccionado.controlado && productoSeleccionado.es_servicio) {
      setProductoPrincipal(productoSeleccionado);
      setDetalleSeleccionadoInsumos(null);
      setInsumosSeleccionados([]);
      setBusquedaInsumo("");
      setModalInsumosOpen(true);
      buscarInsumosModal("%", 1);
      return;
    }

    registrarProducto(productoSeleccionado);
  };

  const registrarProducto = async (producto: Producto, insumos?: { clave_prod: string; cantidad: number }[]) => {
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
        `/api/PuntoDeVenta/sp_fw_pos_guardar_venta`,
        {
          cia: cia,
          sucursal: sucursal,
          no_venta: 0,
          cve_cliente: clienteSeleccionado.No_cliente,
          estilista: estilistaSeleccionado,
          auxiliar: auxiliarSeleccionado || "",
          productos: [{
            clave_prod: producto.clave_prod,
            cantidad: 1,
            precio: producto.Precio || 0,
            descuento: 0,
            tiempo: producto.tiempo || "00:00",
            hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            insumos: insumos || []
          }]
        }
      );

      const responseData = Array.isArray(res.data) ? res.data[0] : res.data;
      if (responseData && responseData.ok === 1) {
        Swal.fire('Éxito', responseData.mensaje, 'success');
        setProductoSeleccionado(null);
        setAuxiliarSeleccionado("");
        fetchDetalleVenta(clienteSeleccionado.No_cliente, estilistaSeleccionado);
      } else {
        Swal.fire('Error', responseData?.mensaje || 'Error al registrar', 'error');
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

  const buscarInsumosModal = async (busqueda: string, pagina: number = 1) => {
    if (busqueda.length < 2) {
      setResultadosInsumos([]);
      return;
    }
    setLoadingBusquedaInsumo(true);
    try {
      const response = await consumoApi.get(`/api/PuntoDeVenta/sp_busca_productos_paginado?clave_desc=${busqueda}&insumo=true&pagina=${pagina}&registros=20`);
      const data = response.data || [];
      setResultadosInsumos(data);
      setInsumosPage(pagina);
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

    setInsumosSeleccionados([...insumosSeleccionados, { producto, cantidad: 1, cantidades: [], loadingCantidades: true }]);

    consumoApi.get(`/api/PuntoDeVenta/sp_fw_pos_cat_productos_cantidades_sel?clave_prod=${producto.clave_prod}`)
      .then((response) => {
        if (response.data && Array.isArray(response.data)) {
          const cantidadesArray = response.data.map((item: { cantidad: number }) => item.cantidad).sort((a: number, b: number) => a - b);
          setInsumosSeleccionados(prev => prev.map(item => 
            item.producto.clave_prod === producto.clave_prod 
              ? { ...item, cantidades: cantidadesArray, loadingCantidades: false }
              : item
          ));
        } else {
          setInsumosSeleccionados(prev => prev.map(item => 
            item.producto.clave_prod === producto.clave_prod 
              ? { ...item, cantidades: [], loadingCantidades: false }
              : item
          ));
        }
      })
      .catch((error) => {
        console.error('Error al obtener cantidades:', error);
        setInsumosSeleccionados(prev => prev.map(item => 
          item.producto.clave_prod === producto.clave_prod 
            ? { ...item, cantidades: [], loadingCantidades: false }
            : item
        ));
      });
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
      if (detalleSeleccionadoInsumos) {
        // Botón + Ins. en tabla - usar sp_fw_pos_agregar_insumos_venta
        await consumoApi.post(
          `/api/PuntoDeVenta/sp_fw_pos_agregar_insumos_venta?cia=${cia}&sucursal=${sucursal}&no_venta=0&cve_cliente=${clienteSeleccionado?.No_cliente || ''}&clave_producto_venta=${productoPrincipal.clave_prod}&estilista=${estilistaSeleccionado}`,
          {
            insumos: insumosSeleccionados.map(i => ({
              clave_prod: i.producto.clave_prod,
              cantidad: i.cantidad
            }))
          }
        );
        fetchDetalleVenta(clienteSeleccionado.No_cliente, estilistaSeleccionado);
      } else {
        // Botón registrar con producto controlado - usar sp_fw_pos_guardar_venta con insumos en payload
        const insumosPayload = insumosSeleccionados.map(i => ({
          clave_prod: i.producto.clave_prod,
          cantidad: i.cantidad
        }));
        registrarProducto(productoPrincipal, insumosPayload);
      }
      
      setModalInsumosOpen(false);
      setInsumosSeleccionados([]);
      setProductoPrincipal(null);
      setDetalleSeleccionadoInsumos(null);
    } catch (error: any) {
      const msg = error.response?.data?.mensaje || 'Error al agregar insumos';
      Swal.fire('Error', msg, 'error');
    }
  };

  const renderModal = (isOpen: boolean, onClose: () => void, title: string, body: React.ReactNode, footer?: React.ReactNode) => {
    if (!isOpen) return null;
    return (
      <div className="pos-modal-overlay" onClick={onClose}>
        <div className="pos-modal pos-modal-lg" onClick={e => e.stopPropagation()}>
          <div className="pos-modal-header">
            <h3 className="pos-modal-title">{title}</h3>
            <button className="pos-modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="pos-modal-body">{body}</div>
          {footer && <div className="pos-modal-footer">{footer}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="pos-v3-container">
      <div className="pos-main-container">
        {/* Header Fijo */}
        <div className="pos-header-section">
          <div className="pos-header-title">Punto de Venta</div>
          {/* Sección de Cliente */}
          <div className="pos-client-row">
            <input
              type="text"
              className="pos-client-input"
              readOnly
              value={clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.ap_paterno || ''} ${clienteSeleccionado.ap_materno || ''}`.trim() : ""}
              placeholder="Seleccionar cliente"
            />
            <button className="pos-btn pos-btn-primary" onClick={() => { setSearchText(""); setSearch(""); setPage(0); setModalClienteOpen(true); }}>
              Seleccionar
            </button>
            <button className="pos-btn pos-btn-outline-primary" onClick={handleOpenHistorial} disabled={!clienteSeleccionado}>
              <History />
            </button>
          </div>

          {/* Sección Estilista/Producto */}
          <div className="pos-product-section">
            <select className="pos-select" value={estilistaSeleccionado} onChange={(e) => setEstilistaSeleccionado(e.target.value)}>
              <option value="">Selecciona estilista</option>
              {estilistas.map((est) => (
                <option key={est.clave_empleado} value={est.clave_empleado}>{est.nombre}</option>
              ))}
            </select>

            <select className="pos-select" value={auxiliarSeleccionado} onChange={(e) => setAuxiliarSeleccionado(e.target.value)}>
              <option value="">Selecciona auxiliar</option>
              {estilistaAuxiliar?.map((est) => (
                <option key={est.clave_empleado} value={est.clave_empleado}>{est.nombre}</option>
              ))}
            </select>

            <div className="pos-product-row">
              <input
                type="text"
                className="pos-form-control"
                readOnly
                value={productoSeleccionado ? productoSeleccionado.descripcion : ""}
                placeholder="Seleccionar producto"
              />
              <button className="pos-btn pos-btn-info" onClick={() => { setPageProductos(0); setSearchProductos(""); setModalProductoOpen(true); }}>
                prod
              </button>
              <button className="pos-btn pos-btn-success" onClick={handleRegistrar}>registrar</button>
            </div>
          </div>
        </div>

        {/* Tabla de Detalles - Full Width */}
        <div className="pos-table-wrapper">
          {detallesVenta.length > 0 ? (
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Estilista</th>
                  <th>Producto</th>
                  <th>Cant</th>
                  <th>Precio</th>
                  <th>Importe</th>
                  <th>Insumos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {detallesVenta.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <tr>
                      <td>{item.hora}</td>
                      <td>
                        <div style={{ fontSize: '12px' }}>{item.d_estilista}</div>
                        {item.d_auxiliar && <div className="pos-text-muted" style={{ fontSize: '11px' }}>Aux: {item.d_auxiliar}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.d_producto}</div>
                        <div className="pos-text-muted" style={{ fontSize: '11px' }}>{item.clave_prod}</div>
                      </td>
                      <td className="text-center">{item.Cant}</td>
                      <td className="text-right">${item.precio.toFixed(2)}</td>
                      <td className="text-right" style={{ fontWeight: 600 }}>${item.importe.toFixed(2)}</td>
                      <td className="text-center">
                        {item.insumos && item.insumos.length > 0 && (
                          <button 
                            className="pos-btn-ver-insumos" 
                            style={{ fontSize: '10px', padding: '4px 8px' }}
                            onClick={() => toggleExpandedRow(item.id)}
                          >
                            {item.insumos.length} ins. {expandedRows.includes(item.id) ? '▲' : '▼'}
                          </button>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="pos-d-flex gap-1 justify-center">
                          <button 
                            className="pos-btn pos-btn-info pos-btn-sm" 
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => handleAbrirAgregarInsumos(item)}
                          >
                            + Ins.
                          </button>
                          <button 
                            className="pos-btn pos-btn-danger pos-btn-sm" 
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => handleCancelarRenglon(item)}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows.includes(item.id) && item.insumos && item.insumos.length > 0 && (
                      <tr className="pos-insumos-row">
                        <td colSpan={8} style={{ padding: '8px 16px', background: '#f8f9fa' }}>
                          <div style={{ fontWeight: 600, marginBottom: '8px' }}>Insumos:</div>
                          <table className="pos-table" style={{ fontSize: '12px' }}>
                            <thead>
                              <tr>
                                <th>Clave</th>
                                <th>Producto</th>
                                <th>Cant</th>
                                <th>Precio</th>
                                <th>Importe</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.insumos.map((insumo, iIdx) => (
                                <tr key={iIdx}>
                                  <td>{insumo.clave_prod}</td>
                                  <td>{insumo.d_producto}</td>
                                  <td className="text-center">{insumo.Cant}</td>
                                  <td className="text-right">${insumo.precio.toFixed(2)}</td>
                                  <td className="text-right">${insumo.importe.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="pos-text-center pos-p-4 pos-text-muted">
              No hay productos registrados en la venta
            </div>
          )}
        </div>

        {/* Totales y Botones */}
        <div className="pos-footer-section">
          <div className="pos-btn-group">
            <button className="pos-btn pos-btn-secondary" onClick={handleAbrirCobro}>Cobrar</button>
            <button className="pos-btn pos-btn-secondary" onClick={() => { fetchVentasEnProceso(); setModalVentasEnProcesoOpen(true); }}>En proceso</button>
            <button className="pos-btn pos-btn-secondary">Cambiar cliente</button>
          </div>
          <div className="pos-total-display">
            <span className="pos-total-label">Total:</span>${totalVenta.toFixed(2)}
          </div>
        </div>

        {/* Modal Seleccionar Cliente */}
        {renderModal(
          modalClienteOpen,
          () => setModalClienteOpen(false),
          "Seleccionar Cliente",
          <>
            <div className="pos-search-wrapper">
              <span className="pos-search-icon">🔍</span>
              <input
                type="text"
                className="pos-search-input"
                placeholder="Buscar cliente por nombre o número..."
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setSearch(e.target.value); setPage(0); }}
              />
            </div>
            {clients.length > 0 ? (
              <div className="pos-search-results">
                {clients.map((cliente) => (
                  <div 
                    key={cliente.No_cliente} 
                    className="pos-search-item"
                    onClick={() => { setClienteSeleccionado(cliente); setModalClienteOpen(false); }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <strong>{cliente.No_cliente}</strong> - {cliente.nombre} {cliente.ap_paterno || ''} {cliente.ap_materno || ''}
                    </div>
                    <span className="pos-btn-ver-insumos">Seleccionar</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pos-text-muted text-center p-3">No se encontraron clientes</p>
            )}
            <div className="pos-d-flex pos-justify-between pos-align-center pos-mt-2">
              <button 
                className="pos-btn pos-btn-secondary pos-btn-sm" 
                onClick={() => setPage(Math.max(0, page - 1))} 
                disabled={page === 0}
              >
                ← Anterior
              </button>
              <span className="pos-text-muted">Página {page + 1}</span>
              <button 
                className="pos-btn pos-btn-secondary pos-btn-sm" 
                onClick={() => setPage(page + 1)} 
                disabled={clients.length < pageSize}
              >
                Siguiente →
              </button>
            </div>
          </>
        )}

        {/* Modal Historial */}
        {renderModal(
          modalHistorialOpen,
          () => setModalHistorialOpen(false),
          `Historial de Compras - ${clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.ap_paterno || ''}` : ''}`,
          <>
            <button className="pos-btn-ver-insumos" onClick={() => handleOpenHistorialInsumos()}>📋 Ver Insumos</button>
            {historialLoading ? (
              <div className="pos-loading-overlay"><div className="pos-spinner" /></div>
            ) : (
              historialData.length === 0 ? <p className="pos-text-muted">No hay historial</p> : (
                <>
                    <table className="pos-modal-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Cant</th>
                        <th>Precio</th>
                        <th>Estilista</th>
                        <th>Insumos</th>
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
                          <td>
                            <button 
                              className="pos-btn-ver-insumos" 
                              onClick={() => {
                                handleOpenHistorialInsumos(item.no_venta, item.clave_prod, item.cve_sucursal);
                              }}
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                    <div className="pos-d-flex pos-justify-between pos-align-center pos-mt-2">
                      <button 
                        className="pos-btn pos-btn-secondary pos-btn-sm" 
                        onClick={handlePrevPageHistorial} 
                        disabled={historialLoading || historialPage <= 1}
                      >
                        ← Anterior
                      </button>
                      <span className="pos-text-muted">Página {historialPage}</span>
                      <button 
                        className="pos-btn pos-btn-secondary pos-btn-sm" 
                        onClick={handleNextPageHistorial} 
                        disabled={historialLoading || !hasMoreHistorial}
                      >
                        Siguiente →
                      </button>
                    </div>
                </>
              )
            )}
          </>
        )}

        {/* Modal Historial Insumos */}
        {renderModal(
          modalHistorialInsumosOpen,
          () => setModalHistorialInsumosOpen(false),
          "Historial de Insumos",
          historialInsumosLoading ? (
            <div className="pos-loading-overlay"><div className="pos-spinner" /></div>
          ) : (
            historialInsumosData.length === 0 ? <p className="pos-text-muted">No hay historial de insumos</p> : (
              <>
                <table className="pos-modal-table">
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
                </table>
                <div className="pos-d-flex pos-justify-between pos-align-center pos-mt-2">
                  <button 
                    className="pos-btn pos-btn-secondary pos-btn-sm" 
                    onClick={handlePrevPageHistorialInsumos} 
                    disabled={historialInsumosLoading || historialInsumosPage <= 1}
                  >
                    ← Anterior
                  </button>
                  <span className="pos-text-muted">Página {historialInsumosPage}</span>
                  <button 
                    className="pos-btn pos-btn-secondary pos-btn-sm" 
                    onClick={handleNextPageHistorialInsumos} 
                    disabled={historialInsumosLoading || !hasMoreHistorialInsumos}
                  >
                    Siguiente →
                  </button>
                </div>
              </>
            )
          )
        )}

        {/* Modal Agregar Insumos a Venta */}
        {renderModal(
          modalAgregarInsumosOpen,
          () => setModalAgregarInsumosOpen(false),
          `Agregar Insumos - ${detalleSeleccionadoInsumos?.d_producto}`,
          <>
            <div className="pos-form-group">
              <input
                type="text"
                className="pos-form-control"
                placeholder="Buscar insumo"
                value={busquedaInsumo}
                onChange={(e) => { setBusquedaInsumo(e.target.value); buscarInsumos(e.target.value); }}
              />
            </div>
            {loadingBusquedaInsumo && <div className="pos-loading-overlay"><div className="pos-spinner" /></div>}
            {resultadosInsumos.length > 0 && (
              <div className="pos-search-results">
                {resultadosInsumos.map((producto) => (
                  <div key={producto.clave_prod} className="pos-search-item">
                    <span>{producto.clave_prod} - {producto.descripcion}</span>
                    <button className="pos-btn pos-btn-outline-primary pos-btn-sm" onClick={() => agregarInsumoALista(producto)}>Agregar</button>
                  </div>
                ))}
              </div>
            )}
            <h6>Insumos a agregar:</h6>
            {insumosAgregar.length === 0 ? (
              <p className="pos-text-muted">No hay insumos en la lista</p>
            ) : (
              <div className="pos-insumo-list">
                {insumosAgregar.map((insumo) => (
                  <div key={insumo.clave_prod} className="pos-insumo-item">
                    <span>{insumo.clave_prod}</span>
                    <span>{insumo.d_producto}</span>
                    <input
                      type="number"
                      className="pos-form-control"
                      value={insumo.cantidad}
                      onChange={(e) => actualizarCantidadInsumo(insumo.clave_prod, parseFloat(e.target.value) || 0)}
                      min="0.01"
                      step="0.01"
                    />
                    <button className="pos-btn pos-btn-danger pos-btn-sm" onClick={() => quitarInsumoDeLista(insumo.clave_prod)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </>,
          <>
            <button className="pos-btn pos-btn-primary" onClick={guardarInsumosVenta} disabled={insumosAgregar.length === 0}>Confirmar</button>
            <button className="pos-btn pos-btn-secondary" onClick={() => setModalAgregarInsumosOpen(false)}>Cancelar</button>
          </>
        )}

        {/* Modal Productos */}
        {renderModal(
          modalProductoOpen,
          () => setModalProductoOpen(false),
          "Buscar Producto",
          <>
            <div className="pos-search-wrapper">
              <span className="pos-search-icon">🔍</span>
              <input
                type="text"
                className="pos-search-input"
                placeholder="Buscar producto por código o descripción..."
                onChange={(e) => { setSearchProductos(e.target.value); setPageProductos(0); }}
              />
            </div>
            {productos.length > 0 ? (
              <div className="pos-search-results">
                {productos.map((producto) => (
                  <div 
                    key={producto.clave_prod} 
                    className="pos-search-item"
                    onClick={() => { setProductoSeleccionado(producto); setModalProductoOpen(false); }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <strong>{producto.clave_prod}</strong> - {producto.descripcion}
                      <div className="pos-text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                        ${producto.Precio?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <span className="pos-btn-ver-insumos">Seleccionar</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pos-text-muted text-center p-3">No se encontraron productos</p>
            )}
            <div className="pos-d-flex pos-justify-between pos-align-center pos-mt-2">
              <button 
                className="pos-btn pos-btn-secondary pos-btn-sm" 
                onClick={() => setPageProductos(Math.max(0, pageProductos - 1))} 
                disabled={pageProductos === 0}
              >
                ← Anterior
              </button>
              <span className="pos-text-muted">Página {pageProductos + 1}</span>
              <button 
                className="pos-btn pos-btn-secondary pos-btn-sm" 
                onClick={() => setPageProductos(pageProductos + 1)} 
                disabled={productos.length < pageSizeProductos}
              >
                Siguiente →
              </button>
            </div>
          </>
        )}

        {/* Modal Insumos para nuevos productos */}
        {renderModal(
          modalInsumosOpen,
          () => setModalInsumosOpen(false),
          `Agregar Insumos - ${productoPrincipal?.descripcion}`,
          <>
            <div className="pos-form-group">
              <input
                type="text"
                className="pos-form-control"
                placeholder="Buscar insumo"
                value={busquedaInsumo}
                onChange={(e) => { setBusquedaInsumo(e.target.value); buscarInsumosModal(e.target.value); }}
              />
            </div>
            {loadingBusquedaInsumo && <div className="pos-loading-overlay"><div className="pos-spinner" /></div>}
            {resultadosInsumos.length > 0 && (
              <>
                <div className="pos-search-results">
                  {resultadosInsumos.map((producto) => (
                    <div key={producto.clave_prod} className="pos-search-item">
                      <span>{producto.clave_prod} - {producto.descripcion}</span>
                      <button className="pos-btn pos-btn-outline-primary pos-btn-sm" onClick={() => handleSelectInsumo(producto)}>Agregar</button>
                    </div>
                  ))}
                </div>
                <div className="pos-d-flex pos-justify-between pos-align-center pos-mt-2">
                  <button 
                    className="pos-btn pos-btn-secondary pos-btn-sm" 
                    disabled={insumosPage <= 1 || loadingBusquedaInsumo}
                    onClick={() => buscarInsumosModal(busquedaInsumo, insumosPage - 1)}
                  >
                    Anterior
                  </button>
                  <span className="pos-text-muted">Página {insumosPage}</span>
                  <button 
                    className="pos-btn pos-btn-secondary pos-btn-sm" 
                    disabled={resultadosInsumos.length < 20 || loadingBusquedaInsumo}
                    onClick={() => buscarInsumosModal(busquedaInsumo, insumosPage + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
            <h6>Insumos a agregar:</h6>
            {insumosSeleccionados.length === 0 ? (
              <p className="pos-text-muted">No hay insumos en la lista</p>
            ) : (
              <div className="pos-insumo-list">
                {insumosSeleccionados.map((insumo) => (
                  <div key={insumo.producto.clave_prod} className="pos-insumo-item">
                    <span>{insumo.producto.clave_prod}</span>
                    <span>{insumo.producto.descripcion}</span>
                    {insumo.loadingCantidades ? (
                      <span>Cargando...</span>
                    ) : insumo.cantidades.length > 0 ? (
                      <select
                        className="pos-form-control"
                        value={insumo.cantidad}
                        onChange={(e) => handleQuantityChange(insumo.producto.clave_prod, parseFloat(e.target.value))}
                      >
                        {insumo.cantidades.map((cant: number) => (
                          <option key={cant} value={cant}>{cant}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        className="pos-form-control"
                        value={insumo.cantidad}
                        onChange={(e) => handleQuantityChange(insumo.producto.clave_prod, parseFloat(e.target.value) || 0)}
                        min="0.01"
                        step="0.01"
                      />
                    )}
                    <button className="pos-btn pos-btn-danger pos-btn-sm" onClick={() => handleRemoveInsumo(insumo.producto.clave_prod)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </>,
          <>
            <button className="pos-btn pos-btn-primary" onClick={handleConfirmarInsumos} disabled={insumosSeleccionados.length === 0}>
              Confirmar Insumos ({insumosSeleccionados.length})
            </button>
            <button className="pos-btn pos-btn-secondary" onClick={() => { setModalInsumosOpen(false); setInsumosSeleccionados([]); setProductoPrincipal(null); }}>Cancelar</button>
          </>
        )}

        {/* Modal Ventas en Proceso */}
        {renderModal(
          modalVentasEnProcesoOpen,
          () => setModalVentasEnProcesoOpen(false),
          "Ventas en Proceso",
          loadingVentasEnProceso ? (
            <div className="pos-loading-overlay"><div className="pos-spinner" /></div>
          ) : (
            ventasEnProceso.length === 0 ? <p className="pos-text-muted">No hay ventas en proceso</p> : (
              <table className="pos-modal-table">
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
                        <button className="pos-btn pos-btn-primary pos-btn-sm" onClick={() => fetchDetalleVenta(venta.cve_cliente, venta.user)}>
                          Cargar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )
        )}

        {/* Modal Cobro */}
        {renderModal(
          modalCobroOpen,
          () => setModalCobroOpen(false),
          `Cobrar Venta - Total: $${totalVenta.toFixed(2)}`,
          <>
            <div className="pos-d-flex pos-mb-2" style={{ gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="pos-form-label">Forma de Pago</label>
                <select className="pos-select" value={formaPagoSeleccionada} onChange={(e) => setFormaPagoSeleccionada(e.target.value as any)}>
                  <option value="">Selecciona...</option>
                  {formasPago.map((fp) => (
                    <option key={fp.tipo} value={fp.tipo}>{fp.descripcion}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label className="pos-form-label">Importe</label>
                <input type="number" className="pos-form-control" value={importePagado} onChange={(e) => setImportePagado(e.target.value)} min="0" step="0.01" />
              </div>
              <div style={{ alignSelf: 'flex-end' }}>
                <button className="pos-btn pos-btn-primary" onClick={agregarPago}>Agregar</button>
              </div>
            </div>

            <h6>Pagos registrados:</h6>
            {pagosRegistro.length === 0 ? (
              <p className="pos-text-muted">No hay pagos registrados</p>
            ) : (
              <div className="pos-payment-list">
                {pagosRegistro.map((pago, idx) => (
                  <div key={idx} className="pos-payment-item">
                    <div className="pos-payment-info">
                      <span>{pago.descripcion}</span>
                      <span>${pago.importe.toFixed(2)}</span>
                    </div>
                    <button className="pos-btn pos-btn-danger pos-btn-sm" onClick={() => quitarPago(idx)}>✕</button>
                  </div>
                ))}
                <div className="pos-payment-total pos-d-flex pos-justify-between">
                  <span><strong>Total Pagado:</strong></span>
                  <span><strong>${totalPagado.toFixed(2)}</strong></span>
                </div>
              </div>
            )}

            {totalPagado < totalVenta && (
              <div className="pos-alert pos-alert-warning">Faltan ${(totalVenta - totalPagado).toFixed(2)} para cubrir la venta</div>
            )}
            {totalPagado > totalVenta && cambio > 0 && (
              <div className="pos-alert pos-alert-success">Cambio: ${cambio.toFixed(2)}</div>
            )}
          </>,
          <>
            <button className="pos-btn pos-btn-success" onClick={finalizarVenta} disabled={!puedeFinalizar || finalizandoVenta}>
              {finalizandoVenta ? "Finalizando..." : "Finalizar Venta"}
            </button>
            <button className="pos-btn pos-btn-secondary" onClick={() => setModalCobroOpen(false)}>Cancelar</button>
          </>
        )}
      </div>
    </div>
  );
};

export default POS_v3;