import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  AddShoppingCart,
  Cancel,
  CheckCircle,
  ExitToApp,
  Replay,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import Swal from 'sweetalert2';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { useAuth } from '../../../context/AuthContext';
import { routes } from '../../../utils/Routes';

interface AreaOption {
  area: string;
  descripcion: string;
}

interface MarcaOption {
  id: string;
  marca: string;
}

interface FamiliaOption {
  id: string;
  familia: string;
}

interface ProveedorOption {
  id: string;
  nombre: string;
}

interface ModeloOption {
  id: string;
  modelo: string;
}

interface BusquedaRow {
  id: string;
  idPedido: number;
  fecha_pedido: string;
  cantidad_productos: number;
  clave_proveedor: string;
  proveedor: string;
  estado: string;
}

type PedidoRow = {
  id: string;
  [key: string]: unknown;
};

const obtenerFechaActual = () => {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const formatearFechaCorta = (value: unknown) => {
  const fecha = new Date(String(value ?? ''));
  return Number.isNaN(fecha.getTime())
    ? String(value ?? '')
    : fecha.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
};

const columnasFijas = [
  'clave_prod',
  'clave_prod_ruta',
  'descripcion',
  'marca',
  'd_area',
  'd_familia',
];

const columnasPedido = [
  'finalizado', 'cancelado',
  'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e203', 'e204',
  't1', 't2', 't3', 't4', 't5', 't6', 't203', 't204',
  'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v203', 'v204',
  'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd203', 'd204',
  'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p203', 'p204',
  's1', 's2', 's3', 's4', 's5', 's6', 's7', 's203', 's204',
  'unidad_paq',
  'pReal_1', 'pReal_2', 'pReal_3', 'pReal_4', 'pReal_5', 'pReal_6', 'pReal_203', 'pReal_204',
  'costo_unitario',
  'pReal2_1', 'pReal2_2', 'pReal2_3', 'pReal2_4', 'pReal2_5', 'pReal2_6', 'pReal2_203',
  'difPreal_1', 'difPreal_2', 'difPreal_3', 'difPreal_4', 'difPreal_5', 'difPreal_6', 'difPreal_203',
  'pRealFinal1', 'pRealFinal2', 'pRealFinal3', 'pRealFinal4', 'pRealFinal5', 'pRealFinal6', 'pRealFinal203', 'pRealFinal204',
  'pRealFinalRedondeado_204',
  'costo1', 'costo2', 'costo3', 'costo4', 'costo5', 'costo6', 'costo203', 'costo204',
  'diasVenta', 'diasSoporteStock',
  'bonifi_1', 'bonifi_2', 'bonifi_3', 'bonifi_4', 'bonifi_5', 'bonifi_6', 'bonifi_203', 'bonifi_204',
  'diaEfectivo',
];

const columnasEditables = new Set([
  'pRealFinal1', 'pRealFinal2', 'pRealFinal3', 'pRealFinal4', 'pRealFinal5', 'pRealFinal6',
  'pRealFinal203', 'pRealFinal204', 'pRealFinalRedondeado_204',
  'bonifi_1', 'bonifi_2', 'bonifi_3', 'bonifi_4', 'bonifi_5', 'bonifi_6', 'bonifi_203', 'bonifi_204',
]);

const formatoDecimal = (value: unknown) => {
  const numero = Number(value);
  const numeroNormalizado = Object.is(numero, -0) ? 0 : numero;
  return Number.isFinite(numeroNormalizado)
    ? numeroNormalizado.toLocaleString('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : '';
};

const normalizarCamposEditables = (item: any): Record<string, number> => ({
  pRealFinal1: Number(item.pRealFinal1 ?? item.pRealFinal_1 ?? 0),
  pRealFinal2: Number(item.pRealFinal2 ?? item.pRealFinal_2 ?? 0),
  pRealFinal3: Number(item.pRealFinal3 ?? item.pRealFinal_3 ?? 0),
  pRealFinal4: Number(item.pRealFinal4 ?? item.pRealFinal_4 ?? 0),
  pRealFinal5: Number(item.pRealFinal5 ?? item.pRealFinal_5 ?? 0),
  pRealFinal6: Number(item.pRealFinal6 ?? item.pRealFinal_6 ?? 0),
  pRealFinal203: Number(item.pRealFinal203 ?? item.pRealFinal_203 ?? 0),
  pRealFinal204: Number(item.pRealFinal204 ?? item.pRealFinal_204 ?? 0),
  pRealFinalRedondeado_204: Number(item.pRealFinalRedondeado_204 ?? 0),
  bonifi_1: Number(item.bonifi_1 ?? item.bonificaciones_1 ?? 0),
  bonifi_2: Number(item.bonifi_2 ?? item.bonificaciones_2 ?? 0),
  bonifi_3: Number(item.bonifi_3 ?? item.bonificaciones_3 ?? 0),
  bonifi_4: Number(item.bonifi_4 ?? item.bonificaciones_4 ?? 0),
  bonifi_5: Number(item.bonifi_5 ?? item.bonificaciones_5 ?? 0),
  bonifi_6: Number(item.bonifi_6 ?? item.bonificaciones_6 ?? 0),
  bonifi_203: Number(item.bonifi_203 ?? item.bonificaciones_203 ?? 0),
  bonifi_204: Number(item.bonifi_204 ?? item.bonificaciones_204 ?? 0),
});

const columnas: GridColDef<PedidoRow>[] = [
  ...columnasFijas.map((field, index) => ({
    field,
    headerName: field,
    width: [120, 140, 220, 100, 90, 100][index],
  })),
  ...columnasPedido.map((field) => ({
    field,
    headerName: field,
    width: 105,
    type: 'number' as const,
    editable: columnasEditables.has(field),
    renderCell: (params: { value: unknown }) => formatoDecimal(params.value),
  })),
];

const columnasBusqueda: GridColDef<BusquedaRow>[] = [
  { field: 'idPedido', headerName: 'Folio', width: 60, type: 'number' },
  { field: 'fecha_pedido', headerName: 'Fecha', width: 140 },
  { field: 'clave_proveedor', headerName: 'Clave proveedor', width: 115 },
  { field: 'proveedor', headerName: 'Proveedor', width: 200 },
  { field: 'cantidad_productos', headerName: 'Productos', width: 100, type: 'number', align: 'center', headerAlign: 'center' },
  { field: 'estado', headerName: 'Estado', width: 120 },
];

export default function PedidosProveedoresPage() {
  const navigate = useNavigate();
  const { consumoApi } = useConsumoApi();
  const { token } = useAuth();
  const usuarioSesion =
    token?.usuario ||
    (typeof window !== 'undefined' ? localStorage.getItem('usuario') || '' : '') ||
    'ADMIN';

  const [area, setArea] = useState('');
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [cargandoAreas, setCargandoAreas] = useState(false);
  const [marca, setMarca] = useState('');
  const [marcas, setMarcas] = useState<MarcaOption[]>([]);
  const [cargandoMarcas, setCargandoMarcas] = useState(false);
  const [familia, setFamilia] = useState('');
  const [familias, setFamilias] = useState<FamiliaOption[]>([]);
  const [cargandoFamilias, setCargandoFamilias] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [productos, setProductos] = useState<{ clave_prod: string; descripcion: string }[]>([]);
  const timeoutBusquedaProductos = useRef<NodeJS.Timeout | null>(null);

  const buscarProductos = (texto: string) => {
    if (timeoutBusquedaProductos.current) clearTimeout(timeoutBusquedaProductos.current);
    timeoutBusquedaProductos.current = setTimeout(async () => {
      try {
        const res = await consumoApi.get('/api/CatProductos/sp_bw_cat_productos_sel', {
          params: {
            busqueda: texto,
            pagina: 1,
            tamanoPagina: 50,
          },
        });
        const data = Array.isArray(res.data) ? res.data : [];
        setProductos([
          { clave_prod: 'TODOS', descripcion: 'Todos los productos' },
          ...data.map((item: any) => ({
            clave_prod: String(item.clave_prod ?? ''),
            descripcion: String(item.descripcion ?? ''),
          })),
        ]);
      } catch (error) {
        console.error('Error buscando productos:', error);
      }
    }, 300);
  };
  const [diasVenta, setDiasVenta] = useState('30');
  const [diasInventario, setDiasInventario] = useState('30');
  const [modelo, setModelo] = useState('');
  const [modelos, setModelos] = useState<ModeloOption[]>([]);
  const [cargandoModelos, setCargandoModelos] = useState(false);
  const [proveedor, setProveedor] = useState('');
  const [proveedores, setProveedores] = useState<ProveedorOption[]>([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);
  const [folio, setFolio] = useState(0);
  const [rows, setRows] = useState<PedidoRow[]>([]);
  const [cargandoGrid, setCargandoGrid] = useState(false);

  const [dialogoBusquedaAbierto, setDialogoBusquedaAbierto] = useState(false);
  const [buscarIdPedido, setBuscarIdPedido] = useState('');
  const [buscarFechaInicio, setBuscarFechaInicio] = useState('');
  const [buscarFechaFin, setBuscarFechaFin] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<BusquedaRow[]>([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);

  useEffect(() => {
    const cargarAreas = async () => {
      setCargandoAreas(true);
      try {
        const res = await consumoApi.get('/api/CatAreas/sp_bw_cat_areas_sel', {
          params: { area: '0' },
        });
        const data = Array.isArray(res.data) ? res.data : [];
        setAreas(
          data.map((item: any) => ({
            area: String(item.area ?? ''),
            descripcion: String(item.descripcion ?? ''),
          }))
        );
      } catch (error) {
        console.error('Error cargando áreas:', error);
      } finally {
        setCargandoAreas(false);
      }
    };

    cargarAreas();

    const cargarMarcas = async () => {
      setCargandoMarcas(true);
      try {
        const res = await consumoApi.get('/api/CatMarcas/sp_bw_cat_marcas_sel', {
          params: { id: 0 },
        });
        const data = Array.isArray(res.data) ? res.data : [];
        setMarcas(
          data.map((item: any) => ({
            id: String(item.id ?? ''),
            marca: String(item.marca ?? ''),
          }))
        );
      } catch (error) {
        console.error('Error cargando marcas:', error);
      } finally {
        setCargandoMarcas(false);
      }
    };

    cargarMarcas();

    const cargarFamilias = async () => {
      setCargandoFamilias(true);
      try {
        const res = await consumoApi.get('/api/CatMarcasFamilias/sp_bw_cat_marcasfamilias_sel');
        const data = Array.isArray(res.data) ? res.data : [];
        setFamilias(
          data.map((item: any) => ({
            id: String(item.id_familia ?? item.id ?? ''),
            familia: String(item.familia ?? ''),
          }))
        );
      } catch (error) {
        console.error('Error cargando familias:', error);
      } finally {
        setCargandoFamilias(false);
      }
    };

    cargarFamilias();

    const cargarModelos = async () => {
      setCargandoModelos(true);
      try {
        const res = await consumoApi.get('/api/CatModelos/sp_cat_modelos_Sel');
        const data = Array.isArray(res.data) ? res.data : [];
        setModelos(
          data.map((item: any) => ({
            id: String(item.id ?? ''),
            modelo: String(item.modelo ?? ''),
          }))
        );
      } catch (error) {
        console.error('Error cargando modelos:', error);
      } finally {
        setCargandoModelos(false);
      }
    };

    cargarModelos();

    const cargarProveedores = async () => {
      setCargandoProveedores(true);
      try {
        const res = await consumoApi.get('/api/CatProveedores/sp_bw_cat_proveedores_sel', {
          params: { page: 1, pageSize: 100 },
        });
        const data = Array.isArray(res.data) ? res.data : [];
        setProveedores(
          data.map((item: any) => ({
            id: String(item.id ?? ''),
            nombre: String(item.nombre ?? ''),
          }))
        );
      } catch (error) {
        console.error('Error cargando proveedores:', error);
      } finally {
        setCargandoProveedores(false);
      }
    };

    cargarProveedores();
  }, []);

  const handleGenerarPedido = async () => {
    if (!proveedor) {
      Swal.fire('Proveedor requerido', 'Selecciona un proveedor para generar el pedido.', 'warning');
      return;
    }

    setCargandoGrid(true);
    try {
      const marcaTexto = marcas.find((m) => m.id === marca)?.marca ?? '';
      const familiaTexto = familias.find((f) => f.id === familia)?.familia ?? '%';

      const res = await consumoApi.post('/api/PedidosProveedores/sp_generar_pedido', {
        area,
        marca: marcaTexto,
        familia: familiaTexto,
        descripcion: descripcion ? `%${descripcion}%` : '%',
        diasVenta: parseInt(diasVenta || '0', 10),
        diasSoporteStock: parseInt(diasInventario || '0', 10),
        almacenar: true,
        modelo: parseInt(modelo || '0', 10),
        proveedor,
      }, {
        timeout: 180000,
      });

      const data = Array.isArray(res.data) ? res.data : [];
      const folioGenerado = Number(data[0]?.folio ?? data[0]?.idPedido ?? 0);

      if (folioGenerado <= 0) {
        setRows([]);
        setFolio(0);
        Swal.fire(
          'Sin productos',
          'No se encontraron productos que correspondan con el área, marca, familia, descripción y proveedor seleccionados.',
          'warning',
        );
        return;
      }

      setFolio(folioGenerado);
      const detalle = await cargarDetallePedido(folioGenerado);

      if (detalle.length === 0) {
        setFolio(0);
        setRows([]);
        Swal.fire(
          'Sin productos',
          'No se encontraron productos que correspondan con los filtros seleccionados. No se guardó ningún pedido.',
          'warning',
        );
        return;
      }

      Swal.fire(
        'Pedido generado',
        `Se generó el folio ${folioGenerado} con ${detalle.length} productos.`,
        'success',
      );
    } catch (error: any) {
      const resultadoNoConfirmado =
        error?.code === 'ECONNABORTED' ||
        error?.code === 'ERR_NETWORK' ||
        !error?.response;

      if (resultadoNoConfirmado) {
        Swal.fire({
          title: 'Resultado no confirmado',
          text: 'Se perdió la conexión o se agotó el tiempo de espera. El pedido podría haberse generado. Revísalo en Buscar Pedido antes de volver a intentarlo para evitar duplicados.',
          icon: 'warning',
          confirmButtonText: 'Entendido',
        });
      } else {
        const respuesta = error.response.data;
        const mensaje = respuesta?.detalle
          ? `${respuesta?.mensaje || 'No se pudo generar el pedido.'} ${respuesta.detalle}`
          : respuesta?.mensaje || 'No se pudo generar el pedido.';
        Swal.fire('Error', mensaje, 'error');
      }
    } finally {
      setCargandoGrid(false);
    }
  };

  const cargarDetallePedido = async (idPedido: number) => {
    const res = await consumoApi.get('/api/PedidosProveedores/sp_buscar_pedidos_proveedores', {
      params: { idPedido },
    });
    const data = Array.isArray(res.data) ? res.data : [];

    const mappedRows: PedidoRow[] = data.map((item: any, index: number) => ({
      id: String(item.clave_prod ?? index),
      ...item,
      ...normalizarCamposEditables(item),
      clave_prod: String(item.clave_prod ?? ''),
      clave_prod_ruta: String(item.clave_prod_ruta ?? ''),
      descripcion: String(item.descripcion ?? ''),
      marca: String(item.marca ?? ''),
      d_area: String(item.d_area ?? ''),
      d_familia: String(item.d_familia ?? ''),
      f_ini: String(item.f_ini ?? ''),
      finalizado: Number(item.finalizado ?? 0),
      cancelado: Number(item.cancelado ?? item.can ?? 0),
      e1: Number(item.e1 ?? 0),
      e2: Number(item.e2 ?? 0),
      e3: Number(item.e3 ?? 0),
      e4: Number(item.e4 ?? 0),
      e5: Number(item.e5 ?? 0),
      e6: Number(item.e6 ?? 0),
      e203: Number(item.e203 ?? 0),
      e204: Number(item.e204 ?? 0),
      t1: Number(item.t1 ?? 0),
      t2: Number(item.t2 ?? 0),
      t3: Number(item.t3 ?? 0),
      t4: Number(item.t4 ?? 0),
      t5: Number(item.t5 ?? 0),
      t6: Number(item.t6 ?? 0),
      t1203: Number(item.t1203 ?? 0),
      t1204: Number(item.t1204 ?? 0),
      v1: Number(item.v1 ?? 0),
      v2: Number(item.v2 ?? 0),
      v3: Number(item.v3 ?? 0),
      v4: Number(item.v4 ?? 0),
      v5: Number(item.v5 ?? 0),
      v6: Number(item.v6 ?? 0),
    }));

    setRows(mappedRows);
    return mappedRows;
  };

  const handleFinalizarPedido = async () => {
    if (folio <= 0) {
      Swal.fire('Folio requerido', 'No hay un folio de pedido cargado para finalizar.', 'warning');
      return;
    }

    const confirm = await Swal.fire({
      title: 'Finalizar pedido',
      text: `¿Seguro que deseas finalizar el pedido folio ${folio}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'No',
    });

    if (!confirm.isConfirmed) return;

    try {
      await consumoApi.post('/api/PedidosProveedores/sp_finalizarPedidoProveedor', {
        idPedido: folio,
        usuario: usuarioSesion,
      });
      await cargarDetallePedido(folio);
      Swal.fire('Finalizado', `El pedido folio ${folio} fue finalizado.`, 'success');
    } catch (error: any) {
      const mensaje = error?.response?.data?.mensaje || 'No se pudo finalizar el pedido.';
      Swal.fire('Error', mensaje, 'error');
    }
  };

  const handleCancelarPedido = async () => {
    if (folio <= 0) {
      Swal.fire('Folio requerido', 'No hay un folio de pedido cargado para cancelar.', 'warning');
      return;
    }

    if (rows.some((row) => Number(row.cancelado) === 1)) {
      Swal.fire('Pedido cancelado', `El pedido folio ${folio} ya está cancelado.`, 'warning');
      return;
    }

    const confirm = await Swal.fire({
      title: 'Cancelar pedido',
      text: `¿Seguro que deseas cancelar el pedido folio ${folio}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
    });

    if (!confirm.isConfirmed) return;

    try {
      await consumoApi.post('/api/PedidosProveedores/sp_cancelarPedidoProveedor', {
        idPedido: folio,
        usuario: usuarioSesion,
      });
      await cargarDetallePedido(folio);
      Swal.fire('Cancelado', `El pedido folio ${folio} fue cancelado.`, 'success');
    } catch (error: any) {
      const mensaje = error?.response?.data?.mensaje || 'No se pudo cancelar el pedido.';
      Swal.fire('Error', mensaje, 'error');
    }
  };



  const handleActivarPedido = async () => {
    if (folio <= 0) {
      Swal.fire('Folio requerido', 'No hay un pedido cargado para activar.', 'warning');
      return;
    }

    const confirmacion = await Swal.fire({
      title: 'Activar pedido',
      text: `¿Deseas activar nuevamente el pedido folio ${folio}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'No',
      confirmButtonColor: '#000000',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await consumoApi.post(
        '/api/PedidosProveedores/sp_activar_pedido_proveedores',
        { idPedido: folio, usuario: usuarioSesion },
      );
      await cargarDetallePedido(folio);
      Swal.fire(
        'Pedido activado',
        response.data?.mensaje || `El pedido folio ${folio} fue activado correctamente.`,
        'success',
      );
    } catch (error: any) {
      const mensaje =
        error?.response?.data?.mensaje ||
        'No se pudo activar el pedido.';
      Swal.fire('Error', mensaje, 'error');
    }
  };

  const handleAbrirBusqueda = () => {
    const fechaActual = obtenerFechaActual();
    setBuscarIdPedido('');
    setBuscarFechaInicio(fechaActual);
    setBuscarFechaFin(fechaActual);
    setResultadosBusqueda([]);
    setDialogoBusquedaAbierto(true);
  };

  const handleCerrarBusqueda = () => {
    setDialogoBusquedaAbierto(false);
  };

  const handleBuscarPedidos = async () => {
    const folioTexto = buscarIdPedido.trim();
    const folioBuscado = folioTexto ? Number(folioTexto) : 0;

    if (folioTexto && (!Number.isInteger(folioBuscado) || folioBuscado <= 0)) {
      Swal.fire('Folio inválido', 'Captura un folio mayor que cero.', 'warning');
      return;
    }

    setCargandoBusqueda(true);
    try {
      const params: Record<string, unknown> = {};
      if (folioBuscado > 0) {
        params.idPedido = folioBuscado;
      } else {
        if (buscarFechaInicio) params.fechaInicio = buscarFechaInicio;
        if (buscarFechaFin) params.fechaFin = buscarFechaFin;
      }

      const res = await consumoApi.get('/api/PedidosProveedores/sp_buscar_pedidos_proveedores', {
        params,
      });
      const data = Array.isArray(res.data) ? res.data : [];
      const filasBusqueda =
        folioBuscado > 0 && data.length > 0
          ? [{
              idPedido: folioBuscado,
              fecha_pedido: data[0].fecha_pedido ?? data[0].fecha,
              proveedor: data[0].proveedor ?? '',
              cantidad_productos: data.length,
              estado: data.some((item: any) => Number(item.cancelado) === 1)
                ? 'CANCELADO'
                : data.some((item: any) => Number(item.finalizado) === 1)
                  ? 'FINALIZADO'
                  : 'ACTIVO',
            }]
          : data;
      setResultadosBusqueda(
        filasBusqueda.map((item: any, index: number) => {
          const proveedorId = String(item.proveedor ?? '').trim();
          const proveedorCatalogo = proveedores.find(
            (option) =>
              option.id.trim() === proveedorId ||
              (Number.isFinite(Number(option.id)) &&
                Number.isFinite(Number(proveedorId)) &&
                Number(option.id) === Number(proveedorId)),
          );

          return {
            id: `${item.idPedido ?? index}-${index}`,
            idPedido: Number(item.idPedido ?? 0),
            fecha_pedido: formatearFechaCorta(item.fecha_pedido),
            clave_proveedor: proveedorId,
            proveedor: proveedorCatalogo?.nombre || proveedorId,
            cantidad_productos: Number(item.cantidad_productos ?? 0),
            estado: String(item.estado ?? 'ACTIVO'),
          };
        })
      );
    } catch (error) {
      console.error('Error buscando pedidos:', error);
    } finally {
      setCargandoBusqueda(false);
    }
  };

  const handleSeleccionarPedido = async (row: BusquedaRow) => {
    setCargandoGrid(true);
    try {
      const mappedRows = await cargarDetallePedido(row.idPedido);
      setFolio(row.idPedido);
      setDialogoBusquedaAbierto(false);
      Swal.fire('Pedido cargado', `Se cargó el folio ${row.idPedido} con ${mappedRows.length} renglones.`, 'success');
    } catch (error: any) {
      const mensaje = error?.response?.data?.mensaje || 'No se pudo cargar el detalle del pedido.';
      Swal.fire('Error', mensaje, 'error');
    } finally {
      setCargandoGrid(false);
    }
  };

  const handleSalir = () => {
    navigate(routes.inventario);
  };

  const procesarActualizacionDeRenglon = async (newRow: PedidoRow, oldRow: PedidoRow) => {
    if (folio <= 0) {
      Swal.fire('Pedido no guardado', 'Selecciona un pedido con folio antes de editarlo.', 'warning');
      return oldRow;
    }

    if (Number(oldRow.finalizado ?? 0) === 1) {
      Swal.fire('Pedido finalizado', 'Este pedido solo puede consultarse; no permite editar sus valores.', 'info');
      return oldRow;
    }

    try {
      await consumoApi.put('/api/PedidosProveedores/sp_actualizar_detalle_pedido_proveedor', {
        idPedido: folio,
        clave_prod: String(newRow.clave_prod ?? ''),
        pRealFinal_1: Number(newRow.pRealFinal1 ?? 0),
        pRealFinal_2: Number(newRow.pRealFinal2 ?? 0),
        pRealFinal_3: Number(newRow.pRealFinal3 ?? 0),
        pRealFinal_4: Number(newRow.pRealFinal4 ?? 0),
        pRealFinal_5: Number(newRow.pRealFinal5 ?? 0),
        pRealFinal_6: Number(newRow.pRealFinal6 ?? 0),
        pRealFinal_203: Number(newRow.pRealFinal203 ?? 0),
        pRealFinal_204: Number(newRow.pRealFinal204 ?? 0),
        pRealFinalRedondeado_204: Number(newRow.pRealFinalRedondeado_204 ?? 0),
        bonificaciones_1: Number(newRow.bonifi_1 ?? 0),
        bonificaciones_2: Number(newRow.bonifi_2 ?? 0),
        bonificaciones_3: Number(newRow.bonifi_3 ?? 0),
        bonificaciones_4: Number(newRow.bonifi_4 ?? 0),
        bonificaciones_5: Number(newRow.bonifi_5 ?? 0),
        bonificaciones_6: Number(newRow.bonifi_6 ?? 0),
        bonificaciones_203: Number(newRow.bonifi_203 ?? 0),
        bonificaciones_204: Number(newRow.bonifi_204 ?? 0),
      });
      setRows((currentRows) => currentRows.map((row) => (row.id === newRow.id ? newRow : row)));
      return newRow;
    } catch (error: any) {
      const mensaje = error?.response?.data?.mensaje || 'No se pudo actualizar el detalle del pedido.';
      Swal.fire('Error', mensaje, 'error');
      return oldRow;
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        boxSizing: 'border-box',
        p: { xs: 1, sm: 2 },
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 'bold',
          mb: { xs: 1.5, sm: 2 },
          fontSize: { xs: '1.35rem', sm: '1.5rem' },
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        Pedidos a Proveedores
      </Typography>

      <Paper
        elevation={2}
        sx={{
          width: '100%',
          boxSizing: 'border-box',
          p: { xs: 1, sm: 2 },
          mb: { xs: 1.5, sm: 2 },
          borderRadius: 1,
          border: '1px solid #000000',
        }}
      >
        <Grid container spacing={{ xs: 1, sm: 2 }} alignItems="flex-end">
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <Autocomplete
                  options={areas.map((a) => ({ value: a.area, label: a.descripcion }))}
                  getOptionLabel={(option) => option.label}
                  value={areas.find((a) => a.area === area) ? { value: area, label: areas.find((a) => a.area === area)!.descripcion } : null}
                  onChange={(_, option) => setArea(option?.value ?? '')}
                  isOptionEqualToValue={(opt, val) => opt.value === val.value}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" label="Area" />
                  )}
                  disabled={cargandoGrid || cargandoAreas}
                  clearOnEscape
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <Autocomplete
                  options={marcas.map((m) => ({ value: m.id, label: m.marca }))}
                  getOptionLabel={(option) => option.label}
                  value={marcas.find((m) => m.id === marca) ? { value: marca, label: marcas.find((m) => m.id === marca)!.marca } : null}
                  onChange={(_, option) => setMarca(option?.value ?? '')}
                  isOptionEqualToValue={(opt, val) => opt.value === val.value}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" label="Marca" />
                  )}
                  disabled={cargandoGrid || cargandoMarcas}
                  clearOnEscape
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <TextField
                  fullWidth
                  size="small"
                  label="Días Venta"
                  value={diasVenta}
                  onChange={(e) => setDiasVenta(e.target.value)}
                  disabled={cargandoGrid}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <Autocomplete
                  options={[
                    { value: '', label: 'Todas' },
                    ...familias.map((f) => ({ value: f.id, label: f.familia })),
                  ]}
                  getOptionLabel={(option) => option.label}
                  value={
                    familia === ''
                      ? { value: '', label: 'Todas' }
                      : familias.find((f) => f.id === familia)
                        ? { value: familia, label: familias.find((f) => f.id === familia)!.familia }
                        : null
                  }
                  onChange={(_, option) => setFamilia(option?.value ?? '')}
                  isOptionEqualToValue={(opt, val) => opt.value === val.value}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" label="Familia" />
                  )}
                  disabled={cargandoGrid || cargandoFamilias}
                  clearOnEscape
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <Autocomplete
                  freeSolo
                  options={productos}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.descripcion
                  }
                  inputValue={descripcion}
                  onInputChange={(_, value) => {
                    setDescripcion(value);
                    buscarProductos(value);
                  }}
                  onChange={(_, option) => {
                    if (typeof option === 'string') {
                      setDescripcion(option);
                    } else if (option) {
                      if (option.clave_prod === 'TODOS') {
                        setDescripcion('');
                      } else {
                        setDescripcion(option.descripcion);
                      }
                    }
                  }}
                  onOpen={() => {
                    if (productos.length <= 1) buscarProductos('');
                  }}
                  isOptionEqualToValue={(opt, val) =>
                    typeof opt === 'string' && typeof val === 'string'
                      ? opt === val
                      : (opt as any)?.clave_prod === (val as any)?.clave_prod
                  }
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" label="Descripción" />
                  )}
                  disabled={cargandoGrid}
                  clearOnEscape
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <TextField
                  fullWidth
                  size="small"
                  label="Días Inventario"
                  value={diasInventario}
                  onChange={(e) => setDiasInventario(e.target.value)}
                  disabled={cargandoGrid}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Modelo"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  disabled={cargandoGrid || cargandoModelos}
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                  {modelos.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.modelo}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <Autocomplete
                  options={proveedores.map((p) => ({ value: p.id, label: p.nombre }))}
                  getOptionLabel={(option) => option.label}
                  value={proveedores.find((p) => p.id === proveedor) ? { value: proveedor, label: proveedores.find((p) => p.id === proveedor)!.nombre } : null}
                  onChange={(_, option) => setProveedor(option?.value ?? '')}
                  isOptionEqualToValue={(opt, val) => opt.value === val.value}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" label="Proveedor" />
                  )}
                  disabled={cargandoGrid || cargandoProveedores}
                  clearOnEscape
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Box
                sx={{
                  bgcolor: '#dfdede',
                  color: '#000000',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  minWidth: 80,
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ display: 'block', color: '#777' }}>
                  Folio
                </Typography>
                <Typography variant="h7" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                  {folio}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={handleGenerarPedido}
                disabled={cargandoGrid}
                sx={{ textTransform: 'none', bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#b1b1b1' } }}
              >
                Generar Pedido
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleActivarPedido}
                disabled={cargandoGrid}
                sx={{ textTransform: 'none', bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#b1b1b1' } }}
              >
                Activar Pedido
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleAbrirBusqueda}
                disabled={cargandoGrid}
                sx={{ textTransform: 'none', bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#b1b1b1' } }}
              >
                Buscar Pedido
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleFinalizarPedido}
                disabled={cargandoGrid}
                sx={{ textTransform: 'none', bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#b1b1b1' } }}
              >
                Finalizar Pedido
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleCancelarPedido}
                disabled={cargandoGrid}
                disabled={folio <= 0 || rows.some((row) => Number(row.cancelado) === 1)}
                sx={{ textTransform: 'none', bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#b1b1b1' } }}
              >
                Cancelar Pedido
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSalir}
                disabled={cargandoGrid}
                sx={{ textTransform: 'none', bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#b1b1b1' } }}
              >
                Salir
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper
        elevation={2}
        sx={{
          width: '100%',
          height: { xs: 380, sm: 460, md: 520 },
          border: '1px solid #ccc',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <DataGrid
          rows={rows}
          columns={columnas}
          pinnedColumns={{ left: columnasFijas }}
          processRowUpdate={procesarActualizacionDeRenglon}
          isCellEditable={(params) => folio > 0 && Number(params.row.finalizado ?? 0) === 0}
          loading={cargandoGrid}
          density="compact"
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 50, page: 0 } },
          }}
          disableRowSelectionOnClick
          sx={{
            width: '100%',
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#b3d9ff',
            },
            '& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader': {
              fontSize: { xs: '0.7rem', sm: '0.78rem' },
            },
          }}
        />
      </Paper>

      <Dialog
        open={dialogoBusquedaAbierto}
        onClose={handleCerrarBusqueda}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Buscar pedido</DialogTitle>
        <DialogContent sx={{ py: 1, px: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, mt: 0.5 }}>
            <TextField
              label="Folio"
              type="number"
              size="small"
              value={buscarIdPedido}
              onChange={(e) => setBuscarIdPedido(e.target.value)}
            />
            <TextField
              label="Fecha inicio"
              type="date"
              size="small"
              value={buscarFechaInicio}
              onChange={(e) => setBuscarFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha fin"
              type="date"
              size="small"
              value={buscarFechaFin}
              onChange={(e) => setBuscarFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleBuscarPedidos}
              disabled={cargandoBusqueda}
              sx={{ textTransform: 'none' }}
            >
              Buscar
            </Button>
          </Stack>

          <Paper sx={{ height: 260, overflow: 'hidden' }}>
            <DataGrid
              rows={resultadosBusqueda}
              columns={[
                ...columnasBusqueda,
                {
                  field: 'id',
                  headerName: 'Seleccionar',
                  width: 110,
                  sortable: false,
                  filterable: false,
                  renderCell: (params: GridRenderCellParams<BusquedaRow>) => (
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={() => handleSeleccionarPedido(params.row)}
                      sx={{
                        textTransform: 'none',
                        textAlign: 'center',
                        justifyContent: 'center',
                        bgcolor: '#000000',
                        color: '#ffffff',
                        borderColor: '#000000',
                        '&:hover': {
                          bgcolor: '#333333',
                          borderColor: '#333333',
                        },
                      }}
                    >
                      Seleccionar
                    </Button>
                  ),
                },
              ]}
              loading={cargandoBusqueda}
              density="compact"
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
              }}
              disableRowSelectionOnClick
            />
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarBusqueda} sx={{ textTransform: 'none' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
