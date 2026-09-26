import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Accordion,
  Autocomplete,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  Assessment,
  Download,
  ExpandMore,
  FilterAlt,
  Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import * as XLSX from 'xlsx';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { ReportesApis } from './apis/ReportesApis';
import { routes } from '../../../utils/Routes';
import { useSessionContext } from '../../../context/SessionProvider';

type FilterName =
  | 'fechaInicial'
  | 'fechaFinal'
  | 'sucursal'
  | 'cliente'
  | 'tarjeta'
  | 'estilista'
  | 'producto'
  | 'marca'
  | 'familia'
  | 'almacen'
  | 'empresa'
  | 'sucursalDestino'
  | 'almacenDestino'
  | 'tipoMovimiento'
  | 'proveedor'
  | 'metodoPago'
  | 'tipoDescuento'
  | 'clave_prod'
  | 'palabra'
  | 'noVenta'
  | 'area'
  | 'depto'
  | 'cadena_areas'
  | 'año'
  | 'mes'
  | 'fechaCorte'
  | 'obsoleto'
  | 'todo';

type ReportFilters = Record<FilterName, string>;
type ReportRow = Record<string, unknown>;
type ReportRaw = Record<string, unknown>;

type ReportCatalogItem = {
  id: string;
  metodoApi: string;
  descripcion: string;
  raw: ReportRaw;
};

type SucursalOption = {
  value: string;
  label: string;
};

type ProveedorOption = {
  value: string;
  label: string;
};

type EstilistaOption = {
  value: string;
  label: string;
};

type MarcaOption = {
  id: number;
  value: string;
  label: string;
};

type FamiliaMarcaOption = {
  idMarca: number;
  value: string;
  label: string;
  marca: string;
};

type AreaOption = {
  value: string;
  label: string;
};

type ProductoOption = {
  value: string;
  label: string;
  esServicio: boolean;
};

type ClienteOption = {
  value: string;
  label: string;
  tarjeta: string;
};

type FilterDefinition = {
  key: FilterName;
  label: string;
  type?: 'text' | 'date' | 'select' | 'checkbox';
  placeholder?: string;
};

const formatearFechaReporte = (fechaIso: string) => {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  const meses = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  return `${String(dia).padStart(2, '0')}-${meses[mes - 1]}-${String(anio).slice(-2)}`;
};

const today = new Date().toISOString().split('T')[0];

const initialFilters: ReportFilters = {
  fechaInicial: today,
  fechaFinal: today,
  sucursal: '',
  cliente: '',
  tarjeta: '',
  estilista: '',
  producto: '',
  marca: '',
  familia: '',
  almacen: '',
  empresa: '',
  sucursalDestino: '',
  almacenDestino: '',
  tipoMovimiento: '',
  proveedor: '',
  metodoPago: '',
  tipoDescuento: '',
  clave_prod: '',
  palabra: '',
  noVenta: '',
  area: '',
  depto: '',
  cadena_areas: '',
  año: '',
  mes: '',
  fechaCorte: '',
  obsoleto: '0',
  todo: '0',
};

const filterDefinitions: FilterDefinition[] = [
  { key: 'fechaInicial', label: 'Fecha inicial', type: 'date' },
  { key: 'fechaFinal', label: 'Fecha final', type: 'date' },
  { key: 'sucursal', label: 'Sucursal', placeholder: 'Clave de sucursal' },
  { key: 'cliente', label: 'Cliente', placeholder: 'Clave o nombre del cliente' },
  { key: 'tarjeta', label: 'Tarjeta', placeholder: 'Número de tarjeta' },
  { key: 'estilista', label: 'Trabajador', placeholder: 'Clave o nombre del trabajador' },
  { key: 'producto', label: 'Producto', placeholder: 'Clave del producto' },
  { key: 'marca', label: 'Marca', placeholder: 'Clave o nombre de marca' },
  { key: 'familia', label: 'Familia', placeholder: 'Clave de familia' },
  { key: 'almacen', label: 'Almacén', placeholder: 'Clave de almacén' },
  { key: 'empresa', label: 'Empresa', placeholder: 'Clave de empresa' },
  { key: 'sucursalDestino', label: 'Sucursal destino', placeholder: 'Clave de sucursal' },
  { key: 'almacenDestino', label: 'Almacén destino', placeholder: 'Clave de almacén' },
  { key: 'tipoMovimiento', label: 'Tipo de movimiento', placeholder: 'Tipo de movimiento' },
  { key: 'proveedor', label: 'Proveedor', placeholder: 'Clave o nombre del proveedor' },
  { key: 'metodoPago', label: 'Método de pago', placeholder: 'Clave del método de pago' },
  { key: 'tipoDescuento', label: 'Tipo de descuento', placeholder: 'Clave del descuento' },
  { key: 'clave_prod', label: 'Clave producto', placeholder: 'Clave del producto' },
  { key: 'palabra', label: 'Palabra', placeholder: 'Texto a buscar' },
  { key: 'noVenta', label: 'No. venta', placeholder: 'Número de venta' },
  { key: 'area', label: 'Área', placeholder: 'Clave de área' },
  { key: 'depto', label: 'Departamento', placeholder: 'Clave de departamento' },
  { key: 'cadena_areas', label: 'Cadena de áreas', placeholder: 'Ejemplo: 1,2,3' },
  { key: 'año', label: 'Año', type: 'select' },
  { key: 'mes', label: 'Mes', type: 'select' },
  { key: 'fechaCorte', label: 'Fecha de corte', type: 'date' },
  { key: 'obsoleto', label: 'Obsoleto', type: 'checkbox' },
  { key: 'todo', label: 'Ver exist=0', type: 'checkbox' },
];

