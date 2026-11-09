import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Assessment from '@mui/icons-material/Assessment';
import Download from '@mui/icons-material/Download';
import Search from '@mui/icons-material/Search';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { useSessionContext } from '../../../context/SessionProvider';
import { routes } from '../../../utils/Routes';
import { ReportesApis } from '../Reportes/apis/ReportesApis';

type ConteoRow = Record<string, unknown>;

type SucursalOption = {
  value: string;
  label: string;
};

const fechaHoy = () => {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const leerValor = (item: Record<string, unknown>, nombres: string[]) => {
  const claves = Object.keys(item);
  for (const nombre of nombres) {
    const clave = claves.find((k) => k.toLowerCase() === nombre.toLowerCase());
    if (clave !== undefined && item[clave] !== null && item[clave] !== undefined) {
      return item[clave];
    }
  }
  return undefined;
};

const numero = (valor: unknown) => {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const moneda = (valor: unknown) =>
  numero(valor).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  });

const cantidad = (valor: unknown) =>
  numero(valor).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const columnas: MRT_ColumnDef<ConteoRow>[] = [
  {
    accessorFn: (row) => String(leerValor(row, ['Fecha_cierre']) ?? ''),
    id: 'Fecha_cierre',
    header: 'Fecha cierre',
    size: 120,
  },
  {
    accessorFn: (row) => String(leerValor(row, ['Clave_sucursal']) ?? ''),
    id: 'Clave_sucursal',
    header: 'Sucursal',
    size: 90,
  },
  {
    accessorFn: (row) => String(leerValor(row, ['Usuario']) ?? ''),
    id: 'Usuario',
    header: 'Usuario',
    size: 100,
  },
  {
    accessorFn: (row) => String(leerValor(row, ['marca']) ?? ''),
    id: 'marca',
    header: 'Marca',
    size: 140,
  },
  {
    accessorFn: (row) => String(leerValor(row, ['clave']) ?? ''),
    id: 'clave',
    header: 'Clave',
    size: 110,
  },
  {
    accessorFn: (row) => String(leerValor(row, ['descripcion']) ?? ''),
    id: 'descripcion',
    header: 'Familia',
    size: 150,
  },
  {
    accessorFn: (row) => String(leerValor(row, ['Clave_prod']) ?? ''),
    id: 'Clave_prod',
    header: 'Clave producto',
    size: 130,
  },
  {
    accessorFn: (row) => String(leerValor(row, ['desc_producto']) ?? ''),
    id: 'desc_producto',
    header: 'Producto',
    size: 260,
  },
  {
    accessorFn: (row) => String(leerValor(row, ['obsoleto']) ?? ''),
    id: 'obsoleto',
    header: 'Obs.',
    size: 70,
  },
  {
    accessorFn: (row) => moneda(leerValor(row, ['precio'])),
    id: 'precio',
    header: 'Precio',
    size: 100,
  },
  {
    accessorFn: (row) => moneda(leerValor(row, ['costo_c_iva'])),
    id: 'costo_c_iva',
    header: 'Costo c/IVA',
    size: 110,
  },
  {
    accessorFn: (row) => cantidad(leerValor(row, ['Existencia'])),
    id: 'Existencia',
    header: 'Existencia',
    size: 100,
  },
  {
    accessorFn: (row) => cantidad(leerValor(row, ['entrada'])),
    id: 'entrada',
    header: 'Entrada',
    size: 90,
  },
  {
    accessorFn: (row) => cantidad(leerValor(row, ['salida'])),
    id: 'salida',
    header: 'Salida',
    size: 90,
  },
  {
    accessorFn: (row) => cantidad(leerValor(row, ['Conteo_Fisico'])),
    id: 'Conteo_Fisico',
    header: 'Conteo físico',
    size: 110,
  },
  {
    accessorFn: (row) => moneda(leerValor(row, ['Ajuste_precio'])),
    id: 'Ajuste_precio',
    header: 'Ajuste precio',
    size: 110,
  },
  {
    accessorFn: (row) => moneda(leerValor(row, ['Ajuste_costo'])),
    id: 'Ajuste_costo',
    header: 'Ajuste costo',
    size: 110,
  },
  {
    accessorFn: (row) => String(leerValor(row, ['desc_area']) ?? ''),
    id: 'desc_area',
    header: 'Área',
    size: 140,
  },
];

