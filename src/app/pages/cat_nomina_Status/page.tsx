import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Alert, Typography } from '@mui/material';
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

interface CatNominaStatus {
  id: number;
  clave_status: number;
  descripcion: string;
}

export default function CatNominaStatus() {
  const { consumoApi } = useConsumoApi();
  const [rows, setRows] = useState<CatNominaStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Elementos para agregar status
  const [openAdd, setOpenAdd] = useState(false);
  const [clave_status, setClaveStatus] = useState<number | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);

  // Elementos para editar status
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editClaveStatus, setEditClaveStatus] = useState<number | ''>('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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
    { field: 'clave_status', headerName: 'Clave', width: 150, type: 'number' },
    { field: 'descripcion', headerName: 'Descripción', width: 300, type: 'string' },
  ];

  const handleEditOpen = (row: CatNominaStatus) => {
    setEditId(row.id);
    setEditClaveStatus(row.clave_status);
    setEditDescripcion(row.descripcion);
    setOpenEdit(true);
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get(
        '/api/CatNominaStatus/sp_bw_cat_nomina_status_sel',
      );
      // Agregar id único a cada fila usando clave_status
      const rowsWithId = response.data.map((item: any, index: number) => ({
        ...item,
        id: item.clave_status || index
      }));
      setRows(rowsWithId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleAdd = async () => {
    if (!clave_status || !descripcion) return;

    try {
      setSaving(true);

      const claveStatusNumber = clave_status === '' ? 0 : Number(clave_status);

      const response = await consumoApi.post(
        `/api/CatNominaStatus/sp_bw_cat_nomina_status_add?clave_status=${claveStatusNumber}&descripcion=${encodeURIComponent(descripcion)}`,
        null,
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al guardar');
      }

      setOpenAdd(false);
      setClaveStatus('');
      setDescripcion('');
      fetchStatus(); // refresca grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editClaveStatus || !editDescripcion) return;

    try {
      setSavingEdit(true);

      const editClaveStatusNumber = editClaveStatus === '' ? 0 : Number(editClaveStatus);

      const response = await consumoApi.put(
        `/api/CatNominaStatus/sp_bw_cat_nomina_status_upd?descripcion=${encodeURIComponent(editDescripcion)}&clave_status=${editClaveStatusNumber}`,
        null,
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al actualizar');
      }

      setOpenEdit(false);
      setEditId(null);
      setEditClaveStatus('');
      setEditDescripcion('');
      fetchStatus(); // refresca grid
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
          Catálogo de Status
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={() => setOpenAdd(true)}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          Agregar Status
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
        <DialogTitle>Agregar Status</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Clave del Status"
            fullWidth
            variant="outlined"
            value={clave_status}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setClaveStatus('');
              } else {
                const parsed = parseInt(value);
                setClaveStatus(isNaN(parsed) ? '' : parsed);
              }
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción del Status"
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
        <DialogTitle>Editar Status</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Clave del Status"
            fullWidth
            variant="outlined"
            value={editClaveStatus}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setEditClaveStatus('');
              } else {
                const parsed = parseInt(value);
                setEditClaveStatus(isNaN(parsed) ? '' : parsed);
              }
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción del Status"
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