import { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Box, CircularProgress, Alert, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Snackbar, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import Swal from 'sweetalert2';
import useConsumoApi from "../../../hooks/useConsumoApi";
import { useSessionContext } from '../../../context/SessionProvider'; 

// --- ESTILOS BERLLANO ELEGANTE ---
const commonProps = {
  fullWidth: true,
  size: "small" as const,
  variant: "outlined" as const,
  sx: {
    '& .MuiInputBase-root': { 
      height: '50px', 
      alignItems: 'center',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderColor: '#999' }
    },
    '& .MuiInputLabel-root': { transform: 'translate(14px, 14px) scale(1)', color: '#666', fontWeight: 500 },
    '& .MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)', color: '#333', fontWeight: 600 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0', borderWidth: '1.5px' }
  }
};

interface CatNominaFormasPagos {
  id: number;
  clave_forma_pago: number;
  descripcion_forma_pago: string;
}

export default function CatNominaFormasPagos() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();
  const [rows, setRows] = useState<CatNominaFormasPagos[]>([]);
const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Función interceptora para SweetAlert2
  const setMessage = (msg: { text: string, type: 'success' | 'error' | 'info' } | null) => {
    if (!msg) return;
    Swal.fire({
      title: msg.type === 'success' ? '¡Éxito!' : (msg.type === 'error' ? 'Error' : 'Atención'),
      text: msg.text,
      icon: msg.type === 'info' ? 'warning' : msg.type,
      timer: msg.type === 'success' ? 2000 : undefined,
      showConfirmButton: msg.type !== 'success',
      confirmButtonColor: '#333'
    });
  };

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
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <IconButton size="small" onClick={() => handleEditOpen(params.row)}>
          <EditIcon />
        </IconButton>
      ),
    },
    { field: 'clave_forma_pago', headerName: 'Clave', width: 150, type: 'number', align: 'center', headerAlign: 'center' },
    { field: 'descripcion_forma_pago', headerName: 'Descripción', width: 300, type: 'string', align: 'left', headerAlign: 'center' },
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
    if (clave_forma_pago === '') return setMessage({ text: "La Clave es obligatoria", type: 'info' });
    if (!descripcion_forma_pago.trim()) return setMessage({ text: "La descripción es obligatoria", type: 'info' });

    try {
      setSaving(true);
      const claveFormaPagoNumber = clave_forma_pago === '' ? 0 : clave_forma_pago;

      const response = await consumoApi.post(
        `/api/CatNominaFormasPago/sp_bw_cat_nomina_forma_pago_add?clave_forma_pago=${claveFormaPagoNumber}&descripcion_forma_pago=${encodeURIComponent(descripcion_forma_pago.toUpperCase())}`,
        null,
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        setMessage({ text: result?.mensaje1 || 'Error al guardar', type: 'error' });
        return;
      }

      setMessage({ text: 'Forma de pago agregada correctamente', type: 'success' });
      setOpenAdd(false);
      setClaveFormaPago('');
      setDescripcionFormaPago('');
      fetchFormasPagos(); 
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Error desconocido', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

const handleUpdate = async () => {
    if (!editId) return;
    if (editClaveFormaPago === '') return setMessage({ text: "La Clave es obligatoria", type: 'info' });
    if (!editDescripcionFormaPago.trim()) return setMessage({ text: "La descripción es obligatoria", type: 'info' });

    try {
      setSavingEdit(true);
      const editClaveFormaPagoNumber = editClaveFormaPago === '' ? 0 : editClaveFormaPago;

      const response = await consumoApi.put(
        `/api/CatNominaFormasPago/sp_bw_cat_nomina_forma_pago_upd?descripcion_forma_pago=${encodeURIComponent(editDescripcionFormaPago.toUpperCase())}&clave_forma_pago=${editClaveFormaPagoNumber}`,
        null,
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        setMessage({ text: result?.mensaje1 || 'Error al actualizar', type: 'error' });
        return;
      }

      setMessage({ text: 'Forma de pago actualizada correctamente', type: 'success' });
      setOpenEdit(false);
      setEditId(null);
      setEditClaveFormaPago('');
      setEditDescripcionFormaPago('');
      fetchFormasPagos(); 
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Error desconocido', type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
      
      {/* MAGIA CSS: Forzamos a SweetAlert a saltar al frente de los modales de MUI */}
      <style>{`
        .swal2-container {
          z-index: 9999 !important;
        }
      `}</style>

      <Paper sx={{ p: 3, borderRadius: '8px' }}>
        {/* ENCABEZADO BERLLANO ELEGANTE 2 */}
        <Box sx={{ border: '1px solid #000000ff', borderRadius: '8px', backgroundColor: '#fff', p: 1.5, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 'bold', color: '#000000ff', fontSize: '1.1rem' }}>
              Catálogo de Formas de Pago
            </Typography>
           
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', fontSize: '0.9rem' }}>
              {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
            </Typography>
            
          </Box>
        </Box>

        {/* Botón Agregar */}
        <Button variant="contained" onClick={() => setOpenAdd(true)} startIcon={<AddIcon />}
          sx={{ 
            height: '50px', backgroundColor: '#333333', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', transition: 'all 0.3s ease', mb: 2,
            '&:hover': { backgroundColor: '#555555', boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', transform: 'translateY(-1px)' }
          }}>
          AGREGAR FORMA DE PAGO
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* TABLA PRINCIPAL */}
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3, width: '100%', maxHeight: 600, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[5, 10, 25]}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true } }}
            density="compact"
            disableRowSelectionOnClick
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            sx={{ 
              border: 'none', 
              '& .MuiDataGrid-columnHeaders': { borderBottom: '2px solid #000', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' },
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' },
              '& .MuiDataGrid-cell--editable': { backgroundColor: '#f9fbfd', cursor: 'pointer' }, 
              '& .MuiDataGrid-cell--editing': { backgroundColor: '#fff', boxShadow: '0 0 5px rgba(25,118,210,0.5)' }
            }} 
          />
        </Paper>
      </Box>

  

{/* --- MODAL AGREGAR --- */}
      <Dialog 
        open={openAdd} 
        onClose={() => setOpenAdd(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }
        }}
      >
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Agregar Forma de Pago
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Ingrese la información de la nueva forma de pago
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton 
            onClick={() => setOpenAdd(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                {...commonProps}
                label="Clave de la Forma de Pago *"
                type="number"
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
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...commonProps}
                label="Descripción de la Forma de Pago *"
                value={descripcion_forma_pago}
                onChange={(e) => setDescripcionFormaPago(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={() => setOpenAdd(false)}
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 500, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAdd}
            disabled={saving}
            variant="contained"
            sx={{ 
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL EDITAR --- */}
      <Dialog 
        open={openEdit} 
        onClose={() => setOpenEdit(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }
        }}
      >
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Editar Forma de Pago
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Modifique la información de la forma de pago seleccionada
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton 
            onClick={() => setOpenEdit(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                {...commonProps}
                label="Clave de la Forma de Pago *"
                type="number"
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
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...commonProps}
                label="Descripción de la Forma de Pago *"
                value={editDescripcionFormaPago}
                onChange={(e) => setEditDescripcionFormaPago(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={() => setOpenEdit(false)}
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 500, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={savingEdit}
            variant="contained"
            sx={{ 
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            {savingEdit ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}