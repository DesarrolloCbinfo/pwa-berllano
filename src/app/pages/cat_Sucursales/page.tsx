import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import useConsumoApi from '../../../hooks/useConsumoApi';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import PWABadge from '../../../PWABadge';

interface CatSucursal {
  cve_sucursal: number;
  nombre: string;
  direccion: string | null;
  version: string | null;
  fecha_alta: string | null;
  fecha_act: string | null;
}

export default function CatSucursales() {
  const { consumoApi } = useConsumoApi();
  const [rows, setRows] = useState<CatSucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Elementos para agregar sucursal
  const [openAdd, setOpenAdd] = useState(false);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [cve_sucursal, setCveSucursal] = useState('');
  const [es_ruta, setEsRuta] = useState(false);
  const [es_bodega, setEsBodega] = useState(false);
  const [dias_devolucion, setDiasDevolucion] = useState('0');
  const [en_linea, setEnLinea] = useState(true);
  const [supervisor, setSupervisor] = useState('1');
  const [version, setVersion] = useState('');
  const [saving, setSaving] = useState(false);

  // Elementos para editar sucursal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Elementos para eliminar sucursal
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNombre, setDeleteNombre] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const columns: GridColDef[] = [
    { field: 'cve_sucursal', headerName: 'ID', width: 80, type: 'number' },
    { field: 'nombre', headerName: 'Nombre', width: 150, type: 'string' },
    { field: 'direccion', headerName: 'Dirección', width: 250 },
    { field: 'version', headerName: 'Versión', width: 100 },
    {
      field: 'fecha_alta',
      headerName: 'Fecha Alta',
      width: 180,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleString() : '-',
    },
    {
      field: 'fecha_act',
      headerName: 'Fecha Actualización',
      width: 180,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleString() : '-',
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEditOpen(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton
            color='error'
            onClick={() => handleDeleteOpen(params.row)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  const handleEditOpen = (row: CatSucursal) => {
    setEditId(row.cve_sucursal);
    setEditNombre(row.nombre);
    setEditDireccion(row.direccion || '');
    setOpenEdit(true);
  };

  const handleDeleteOpen = (row: CatSucursal) => {
    setDeleteId(row.cve_sucursal);
    setDeleteNombre(row.nombre);
    setOpenDelete(true);
  };

  const fetchSucursales = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get(
        '/api/CatSucursales/sp_bw_cat_sucursales_sel?cve_sucursal=0',
      );
      setRows(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSucursales();
  }, []);

  const handleAdd = async () => {
    if (!nombre) return;

    try {
      setSaving(true);

      const response = await consumoApi.post(
        `/api/CatSucursales/sp_bw_cat_sucursales_add`,
        null,
        {
          params: {
            cia: 1,
            cve_sucursal: cve_sucursal || 999,
            nombre,
            direccion,
            es_ruta: es_ruta ? 1 : 0,
            es_bodega: es_bodega ? 1 : 0,
            dias_devolucion: dias_devolucion || 0,
            en_linea: en_linea ? 1 : 0,
            supervisor: supervisor || 1,
            version: version || '1',
            VALIDAR_TX: 0,
            VALIDAR_RM: 0,
            MIN_RECORDS_VAL_TX: 0,
            MIN_RECORDS_VAL_RM: 0,
            clave_timbrador: 1,
            RECIBE_FV: 1,
            RECIBE_PROV_ALL: 0,
            EDITA_COSTOS_RM: 0,
            NOCTURNA: 0,
            CREDITO: 0,
            VENCIMIENTO_DEPOSITO: 0,
            TOLERANCIA_EXISTENCIA: 0,
            CONTROL_TRASPASOS: 0,
            BANCOMER_ONLINE: 0,
            AFILIACION_BANCOMER: '1',
            SERVICIO_DOMICILIO: 0,
            APLICA_CINEPOLIS: 0,
            APLICA_CINETIX: 0,
            AREA_DEPOSITO: '1',
            DEPTO_DEPOSITO: '1',
            LIMITE_SOBRANTE: 0,
            LIMITE_FALTANTE: 0,
            importe_retiros: 0,
            fondo: 0,
            montoAviso: 0,
            numeroAvisos: 0,
            importeCajaDespuesRetiros: 0,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al guardar');
      }

      setOpenAdd(false);
      setNombre('');
      setDireccion('');
      setCveSucursal('');
      setEsRuta(false);
      setEsBodega(false);
      setDiasDevolucion('0');
      setEnLinea(true);
      setSupervisor('1');
      setVersion('');
      fetchSucursales(); // 🔁 refresca grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editNombre) return;

    try {
      setSavingEdit(true);

      const response = await consumoApi.put(
        `/api/CatSucursales/sp_bw_cat_sucursales_upd`,
        null,
        {
          params: {
            cve_sucursal: editId,
            nombre: editNombre,
            direccion: editDireccion,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al actualizar');
      }

      setOpenEdit(false);
      setEditId(null);
      fetchSucursales(); // 🔄 refrescar grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);

      const response = await consumoApi.delete(
        `/api/CatSucursales/sp_bw_cat_sucursales_del`,
        {
          params: {
            cve_sucursal: deleteId,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje || 'Error al eliminar');
      }

      setOpenDelete(false);
      setDeleteId(null);
      setDeleteNombre(null);
      fetchSucursales(); // 🔄 refresca grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity='error'>Error al cargar los datos: {error}</Alert>;
  }

  return (
    <>
      <Box sx={{ p: 2 }}>
        <h1>Catálogo de Sucursales</h1>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button variant='contained' onClick={() => setOpenAdd(true)}>
            Agregar Sucursal
          </Button>
        </Box>

        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.cve_sucursal}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          sx={{ height: 600 }}
        />

        <Dialog
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>Agregar Sucursal</DialogTitle>

          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <TextField
              label='Nombre'
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label='Dirección'
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              fullWidth
            />

            <TextField
              label='Clave Sucursal'
              value={cve_sucursal}
              onChange={(e) => setCveSucursal(e.target.value)}
              fullWidth
              type='number'
            />

            <TextField
              label='Supervisor'
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              fullWidth
              type='number'
            />

            <TextField
              label='Versión'
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              fullWidth
            />

            <TextField
              label='Días Devolución'
              value={dias_devolucion}
              onChange={(e) => setDiasDevolucion(e.target.value)}
              fullWidth
              type='number'
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
            <Button variant='contained' onClick={handleAdd} disabled={saving}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>Editar Sucursal</DialogTitle>

          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <TextField label='ID' value={editId || ''} disabled fullWidth />
            <TextField
              label='Nombre'
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              fullWidth
            />
            <TextField
              label='Dirección'
              value={editDireccion}
              onChange={(e) => setEditDireccion(e.target.value)}
              fullWidth
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button
              variant='contained'
              onClick={handleUpdate}
              disabled={savingEdit}
            >
              Guardar cambios
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
          <DialogTitle>Eliminar Sucursal</DialogTitle>

          <DialogContent>
            <Typography>
              ¿Seguro que deseas eliminar la sucursal{' '}
              <strong>{deleteNombre}</strong>?
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>

            <Button
              color='error'
              variant='contained'
              onClick={handleDelete}
              disabled={deleting}
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <PWABadge />
    </>
  );
}
