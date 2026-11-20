import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
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

type VisitaRow = Record<string, unknown>;

type NivelContexto = {
  estilista?: string;
  claveCliente?: string;
  genero?: string;
  clave_prod?: string;
};

type NivelResultado = {
  nivel: number;
  filas: VisitaRow[];
  contexto: NivelContexto;
};

const NIVEL_MAXIMO = 4;

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

const titulosNivel: Record<number, string> = {
  1: 'Resumen por colaborador',
  2: 'Clientes atendidos',
  3: 'Productos y servicios del cliente',
  4: 'Ventas por folio',
};

export default function ReporteVisitasClientesPuestosPage() {
  const navigate = useNavigate();
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  const sucursalSesion = Number(session?.sucursal ?? 0);

  const [fechaInicial, setFechaInicial] = useState(fechaHoy());
  const [fechaFinal, setFechaFinal] = useState(fechaHoy());
  const [sucursal, setSucursal] = useState(String(sucursalSesion || ''));
  const [puesto, setPuesto] = useState('');
  const [sucursales, setSucursales] = useState<{ value: string; label: string }[]>([]);

  const [niveles, setNiveles] = useState<NivelResultado[]>([]);
  const [consultando, setConsultando] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');

  const apiRef = useRef(consumoApi);
  apiRef.current = consumoApi;

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
    if (!sucursal && sucursalSesion > 0) setSucursal(String(sucursalSesion));
  }, [sucursalSesion, sucursal]);

  const validarFiltros = () => {
    if (!fechaInicial || !fechaFinal) {
      setMensaje('Selecciona la fecha inicial y la fecha final.');
      return false;
    }
    if (fechaInicial > fechaFinal) {
      setMensaje('La fecha inicial no puede ser mayor que la fecha final.');
      return false;
    }
    return true;
  };

  const rangoSucursal = {
    s1: sucursal ? Number(sucursal) : 0,
    s2: sucursal ? Number(sucursal) : 99999,
  };

  const rangoPuesto = {
    puesto1: puesto ? Number(puesto) : 1,
    puesto2: puesto ? Number(puesto) : 99999,
  };

  const ejecutarNivel = async (nivel: number, contexto: NivelContexto) => {
    const { data } = await consumoApi.get(ReportesApis.visitasClientesPuestos, {
      params: {
        f1: fechaInicial.replace(/-/g, ''),
        f2: fechaFinal.replace(/-/g, ''),
        ...rangoPuesto,
        ...rangoSucursal,
        claveCliente: contexto.claveCliente ?? '',
        estilista: contexto.estilista ?? '',
        clave_prod: '',
        genero: contexto.genero ?? '',
        nivel,
      },
      timeout: 120000,
    });
    return Array.isArray(data) ? data : [];
  };

  const consultarNivel = async (nivel: number, contexto: NivelContexto) => {
    setMensaje('');
    setConsultando(nivel);
    try {
      const filas = await ejecutarNivel(nivel, contexto);
      setNiveles((prev) => [
        ...prev.filter((item) => item.nivel < nivel),
        { nivel, filas, contexto },
      ]);
    } catch (error: any) {
      console.error(`Error al consultar el nivel ${nivel}:`, error);
      setMensaje(
        error?.response?.data?.mensaje ||
          error?.response?.data?.detalle ||
          `No fue posible consultar el nivel ${nivel}.`,
      );
    } finally {
      setConsultando(null);
    }
  };

  const consultarNivelUno = () => {
    if (!validarFiltros()) return;
    setNiveles([]);
    void consultarNivel(1, {});
  };

  const abrirClientes = (fila: VisitaRow, genero: string) => {
    const usuario = String(leerValor(fila, ['User']) ?? '');
    void consultarNivel(2, { estilista: usuario, genero });
  };

  const abrirProductos = (fila: VisitaRow, contexto: NivelContexto) => {
    const cliente = String(leerValor(fila, ['cve_cliente']) ?? '');
    void consultarNivel(3, { ...contexto, claveCliente: cliente });
  };

  const abrirFolios = async (fila: VisitaRow, contexto: NivelContexto) => {
    const prod = String(leerValor(fila, ['clave_prod']) ?? '');
    setMensaje('');
    setConsultando(4);
    try {
      const { data } = await consumoApi.get(ReportesApis.visitasClientesPuestos, {
        params: {
          f1: fechaInicial.replace(/-/g, ''),
          f2: fechaFinal.replace(/-/g, ''),
          ...rangoPuesto,
          ...rangoSucursal,
          claveCliente: contexto.claveCliente ?? '',
          estilista: contexto.estilista ?? '',
          clave_prod: prod,
          genero: '',
          nivel: 4,
        },
        timeout: 120000,
      });
      setNiveles((prev) => [
        ...prev.filter((item) => item.nivel < 4),
        {
          nivel: 4,
          filas: Array.isArray(data) ? data : [],
          contexto: { ...contexto, clave_prod: prod },
        },
      ]);
    } catch (error: any) {
      console.error('Error al consultar el nivel 4:', error);
      setMensaje(
        error?.response?.data?.mensaje ||
          error?.response?.data?.detalle ||
          'No fue posible consultar el nivel 4.',
      );
    } finally {
      setConsultando(null);
    }
  };

  const exportarExcel = (item: NivelResultado) => {
    if (item.filas.length === 0) return;
    const hoja = XLSX.utils.json_to_sheet(item.filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, `Nivel ${item.nivel}`);
    XLSX.writeFile(
      libro,
      `visitas_clientes_puestos_nivel${item.nivel}_${fechaInicial}_${fechaFinal}.xlsx`,
    );
  };

  const reiniciar = () => {
    setNiveles([]);
    setMensaje('');
  };

  const columnasNivel = useMemo<Record<number, MRT_ColumnDef<VisitaRow>[]>>(
    () => ({
      1: [
        {
          accessorFn: (row) => String(leerValor(row, ['sucursal']) ?? ''),
          id: 'sucursal',
          header: 'Suc.',
          size: 70,
        },
        {
          accessorFn: (row) => String(leerValor(row, ['nombre_sucursal']) ?? ''),
          id: 'nombre_sucursal',
          header: 'Sucursal',
          size: 170,
        },
        {
          accessorFn: (row) => String(leerValor(row, ['nombre_colaborador']) ?? ''),
          id: 'nombre_colaborador',
          header: 'Colaborador',
          size: 210,
        },
        {
          accessorFn: (row) => String(leerValor(row, ['User']) ?? ''),
          id: 'User',
          header: 'Usuario',
          size: 90,
        },
        {
          accessorFn: (row) => numero(leerValor(row, ['m', 'Mujeres'])),
          id: 'm',
          header: 'Mujeres',
          size: 90,
          Cell: ({ row, renderedCellValue }) => (
            <Button
              size="small"
              variant="text"
              disabled={consultando !== null || numero(leerValor(row.original, ['m', 'Mujeres'])) === 0}
              onClick={() => abrirClientes(row.original, 'Femenino')}
              sx={{ minWidth: 0, fontWeight: 'bold' }}
            >
              {renderedCellValue}
            </Button>
          ),
          muiTableBodyCellProps: { align: 'right' },
        },
        {
          accessorFn: (row) => numero(leerValor(row, ['h', 'Hombres'])),
          id: 'h',
          header: 'Hombres',
          size: 90,
          Cell: ({ row, renderedCellValue }) => (
            <Button
              size="small"
              variant="text"
              disabled={consultando !== null || numero(leerValor(row.original, ['h', 'Hombres'])) === 0}
              onClick={() => abrirClientes(row.original, 'Masculino')}
              sx={{ minWidth: 0, fontWeight: 'bold' }}
            >
              {renderedCellValue}
            </Button>
          ),
          muiTableBodyCellProps: { align: 'right' },
        },
        {
          accessorFn: (row) => numero(leerValor(row, ['p', 'Por_Asignar'])),
          id: 'p',
          header: 'Por asignar',
          size: 100,
          Cell: ({ row, renderedCellValue }) => (
            <Button
              size="small"
              variant="text"
              disabled={consultando !== null || numero(leerValor(row.original, ['p', 'Por_Asignar'])) === 0}
              onClick={() => abrirClientes(row.original, 'Por Asignar')}
              sx={{ minWidth: 0, fontWeight: 'bold' }}
            >
              {renderedCellValue}
            </Button>
          ),
          muiTableBodyCellProps: { align: 'right' },
        },
        {
          accessorFn: (row) => String(leerValor(row, ['clave_puesto']) ?? ''),
          id: 'clave_puesto',
          header: 'Puesto',
          size: 80,
        },
      ],
      2: [
        {
          accessorFn: (row) => String(leerValor(row, ['cve_cliente']) ?? ''),
          id: 'cve_cliente',
          header: 'Clave cliente',
          size: 110,
        },
        {
          accessorFn: (row) => String(leerValor(row, ['nombre_completo']) ?? ''),
          id: 'nombre_completo',
          header: 'Cliente',
          size: 260,
        },
        {
          accessorFn: (row) => String(leerValor(row, ['nombre_sucursal']) ?? ''),
          id: 'nombre_sucursal',
          header: 'Sucursal',
          size: 170,
        },
        {
          accessorFn: (row) => String(leerValor(row, ['User']) ?? ''),
          id: 'User',
          header: 'Usuario',
          size: 90,
        },
      ],
      3: [
        {
          accessorFn: (row) => String(leerValor(row, ['clave_prod']) ?? ''),
          id: 'clave_prod',
          header: 'Clave',
          size: 120,
        },
        {
          accessorFn: (row) => String(leerValor(row, ['descripcion']) ?? ''),
          id: 'descripcion',
          header: 'Producto / Servicio',
          size: 300,
        },
        {
          accessorFn: (row) => numero(leerValor(row, ['Cantidad'])),
          id: 'Cantidad',
          header: 'Cantidad',
          size: 90,
          muiTableBodyCellProps: { align: 'right' },
        },
        {
          accessorFn: (row) => moneda(leerValor(row, ['importe'])),
          id: 'importe',
          header: 'Importe',
          size: 110,
          muiTableBodyCellProps: { align: 'right' },
        },
      ],
      4: [
        {
          accessorFn: (row) => {
            const fecha = leerValor(row, ['fecha']);
            return fecha ? String(fecha).slice(0, 10) : '';
          },
          id: 'fecha',
          header: 'Fecha',
          size: 100,
        },
        {
          accessorFn: (row) => String(leerValor(row, ['no_venta']) ?? ''),
          id: 'no_venta',
          header: 'Folio',
          size: 100,
        },
        {
          accessorFn: (row) => String(leerValor(row, ['clave_prod']) ?? ''),
          id: 'clave_prod',
          header: 'Clave',
          size: 120,
        },
        {
          accessorFn: (row) => String(leerValor(row, ['descripcion']) ?? ''),
          id: 'descripcion',
          header: 'Producto / Servicio',
          size: 300,
        },
        {
          accessorFn: (row) => moneda(leerValor(row, ['importe'])),
          id: 'importe',
          header: 'Importe',
          size: 110,
          muiTableBodyCellProps: { align: 'right' },
        },
      ],
    }),
    [consultando, niveles],
  );

  const accionesNivel = (item: NivelResultado) => ({
    id: 'acciones',
    header: '',
    size: 140,
    enableColumnActions: false,
    Cell: ({ row }: { row: { original: VisitaRow } }) => {
      if (item.nivel === 2) {
        return (
          <Button
            size="small"
            variant="outlined"
            disabled={consultando !== null}
            onClick={() => abrirProductos(row.original, item.contexto)}
          >
            Productos
          </Button>
        );
      }
      if (item.nivel === 3) {
        return (
          <Button
            size="small"
            variant="outlined"
            disabled={consultando !== null}
            onClick={() => void abrirFolios(row.original, item.contexto)}
          >
            Folios
          </Button>
        );
      }
      return null;
    },
  });

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton aria-label="Regresar al menú principal" onClick={() => navigate(routes.mainMenu)}>
          <ArrowBack />
        </IconButton>
        <Assessment sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h4">Reporte de Visitas por Puesto</Typography>
          <Typography variant="body2" sx={{ color: 'grey.700' }}>
            Resumen → Clientes → Productos → Folios
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
            disabled={consultando !== null}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 170 } }}
            onChange={(event) => {
              setFechaInicial(event.target.value);
              reiniciar();
            }}
          />
          <TextField
            label="Fecha final"
            type="date"
            size="small"
            required
            value={fechaFinal}
            disabled={consultando !== null}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 170 } }}
            onChange={(event) => {
              setFechaFinal(event.target.value);
              reiniciar();
            }}
          />
          <TextField
            label="Sucursal"
            select
            size="small"
            value={sucursal}
            disabled={consultando !== null}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 200 } }}
            onChange={(event) => {
              setSucursal(event.target.value);
              reiniciar();
            }}
          >
            <MenuItem value="">TODAS</MenuItem>
            {sucursales.map((opcion) => (
              <MenuItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Puesto"
            type="number"
            size="small"
            value={puesto}
            disabled={consultando !== null}
            placeholder="Todos"
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 130 } }}
            onChange={(event) => {
              setPuesto(event.target.value);
              reiniciar();
            }}
          />
          <Button
            variant="contained"
            onClick={consultarNivelUno}
            disabled={consultando !== null}
            startIcon={consultando === 1 ? <CircularProgress size={16} color="inherit" /> : <Search />}
          >
            {consultando === 1 ? 'Consultando...' : 'Consultar'}
          </Button>
        </Stack>
      </Paper>

      {mensaje && <Alert severity="warning" sx={{ mb: 2 }}>{mensaje}</Alert>}

      {niveles.length === 0 && consultando === null && (
        <Paper variant="outlined" sx={{ py: 7, px: 2, textAlign: 'center' }}>
          <Assessment color="disabled" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h6">Selecciona los filtros para comenzar</Typography>
          <Typography variant="body2" sx={{ color: 'grey.700' }}>
            Presiona los números de cada columna para bajar de nivel.
          </Typography>
        </Paper>
      )}

      {niveles.map((item) => (
        <Paper key={item.nivel} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            useFlexGap
            sx={{ mb: 1.5 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`Nivel ${item.nivel}`} size="small" />
              <Typography variant="subtitle1">{titulosNivel[item.nivel]}</Typography>
              {item.contexto.estilista && (
                <Typography variant="body2" sx={{ color: 'grey.700' }}>
                  Usuario: <b>{item.contexto.estilista}</b>
                </Typography>
              )}
              {item.contexto.claveCliente && (
                <Typography variant="body2" sx={{ color: 'grey.700' }}>
                  Cliente: <b>{item.contexto.claveCliente}</b>
                </Typography>
              )}
            </Stack>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download />}
              disabled={item.filas.length === 0 || consultando !== null}
              onClick={() => exportarExcel(item)}
            >
              Excel
            </Button>
          </Stack>

          {item.filas.length > 0 ? (
            <MaterialReactTable
              columns={[...columnasNivel[item.nivel], accionesNivel(item)]}
              data={item.filas}
              enableColumnActions={false}
              enableDensityToggle={false}
              enableFullScreenToggle={false}
              initialState={{ density: 'compact', pagination: { pageSize: 25, pageIndex: 0 } }}
              muiTableProps={{ sx: { fontSize: '0.8rem' } }}
            />
          ) : (
            <Alert severity="info">Sin datos en el nivel {item.nivel}.</Alert>
          )}

          {consultando === item.nivel + 1 && (
            <Stack role="status" direction="row" alignItems="center" spacing={1} sx={{ py: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Consultando nivel {consultando}...</Typography>
            </Stack>
          )}
        </Paper>
      ))}
    </Box>
  );
}
