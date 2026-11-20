import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
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

type ClienteRow = Record<string, unknown>;

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

const textoCol = (id: string, header: string, size = 110): MRT_ColumnDef<ClienteRow> => ({
  accessorFn: (row) => String(leerValor(row, [id]) ?? ''),
  id,
  header,
  size,
});

const numeroCol = (id: string, header: string, size = 95): MRT_ColumnDef<ClienteRow> => ({
  accessorFn: (row) => numero(leerValor(row, [id])),
  id,
  header,
  size,
  muiTableBodyCellProps: { align: 'right' },
});

const monedaCol = (id: string, header: string, size = 110): MRT_ColumnDef<ClienteRow> => ({
  accessorFn: (row) => numero(leerValor(row, [id])),
  id,
  header,
  size,
  Cell: ({ cell }) => moneda(cell.getValue()),
  muiTableBodyCellProps: { align: 'right' },
});

const columnasResumen1: MRT_ColumnDef<ClienteRow>[] = [
  textoCol('cve_cliente', 'Clave', 80),
  textoCol('sucursal_origen', 'Suc.', 60),
  textoCol('nombre', 'Sucursal', 120),
  textoCol('nombreCliente', 'Cliente', 260),
  textoCol('fecha_nac', 'Fecha nac.', 100),
  textoCol('genero', 'Género', 100),
  textoCol('celular', 'Celular', 110),
  textoCol('email', 'Email', 160),
  textoCol('fechaUltimaCompra', 'Última compra', 110),
  numeroCol('numeroVisitas', 'Visitas', 80),
  textoCol('cp', 'CP', 80),
  monedaCol('promedioVenta_reventa', 'Reventa'),
  monedaCol('promedioVentaTratamientos', 'Tratamientos'),
  monedaCol('promedioVenta_Quimicos_Color', 'Q. Color'),
  monedaCol('promedioVenta_Quimicos_Alaciados', 'Q. Alaciados'),
  monedaCol('promedioVenta_Servicios', 'Servicios'),
  monedaCol('promedioVenta', 'Promedio venta'),
  numeroCol('Cortes', 'Cortes', 80),
  numeroCol('Servicios_color', 'Serv. color', 90),
  numeroCol('Tratamientos', 'Tratamientos', 100),
  numeroCol('Alaciados_Tratamientos', 'Alaciados', 90),
  numeroCol('Barberia', 'Barbería', 80),
];

const columnasDetalle: MRT_ColumnDef<ClienteRow>[] = [
  textoCol('St', 'Suc.', 40),
  textoCol('nombre', 'Sucursal', 140),
  textoCol('estilista', 'Estilista', 160),
  {
    accessorFn: (row) => {
      const fecha = leerValor(row, ['fecha']);
      return fecha ? String(fecha).slice(0, 10) : '';
    },
    id: 'fecha',
    header: 'Fecha',
    size: 110,
  },
  textoCol('Clave_pr', 'Clave', 110),
  textoCol('descripcion', 'Descripción', 450),
  monedaCol('venta', 'Venta', 85),
];

