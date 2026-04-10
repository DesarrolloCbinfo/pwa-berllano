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

interface CatNominaBajas {
  id: number;
  descripcion: string;
}

export default function CatNominaBajas() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();
  const [rows, setRows] = useState<CatNominaBajas[]>([]);
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
    { field: 'descripcion', headerName: 'Descripción', width: 400, type: 'string', align: 'left', headerAlign: 'center' },
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
    if (!descripcion.trim()) return setMessage({ text: "La descripción es obligatoria", type: 'info' });

    try {
      setSaving(true);

      const response = await consumoApi.post(
        `/api/CatNominaBajas/sp_bw_cat_nomina_motivo_baja_add?descripcion=${encodeURIComponent(descripcion.toUpperCase())}`,
        null,
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        setMessage({ text: result?.mensaje1 || 'Error al guardar', type: 'error' });
        return;
      }

      setMessage({ text: 'Baja agregada correctamente', type: 'success' });
      setOpenAdd(false);
      setDescripcion('');
      fetchBajas(); 
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Error desconocido', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

const handleUpdate = async () => {
    if (!editId) return;
    if (!editDescripcion.trim()) return setMessage({ text: "La descripción es obligatoria", type: 'info' });

    try {
      setSavingEdit(true);

      const response = await consumoApi.put(
        `/api/CatNominaBajas/sp_bw_cat_nomina_motivo_baja_upd?id=${editId}&descripcion=${encodeURIComponent(editDescripcion.toUpperCase())}`,
        null,
      );

      const result = response.data?.[0];

      if (result?.codigo !== 0) {
        setMessage({ text: result?.mensaje1 || 'Error al actualizar', type: 'error' });
        return;
      }

      setMessage({ text: 'Baja actualizada correctamente', type: 'success' });
      setOpenEdit(false);
      setEditId(null);
      setEditDescripcion('');
      fetchBajas(); 
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Error desconocido', type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
      
      {/* MAGIA CSS: Forzamos a SweetAlert a saltar al frente de cualquier modal de MUI */}
      <style>{`
        .swal2-container {
          z-index: 9999 !important;
        }
      `}</style>

      <Paper sx={{ p: 3, borderRadius: '8px' }}>
        {/* ENCABEZADO BERLLANO ELEGANTE 2 */}
        <Box sx={{ border: '1px solid #2c3e50', borderRadius: '8px', backgroundColor: '#fff', p: 1.5, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 'bold', color: '#1a365d', fontSize: '1.1rem' }}>
                    Catálogo de Motivos de Baja
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
            AGREGAR MOTIVO DE BAJA
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
              Agregar Motivo de Baja
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Ingrese la descripción del nuevo motivo de baja
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
                label="Descripción del Motivo de Baja *"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
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
              Editar Motivo de Baja
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Modifique la descripción del motivo seleccionado
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
                label="Descripción del Motivo de Baja *"
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
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