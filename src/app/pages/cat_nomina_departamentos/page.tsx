import { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Box, CircularProgress, Alert, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Snackbar } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
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

interface CatNominaDepartamentos {
  id: number;
  clave_departamento: string;
  descripcion_departamento: string;
}

export default function CatNominaDepartamentos() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();
  const [rows, setRows] = useState<CatNominaDepartamentos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

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
    { field: 'clave_departamento', headerName: 'Clave', width: 150, type: 'string', align: 'center', headerAlign: 'center' },
    { field: 'descripcion_departamento', headerName: 'Descripción', width: 300, type: 'string', align: 'left', headerAlign: 'center' },
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
        setMessage({ text: result?.mensaje1 || 'Error al guardar', type: 'error' });
        return;
      }

      setMessage({ text: '✅ Departamento agregado correctamente', type: 'success' });
      setOpenAdd(false);
      setClaveDepartamento('');
      setDescripcionDepartamento('');
      fetchDepartamentos(); // refresca grid
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Error desconocido', type: 'error' });
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
        setMessage({ text: result?.mensaje1 || 'Error al actualizar', type: 'error' });
        return;
      }

      setMessage({ text: '💾 Departamento actualizado correctamente', type: 'success' });
      setOpenEdit(false);
      setEditId(null);
      setEditClaveDepartamento('');
      setEditDescripcionDepartamento('');
      fetchDepartamentos(); // refresca grid
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Error desconocido', type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
      <Paper sx={{ p: 3, borderRadius: '8px' }}>
        {/* ENCABEZADO BERLLANO ELEGANTE 2 */}
        <Box sx={{ border: '1px solid #2c3e50', borderRadius: '8px', backgroundColor: '#fff', p: 1.5, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 'bold', color: '#1a365d', fontSize: '1.1rem' }}>
              Catálogo de Departamentos
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', fontSize: '0.75rem' }}>
              Sucursal: {session?.dSucursal || 'Cargando...'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', fontSize: '0.9rem' }}>
              {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', fontSize: '0.75rem' }}>
              USR: {session?.nombre || 'ADMIN'}
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
          AGREGAR DEPARTAMENTO
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

      {/* PIE DE PÁGINA BERLLANO ELEGANTE 2 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
        <Button variant="contained" sx={{ backgroundColor: '#e0e0e0', color: '#000', fontWeight: 'bold', px: 4, mb: 2, '&:hover': { backgroundColor: '#d0d0d0' } }}>
          Salir
        </Button>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          CAT_NOMINA_DEPARTAMENTOS, ARAUCARIAS, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR:{session?.nombre || 'ADMIN'}
        </Typography>
      </Box>

      {/* Dialog para agregar */}
      <Dialog 
        open={openAdd} 
        onClose={() => setOpenAdd(false)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0'
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 'bold', color: '#1a365d' }}>
          Agregar Departamento
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            {...commonProps}
            label="Clave del Departamento*"
            value={clave_departamento}
            onChange={(e) => setClaveDepartamento(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            {...commonProps}
            label="Descripción del Departamento*"
            value={descripcion_departamento}
            onChange={(e) => setDescripcionDepartamento(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenAdd(false)}
            sx={{ 
              backgroundColor: '#e0e0e0', color: '#000', fontWeight: 'bold',
              '&:hover': { backgroundColor: '#d0d0d0' }, borderRadius: '8px'
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAdd}
            disabled={saving}
            sx={{ 
              backgroundColor: '#333333', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', transition: 'all 0.3s ease',
              '&:hover': { backgroundColor: '#555555', boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', transform: 'translateY(-1px)' }
            }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar */}
      <Dialog 
        open={openEdit} 
        onClose={() => setOpenEdit(false)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0'
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 'bold', color: '#1a365d' }}>
          Editar Departamento
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            {...commonProps}
            label="Clave del Departamento*"
            value={editClaveDepartamento}
            onChange={(e) => setEditClaveDepartamento(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            {...commonProps}
            label="Descripción del Departamento*"
            value={editDescripcionDepartamento}
            onChange={(e) => setEditDescripcionDepartamento(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenEdit(false)}
            sx={{ 
              backgroundColor: '#e0e0e0', color: '#000', fontWeight: 'bold',
              '&:hover': { backgroundColor: '#d0d0d0' }, borderRadius: '8px'
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={savingEdit}
            sx={{ 
              backgroundColor: '#333333', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', transition: 'all 0.3s ease',
              '&:hover': { backgroundColor: '#555555', boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', transform: 'translateY(-1px)' }
            }}
          >
            {savingEdit ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* NOTIFICACIONES */}
      <Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type} onClose={() => setMessage(null)} sx={{ width: '100%' }}>{message?.text}</Alert>
      </Snackbar>
    </Box>
  );
}