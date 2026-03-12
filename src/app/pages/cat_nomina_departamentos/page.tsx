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

interface CatNominaDepartamentos {
  id: number;
  clave_departamento: string;
  descripcion_departamento: string;
}

export default function CatNominaDepartamentos() {
  const { consumoApi } = useConsumoApi();
  const [rows, setRows] = useState<CatNominaDepartamentos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Elementos para agregar departamentos
  const [openAdd, setOpenAdd] = useState(false);
  const [clave_departamento, setClaveDepartamento] = useState('');
  const [descripcion_departamento, setDescripcionDepartamento] = useState('');
  const [saving, setSaving] = useState(false);

  // Elementos para editar departamentos
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editClaveDepartamento, setEditClaveDepartamento] = useState('');
  const [editDescripcionDepartamento, setEditDescripcionDepartamento] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Elementos para eliminar departamentos
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
    { field: 'clave_departamento', headerName: 'Clave', width: 150, type: 'string' },
    { field: 'descripcion_departamento', headerName: 'Descripción', width: 300, type: 'string' },
  ];

  const handleEditOpen = (row: CatNominaDepartamentos) => {
    setEditId(row.id);
    setEditClaveDepartamento(row.clave_departamento);
    setEditDescripcionDepartamento(row.descripcion_departamento);
    setOpenEdit(true);
  };


  const fetchDepartamentos = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get(
        '/api/CatNominaDepartamentos/sp_bw_cat_nomina_departamentos_sel',
      );
      // Agregar id único a cada fila usando clave_departamento
      const rowsWithId = response.data.map((item: any, index: number) => ({
        ...item,
        id: item.clave_departamento || index
      }));
      setRows(rowsWithId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  const handleAdd = async () => {
    if (!clave_departamento || !descripcion_departamento) return;

    try {
      setSaving(true);

      const response = await consumoApi.post(
        `/api/CatNominaDepartamentos/sp_bw_cat_nomina_departamentos_add`,
        null,
        {
          params: {
            clave_departamento,
            descripcion_departamento,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al guardar');
      }

      setOpenAdd(false);
      setClaveDepartamento('');
      setDescripcionDepartamento('');
      fetchDepartamentos(); //  refresca grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editClaveDepartamento || !editDescripcionDepartamento) return;

    try {
      setSavingEdit(true);

      const response = await consumoApi.put(
        `/api/CatNominaDepartamentos/sp_bw_cat_nomina_departamentos_upd`,
        null,
        {
          params: {
          
            clave_departamento: editClaveDepartamento,
            descripcion_departamento: editDescripcionDepartamento,
          },
        },
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al actualizar');
      }

      setOpenEdit(false);
      setEditId(null);
      setEditClaveDepartamento('');
      setEditDescripcionDepartamento('');
      fetchDepartamentos(); // refresca grid
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
          Catálogo de Departamentos
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={() => setOpenAdd(true)}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          Agregar Departamento
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
        <DialogTitle>Agregar Departamento</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Clave del Departamento"
            fullWidth
            variant="outlined"
            value={clave_departamento}
            onChange={(e) => setClaveDepartamento(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción del Departamento"
            fullWidth
            variant="outlined"
            value={descripcion_departamento}
            onChange={(e) => setDescripcionDepartamento(e.target.value)}
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
        <DialogTitle>Editar Departamento</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Clave del Departamento"
            fullWidth
            variant="outlined"
            value={editClaveDepartamento}
            onChange={(e) => setEditClaveDepartamento(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción del Departamento"
            fullWidth
            variant="outlined"
            value={editDescripcionDepartamento}
            onChange={(e) => setEditDescripcionDepartamento(e.target.value)}
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