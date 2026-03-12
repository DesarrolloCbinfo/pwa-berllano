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

interface CatNominaPuestos {
  id: number;
  clave_puesto: number;
  descripcion_puesto: string;
}

export default function CatNominaPuestos() {
  const { consumoApi } = useConsumoApi();
  const [rows, setRows] = useState<CatNominaPuestos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Elementos para agregar puestos
  const [openAdd, setOpenAdd] = useState(false);
  const [clave_puesto, setClavePuesto] = useState<number | ''>('');
  const [descripcion_puesto, setDescripcionPuesto] = useState('');
  const [saving, setSaving] = useState(false);

  // Elementos para editar puestos
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editClavePuesto, setEditClavePuesto] = useState<number | ''>('');
  const [editDescripcionPuesto, setEditDescripcionPuesto] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Elementos para eliminar puestos
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
    { field: 'clave_puesto', headerName: 'Clave', width: 150, type: 'number' },
    { field: 'descripcion_puesto', headerName: 'Descripción', width: 300, type: 'string' },
  ];

  const handleEditOpen = (row: CatNominaPuestos) => {
    setEditId(row.id);
    setEditClavePuesto(row.clave_puesto);
    setEditDescripcionPuesto(row.descripcion_puesto);
    setOpenEdit(true);
  };


  const fetchPuestos = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get(
        '/api/CatNominaPuestos/sp_bw_cat_nomina_puestos_sel',
      );
      // Agregar id único a cada fila usando clave_puesto
      const rowsWithId = response.data.map((item: any, index: number) => ({
        ...item,
        id: item.clave_puesto || index
      }));
      setRows(rowsWithId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPuestos();
  }, []);

  const handleAdd = async () => {
    if (clave_puesto === '' || !descripcion_puesto) return;

    try {
      setSaving(true);

      const clavePuestoNumber = clave_puesto === '' ? 0 : clave_puesto;

      const response = await consumoApi.post(
        `/api/CatNominaPuestos/sp_bw_cat_nomina_puestos_add?clave_puesto=${clavePuestoNumber}&descripcion_puesto=${encodeURIComponent(descripcion_puesto)}`,
        null,
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al guardar');
      }

      setOpenAdd(false);
      setClavePuesto('');
      setDescripcionPuesto('');
      fetchPuestos(); //  refresca grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId || editClavePuesto === '' || !editDescripcionPuesto) return;

    try {
      setSavingEdit(true);

      const editClavePuestoNumber = editClavePuesto === '' ? 0 : editClavePuesto;

      const response = await consumoApi.put(
        `/api/CatNominaPuestos/sp_bw_cat_nomina_puestos_upd?clave_puesto=${editClavePuestoNumber}&descripcion_puesto=${encodeURIComponent(editDescripcionPuesto)}`,
        null,
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al actualizar');
      }

      setOpenEdit(false);
      setEditId(null);
      setEditClavePuesto('');
      setEditDescripcionPuesto('');
      fetchPuestos(); // refresca grid
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
          Catálogo de Puestos
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={() => setOpenAdd(true)}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          Agregar Puesto
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
        <DialogTitle>Agregar Puesto</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Clave del Puesto"
            fullWidth
            variant="outlined"
            value={clave_puesto}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setClavePuesto('');
              } else {
                const parsed = parseInt(value);
                setClavePuesto(isNaN(parsed) ? '' : parsed);
              }
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción del Puesto"
            fullWidth
            variant="outlined"
            value={descripcion_puesto}
            onChange={(e) => setDescripcionPuesto(e.target.value)}
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
        <DialogTitle>Editar Puesto</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Clave del Puesto"
            fullWidth
            variant="outlined"
            value={editClavePuesto}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setEditClavePuesto('');
              } else {
                const parsed = parseInt(value);
                setEditClavePuesto(isNaN(parsed) ? '' : parsed);
              }
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción del Puesto"
            fullWidth
            variant="outlined"
            value={editDescripcionPuesto}
            onChange={(e) => setEditDescripcionPuesto(e.target.value)}
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