function DetalleCliente({
  cveCliente,
  f1,
  f2,
}: {
  cveCliente: string;
  f1: string;
  f2: string;
}) {
  const { consumoApi } = useConsumoApi();
  const apiRef = useRef(consumoApi);
  apiRef.current = consumoApi;
  const [filas, setFilas] = useState<ClienteRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      setCargando(true);
      try {
        const { data } = await apiRef.current.get(ReportesApis.clientesDetalle, {
          params: {
            cve_cliente: cveCliente,
            f1: f1.replace(/-/g, ''),
            f2: f2.replace(/-/g, ''),
          },
          timeout: 120000,
        });
        if (activo) setFilas(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Error al consultar el detalle del cliente:', err);
        if (activo) {
          setFilas([]);
          setError(
            err?.response?.data?.mensaje ||
              err?.response?.data?.detalle ||
              'No fue posible consultar el detalle del cliente.',
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    };
    void cargar();
    return () => {
      activo = false;
    };
  }, [cveCliente, f1, f2]);

  if (cargando) {
    return (
      <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 2, pl: 4 }}>
        <CircularProgress size={18} />
        <Typography variant="body2">Cargando detalle...</Typography>
      </Stack>
    );
  }

  if (error) return <Alert severity="warning" sx={{ m: 1 }}>{error}</Alert>;
  if (filas.length === 0) return <Alert severity="info" sx={{ m: 1 }}>Sin detalle para este cliente.</Alert>;

  const total = filas.reduce((acc, fila) => acc + numero(leerValor(fila, ['venta'])), 0);

  return (
    <Box sx={{ pl: 4, pr: 2, py: 1 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Registros: <b>{filas.length}</b> — Total: <b>{moneda(total)}</b>
      </Typography>
      <MaterialReactTable
        columns={columnasDetalle}
        data={filas}
        enableColumnActions={false}
        enableDensityToggle={false}
        enableFullScreenToggle={false}
        enablePagination={false}
        enableBottomToolbar={false}
        layoutMode="grid-noGrow"
        initialState={{ density: 'compact' }}
        muiTableProps={{ sx: { fontSize: '0.78rem' } }}
      />
    </Box>
  );
}

export default function ReporteClientesResumenPage() {
  const navigate = useNavigate();
  const { consumoApi } = useConsumoApi();
  const apiRef = useRef(consumoApi);
  apiRef.current = consumoApi;
  const { session } = useSessionContext();

  const [tab, setTab] = useState(0);
  const [fechaInicial, setFechaInicial] = useState(fechaHoy());
  const [fechaFinal, setFechaFinal] = useState(fechaHoy());
  const [sucursal, setSucursal] = useState(String(session?.sucursal ?? ''));
  const [sucursales, setSucursales] = useState<SucursalOption[]>([]);
  const [filas, setFilas] = useState<ClienteRow[]>([]);
  const [consultando, setConsultando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [consultado, setConsultado] = useState(false);

  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        const { data } = await apiRef.current.get(ReportesApis.sucursales);
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
    void cargarSucursales();
  }, []);

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

    setMensaje('');
    setConsultando(true);
    try {
      const { data } = await consumoApi.get(ReportesApis.clientesResumen, {
        params: {
          f1: fechaInicial.replace(/-/g, ''),
          f2: fechaFinal.replace(/-/g, ''),
          sucursal: sucursal || '%',
        },
        timeout: 120000,
      });
      setFilas(Array.isArray(data) ? data : []);
      setConsultado(true);
    } catch (error: any) {
      console.error('Error al consultar el resumen de clientes:', error);
      setFilas([]);
      setConsultado(true);
      setMensaje(
        error?.response?.data?.mensaje ||
          error?.response?.data?.detalle ||
          'No fue posible consultar el resumen de clientes.',
      );
    } finally {
      setConsultando(false);
    }
  };

  const exportarExcel = () => {
    if (filas.length === 0) return;
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, `Resumen ${tab + 1}`);
    XLSX.writeFile(
      libro,
      `clientes_resumen${tab + 1}_${fechaInicial}_${fechaFinal}_suc${sucursal || 'todas'}.xlsx`,
    );
  };

  const totales = useMemo(
    () => ({
      visitas: filas.reduce((acc, fila) => acc + numero(leerValor(fila, ['numeroVisitas'])), 0),
      promedio: filas.reduce((acc, fila) => acc + numero(leerValor(fila, ['promedioVenta'])), 0),
    }),
    [filas],
  );

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton aria-label="Regresar al menú principal" onClick={() => navigate(routes.mainMenu)}>
          <ArrowBack />
        </IconButton>
        <Assessment sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h4">Reporte de Clientes</Typography>
          <Typography variant="body2" sx={{ color: 'grey.700' }}>
            Clientes atendidos por periodo
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
            sx={{ width: { xs: '100%', sm: 170 } }}
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
            sx={{ width: { xs: '100%', sm: 170 } }}
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
            value={sucursal}
            disabled={consultando}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 220 } }}
            onChange={(event) => {
              setSucursal(event.target.value);
              setConsultado(false);
              setMensaje('');
            }}
          >
            <MenuItem value="">TODAS</MenuItem>
            {sucursales.map((opcion) => (
              <MenuItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </MenuItem>
            ))}
          </TextField>
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

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Resumen 1" />
          <Tab label="Resumen 2" />
        </Tabs>

        {tab === 0 && (
          <>
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
                <Typography>Consultando resumen de clientes...</Typography>
              </Stack>
            )}

            {!consultando && filas.length > 0 && (
              <>
                <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                  <Typography variant="body2">Registros: <b>{filas.length}</b></Typography>
                  <Typography variant="body2">Visitas: <b>{totales.visitas}</b></Typography>
                  <Typography variant="body2">
                    Suma prom. venta: <b>{moneda(totales.promedio)}</b>
                  </Typography>
                </Stack>

                <MaterialReactTable
                  columns={columnasResumen1}
                  data={filas}
                  enableColumnActions={false}
                  enableDensityToggle={false}
                  enableFullScreenToggle={false}
                  enableExpanding
                  renderDetailPanel={({ row }) => (
                    <DetalleCliente
                      cveCliente={String(leerValor(row.original, ['cve_cliente']) ?? '')}
                      f1={fechaInicial}
                      f2={fechaFinal}
                    />
                  )}
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
              </Paper>
            )}
          </>
        )}

        {tab === 1 && (
          <Alert severity="info">
            Resumen 2 pendiente: en cuanto pases su SP lo conecto aquí.
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