const knownReportFilters: Record<string, FilterName[]> = {
  RepVtaSucEstilista: ['fechaInicial', 'fechaFinal', 'sucursal', 'cliente', 'estilista'],
  RepVtaDetalle: ['fechaInicial', 'fechaFinal', 'sucursal', 'cliente', 'estilista'],
  RepVtaSucFecha: ['fechaInicial', 'fechaFinal', 'sucursal', 'cliente', 'estilista'],
  sp_reporte5_Ventas: [
    'fechaInicial',
    'fechaFinal',
    'sucursal',
    'estilista',
    'tipoDescuento',
    'metodoPago',
    'area',
  ],
  sp_reporte_medios_pagos: ['fechaInicial', 'fechaFinal', 'sucursal'],
  sp_reporte_medios_pagos_folios: ['fechaInicial', 'fechaFinal', 'sucursal'],
  sp_reporte_clientes_atendidos_periodo: ['fechaInicial', 'fechaFinal', 'sucursal'],
  sp_reporte_visitas: ['fechaInicial', 'fechaFinal', 'sucursal'],
  sp_reporte_saldo_puntos: [],
  sp_reporte_inventario: ['fechaInicial', 'fechaFinal', 'sucursal'],
  sp_reporte_ajuste_inventario: ['fechaInicial', 'fechaFinal', 'sucursal'],
  sp_reporte_traspasos_sucursales: ['fechaInicial', 'fechaFinal', 'sucursal'],
  sp_repoComisiones1: ['fechaInicial', 'fechaFinal', 'sucursal', 'estilista'],
  sp_reporte4_Estilistas: [
    'fechaInicial',
    'fechaFinal',
    'sucursal',
    'estilista',
    'area',
    'depto',
  ],
  sp_reporteinventario3: [
    'fechaInicial',
    'fechaFinal',
    'sucursal',
    'almacen',
    'marca',
    'clave_prod',
  ],
  sp_reporte_inventario_compras: [
    'fechaInicial',
    'fechaFinal',
    'sucursal',
    'marca',
    'familia',
    'clave_prod',
    'cadena_areas',
    'proveedor',
  ],
  sp_reporte_inventario_ERP: ['fechaCorte', 'obsoleto', 'todo'],
  sp_reporte_rentabilidad_insumos: [
    'sucursal',
    'fechaInicial',
    'fechaFinal',
    'estilista',
    'area',
  ],
  sp_reporte_validaciones_insumos: ['fechaInicial', 'fechaFinal', 'sucursal'],
  sp_reporte_puntos_cliente: ['cliente', 'tarjeta', 'fechaInicial', 'fechaFinal'],
  sp_reporte_ventas_cfds: ['fechaInicial', 'fechaFinal', 'sucursal'],
  sp_reporte_ventas_estilista: ['fechaInicial', 'fechaFinal', 'sucursal'],
  TicketInsumosEstilsta: [
    'fechaInicial',
    'fechaFinal',
    'sucursal',
    'cliente',
    'estilista',
    'noVenta',
  ],
  sp_reporteCifrasEmpleado_2Extendido: ['sucursal', 'año', 'mes', 'estilista'],
  sp_reporteCifrasEmpleado: ['sucursal', 'año', 'mes'],
  sp_reporteCifras: ['sucursal', 'año', 'mes'],
  sp_repoComisionesHoja: ['fechaInicial', 'fechaFinal', 'sucursal', 'estilista'],
  ReporteSaldoCreditoClientes: ['fechaInicial', 'fechaFinal'],
  ReporteSaldoCreditoDetalle: ['fechaInicial', 'fechaFinal', 'cliente'],
};

const metadataFilterAliases: Partial<Record<FilterName, string[]>> = {
  fechaInicial: ['f1', 'fechaInicial'],
  fechaFinal: ['f2', 'fechaFinal'],
  sucursal: ['sucursal', 'suc'],
  cliente: ['cliente', 'cte'],
  estilista: ['estilista', 'empleado', 'trabajador'],
  producto: ['producto'],
  marca: ['marca'],
  familia: ['familia', 'marcaFam1'],
  almacen: ['almacen', 'almacenOrigen'],
  empresa: ['empresa', 'cia', 'compania'],
  sucursalDestino: ['sucDestino', 'sucursalDestino'],
  almacenDestino: ['almacenDestino'],
  tipoMovimiento: ['tipomovto', 'tipoMovimiento'],
  proveedor: ['proveedor'],
  metodoPago: ['tipoPago', 'metodoPago'],
  tipoDescuento: ['tipoDescuento'],
  clave_prod: ['clave_prod', 'claveProd', 'cve_prod'],
  palabra: ['palabra'],
  noVenta: ['noVenta'],
  area: ['area'],
  depto: ['depto', 'departamento'],
  cadena_areas: ['cadena_areas', 'cadenaAreas'],
  año: ['año', 'anio'],
  mes: ['mes'],
};

const monthOptions = [
  ['1', 'Enero'],
  ['2', 'Febrero'],
  ['3', 'Marzo'],
  ['4', 'Abril'],
  ['5', 'Mayo'],
  ['6', 'Junio'],
  ['7', 'Julio'],
  ['8', 'Agosto'],
  ['9', 'Septiembre'],
  ['10', 'Octubre'],
  ['11', 'Noviembre'],
  ['12', 'Diciembre'],
];

function readProperty(row: ReportRaw, aliases: string[]): unknown {
  const property = Object.keys(row).find((key) =>
    aliases.some((alias) => key.toLowerCase() === alias.toLowerCase()),
  );
  return property ? row[property] : undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return undefined;
}

function normalizeCatalog(data: unknown): ReportCatalogItem[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item): item is ReportRaw => typeof item === 'object' && item !== null)
    .map((item, index) => ({
      id: String(readProperty(item, ['id', 'clave', 'codigo']) ?? index),
      metodoApi: String(
        readProperty(item, ['metodoApi', 'metodo_api', 'metodo', 'procedimiento']) ?? '',
      ).trim(),
      descripcion: String(
        readProperty(item, ['descripcion', 'nombre', 'reporte']) ?? 'Reporte sin descripción',
      ).trim(),
      raw: item,
    }))
    .filter((item) => item.metodoApi.length > 0);
}

function normalizeSucursales(data: unknown): SucursalOption[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item): item is ReportRaw => typeof item === 'object' && item !== null)
    .map((item) => {
      const clave = Number(readProperty(item, ['cve_sucursal', 'cveSucursal']));
      const nombre = String(readProperty(item, ['nombre']) ?? '').trim();

      if (!Number.isFinite(clave) || !nombre) return null;

      return {
        value: clave === 0 ? '' : String(clave),
        label: nombre,
      };
    })
    .filter((item): item is SucursalOption => item !== null);
}

function normalizeEstilistas(data: unknown): EstilistaOption[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item): item is ReportRaw => typeof item === 'object' && item !== null)
    .map((item) => {
      const clave = String(readProperty(item, ['clave_empleado', 'claveEmpleado']) ?? '').trim();
      const nombre = String(readProperty(item, ['nombre']) ?? '').trim();

      if (!clave || !nombre) return null;

      return { value: clave, label: nombre };
    })
    .filter((item): item is EstilistaOption => item !== null);
}

function normalizeMarcas(data: unknown): MarcaOption[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item): item is ReportRaw => typeof item === 'object' && item !== null)
    .map((item) => {
      const id = Number(readProperty(item, ['id']));
      const marca = String(readProperty(item, ['marca']) ?? '').trim();

      if (!Number.isFinite(id) || !marca) return null;

      return {
        id,
        value: id === 0 ? '' : marca,
        label: marca,
      };
    })
    .filter((item): item is MarcaOption => item !== null);
}

function normalizeFamiliasMarca(data: unknown): FamiliaMarcaOption[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item): item is ReportRaw => typeof item === 'object' && item !== null)
    .map((item) => {
      const idFamilia = readProperty(item, ['id_familia', 'idFamilia']);
      const idMarca = Number(readProperty(item, ['id_marca', 'idMarca']));
      const familia = String(readProperty(item, ['familia', 'descripcion']) ?? '').trim();
      const marca = String(readProperty(item, ['marca_desc', 'marcaDesc', 'marca']) ?? '').trim();

      if (idFamilia === undefined || idFamilia === null || !Number.isFinite(idMarca) || !familia) {
        return null;
      }

      return {
        idMarca,
        value: String(idFamilia),
        label: familia,
        marca,
      };
    })
    .filter((item): item is FamiliaMarcaOption => item !== null);
}

