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

interface CatMarcas {
  id: number;
  marca: string;
}

export default function CatMarcas() {
  const { consumoApi } = useConsumoApi();
  const [rows, setRows] = useState<CatMarcas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Elementos para agregar marcas
  const [openAdd, setOpenAdd] = useState(false);
  const [marca, setMarca] = useState('');
  const [saving, setSaving] = useState(false);

  // Elementos para editar marcas
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editMarca, setEditMarca] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Elementos para eliminar marcas
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteMarca, setDeleteMarca] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80, type: 'number' },
    { field: 'marca', headerName: 'Marca', width: 200, type: 'string' },
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

  const handleEditOpen = (row: CatMarcas) => {
    setEditId(row.id);
    setEditMarca(row.marca);
    setOpenEdit(true);
  };

  const handleDeleteOpen = (row: CatMarcas) => {
    setDeleteId(row.id);
    setDeleteMarca(row.marca);
    setOpenDelete(true);
  };

  const fetchMarcas = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get(
        '/api/CatMarcas/sp_bw_cat_marcas_sel?id=0',
      );
      setRows(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  const handleAdd = async () => {
    if (!marca) return;

    try {
      setSaving(true);

      const response = await consumoApi.post(
        `/api/CatMarcas/sp_bw_cat_marcas_add`,
        null,
        {
          params: {
            marca,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al guardar');
      }

      setOpenAdd(false);
      setMarca('');
      fetchMarcas(); // 🔁 refresca grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editMarca) return;

    try {
      setSavingEdit(true);

      const response = await consumoApi.put(
        `/api/CatMarcas/sp_bw_cat_marcas_upd`,
        null,
        {
          params: {
            id: editId,
            marca: editMarca,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al actualizar');
      }

      setOpenEdit(false);
      setEditId(null);
      fetchMarcas(); // 🔄 refrescar grid
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
        `/api/CatMarcas/sp_bw_cat_marcas_del`,
        {
          params: {
            id: deleteId,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje || 'Error al eliminar');
      }

      setOpenDelete(false);
      setDeleteId(null);
      setDeleteMarca(null);
      fetchMarcas(); // 🔄 refresca grid
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
        <h1>Catálogo de Marcas</h1>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button variant='contained' onClick={() => setOpenAdd(true)}>
            Agregar Marca
          </Button>
        </Box>

        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
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
          <DialogTitle>Agregar Marca</DialogTitle>

          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <TextField
              label='Marca'
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              fullWidth
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
          <DialogTitle>Editar Marca</DialogTitle>

          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <TextField label='ID' value={editId || ''} disabled fullWidth />
            <TextField
              label='Marca'
              value={editMarca}
              onChange={(e) => setEditMarca(e.target.value)}
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
          <DialogTitle>Eliminar Marca</DialogTitle>

          <DialogContent>
            <Typography>
              ¿Seguro que deseas eliminar la marca{' '}
              <strong>{deleteMarca}</strong>?
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
