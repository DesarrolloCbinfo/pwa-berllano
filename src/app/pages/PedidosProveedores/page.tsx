import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
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
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import Swal from 'sweetalert2';
import useConsumoApi from '../../../hooks/useConsumoApi';
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

interface PedidoRow {
  id: string;
  clave_prod: string;
  clave_prod_ruta: string;
  descripcion: string;
  marca: string;
  d_area: string;
  d_familia: string;
  f_ini: string;
  can: number;
  e1: number;
  e2: number;
  e3: number;
  e4: number;
  e5: number;
  e6: number;
  e203: number;
  e204: number;
  t1: number;
  t2: number;
  t3: number;
  t4: number;
  t5: number;
  t6: number;
  t1203: number;
  t1204: number;
  v1: number;
  v2: number;
  v3: number;
  v4: number;
  v5: number;
  v6: number;
}

const columnas: GridColDef<PedidoRow>[] = [
  { field: 'clave_prod', headerName: 'clave_prod', width: 120 },
  { field: 'clave_prod_ruta', headerName: 'clave_prod_ruta', width: 140 },
  { field: 'descripcion', headerName: 'descripcion', width: 220 },
  { field: 'marca', headerName: 'marca', width: 100 },
  { field: 'd_area', headerName: 'd_area', width: 90 },
  { field: 'd_familia', headerName: 'd_familia', width: 100 },
  { field: 'f_ini', headerName: 'f_ini', width: 80 },
  { field: 'can', headerName: 'can', width: 60, type: 'number' },
  { field: 'e1', headerName: 'e1', width: 50, type: 'number' },
  { field: 'e2', headerName: 'e2', width: 50, type: 'number' },
  { field: 'e3', headerName: 'e3', width: 50, type: 'number' },
  { field: 'e4', headerName: 'e4', width: 50, type: 'number' },
  { field: 'e5', headerName: 'e5', width: 50, type: 'number' },
  { field: 'e6', headerName: 'e6', width: 50, type: 'number' },
  { field: 'e203', headerName: 'e203', width: 60, type: 'number' },
  { field: 'e204', headerName: 'e204', width: 60, type: 'number' },
  { field: 't1', headerName: 't1', width: 50, type: 'number' },
  { field: 't2', headerName: 't2', width: 50, type: 'number' },
  { field: 't3', headerName: 't3', width: 50, type: 'number' },
  { field: 't4', headerName: 't4', width: 50, type: 'number' },
  { field: 't5', headerName: 't5', width: 50, type: 'number' },
  { field: 't6', headerName: 't6', width: 50, type: 'number' },
  { field: 't1203', headerName: 't1203', width: 65, type: 'number' },
  { field: 't1204', headerName: 't1204', width: 65, type: 'number' },
  { field: 'v1', headerName: 'v1', width: 50, type: 'number' },
  { field: 'v2', headerName: 'v2', width: 50, type: 'number' },
  { field: 'v3', headerName: 'v3', width: 50, type: 'number' },
  { field: 'v4', headerName: 'v4', width: 50, type: 'number' },
  { field: 'v5', headerName: 'v5', width: 50, type: 'number' },
  { field: 'v6', headerName: 'v6', width: 50, type: 'number' },
];

export default function PedidosProveedoresPage() {
  const navigate = useNavigate();
  const { consumoApi } = useConsumoApi();

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
  const [diasVenta, setDiasVenta] = useState('30');
  const [diasInventario, setDiasInventario] = useState('30');
  const [modelo, setModelo] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [proveedores, setProveedores] = useState<ProveedorOption[]>([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);
  const [folio, setFolio] = useState(0);
  const [rows] = useState<PedidoRow[]>([]);
  const [loading] = useState(false);

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
        const res = await consumoApi.get('/api/CatMarcasFamilias/sp_bw_cat_marcasfamilias_list');
        const data = Array.isArray(res.data) ? res.data : [];
        setFamilias(
          data.map((item: any) => ({
            id: String(item.id ?? ''),
            familia: String(item.marca ?? ''),
          }))
        );
      } catch (error) {
        console.error('Error cargando familias:', error);
      } finally {
        setCargandoFamilias(false);
      }
    };

    cargarFamilias();

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

  const handleGenerarPedido = () => {
    Swal.fire('Generar pedido', 'Aquí se consultará y generará el pedido.', 'info');
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
      });
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
      });
      Swal.fire('Cancelado', `El pedido folio ${folio} fue cancelado.`, 'success');
      setFolio(0);
    } catch (error: any) {
      const mensaje = error?.response?.data?.mensaje || 'No se pudo cancelar el pedido.';
      Swal.fire('Error', mensaje, 'error');
    }
  };

  const handleRecuperarPedido = () => {
    Swal.fire('Recuperar pedido', 'Aquí se recuperará un pedido existente.', 'info');
  };

  const handleSalir = () => {
    navigate(routes.inventario);
  };

  return (
    <Box sx={{ p: 2, minHeight: 'calc(100vh - 64px)' }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 'bold',
          mb: 2,
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        Pedidos a Proveedores
      </Typography>

      <Paper
        elevation={2}
        sx={{ p: 2, mb: 2, borderRadius: 1, border: '1px solid #ccc' }}
      >
        <Grid container spacing={2} alignItems="flex-end">
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  disabled={cargandoAreas}
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                  {areas.map((a) => (
                    <MenuItem key={a.area} value={a.area}>
                      {a.descripcion}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Marca"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  disabled={cargandoMarcas}
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                  {marcas.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.marca}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <TextField
                  fullWidth
                  size="small"
                  label="Días Venta"
                  value={diasVenta}
                  onChange={(e) => setDiasVenta(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Familia"
                  value={familia}
                  onChange={(e) => setFamilia(e.target.value)}
                  disabled={cargandoFamilias}
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                  {familias.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.familia}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <TextField
                  fullWidth
                  size="small"
                  label="Descripción"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <TextField
                  fullWidth
                  size="small"
                  label="Días Inventario"
                  value={diasInventario}
                  onChange={(e) => setDiasInventario(e.target.value)}
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
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3}}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Proveedor"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  disabled={cargandoProveedores}
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                  {proveedores.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nombre}
                    </MenuItem>
                  ))}
                </TextField>
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
              <Button
                variant="contained"
                size="small"
                onClick={handleGenerarPedido}
                sx={{ textTransform: 'none', bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#b1b1b1' } }}
              >
                Generar Pedido
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleRecuperarPedido}
                sx={{ textTransform: 'none', bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#b1b1b1' } }}
              >
                Recuperar Pedido
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleFinalizarPedido}
                sx={{ textTransform: 'none', bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#b1b1b1' } }}
              >
                Finalizar Pedido
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleCancelarPedido}
                sx={{ textTransform: 'none', bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#b1b1b1' } }}
              >
                Cancelar Pedido
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSalir}
                sx={{ textTransform: 'none', bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#b1b1b1' } }}
              >
                Salir
              </Button>
              <Box
                sx={{
                  bgcolor: '#dfdede',
                  color: '#000000',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  minWidth: 80,
                  textAlign: 'right',
                }}
              >
                <Typography variant="caption" sx={{ display: 'block', color: '#aaa' }}>
                  Folio
                </Typography>
                <Typography variant="h7" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                  {folio}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper
        elevation={2}
        sx={{
          height: { xs: 400, md: 520 },
          border: '1px solid #ccc',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <DataGrid
          rows={rows}
          columns={columnas}
          loading={loading}
          density="compact"
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 50, page: 0 } },
          }}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#b3d9ff',
            },
          }}
        />
      </Paper>
    </Box>
  );
}