function normalizeAreas(data: unknown): AreaOption[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item): item is ReportRaw => typeof item === 'object' && item !== null)
    .map((item) => {
      const area = readProperty(item, ['area']);
      const descripcion = String(readProperty(item, ['descripcion']) ?? '').trim();
      if (area === undefined || area === null || !descripcion) return null;
      return { value: String(area), label: descripcion };
    })
    .filter((item): item is AreaOption => item !== null);
}

function normalizeProductos(data: unknown): ProductoOption[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item): item is ReportRaw => typeof item === 'object' && item !== null)
    .map((item) => {
      const clave = String(readProperty(item, ['clave_prod', 'claveProd', 'clave']) ?? '').trim();
      const descripcion = String(readProperty(item, ['descripcion']) ?? '').trim();
      if (!clave) return null;
      return {
        value: clave,
        label: descripcion,
        esServicio: toBoolean(readProperty(item, ['es_servicio', 'esServicio'])) === true,
      };
    })
    .filter((item): item is ProductoOption => item !== null);
}

function normalizeClientes(data: unknown): ClienteOption[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item): item is ReportRaw => typeof item === 'object' && item !== null)
    .map((item) => {
      const id = readProperty(item, ['id', 'No_cliente', 'no_cliente', 'NoCliente']);
      const nombre = String(
        readProperty(item, ['nombre_completo', 'nombreCompleto', 'nombre']) ?? '',
      ).trim();
      const tarjeta = String(
        readProperty(item, ['num_plastico', 'numPlastico', 'tarjeta']) ?? '',
      ).trim();

      if (id === undefined || id === null) return null;

      return {
        value: String(id),
        label: nombre,
        tarjeta,
      };
    })
    .filter((item): item is ClienteOption => item !== null);
}

function normalizeProveedores(data: unknown): ProveedorOption[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item): item is ReportRaw => typeof item === 'object' && item !== null)
    .map((item) => {
      const id = readProperty(item, ['id', 'cve_prov', 'cveProv']);
      const descripcion = String(readProperty(item, ['descripcion', 'nombre']) ?? '').trim();

      if (id === undefined || id === null || !descripcion) return null;

      return {
        value: String(id),
        label: descripcion,
      };
    })
    .filter((item): item is ProveedorOption => item !== null);
}

function getVisibleFilters(report: ReportCatalogItem | undefined): Set<FilterName> {
  if (!report) return new Set();

  const visible = new Set<FilterName>(knownReportFilters[report.metodoApi] ?? []);
  const hasKnownDefinition = Boolean(knownReportFilters[report.metodoApi]);

  if (!hasKnownDefinition) {
    filterDefinitions.forEach(({ key }) => {
      const aliases = metadataFilterAliases[key] ?? [key];
      if (toBoolean(readProperty(report.raw, aliases)) === true) visible.add(key);
    });
  }

  return visible;
}

function formatDateValue(value: unknown): string {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCellValue(value: unknown, key?: string): string | number {
  if (value === null || value === undefined || value === '') return '';
  if (key?.toLowerCase().includes('fecha')) return formatDateValue(value);

  const normalizedKey = key?.toLowerCase();
  const moneyKeys = [
    'total',
    'importe',
    'precio',
    'subtotal',
    'iva',
    'costo',
    'saldo',
    'saldoinicial',
    'saldocompras',
    'saldopagos',
    'saldofinal',
    'monto',
    'cargo',
    'abono',
    'venta',
    'utilidad',
    'ganancia',
  ];
  if (normalizedKey && moneyKeys.includes(normalizedKey)) {
    const numberValue = Number(value);
    if (!Number.isNaN(numberValue)) {
      return numberValue.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
      });
    }
  }

  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function getRowsFromResponse(data: unknown): ReportRow[] {
  const rows = Array.isArray(data)
    ? data
    : typeof data === 'object' && data !== null
      ? (data as { data?: unknown }).data
      : undefined;

  return Array.isArray(rows)
    ? rows.filter((row): row is ReportRow => typeof row === 'object' && row !== null)
    : [];
}

