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

interface CatNominaFormasPagos {
  id: number;
  clave_forma_pago: number;
  descripcion_forma_pago: string;
}

export default function CatNominaFormasPagos() {
  const { consumoApi } = useConsumoApi();
  const [rows, setRows] = useState<CatNominaFormasPagos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Elementos para agregar formas de pago
  const [openAdd, setOpenAdd] = useState(false);
  const [clave_forma_pago, setClaveFormaPago] = useState<number | ''>('');
  const [descripcion_forma_pago, setDescripcionFormaPago] = useState('');
  const [saving, setSaving] = useState(false);

  // Elementos para editar formas de pago
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editClaveFormaPago, setEditClaveFormaPago] = useState<number | ''>('');
  const [editDescripcionFormaPago, setEditDescripcionFormaPago] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Elementos para eliminar formas de pago
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
    { field: 'clave_forma_pago', headerName: 'Clave', width: 150, type: 'number' },
    { field: 'descripcion_forma_pago', headerName: 'Descripción', width: 300, type: 'string' },
  ];

  const handleEditOpen = (row: CatNominaFormasPagos) => {
    setEditId(row.id);
    setEditClaveFormaPago(row.clave_forma_pago);
    setEditDescripcionFormaPago(row.descripcion_forma_pago);
    setOpenEdit(true);
  };


  const fetchFormasPagos = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get(
        '/api/CatNominaFormasPago/sp_bw_cat_nomina_forma_pago_sel',
      );
      // Agregar id único a cada fila usando clave_forma_pago
      const rowsWithId = response.data.map((item: any, index: number) => ({
        ...item,
        id: item.clave_forma_pago || index
      }));
      setRows(rowsWithId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormasPagos();
  }, []);

  const handleAdd = async () => {
    if (clave_forma_pago === '' || !descripcion_forma_pago) return;

    try {
      setSaving(true);

      const claveFormaPagoNumber = clave_forma_pago === '' ? 0 : clave_forma_pago;

      const response = await consumoApi.post(
        `/api/CatNominaFormasPago/sp_bw_cat_nomina_forma_pago_add?clave_forma_pago=${claveFormaPagoNumber}&descripcion_forma_pago=${encodeURIComponent(descripcion_forma_pago)}`,
        null,
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al guardar');
      }

      setOpenAdd(false);
      setClaveFormaPago('');
      setDescripcionFormaPago('');
      fetchFormasPagos(); //  refresca grid
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId || editClaveFormaPago === '' || !editDescripcionFormaPago) return;

    try {
      setSavingEdit(true);

      const editClaveFormaPagoNumber = editClaveFormaPago === '' ? 0 : editClaveFormaPago;

      const response = await consumoApi.put(
        `/api/CatNominaFormasPago/sp_bw_cat_nomina_forma_pago_upd?descripcion_forma_pago=${encodeURIComponent(editDescripcionFormaPago)}&clave_forma_pago=${editClaveFormaPagoNumber}`,
        null,
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al actualizar');
      }

      setOpenEdit(false);
      setEditId(null);
      setEditClaveFormaPago('');
      setEditDescripcionFormaPago('');
      fetchFormasPagos(); // refresca grid
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
          Catálogo de Formas de Pago
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={() => setOpenAdd(true)}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          Agregar Forma de Pago
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
        <DialogTitle>Agregar Forma de Pago</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Clave de la Forma de Pago"
            fullWidth
            variant="outlined"
            value={clave_forma_pago}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setClaveFormaPago('');
              } else {
                const parsed = parseInt(value);
                setClaveFormaPago(isNaN(parsed) ? '' : parsed);
              }
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción de la Forma de Pago"
            fullWidth
            variant="outlined"
            value={descripcion_forma_pago}
            onChange={(e) => setDescripcionFormaPago(e.target.value)}
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
        <DialogTitle>Editar Forma de Pago</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Clave de la Forma de Pago"
            fullWidth
            variant="outlined"
            value={editClaveFormaPago}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setEditClaveFormaPago('');
              } else {
                const parsed = parseInt(value);
                setEditClaveFormaPago(isNaN(parsed) ? '' : parsed);
              }
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción de la Forma de Pago"
            fullWidth
            variant="outlined"
            value={editDescripcionFormaPago}
            onChange={(e) => setEditDescripcionFormaPago(e.target.value)}
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