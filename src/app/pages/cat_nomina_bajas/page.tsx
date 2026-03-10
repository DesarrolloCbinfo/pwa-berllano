import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import useConsumoApi from "../../../hooks/useConsumoApi";
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

import PWABadge from '../../../PWABadge';

interface CatNominaBajas {
  id: number;
  descripcion: string;
}

export default function CatNominaBajas() {
  const { consumoApi } = useConsumoApi();
  const [rows, setRows] = useState<CatNominaBajas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Elementos para agregar bajas
  const [openAdd, setOpenAdd] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);

  // Elementos para editar bajas
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Elementos para eliminar bajas
  const columns: GridColDef[] = [
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      renderCell: (params) => (
        <IconButton onClick={() => handleEditOpen(params.row)}>
          <EditIcon />
        </IconButton>
      ),
    },
    { field: 'descripcion', headerName: 'Descripción', width: 400, type: 'string' },
  ];

  const handleEditOpen = (row: CatNominaBajas) => {
    setEditId(row.id);
    setEditDescripcion(row.descripcion);
    setOpenEdit(true);
  };

  const fetchBajas = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get(
        '/api/CatNominaBajas/sp_bw_cat_nomina_motivo_baja_sel',
      );
      // Usar el id que viene de la API
      const rowsWithId = response.data.map((item: any) => ({
        ...item,
        id: item.id
      }));
      setRows(rowsWithId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBajas();
  }, []);

  const handleAdd = async () => {
    if (!descripcion) return;

    try {
      setSaving(true);

      const response = await consumoApi.post(
        `/api/CatNominaBajas/sp_bw_cat_nomina_motivo_baja_add?descripcion=${encodeURIComponent(descripcion)}`,
        null,
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al guardar');
      }

      setOpenAdd(false);
      setDescripcion('');
      fetchBajas(); //  refresca grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editDescripcion) return;

    try {
      setSavingEdit(true);

      const response = await consumoApi.put(
        `/api/CatNominaBajas/sp_bw_cat_nomina_motivo_baja_upd?id=${editId}&descripcion=${encodeURIComponent(editDescripcion)}`,
        null,
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al actualizar');
      }

      setOpenEdit(false);
      setEditId(null);
      setEditDescripcion('');
      fetchBajas(); // refresca grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <>
      <PWABadge />
      <Box sx={{ height: 600, width: '100%' }}>
        <Typography variant="h4" gutterBottom>
          Catálogo de Bajas
        </Typography>

        <Button
          variant="contained"
          onClick={() => setOpenAdd(true)}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          Agregar Baja
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
        />
      </Box>

      {/* Dialog para agregar */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Agregar Baja</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Descripción del Motivo de Baja"
            fullWidth
            variant="outlined"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
          <Button
            onClick={handleAdd}
            disabled={saving}
            sx={{ backgroundColor: 'black', color: 'white', '&:hover': { backgroundColor: '#333' }, borderRadius: 2 }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Editar Baja</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Descripción del Motivo de Baja"
            fullWidth
            variant="outlined"
            value={editDescripcion}
            onChange={(e) => setEditDescripcion(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button
            onClick={handleUpdate}
            disabled={savingEdit}
            sx={{ backgroundColor: 'black', color: 'white', '&:hover': { backgroundColor: '#333' }, borderRadius: 2 }}
          >
            {savingEdit ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
}