import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Divider,
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
  InfoOutlined,
  Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import * as XLSX from 'xlsx';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { ReportesApis } from './apis/ReportesApis';
import { routes } from '../../../utils/Routes';

type FilterName =
  | 'fechaInicial'
  | 'fechaFinal'
  | 'sucursal'
  | 'cliente'
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
  | 'mes';

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

type FilterDefinition = {
  key: FilterName;
  label: string;
  type?: 'text' | 'date' | 'select';
  placeholder?: string;
};

const initialFilters: ReportFilters = {
  fechaInicial: '',
  fechaFinal: '',
  sucursal: '',
  cliente: '',
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
};

const filterDefinitions: FilterDefinition[] = [
  { key: 'fechaInicial', label: 'Fecha inicial', type: 'date' },
  { key: 'fechaFinal', label: 'Fecha final', type: 'date' },
  { key: 'sucursal', label: 'Sucursal', placeholder: 'Clave de sucursal' },
  { key: 'cliente', label: 'Cliente', placeholder: 'Clave o nombre del cliente' },
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
  if (normalizedKey && ['total', 'importe', 'precio'].includes(normalizedKey)) {
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
  const apiRef = useRef(consumoApi);
  const [reports, setReports] = useState<ReportCatalogItem[]>([]);
  const [sucursales, setSucursales] = useState<SucursalOption[]>([]);
  const [sucursalesLoading, setSucursalesLoading] = useState(true);
  const [sucursalesError, setSucursalesError] = useState('');
  const [proveedores, setProveedores] = useState<ProveedorOption[]>([]);
  const [proveedoresLoading, setProveedoresLoading] = useState(true);
  const [proveedoresError, setProveedoresError] = useState('');
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
      .map((key) => ({
        accessorKey: key,
        header: key,
        Cell: ({ cell }) => formatCellValue(cell.getValue(), key),
      }));
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

  const handleReportChange = (metodoApi: string) => {
    setSelectedReportKey(metodoApi);
    setFilters({ ...initialFilters });
    setReportRows([]);
    setQueryError(false);
    setQueryMessage('');
  };

  const handleFilterChange = (key: FilterName, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
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
          : selectedReport.metodoApi === 'sp_reporte_inventario_compras'
            ? ReportesApis.inventarioCompras
            : null;

    if (!reportEndpoint) {
      setReportRows([]);
      setQueryMessage(
        `El reporte «${selectedReport.descripcion}» aún no tiene conectada su API de consulta en Berllano.`,
      );
      return;
    }

    if (!filters.fechaInicial || !filters.fechaFinal) {
      setQueryError(true);
      setQueryMessage('Selecciona la fecha inicial y la fecha final para consultar el reporte.');
      return;
    }

    setQueryLoading(true);
    setQueryMessage('');
    const params = {
      suc: filters.sucursal.trim() || '%',
      f1: filters.fechaInicial,
      f2: filters.fechaFinal,
      ...(selectedReport.metodoApi === 'sp_reporte_inventario_compras'
        ? {
            marca: filters.marca.trim() || '%',
            familia: filters.familia.trim() || '%',
            clave_prod: filters.clave_prod.trim() || '%',
            cadena_areas: filters.cadena_areas.trim() || '%',
            proveedor: filters.proveedor.trim() || '%',
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
          <MenuItem value="">Todos los proveedores</MenuItem>
          {proveedores.map((proveedor) => (
            <MenuItem key={`${proveedor.value}-${proveedor.label}`} value={proveedor.value}>
              {proveedor.label}
            </MenuItem>
          ))}
        </TextField>
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

      <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 2 }}>
        El selector se carga desde <strong>sp_cat_reportesSel2</strong>. Los reportes de medios de pagos e inventario de compras ya están conectados; las demás consultas se agregarán conforme se proporcionen sus APIs de Berllano.
      </Alert>

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

        {Object.keys(summary).some((key) => ['total', 'importe', 'saldoinicial', 'saldocompras', 'saldopagos', 'saldofinal'].includes(key.toLowerCase())) && (
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
    </Box>
  );
}