export default function ReportesPage() {
  const navigate = useNavigate();
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();
  const apiRef = useRef(consumoApi);
  const [reports, setReports] = useState<ReportCatalogItem[]>([]);
  const [sucursales, setSucursales] = useState<SucursalOption[]>([]);
  const [sucursalesLoading, setSucursalesLoading] = useState(true);
  const [sucursalesError, setSucursalesError] = useState('');
  const [marcas, setMarcas] = useState<MarcaOption[]>([]);
  const [marcasLoading, setMarcasLoading] = useState(true);
  const [marcasError, setMarcasError] = useState('');
  const [familiasMarca, setFamiliasMarca] = useState<FamiliaMarcaOption[]>([]);
  const [familiasMarcaLoading, setFamiliasMarcaLoading] = useState(true);
  const [familiasMarcaError, setFamiliasMarcaError] = useState('');
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [areasError, setAreasError] = useState('');
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [productosLoading, setProductosLoading] = useState(false);
  const [productosError, setProductosError] = useState('');
  const [productoBusqueda, setProductoBusqueda] = useState('');
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [clientesError, setClientesError] = useState('');
  const [clienteBusqueda, setClienteBusqueda] = useState('');
  const [tarjetaBusqueda, setTarjetaBusqueda] = useState('');
  const [proveedores, setProveedores] = useState<ProveedorOption[]>([]);
  const [proveedoresLoading, setProveedoresLoading] = useState(true);
  const [proveedoresError, setProveedoresError] = useState('');
  const [estilistas, setEstilistas] = useState<EstilistaOption[]>([]);
  const [estilistasLoading, setEstilistasLoading] = useState(true);
  const [estilistasError, setEstilistasError] = useState('');
  const [selectedReportKey, setSelectedReportKey] = useState('');
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(false);
  const [queryMessage, setQueryMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError('');
      try {
        const response = await apiRef.current.get(ReportesApis.catalogo);
        if (active) setReports(normalizeCatalog(response.data));
      } catch (error) {
        if (active) {
          setCatalogError(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar el catálogo de reportes.',
          );
        }
      } finally {
        if (active) setCatalogLoading(false);
      }
    };

    loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadSucursales = async () => {
      setSucursalesLoading(true);
      setSucursalesError('');

      try {
        const response = await apiRef.current.get(ReportesApis.sucursales, {
          params: { cve_sucursal: 0 },
        });

        if (active) setSucursales(normalizeSucursales(response.data));
      } catch (error) {
        if (active) {
          setSucursalesError(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar las sucursales.',
          );
        }
      } finally {
        if (active) setSucursalesLoading(false);
      }
    };

    loadSucursales();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadEstilistas = async () => {
      setEstilistasLoading(true);
      setEstilistasError('');

      try {
        const response = await apiRef.current.get(ReportesApis.estilistas, {
          params: { sucursal: 0 },
        });
        if (active) setEstilistas(normalizeEstilistas(response.data));
      } catch (error) {
        if (active) {
          setEstilistasError(
            error instanceof Error ? error.message : 'No fue posible cargar los estilistas.',
          );
        }
      } finally {
        if (active) setEstilistasLoading(false);
      }
    };

    loadEstilistas();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadMarcas = async () => {
      setMarcasLoading(true);
      setMarcasError('');

      try {
        const response = await apiRef.current.get(ReportesApis.marcas, {
          params: { id: 0 },
        });
        if (active) setMarcas(normalizeMarcas(response.data));
      } catch (error) {
        if (active) {
          setMarcasError(
            error instanceof Error ? error.message : 'No fue posible cargar las marcas.',
          );
        }
      } finally {
        if (active) setMarcasLoading(false);
      }
    };

    loadMarcas();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadFamiliasMarca = async () => {
      setFamiliasMarcaLoading(true);
      setFamiliasMarcaError('');

      try {
        const response = await apiRef.current.get(ReportesApis.familiasMarca);
        if (active) setFamiliasMarca(normalizeFamiliasMarca(response.data));
      } catch (error) {
        if (active) {
          setFamiliasMarcaError(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar las familias de marcas.',
          );
        }
      } finally {
        if (active) setFamiliasMarcaLoading(false);
      }
    };

    loadFamiliasMarca();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadAreas = async () => {
      setAreasLoading(true);
      setAreasError('');

      try {
        const response = await apiRef.current.get(ReportesApis.areas, {
          params: { area: '0' },
        });
        if (active) setAreas(normalizeAreas(response.data));
      } catch (error) {
        if (active) {
          setAreasError(
            error instanceof Error ? error.message : 'No fue posible cargar las áreas.',
          );
        }
      } finally {
        if (active) setAreasLoading(false);
      }
    };

    loadAreas();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setProductosLoading(true);
      setProductosError('');

      try {
        const response = await apiRef.current.get(ReportesApis.productos, {
          params: {
            busqueda: productoBusqueda.trim() || undefined,
            pagina: 1,
            tamanoPagina: 50,
          },
        });
        if (active) setProductos(normalizeProductos(response.data));
      } catch (error) {
        if (active) {
          setProductosError(
            error instanceof Error ? error.message : 'No fue posible cargar los productos.',
          );
        }
      } finally {
        if (active) setProductosLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [productoBusqueda]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setClientesLoading(true);
      setClientesError('');

      try {
        const response = await apiRef.current.get(ReportesApis.clientes, {
          params: {
            pageNumber: 1,
            pageSize: 50,
            busqueda: clienteBusqueda.trim() || undefined,
          },
        });
        if (active) setClientes(normalizeClientes(response.data));
      } catch (error) {
        if (active) {
          setClientesError(
            error instanceof Error ? error.message : 'No fue posible cargar los clientes.',
          );
        }
      } finally {
        if (active) setClientesLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [clienteBusqueda]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setClientesLoading(true);
      setClientesError('');

      try {
        const response = await apiRef.current.get(ReportesApis.clientes, {
          params: {
            pageNumber: 1,
            pageSize: 50,
            busqueda: tarjetaBusqueda.trim() || undefined,
          },
        });
        if (active) setClientes(normalizeClientes(response.data));
      } catch (error) {
        if (active) {
          setClientesError(
            error instanceof Error ? error.message : 'No fue posible cargar los clientes.',
          );
        }
      } finally {
        if (active) setClientesLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [tarjetaBusqueda]);

  useEffect(() => {
    let active = true;

    const loadProveedores = async () => {
      setProveedoresLoading(true);
      setProveedoresError('');

      try {
        const response = await apiRef.current.get(ReportesApis.proveedores);
        if (active) setProveedores(normalizeProveedores(response.data));
      } catch (error) {
        if (active) {
          setProveedoresError(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar los proveedores.',
          );
        }
      } finally {
        if (active) setProveedoresLoading(false);
      }
    };

    loadProveedores();
    return () => {
      active = false;
    };
  }, []);

  const selectedReport = useMemo(
    () => reports.find((report) => report.metodoApi === selectedReportKey),
    [reports, selectedReportKey],
  );

  const visibleFilters = useMemo(() => getVisibleFilters(selectedReport), [selectedReport]);

  const columns = useMemo<MRT_ColumnDef<ReportRow>[]>(() => {
    const keys = reportRows.length > 0 ? Object.keys(reportRows[0]) : [];
    return keys
      .filter((key) => key.toLowerCase() !== 'id')
      .map((key) => {
        const narrowColumns = ['cant_producto', 'visitas'];
        const isNarrow = narrowColumns.includes(key.toLowerCase());
        return {
          accessorKey: key,
          header: key,
          Cell: ({ cell }: { cell: any }) => formatCellValue(cell.getValue(), key),
          ...(isNarrow ? { size: 80, maxSize: 100 } : {}),
        };
      });
  }, [reportRows]);

  const summary = useMemo(() => {
    const result: Record<string, number> = {};
    reportRows.forEach((row) => {
      Object.entries(row).forEach(([key, value]) => {
        if (typeof value === 'number' && Number.isFinite(value)) {
          result[key] = (result[key] ?? 0) + value;
        }
      });
    });
    return result;
  }, [reportRows]);

  const puntosResumen = useMemo(() => {
    if (selectedReport?.metodoApi !== 'sp_reporte_puntos_cliente') return null;

    const puntosGenerados = reportRows.reduce(
      (total, row) =>
        total + Number(
          readProperty(row, [
            'puntosGenerados',
            'puntos_generados',
            'puntosGeneradosTotal',
            'generados',
            'puntos',
          ]) ?? 0
        ),
      0
    );
    const puntosUtilizados = reportRows.reduce(
      (total, row) =>
        total + Number(
          readProperty(row, [
            'puntosUtilizados',
            'puntos_utilizados',
            'puntosUsados',
            'puntos_usados',
            'utilizados',
            'canjeados',
          ]) ?? 0
        ),
      0
    );

    return {
      puntosGenerados,
      puntosUtilizados,
      saldo: puntosGenerados - puntosUtilizados,
    };
  }, [reportRows, selectedReport]);

  const saldoPuntosResumen = useMemo(() => {
    if (selectedReport?.metodoApi !== 'sp_reporte_saldo_puntos') return null;

    const puntosGenerados = reportRows.reduce(
      (total, row) =>
        total +
        Number(
          readProperty(row, [
            'PuntosGen',
            'puntosGenerados',
            'puntos_generados',
            'puntosGeneradosTotal',
            'generados',
            'puntos',
          ]) ?? 0,
        ),
      0,
    );
    const puntosUtilizados = reportRows.reduce(
      (total, row) =>
        total +
        Number(
          readProperty(row, [
            'puntosUtilizados',
            'puntos_utilizados',
            'puntosUsados',
            'puntos_usados',
            'utilizados',
            'canjeados',
          ]) ?? 0,
        ),
      0,
    );

    return {
      puntosGenerados,
      puntosUtilizados,
      saldo: puntosGenerados - puntosUtilizados,
    };
  }, [reportRows, selectedReport]);

  const rentabilidadResumen = useMemo(() => {
    if (selectedReport?.metodoApi !== 'sp_reporte_rentabilidad_insumos') return null;

    const venta = reportRows.reduce(
      (total, row) =>
        total + Number(readProperty(row, ['venta', 'ventas', 'totalVenta', 'total_venta']) ?? 0),
      0
    );
    const costo = reportRows.reduce(
      (total, row) =>
        total + Number(readProperty(row, ['costo', 'costos', 'totalCosto', 'total_costo']) ?? 0),
      0
    );

    return {
      venta,
      costo,
      rentabilidad: venta !== 0 ? (venta - costo) / venta : 0,
    };
  }, [reportRows, selectedReport]);

  const handleReportChange = (metodoApi: string) => {
    setSelectedReportKey(metodoApi);
    setFilters({ ...initialFilters });
    setReportRows([]);
    setQueryError(false);
    setQueryMessage('');
  };

  const handleFilterChange = (key: FilterName, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === 'marca' ? { familia: '' } : {}),
    }));
    setQueryError(false);
    setQueryMessage('');
  };

  const handleConsultar = async () => {
    setQueryError(false);

    if (!selectedReport) {
      setQueryError(true);
      setQueryMessage('Selecciona un reporte para continuar.');
      return;
    }

    const reportEndpoint =
      selectedReport.metodoApi === 'sp_reporte_medios_pagos'
        ? ReportesApis.mediosPagos
        : selectedReport.metodoApi === 'sp_reporte_medios_pagos_folios'
          ? ReportesApis.mediosPagosFolios
          : selectedReport.metodoApi === 'sp_reporte_clientes_atendidos_periodo'
            ? ReportesApis.clientesAtendidosPeriodo
            : selectedReport.metodoApi === 'sp_reporte_visitas'
              ? ReportesApis.visitas
              : selectedReport.metodoApi === 'sp_reporte_saldo_puntos'
                ? ReportesApis.saldoPuntos
                : selectedReport.metodoApi === 'sp_reporte_inventario'
                  ? ReportesApis.inventario
                  : selectedReport.metodoApi === 'sp_reporte_ajuste_inventario'
                    ? ReportesApis.ajusteInventario
                    : selectedReport.metodoApi === 'sp_reporte_traspasos_sucursales'
                      ? ReportesApis.traspasosSucursales
                      : selectedReport.metodoApi === 'sp_reporte_inventario_compras'
                        ? ReportesApis.inventarioCompras
                        : selectedReport.metodoApi === 'sp_reporte_inventario_ERP'
                          ? ReportesApis.inventarioErp
                          : selectedReport.metodoApi === 'sp_reporte_rentabilidad_insumos'
                            ? ReportesApis.rentabilidadInsumos
                            : selectedReport.metodoApi === 'sp_reporte_validaciones_insumos'
                              ? ReportesApis.validacionesInsumos
                              : selectedReport.metodoApi === 'sp_reporte_puntos_cliente'
                                ? ReportesApis.puntosCliente
                                : selectedReport.metodoApi === 'sp_reporte_ventas_estilista'
                                  ? ReportesApis.ventasEstilista
                                  : selectedReport.metodoApi === 'sp_reporte_ventas_cfds'
                                    ? ReportesApis.ventasCfds
                                    : null;

    if (!reportEndpoint) {
      setReportRows([]);
      setQueryMessage(
        `El reporte «${selectedReport.descripcion}» aún no tiene conectada su API de consulta en Berllano.`,
      );
      return;
    }

    const requiereFechas =
      visibleFilters.has('fechaInicial') || visibleFilters.has('fechaFinal');
    if (requiereFechas && (!filters.fechaInicial || !filters.fechaFinal)) {
      setQueryError(true);
      setQueryMessage('Selecciona la fecha inicial y la fecha final para consultar el reporte.');
      return;
    }
    const requiereFechaCorte = visibleFilters.has('fechaCorte');
    if (requiereFechaCorte && !filters.fechaCorte) {
      setQueryError(true);
      setQueryMessage('Selecciona la fecha de corte para consultar el reporte.');
      return;
    }
    if (
      selectedReport.metodoApi === 'sp_reporte_puntos_cliente' &&
      !filters.cliente.trim()
    ) {
      setQueryError(true);
      setQueryMessage('Ingresa la clave o nombre del cliente para consultar el reporte.');
      return;
    }
    if (
      ['sp_reporte_inventario', 'sp_reporte_ajuste_inventario', 'sp_reporte_traspasos_sucursales', 'sp_reporte_ventas_estilista'].includes(
        selectedReport.metodoApi,
      ) &&
      !filters.sucursal
    ) {
      setQueryError(true);
      setQueryMessage('Selecciona una sucursal para consultar el reporte.');
      return;
    }
    if (selectedReport.metodoApi === 'sp_reporte_inventario_ERP' && (session?.sucursal ?? 0) <= 0) {
      setQueryError(true);
      setQueryMessage('No se encontró la sucursal de la sesión.');
      return;
    }

    setQueryLoading(true);
    setQueryMessage('');
    const params: Record<string, unknown> = {
      ...(requiereFechas &&
      !['sp_reporte_puntos_cliente', 'sp_reporte_ventas_cfds', 'sp_reporte_ventas_estilista'].includes(
        selectedReport.metodoApi,
      )
        ? {
            f1: filters.fechaInicial,
            f2: filters.fechaFinal,
          }
        : {}),
      ...(selectedReport.metodoApi === 'sp_reporte_inventario_ERP'
        ? { suc: session?.sucursal ?? 0 }
        : selectedReport.metodoApi === 'sp_reporte_inventario' ||
            selectedReport.metodoApi === 'sp_reporte_ajuste_inventario'
          ? { s: Number(filters.sucursal) }
          : selectedReport.metodoApi === 'sp_reporte_traspasos_sucursales'
            ? { s: filters.sucursal.trim() }
            : selectedReport.metodoApi === 'sp_reporte_validaciones_insumos'
              ? { suc: filters.sucursal.trim() || '0' }
              : selectedReport.metodoApi === 'sp_reporte_ventas_cfds' ||
                  selectedReport.metodoApi === 'sp_reporte_ventas_estilista'
                ? {}
                : requiereFechas
                  ? { suc: filters.sucursal.trim() || '%' }
                  : {}),
      ...(selectedReport.metodoApi === 'sp_reporte_inventario_ERP'
        ? {
            fechaCorte: filters.fechaCorte,
            obsoleto: filters.obsoleto === '1',
            todo: filters.todo === '1',
          }
        : {}),
      ...(selectedReport.metodoApi === 'sp_reporte_inventario_compras'
        ? {
            marca: filters.marca.trim() || '%',
            familia: filters.familia.trim() || '%',
            clave_prod: filters.clave_prod.trim() || '%',
            cadena_areas: filters.cadena_areas.trim() || '%',
            proveedor: filters.proveedor.trim() || '%',
          }
        : {}),
      ...(selectedReport.metodoApi === 'sp_reporte_rentabilidad_insumos'
        ? {
            suc: filters.sucursal.trim() || '%',
            fechaI: filters.fechaInicial,
            fechaF: filters.fechaFinal,
            usr: filters.estilista.trim() || '%',
            area: filters.area.trim() || '%',
            cliente: '%',
          }
        : {}),
      ...(selectedReport.metodoApi === 'sp_reporte_puntos_cliente'
        ? {
            cliente: filters.cliente.trim(),
            tarjeta: filters.tarjeta.trim(),
            fechaI: filters.fechaInicial.replace(/-/g, ''),
            fechaF: filters.fechaFinal.replace(/-/g, ''),
          }
        : {}),
      ...(selectedReport.metodoApi === 'sp_reporte_ventas_estilista'
        ? {
            fecha_inicio: formatearFechaReporte(filters.fechaInicial),
            fecha_fin: formatearFechaReporte(filters.fechaFinal),
            sucursal: Number(filters.sucursal),
          }
        : selectedReport.metodoApi === 'sp_reporte_ventas_cfds'
          ? {
              fecha1: filters.fechaInicial,
              fecha2: filters.fechaFinal,
              sucursal: filters.sucursal.trim() || '%',
            }
          : {}),
    };

    try {
      const response = await apiRef.current.get(reportEndpoint, {
        params,
        timeout: 120000,
      });
      const rows = getRowsFromResponse(response.data);
      setReportRows(rows);
      setQueryMessage(
        rows.length > 0
          ? `Consulta realizada correctamente: ${rows.length} registro(s).`
          : 'La consulta se realizó correctamente, pero no devolvió registros.',
      );
    } catch (error) {
      setReportRows([]);
      setQueryError(true);
      setQueryMessage(
        error instanceof Error
          ? `No fue posible consultar el reporte: ${error.message}`
          : 'No fue posible consultar el reporte de medios de pagos.',
      );
    } finally {
      setQueryLoading(false);
    }
  };

  const handleExport = () => {
    if (reportRows.length === 0) return;

    const exportRows = reportRows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, formatCellValue(value, key)]),
      ),
    );
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = (selectedReport?.descripcion || 'reporte').replace(/[^a-z0-9_-]+/gi, '_');
    link.href = url;
    link.download = `${filename || 'reporte'}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderFilter = (definition: FilterDefinition) => {
    const value = filters[definition.key];
    const isDate = definition.type === 'date';
    const isSelect = definition.type === 'select';
    const metadataValue = selectedReport
      ? toBoolean(readProperty(selectedReport.raw, metadataFilterAliases[definition.key] ?? [definition.key]))
      : undefined;

    if (definition.key === 'sucursal') {
      return (
        <TextField
          key={definition.key}
          select
          fullWidth
          size="small"
          label={definition.label}
          value={value}
          onChange={(event) => handleFilterChange(definition.key, event.target.value)}
          disabled={sucursalesLoading || metadataValue === false}
          error={Boolean(sucursalesError)}
          helperText={sucursalesError || (sucursalesLoading ? 'Cargando sucursales...' : undefined)}
        >
          {sucursales.map((sucursal) => (
            <MenuItem key={`${sucursal.value || 'todas'}-${sucursal.label}`} value={sucursal.value}>
              {sucursal.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (definition.key === 'marca') {
      return (
        <TextField
          key={definition.key}
          select
          fullWidth
          size="small"
          label={definition.label}
          value={value}
          onChange={(event) => handleFilterChange(definition.key, event.target.value)}
          disabled={marcasLoading || metadataValue === false}
          error={Boolean(marcasError)}
          helperText={marcasError || (marcasLoading ? 'Cargando marcas...' : undefined)}
        >
          {marcas.map((marca) => (
            <MenuItem key={`${marca.id}-${marca.label}`} value={marca.value}>
              {marca.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (definition.key === 'familia') {
      const marcaSeleccionada = marcas.find((marca) => marca.value === filters.marca);
      const familiasDisponibles = marcaSeleccionada
        ? familiasMarca.filter((familia) => familia.idMarca === marcaSeleccionada.id)
        : familiasMarca;

      return (
        <TextField
          key={definition.key}
          select
          fullWidth
          size="small"
          label={definition.label}
          value={value}
          onChange={(event) => handleFilterChange(definition.key, event.target.value)}
          disabled={familiasMarcaLoading || metadataValue === false}
          error={Boolean(familiasMarcaError)}
          helperText={
            familiasMarcaError ||
            (familiasMarcaLoading ? 'Cargando familias...' : undefined)
          }
        >
          {familiasDisponibles.map((familia) => (
            <MenuItem
              key={`${familia.idMarca}-${familia.value}`}
              value={familia.value}
            >
              {marcaSeleccionada ? familia.label : `${familia.marca} - ${familia.label}`}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (definition.key === 'producto' || definition.key === 'clave_prod') {
      const productoSeleccionado = productos.find((producto) => producto.value === value) ?? null;

      return (
        <Autocomplete
          key={definition.key}
          fullWidth
          size="small"
          options={productos}
          value={productoSeleccionado}
          inputValue={productoBusqueda}
          loading={productosLoading}
          filterOptions={(options) => options}
          getOptionLabel={(producto) => `${producto.value} - ${producto.label}`}
          isOptionEqualToValue={(option, selected) => option.value === selected.value}
          onInputChange={(_, inputValue, reason) => {
            if (reason === 'input' || reason === 'clear') setProductoBusqueda(inputValue);
          }}
          onChange={(_, producto) => {
            handleFilterChange(definition.key, producto?.value ?? '');
            setProductoBusqueda(producto ? `${producto.value} - ${producto.label}` : '');
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={definition.label}
              error={Boolean(productosError)}
              helperText={
                productosError ||
                (productosLoading ? 'Buscando productos...' : 'Escribe una clave o descripción')
              }
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {productosLoading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      );
    }

    if (definition.key === 'cadena_areas' || definition.key === 'area') {
      const selectedAreas = value ? value.split(',').filter(Boolean) : [];

      return (
        <TextField
          key={definition.key}
          select
          fullWidth
          size="small"
          label={definition.label}
          value={selectedAreas}
          onChange={(event) => {
            const selected = event.target.value;
            handleFilterChange(
              definition.key,
              (typeof selected === 'string' ? selected.split(',') : selected).join(','),
            );
          }}
          disabled={areasLoading || metadataValue === false}
          error={Boolean(areasError)}
          helperText={areasError || (areasLoading ? 'Cargando áreas...' : undefined)}
          SelectProps={{
            multiple: true,
            renderValue: (selected) => {
              const values = selected as string[];
              if (values.length === 0) return 'Todas las áreas';
              return values
                .map((area) => areas.find((option) => option.value === area)?.label ?? area)
                .join(', ');
            },
          }}
        >
          {areas.map((area) => (
            <MenuItem key={area.value} value={area.value}>
              <Checkbox checked={selectedAreas.includes(area.value)} size="small" />
              {area.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (definition.key === 'proveedor') {
      return (
        <TextField
          key={definition.key}
          select
          fullWidth
          size="small"
          label={definition.label}
          value={value}
          onChange={(event) => handleFilterChange(definition.key, event.target.value)}
          disabled={proveedoresLoading || metadataValue === false}
          error={Boolean(proveedoresError)}
          helperText={proveedoresError || (proveedoresLoading ? 'Cargando proveedores...' : undefined)}
        >
          {proveedores.map((proveedor) => (
            <MenuItem key={`${proveedor.value}-${proveedor.label}`} value={proveedor.value}>
              {proveedor.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (definition.key === 'estilista') {
      return (
        <TextField
          key={definition.key}
          select
          fullWidth
          size="small"
          label={definition.label}
          value={value}
          onChange={(event) => handleFilterChange(definition.key, event.target.value)}
          disabled={estilistasLoading || metadataValue === false}
          error={Boolean(estilistasError)}
          helperText={estilistasError || (estilistasLoading ? 'Cargando estilistas...' : undefined)}
        >
          {estilistas.map((estilista) => (
            <MenuItem key={`${estilista.value}-${estilista.label}`} value={estilista.value}>
              {estilista.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (definition.key === 'cliente') {
      const clienteSeleccionado = clientes.find((cliente) => cliente.value === value) ?? null;

      return (
        <Autocomplete
          key={definition.key}
          freeSolo
          fullWidth
          size="small"
          options={clientes}
          value={clienteSeleccionado}
          inputValue={clienteBusqueda}
          loading={clientesLoading}
          filterOptions={(options) => options}
          getOptionLabel={(option) =>
            typeof option === 'string' ? option : `${option.value} - ${option.label}`
          }
          isOptionEqualToValue={(option, selected) =>
            typeof option === 'string' || typeof selected === 'string'
              ? option === selected
              : option.value === selected.value
          }
          onInputChange={(_, inputValue, reason) => {
            if (reason === 'input' || reason === 'clear') setClienteBusqueda(inputValue);
          }}
          onChange={(_, newValue) => {
            const selected =
              typeof newValue === 'string' ? newValue : newValue?.value ?? '';
            handleFilterChange(definition.key, selected);
            setClienteBusqueda(
              typeof newValue === 'string'
                ? newValue
                : newValue
                  ? `${newValue.value} - ${newValue.label}`
                  : '',
            );
            if (typeof newValue !== 'string' && newValue) {
              handleFilterChange('tarjeta', newValue.tarjeta ?? '');
              setTarjetaBusqueda(newValue.tarjeta ?? '');
            } else if (!newValue) {
              handleFilterChange('tarjeta', '');
              setTarjetaBusqueda('');
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={definition.label}
              error={Boolean(clientesError)}
              helperText={
                clientesError ||
                (clientesLoading ? 'Buscando clientes...' : 'Escribe clave, nombre o selecciona')
              }
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {clientesLoading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      );
    }

    if (definition.key === 'tarjeta') {
      const tarjetaSeleccionada =
        clientes.find((cliente) => cliente.tarjeta === value) ?? null;

      return (
        <Autocomplete
          key={definition.key}
          freeSolo
          fullWidth
          size="small"
          options={clientes}
          value={tarjetaSeleccionada}
          inputValue={tarjetaBusqueda}
          loading={clientesLoading}
          filterOptions={(options) => options}
          getOptionLabel={(option) =>
            typeof option === 'string' ? option : option.tarjeta
          }
          isOptionEqualToValue={(option, selected) =>
            typeof option === 'string' || typeof selected === 'string'
              ? option === selected
              : option.tarjeta === selected.tarjeta
          }
          onInputChange={(_, inputValue, reason) => {
            if (reason === 'input' || reason === 'clear') setTarjetaBusqueda(inputValue);
          }}
          onChange={(_, newValue) => {
            const selected =
              typeof newValue === 'string' ? newValue : newValue?.tarjeta ?? '';
            handleFilterChange(definition.key, selected);
            setTarjetaBusqueda(
              typeof newValue === 'string' ? newValue : newValue?.tarjeta ?? '',
            );
            if (typeof newValue !== 'string' && newValue) {
              handleFilterChange('cliente', newValue.value);
              setClienteBusqueda(`${newValue.value} - ${newValue.label}`);
            } else if (!newValue) {
              handleFilterChange('cliente', '');
              setClienteBusqueda('');
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={definition.label}
              error={Boolean(clientesError)}
              helperText={
                clientesError ||
                (clientesLoading ? 'Buscando tarjetas...' : 'Escribe número de tarjeta o selecciona')
              }
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {clientesLoading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      );
    }

    if (isSelect && definition.key === 'año') {
      const currentYear = new Date().getFullYear();
      return (
        <TextField
          key={definition.key}
          select
          fullWidth
          size="small"
          label={definition.label}
          value={value}
          onChange={(event) => handleFilterChange(definition.key, event.target.value)}
        >
          <MenuItem value="">Seleccione un año</MenuItem>
          {Array.from({ length: 8 }, (_, index) => currentYear - 3 + index).map((year) => (
            <MenuItem key={year} value={String(year)}>
              {year}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (isSelect && definition.key === 'mes') {
      return (
        <TextField
          key={definition.key}
          select
          fullWidth
          size="small"
          label={definition.label}
          value={value}
          onChange={(event) => handleFilterChange(definition.key, event.target.value)}
        >
          <MenuItem value="">Seleccione un mes</MenuItem>
          {monthOptions.map(([month, label]) => (
            <MenuItem key={month} value={month}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (definition.type === 'checkbox') {
      return (
        <FormControlLabel
          key={definition.key}
          control={
            <Checkbox
              checked={value === '1'}
              onChange={(event) =>
                handleFilterChange(definition.key, event.target.checked ? '1' : '0')
              }
              size="small"
            />
          }
          label={definition.label}
        />
      );
    }

    return (
      <TextField
        key={definition.key}
        fullWidth
        size="small"
        label={definition.label}
        type={definition.type === 'date' ? 'date' : 'text'}
        value={value}
        placeholder={definition.placeholder}
        onChange={(event) => handleFilterChange(definition.key, event.target.value)}
        disabled={metadataValue === false}
        InputLabelProps={isDate ? { shrink: true } : undefined}
      />
    );
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton aria-label="Regresar al menú principal" onClick={() => navigate(routes.mainMenu)}>
          <ArrowBack />
        </IconButton>
        <Assessment sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h4">Reportes</Typography>
          <Typography variant="body2" color="text.secondary">
            Consulta dinámica de reportes de Berllano
          </Typography>
        </Box>
      </Stack>

      {catalogError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo cargar el catálogo: {catalogError}
        </Alert>
      )}

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FilterAlt />
            <Typography fontWeight={600}>Filtros del reporte</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Reporte"
              value={selectedReportKey}
              onChange={(event) => handleReportChange(event.target.value)}
              sx={{ gridColumn: { xs: 'auto', lg: 'span 2' } }}
            >
              <MenuItem value="">Seleccione un reporte</MenuItem>
              {reports.map((report) => (
                <MenuItem key={`${report.id}-${report.metodoApi}`} value={report.metodoApi}>
                  {report.descripcion}
                </MenuItem>
              ))}
            </TextField>

            {catalogLoading && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ gridColumn: { xs: 'auto', lg: 'span 2' } }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Cargando catálogo de reportes...
                </Typography>
              </Stack>
            )}

            {!catalogLoading && selectedReport && filterDefinitions
              .filter((definition) => visibleFilters.has(definition.key))
              .map(renderFilter)}
          </Box>

          <Divider sx={{ my: 3 }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
            <Typography variant="caption" color="text.secondary">
              {selectedReport
                ? `${visibleFilters.size} filtro(s) disponible(s) para ${selectedReport.descripcion}.`
                : 'Selecciona un reporte para mostrar sus filtros.'}
            </Typography>
            <Button
              variant="contained"
              startIcon={queryLoading ? <CircularProgress size={16} color="inherit" /> : <Search />}
              onClick={handleConsultar}
              disabled={!selectedReport || queryLoading}
            >
              {queryLoading ? 'Consultando...' : 'Consultar'}
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {queryMessage && (
        <Alert severity={queryError ? 'error' : 'info'} sx={{ mt: 2 }}>
          {queryMessage}
        </Alert>
      )}

      <Paper sx={{ mt: 2, overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ p: 2 }}>
          <Box>
            <Typography variant="h6">
              {selectedReport?.descripcion || 'Resultados del reporte'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {reportRows.length > 0 ? `${reportRows.length} registro(s)` : 'Sin datos para mostrar'}
            </Typography>
          </Box>
          <Tooltip title="Exportar resultados a Excel">
            <span>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExport}
                disabled={reportRows.length === 0}
              >
                Excel
              </Button>
            </span>
          </Tooltip>
        </Stack>
        <Divider />

        {reportRows.length > 0 ? (
          <MaterialReactTable
            columns={columns}
            data={reportRows}
            enableStickyHeader
            enableColumnResizing
            enableRowSelection={false}
            initialState={{ density: 'compact' }}
            muiTableContainerProps={{ sx: { maxHeight: 620 } }}
          />
        ) : (
          <Stack alignItems="center" spacing={1} sx={{ py: 8, px: 2 }}>
            <Typography variant="h6" color="text.secondary">
              <Assessment sx={{ verticalAlign: 'middle', mr: 1 }} />
              Aún no hay resultados
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {selectedReport?.metodoApi === 'sp_reporte_medios_pagos' ||
              selectedReport?.metodoApi === 'sp_reporte_medios_pagos_folios' ||
              selectedReport?.metodoApi === 'sp_reporte_inventario_compras'
                ? 'Selecciona los filtros y consulta el reporte para mostrar sus resultados.'
                : 'Selecciona un reporte y sus filtros. La tabla se llenará al conectar la API específica del reporte.'}
            </Typography>
          </Stack>
        )}

        {selectedReport?.metodoApi !== 'sp_reporte_ventas_cfds' &&
          Object.keys(summary).some((key) => ['total', 'importe', 'saldoinicial', 'saldocompras', 'saldopagos', 'saldofinal'].includes(key.toLowerCase())) && (
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            {Object.entries(summary)
              .filter(([key]) => ['total', 'importe', 'saldoinicial', 'saldocompras', 'saldopagos', 'saldofinal'].includes(key.toLowerCase()))
              .map(([key, value]) => (
                <Paper key={key} variant="outlined" sx={{ px: 2, py: 1, minWidth: 150 }}>
                  <Typography variant="caption" color="text.secondary">
                    {key}
                  </Typography>
                  <Typography fontWeight={600}>{formatCellValue(value, key)}</Typography>
                </Paper>
              ))}
          </Stack>
        )}
      </Paper>

      {puntosResumen && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          flexWrap="wrap"
          gap={1}
          sx={{ mt: 1.5 }}
        >
          <Paper variant="outlined" sx={{ flex: '1 1 180px', px: 1.5, py: 1, bgcolor: '#f8fafc' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Puntos generados
            </Typography>
            <Typography
              sx={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}
            >
              {puntosResumen.puntosGenerados.toLocaleString('es-MX')}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ flex: '1 1 180px', px: 1.5, py: 1, bgcolor: '#f8fafc' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Puntos utilizados
            </Typography>
            <Typography
              sx={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}
            >
              {puntosResumen.puntosUtilizados.toLocaleString('es-MX')}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ flex: '1 1 180px', px: 1.5, py: 1, bgcolor: '#f8fafc' }}>
            
            <Typography
              sx={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}
            >
              {puntosResumen.saldo.toLocaleString('es-MX')}
            </Typography>
          </Paper>
        </Stack>
      )}

      {saldoPuntosResumen && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          flexWrap="wrap"
          gap={1}
          sx={{ mt: 1.5 }}
        >
          <Paper variant="outlined" sx={{ flex: '1 1 180px', px: 1.5, py: 1, bgcolor: '#f8fafc' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Puntos generados
            </Typography>
            <Typography
              sx={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}
            >
              {saldoPuntosResumen.puntosGenerados.toLocaleString('es-MX')}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ flex: '1 1 180px', px: 1.5, py: 1, bgcolor: '#f8fafc' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Puntos utilizados
            </Typography>
            <Typography
              sx={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}
            >
              {saldoPuntosResumen.puntosUtilizados.toLocaleString('es-MX')}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ flex: '1 1 180px', px: 1.5, py: 1, bgcolor: '#f8fafc' }}>
           
            <Typography
              sx={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}
            >
              {saldoPuntosResumen.saldo.toLocaleString('es-MX')}
            </Typography>
          </Paper>
        </Stack>
      )}

      {rentabilidadResumen && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          flexWrap="wrap"
          gap={1}
          sx={{ mt: 1.5 }}
        >
          <Paper variant="outlined" sx={{ flex: '1 1 180px', px: 1.5, py: 1, bgcolor: '#f8fafc' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Suma de venta
            </Typography>
            <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {rentabilidadResumen.venta.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ flex: '1 1 180px', px: 1.5, py: 1, bgcolor: '#f8fafc' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Suma de costo
            </Typography>
            <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {rentabilidadResumen.costo.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ flex: '1 1 180px', px: 1.5, py: 1, bgcolor: '#f8fafc' }}>
            
            <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {rentabilidadResumen.rentabilidad.toLocaleString('es-MX', {
                style: 'percent',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