export default function ReporteConteosMarcaPage() {
  const navigate = useNavigate();
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  const [fechaInicial, setFechaInicial] = useState(fechaHoy());
  const [fechaFinal, setFechaFinal] = useState(fechaHoy());
  const [sucursal, setSucursal] = useState(String(session?.sucursal ?? ''));
  const [marca, setMarca] = useState('');
  const [sucursales, setSucursales] = useState<SucursalOption[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [filas, setFilas] = useState<ConteoRow[]>([]);
  const [consultando, setConsultando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [consultado, setConsultado] = useState(false);

  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        const { data } = await consumoApi.get(ReportesApis.sucursales);
        const lista = Array.isArray(data) ? data : [];
        setSucursales(
          lista
            .map((item: any) => ({
              value: String(item.cve_sucursal ?? item.value ?? ''),
              label: String(item.nombre ?? item.label ?? ''),
            }))
            .filter((item) => item.value !== ''),
        );
      } catch (error) {
        console.error('Error al cargar sucursales:', error);
      }
    };

    const cargarMarcas = async () => {
      try {
        const { data } = await consumoApi.get(ReportesApis.marcas);
        const lista = Array.isArray(data) ? data : [];
        const nombres = lista
          .map((item: any) => String(item.marca ?? item.label ?? '').trim())
          .filter((nombre: string) => nombre !== '');
        setMarcas([...new Set(nombres)]);
      } catch (error) {
        console.error('Error al cargar marcas:', error);
      }
    };

    void cargarSucursales();
    void cargarMarcas();
  }, [consumoApi]);

  useEffect(() => {
    if (!sucursal && session?.sucursal) setSucursal(String(session.sucursal));
  }, [session?.sucursal, sucursal]);

  const consultar = async () => {
    if (!fechaInicial || !fechaFinal) {
      setMensaje('Selecciona la fecha inicial y la fecha final.');
      return;
    }
    if (fechaInicial > fechaFinal) {
      setMensaje('La fecha inicial no puede ser mayor que la fecha final.');
      return;
    }
    if (!sucursal) {
      setMensaje('Selecciona una sucursal.');
      return;
    }

    setMensaje('');
    setConsultando(true);
    try {
      const { data } = await consumoApi.get(ReportesApis.conteosMarcaFamilia, {
        params: {
          f1: fechaInicial,
          f2: fechaFinal,
          suc: Number(sucursal),
          marca: marca.trim() || '%',
        },
        timeout: 120000,
      });

      setFilas(Array.isArray(data) ? data : []);
      setConsultado(true);
    } catch (error: any) {
      console.error('Error al consultar conteos por marca:', error);
      setFilas([]);
      setConsultado(true);
      setMensaje(
        error?.response?.data?.mensaje ||
          error?.response?.data?.detalle ||
          'No fue posible consultar el reporte de conteos por marca.',
      );
    } finally {
      setConsultando(false);
    }
  };

  const exportarExcel = () => {
    if (filas.length === 0) return;
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Conteos por marca');
    XLSX.writeFile(
      libro,
      `conteos_por_marca_${fechaInicial}_${fechaFinal}_suc${sucursal}.xlsx`,
    );
  };

  const totales = useMemo(() => {
    const suma = (campo: string) =>
      filas.reduce((acumulado, fila) => acumulado + numero(leerValor(fila, [campo])), 0);

    return {
      existencia: suma('Existencia'),
      entrada: suma('entrada'),
      salida: suma('salida'),
      conteo: suma('Conteo_Fisico'),
      ajustePrecio: suma('Ajuste_precio'),
      ajusteCosto: suma('Ajuste_costo'),
    };
  }, [filas]);

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton aria-label="Regresar al menú principal" onClick={() => navigate(routes.mainMenu)}>
          <ArrowBack />
        </IconButton>
        <Assessment sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h4">Reporte de Conteos por Marca</Typography>
          <Typography variant="body2" sx={{ color: 'grey.700' }}>
            Conteos físicos y ajustes por marca y familia
          </Typography>
        </Box>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Filtros del reporte</Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          <TextField
            label="Fecha inicial"
            type="date"
            size="small"
            required
            value={fechaInicial}
            disabled={consultando}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 180 } }}
            onChange={(event) => {
              setFechaInicial(event.target.value);
              setConsultado(false);
              setMensaje('');
            }}
          />
          <TextField
            label="Fecha final"
            type="date"
            size="small"
            required
            value={fechaFinal}
            disabled={consultando}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 180 } }}
            onChange={(event) => {
              setFechaFinal(event.target.value);
              setConsultado(false);
              setMensaje('');
            }}
          />
          <TextField
            label="Sucursal"
            select
            size="small"
            required
            value={sucursal}
            disabled={consultando}
            sx={{ width: { xs: '100%', sm: 220 } }}
            onChange={(event) => {
              setSucursal(event.target.value);
              setConsultado(false);
              setMensaje('');
            }}
          >
            <MenuItem value="">Seleccionar sucursal</MenuItem>
            {sucursales.map((opcion) => (
              <MenuItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete
            freeSolo
            size="small"
            options={marcas}
            value={marca}
            disabled={consultando}
            sx={{ width: { xs: '100%', sm: 240 } }}
            onChange={(_, value) => {
              setMarca(String(value ?? ''));
              setConsultado(false);
              setMensaje('');
            }}
            onInputChange={(_, value) => {
              setMarca(value ?? '');
            }}
            renderInput={(params) => (
              <TextField {...params} label="Marca" placeholder="Todas" />
            )}
          />
          <Button
            variant="contained"
            onClick={() => void consultar()}
            disabled={consultando}
            startIcon={consultando ? <CircularProgress size={16} color="inherit" /> : <Search />}
          >
            {consultando ? 'Consultando...' : 'Consultar'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            disabled={filas.length === 0 || consultando}
            onClick={exportarExcel}
          >
            Excel
          </Button>
        </Stack>
      </Paper>

      {mensaje && <Alert severity="warning" sx={{ mb: 2 }}>{mensaje}</Alert>}

      {consultando && (
        <Stack
          role="status"
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{ py: 3 }}
        >
          <CircularProgress size={22} />
          <Typography>Consultando conteos por marca...</Typography>
        </Stack>
      )}

      {!consultando && filas.length > 0 && (
        <>
          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
            <Typography variant="body2">Registros: <b>{filas.length}</b></Typography>
            <Typography variant="body2">Existencia: <b>{cantidad(totales.existencia)}</b></Typography>
            <Typography variant="body2">Entradas: <b>{cantidad(totales.entrada)}</b></Typography>
            <Typography variant="body2">Salidas: <b>{cantidad(totales.salida)}</b></Typography>
            <Typography variant="body2">Conteo físico: <b>{cantidad(totales.conteo)}</b></Typography>
            <Typography variant="body2">Ajuste costo: <b>{moneda(totales.ajusteCosto)}</b></Typography>
            <Typography variant="body2">Ajuste precio: <b>{moneda(totales.ajustePrecio)}</b></Typography>
          </Stack>

          <MaterialReactTable
            columns={columnas}
            data={filas}
            enableColumnActions={false}
            enableDensityToggle={false}
            enableFullScreenToggle={false}
            initialState={{ density: 'compact', pagination: { pageSize: 25, pageIndex: 0 } }}
            muiTableProps={{ sx: { fontSize: '0.8rem' } }}
          />
        </>
      )}

      {!consultando && filas.length === 0 && (
        <Paper variant="outlined" sx={{ py: 7, px: 2, textAlign: 'center' }}>
          <Assessment color="disabled" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h6">
            {consultado ? 'Sin datos para el periodo seleccionado' : 'Selecciona los filtros para comenzar'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.700' }}>
            Consulta el reporte para ver existencia, entradas, salidas, conteo físico y ajustes.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
