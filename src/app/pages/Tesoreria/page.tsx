import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
import ArrowForward from '@mui/icons-material/ArrowForward';
import AccountBalance from '@mui/icons-material/AccountBalance';
import Search from '@mui/icons-material/Search';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { useNavigate } from 'react-router-dom';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { useSessionContext } from '../../../context/SessionProvider';
import { routes } from '../../../utils/Routes';
import { ReportesApis } from '../Reportes/apis/ReportesApis';

type MovimientoRow = Record<string, unknown>;

type Opcion = {
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const columnasMovimientos: MRT_ColumnDef<MovimientoRow>[] = [
  {
    accessorFn: (row) => String(leerValor(row, ['consecutivo', 'seg', 'seguridad', 'secuencia']) ?? ''),
    id: 'seg',
    header: 'SEG.',
    size: 55,
  },
  {
    accessorFn: (row) => {
      const fecha = leerValor(row, ['fecha']);
      return fecha ? String(fecha).slice(0, 10) : '';
    },
    id: 'fecha',
    header: 'FECHA',
    size: 95,
  },
  {
    accessorFn: (row) => String(leerValor(row, ['folio']) ?? ''),
    id: 'folio',
    header: 'FOLIO',
    size: 80,
  },
  {
    accessorFn: (row) =>
      String(
        leerValor(row, ['origen', 'origen_destino', 'origenDestino', 'destino']) ?? '',
      ),
    id: 'origen_destino',
    header: 'ORIGEN - DESTINO',
    size: 320,
  },
  {
    accessorFn: (row) => String(leerValor(row, ['desc_estatus', 'st', 'estatus', 'estado']) ?? ''),
    id: 'st',
    header: 'ST.',
    size: 55,
  },
  {
    accessorFn: (row) => numero(leerValor(row, ['retiros', 'retiro'])),
    id: 'retiros',
    header: 'RETIROS',
    size: 100,
    Cell: ({ cell }) => moneda(cell.getValue()),
    muiTableBodyCellProps: { align: 'right' },
  },
  {
    accessorFn: (row) => numero(leerValor(row, ['depositos', 'deposito'])),
    id: 'depositos',
    header: 'DEPOSITOS',
    size: 100,
    Cell: ({ cell }) => moneda(cell.getValue()),
    muiTableBodyCellProps: { align: 'right' },
  },
  {
    accessorFn: (row) => numero(leerValor(row, ['balance', 'saldo', 'importe'])),
    id: 'balance',
    header: 'BALANCE',
    size: 120,
    Cell: ({ cell }) => moneda(cell.getValue()),
    muiTableBodyCellProps: { align: 'right' },
  },
];

export default function TesoreriaPage() {
  const navigate = useNavigate();
  const { consumoApi } = useConsumoApi();
  const apiRef = useRef(consumoApi);
  apiRef.current = consumoApi;
  const { session } = useSessionContext();

  const [tab, setTab] = useState(0);
  const [cuenta, setCuenta] = useState('');
  const [sucursal, setSucursal] = useState('');
  const [estatus, setEstatus] = useState('');
  const [fechaInicial, setFechaInicial] = useState('2022-11-17');
  const [fechaFinal, setFechaFinal] = useState(fechaHoy());

  const [cuentas, setCuentas] = useState<Opcion[]>([]);
  const [sucursales, setSucursales] = useState<Opcion[]>([]);
  const [estatusOpciones, setEstatusOpciones] = useState<Opcion[]>([]);
  const [filas, setFilas] = useState<MovimientoRow[]>([]);
  const [seleccionado, setSeleccionado] = useState<MovimientoRow | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [consultado, setConsultado] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const { data } = await apiRef.current.get(
          '/api/CatTesoreria/sp_bw_cat_cuentas_bancarias_sel',
          { params: { cia: session?.cia ?? session?.idCia ?? 1 } },
        );
        const lista = Array.isArray(data) ? data : [];
        setCuentas(
          lista
            .map((item: any) => ({
              value: String(item.Cuenta ?? item.cuenta ?? ''),
              label: String(item.Descripcion ?? item.descripcion ?? ''),
            }))
            .filter((item) => item.value !== ''),
        );
      } catch (error) {
        console.error('Error al cargar cuentas:', error);
      }

      try {
        const { data } = await apiRef.current.get(ReportesApis.sucursales);
        const lista = Array.isArray(data) ? data : [];
        setSucursales(
          lista
            .map((item: any) => ({
              value: String(item.cve_sucursal ?? item.value ?? ''),
              label: String(item.nombre ?? item.label ?? ''),
            }))
            .filter(
              (item) =>
                item.value !== '' &&
                item.label.toUpperCase() !== 'TODAS' &&
                item.value !== '*' &&
                item.value !== '%',
            ),
        );
      } catch (error) {
        console.error('Error al cargar sucursales:', error);
      }

      try {
        const { data } = await apiRef.current.get(
          '/api/CatTesoreria/sp_bw_cat_estatus_tesoreria_sel',
        );
        const lista = Array.isArray(data) ? data : [];
        setEstatusOpciones(
          lista
            .map((item: any) => ({
              value: String(item.Estatus ?? item.estatus ?? ''),
              label: String(item.Descripcion ?? item.descripcion ?? ''),
            }))
            .filter((item) => item.value !== ''),
        );
      } catch (error) {
        console.error('Error al cargar estatus:', error);
      }
    };
    void cargarCatalogos();
  }, [session?.cia, session?.idCia]);

  const buscar = async () => {
    if (!fechaInicial || !fechaFinal) {
      setMensaje('Selecciona la fecha inicial y la fecha final.');
      return;
    }
    if (fechaInicial > fechaFinal) {
      setMensaje('La fecha inicial no puede ser mayor que la fecha final.');
      return;
    }

    if (!cuenta) {
      setMensaje('Selecciona la cuenta bancaria.');
      return;
    }

    setMensaje('');
    setConsultando(true);
    setSeleccionado(null);
    try {
      const sucursalSeleccionada =
        sucursales.find((opcion) => opcion.value === sucursal)?.label ?? '';
      const { data } = await apiRef.current.get(
        '/api/CatTesoreria/sp_bw_busqueda_detalle_tesoreria_sel',
        {
          params: {
            fechaInicio: fechaInicial,
            fechaFin: fechaFinal,
            cuentaBancaria: cuenta,
            estatus: estatus || '*',
            sucursal: sucursalSeleccionada || 'TODAS',
            incluirSaldoInicial: 1,
          },
          timeout: 120000,
        },
      );
      setFilas(Array.isArray(data) ? data : []);
      setConsultado(true);
    } catch (error: any) {
      console.error('Error al consultar movimientos de tesorería:', error);
      setFilas([]);
      setConsultado(true);
      setMensaje(
        error?.response?.data?.mensaje ||
          error?.response?.data?.detalle ||
          'No fue posible consultar los movimientos de tesorería.',
      );
    } finally {
      setConsultando(false);
    }
  };

  const totales = useMemo(
    () => ({
      retiros: filas.reduce((acc, fila) => acc + numero(leerValor(fila, ['retiros', 'retiro'])), 0),
      depositos: filas.reduce((acc, fila) => acc + numero(leerValor(fila, ['depositos', 'deposito'])), 0),
    }),
    [filas],
  );

  const descripcion = String(leerValor(seleccionado ?? {}, ['descripcion']) ?? '');
  const memo = String(leerValor(seleccionado ?? {}, ['memo', 'nota']) ?? '');

  return (
    <Box sx={{ pb: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton aria-label="Regresar" onClick={() => navigate(routes.mainMenu)}>
          <ArrowBack />
        </IconButton>
        <AccountBalance sx={{ fontSize: 34 }} />
        <Typography variant="h4">Tesorería</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="body2" sx={{ color: 'grey.700' }}>
          SUC: {session?.dSucursal ?? session?.sucursal ?? ''}
        </Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          <TextField
            label="CUENTA"
            select
            size="small"
            value={cuenta}
            disabled={consultando}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', md: 220 } }}
            onChange={(event) => setCuenta(event.target.value)}
          >
            <MenuItem value="">TODAS</MenuItem>
            {cuentas.map((opcion) => (
              <MenuItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="SUCURSAL"
            select
            size="small"
            value={sucursal}
            disabled={consultando}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', md: 200 } }}
            onChange={(event) => setSucursal(event.target.value)}
          >
            <MenuItem value="">TODAS</MenuItem>
            {sucursales.map((opcion) => (
              <MenuItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="ESTATUS"
            select
            size="small"
            value={estatus}
            disabled={consultando}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', md: 160 } }}
            onChange={(event) => setEstatus(event.target.value)}
          >
            {estatusOpciones.length > 0 ? (
              estatusOpciones.map((opcion) => (
                <MenuItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="">TODOS</MenuItem>
            )}
          </TextField>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">Del</Typography>
            <TextField
              type="date"
              size="small"
              value={fechaInicial}
              disabled={consultando}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setFechaInicial(event.target.value)}
            />
            <Typography variant="body2">Al</Typography>
            <TextField
              type="date"
              size="small"
              value={fechaFinal}
              disabled={consultando}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setFechaFinal(event.target.value)}
            />
          </Stack>
          <Button
            variant="contained"
            onClick={() => void buscar()}
            disabled={consultando}
            startIcon={consultando ? <CircularProgress size={16} color="inherit" /> : <Search />}
            sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
          >
            {consultando ? 'Buscando...' : 'Buscar'}
          </Button>
          <Button variant="outlined" disabled sx={{ ml: 'auto' }}>
            Tesorería Corporativa
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
          <Tab label="Resumen de la Tesorería" />
          <Tab label="Depositos" />
          <Tab label="Retiros" />
          <Tab label="Transferencias" />
          <Tab label="Procesos de Enlace de Ingresos" />
        </Tabs>

        {tab === 0 && (
          <>
            {consultando && (
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ py: 4 }}>
                <CircularProgress size={22} />
                <Typography>Consultando movimientos...</Typography>
              </Stack>
            )}

            {!consultando && filas.length > 0 && (
              <>
                <MaterialReactTable
                  columns={[
                    {
                      id: 'seleccion',
                      header: '',
                      size: 40,
                      enableColumnActions: false,
                      Cell: ({ row }) => (
                        <IconButton
                          size="small"
                          onClick={() => setSeleccionado(row.original)}
                          color={seleccionado === row.original ? 'primary' : 'default'}
                        >
                          <ArrowForward fontSize="small" />
                        </IconButton>
                      ),
                    },
                    {
                      id: 'check',
                      header: '',
                      size: 40,
                      enableColumnActions: false,
                      Cell: () => <Checkbox size="small" />,
                    },
                    ...columnasMovimientos,
                  ]}
                  data={filas}
                  enableColumnActions={false}
                  enableDensityToggle={false}
                  enableFullScreenToggle={false}
                  layoutMode="grid-noGrow"
                  initialState={{ density: 'compact', pagination: { pageSize: 25, pageIndex: 0 } }}
                  muiTableProps={{ sx: { fontSize: '0.8rem' } }}
                  muiTableBodyRowProps={({ row }) => ({
                    onClick: () => setSeleccionado(row.original),
                    selected: seleccionado === row.original,
                    sx: { cursor: 'pointer' },
                  })}
                />

                <Stack
                  direction="row"
                  spacing={4}
                  justifyContent="flex-end"
                  sx={{ mt: 1.5, pr: 2 }}
                >
                  <Typography variant="body2">{moneda(totales.retiros)}</Typography>
                  <Typography variant="body2">{moneda(totales.depositos)}</Typography>
                  <Typography variant="body2">
                    Diferencia: <b>{moneda(totales.retiros - totales.depositos)}</b>
                  </Typography>
                </Stack>

                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Descripción: <b>{descripcion || '—'}</b>
                  </Typography>
                  <Typography variant="body2">
                    Memo: <b>{memo || '—'}</b>
                  </Typography>
                </Stack>
              </>
            )}

            {!consultando && filas.length === 0 && (
              <Paper variant="outlined" sx={{ py: 6, textAlign: 'center' }}>
                <AccountBalance color="disabled" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">
                  {consultado ? 'Sin movimientos en el periodo' : 'Selecciona los filtros y presiona Buscar'}
                </Typography>
              </Paper>
            )}

            <Stack
              direction="row"
              spacing={2}
              justifyContent="space-between"
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 3 }}
            >
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" size="small" disabled>
                  Control de Validaciones
                </Button>
                <Button variant="outlined" size="small" disabled>
                  Control de Conciliacione
                </Button>
                <Button variant="outlined" size="small" disabled>
                  Saldos a Depositar
                </Button>
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" size="small" disabled>
                  S. Admitidos
                </Button>
                <Button variant="outlined" size="small" disabled>
                  S. Conciliados
                </Button>
                <Button variant="outlined" size="small" disabled>
                  Saldos
                </Button>
              </Stack>
            </Stack>
          </>
        )}

        {tab !== 0 && (
          <Alert severity="info">
            Esta pestaña quedará habilitada cuando me pases su SP correspondiente.
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
