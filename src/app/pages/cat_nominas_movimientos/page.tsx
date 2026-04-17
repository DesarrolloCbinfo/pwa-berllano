"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  Snackbar, Alert, Paper, IconButton, MenuItem, Checkbox, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material'; 
import { 
  DataGrid, GridColDef, GridToolbar, 
  GridPaginationModel, GridPagination, GridRenderCellParams
} from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import Swal from 'sweetalert2';

import useConsumoApi from '../../../hooks/useConsumoApi';
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

const selectProps = {
    ...commonProps,
    SelectProps: { MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } },
    sx: { ...commonProps.sx, '& .MuiSelect-select': { display: 'block !important', whiteSpace: 'nowrap !important', overflow: 'hidden !important', textOverflow: 'ellipsis !important' } }
};

function CustomPagination() { return <GridPagination />; }

const initialFormState = { id_movimiento: '', descripcion: '', id_gasto: 0, id_subgasto: 0, deduccion: false, depositar: false, tipo_movto: '' };

export default function MovimientosNomina() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  // Estados
  const [rows, setRows] = useState<any[]>([]);
  const [tiposMovimiento, setTiposMovimiento] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
const [openAddModal, setOpenAddModal] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
  
  const [formData, setFormData] = useState(initialFormState);

  // Función interceptora para SweetAlert2
  const setMessage = (msg: { text: string, type: 'success' | 'error' | 'info' } | null) => {
    if (!msg) return;
    
    // Toast rápido para el guardado de la tabla (DataGrid)
    if (msg.type === 'info') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: msg.text,
            showConfirmButton: false,
            timer: 2000
        });
        return;
    }

    // Alertas pop-up grandes
    Swal.fire({
      title: msg.type === 'success' ? '¡Éxito!' : 'Atención',
      text: msg.text,
      icon: msg.type === 'success' ? 'success' : (msg.type === 'error' ? 'error' : 'warning'),
      timer: msg.type === 'success' ? 2000 : undefined,
      showConfirmButton: msg.type !== 'success',
      confirmButtonColor: '#333'
    });
  };

  useEffect(() => {
      fetchCatalogos();
  }, []);

  const fetchCatalogos = async () => {
      setLoading(true);
      try {
          // Llenar Lista Desplegable
          const resTipos = await consumoApi.get('/api/MovimientosNomina/sp_bw_cat_combo_tipos_movimiento');
          setTiposMovimiento(Array.isArray(resTipos?.data) ? resTipos.data : []);

          // Llenar Tabla Principal
          const resTabla = await consumoApi.get('/api/MovimientosNomina/sp_bw_cat_movimientos_nomina_sel');
          setRows(Array.isArray(resTabla?.data) ? resTabla.data : []);
      } catch (error) {
          setMessage({ text: 'Error al cargar los catálogos.', type: 'error' });
      } finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({ 
          ...prev, 
          [name]: type === 'checkbox' ? checked : value 
      }));
  };

// 1. GUARDAR NUEVO
  const handleAgregarNuevo = async () => {
        if (!formData.id_movimiento) return setMessage({ text: "La Clave del movimiento es obligatoria.", type: 'info' });
        if (!formData.descripcion.trim()) return setMessage({ text: "La descripción es obligatoria.", type: 'info' });
        if (!formData.tipo_movto) return setMessage({ text: "Seleccione un Tipo de Movimiento.", type: 'info' });

        setSaving(true);
        try {
            const payload = {
                cia: 1, // Por defecto siempre 1
                id_movimiento: Number(formData.id_movimiento),
                descripcion: formData.descripcion.toUpperCase(),
                id_gasto: Number(formData.id_gasto),
                id_subgasto: Number(formData.id_subgasto),
                deduccion: formData.deduccion,
                depositar: formData.depositar,
                tipo_movto: Number(formData.tipo_movto)
            };

            const res = await consumoApi.post('/api/MovimientosNomina/sp_bw_cat_movimientos_nomina_ins', payload);
            if (res.status === 200) {
                setMessage({ text: `Nuevo movimiento agregado exitosamente.`, type: 'success' });
                fetchCatalogos();
                setOpenAddModal(false); // <--- AGREGAR ESTA LÍNEA
                setFormData(initialFormState);
            }
        } catch (error: any) {
            setMessage({ text: error.response?.data?.mensaje || "Error al agregar el registro.", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

  // 2. AUTO-GUARDADO AL EDITAR LA TABLA 
  const processRowUpdate = async (newRow: any, oldRow: any) => {
      // Validar si cambió algo (comparando todos los campos editables)
      if (
          newRow.descripcion === oldRow.descripcion && 
          newRow.id_gasto === oldRow.id_gasto && 
          newRow.id_subgasto === oldRow.id_subgasto &&
          newRow.deduccion === oldRow.deduccion &&
          newRow.depositar === oldRow.depositar &&
          newRow.tipo_movto === oldRow.tipo_movto
      ) {
          return oldRow;
      }

      try {
          const payload = {
              cia: newRow.cia,
              id_movimiento: newRow.id_movimiento,
              descripcion: newRow.descripcion,
              id_gasto: Number(newRow.id_gasto),
              id_subgasto: Number(newRow.id_subgasto),
              deduccion: newRow.deduccion,
              depositar: newRow.depositar,
              tipo_movto: Number(newRow.tipo_movto)
          };

          const res = await consumoApi.put('/api/MovimientosNomina/sp_bw_cat_movimientos_nomina_upd', payload);
          
          if (res.status === 200) {
              setMessage({ text: "💾 Cambios guardados automáticamente.", type: 'info' });
              return newRow; 
          } else throw new Error("Error en la actualización");
      } catch (error) {
          setMessage({ text: "❌ Error al guardar los cambios.", type: 'error' });
          return oldRow; 
      }
  };

// 3. ELIMINAR
  const handleEliminar = async (cia: number, idMovimiento: number) => {
      const confirmacion = await Swal.fire({
          title: '¿Estás seguro?',
          text: "¿Desea eliminar este movimiento?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d32f2f',
          cancelButtonColor: '#333',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
      });

      if (!confirmacion.isConfirmed) return;

      setSaving(true);
      try {
          const res = await consumoApi.delete(`/api/MovimientosNomina/sp_bw_cat_movimientos_nomina_del?cia=${cia}&idMovimiento=${idMovimiento}`);
          if (res.status === 200) {
              setMessage({ text: "Movimiento eliminado exitosamente.", type: 'success' });
              fetchCatalogos();
          }
      } catch (error) {
          setMessage({ text: "Error al eliminar el registro.", type: 'error' });
      } finally {
          setSaving(false);
      }
  };

  const columns = useMemo<GridColDef[]>(() => [
        { 
        field: 'acciones', headerName: 'Eliminar', width: 90, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.cia, params.row.id_movimiento)}>
                <DeleteIcon />
            </IconButton>
        )
    },
    { field: 'id_movimiento', headerName: 'Clave', width: 80, fontWeight: 'bold', align: 'center', headerAlign: 'center' },
    { field: 'descripcion', headerName: 'Descripción (Editar)', flex: 1, minWidth: 200, editable: true, align: 'left', headerAlign: 'center' },
    { field: 'id_gasto', headerName: 'Gasto', width: 80, type: 'number', editable: true, align: 'center', headerAlign: 'center' },
    { field: 'id_subgasto', headerName: 'Subgasto', width: 90, type: 'number', editable: true, align: 'center', headerAlign: 'center' },
    { field: 'deduccion', headerName: 'Deducción', width: 100, type: 'boolean', editable: true, align: 'center', headerAlign: 'center' },
    { field: 'depositar', headerName: 'Depositar', width: 100, type: 'boolean', editable: true, align: 'center', headerAlign: 'center' },
    { 
        field: 'tipo_movto', 
        headerName: 'Tipo Movimiento', 
        width: 180, 
        editable: true, 
        type: 'singleSelect', // Hace que en la tabla sea una lista desplegable
        valueOptions: tiposMovimiento.map(t => ({ value: t.id, label: t.descripcion })),
        align: 'center', headerAlign: 'center' 
    }

  ], [tiposMovimiento]); // Importante incluir la dependencia para que la lista se cargue en la tabla

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
{/* PAPER 1: ENCABEZADO Y BOTÓN NUEVO */}
      <Paper sx={{ p: 3, borderRadius: '8px', mb: 3 }}>
        <Box sx={{ border: '1px solid #2c3e50', borderRadius: '8px', backgroundColor: '#fff', p: 1.5, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
                <Typography variant="h6" sx={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 'bold', color: '#1a365d', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                    Catálogo de Movimientos de Nómina
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
                
            </Box>
        </Box>
        <Button 
                  variant="contained" 
                  onClick={() => setOpenAddModal(true)} 
                  startIcon={<AddIcon />}
                  sx={{ 
                    backgroundColor: '#333333', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', transition: 'all 0.3s ease',
                    '&:hover': { backgroundColor: '#555555', transform: 'translateY(-1px)' }
                  }}
                >
                  NUEVO REGISTRO
                </Button>
      </Paper>

        {/* TABLA PRINCIPAL */}
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 3, width: '100%', maxHeight: 600, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
            <DataGrid 
                rows={Array.isArray(rows) ? rows : []} 
                columns={columns} 
                getRowId={(row) => `${row.cia}_${row.id_movimiento}`} // Llave compuesta
                loading={loading || saving} 
                paginationModel={paginationModel} 
                onPaginationModelChange={setPaginationModel} 
                pageSizeOptions={[50, 100, 500]} 
                slots={{ toolbar: GridToolbar, pagination: CustomPagination }} 
                slotProps={{ toolbar: { showQuickFilter: true } }} 
                density="compact"
                disableRowSelectionOnClick
                processRowUpdate={processRowUpdate} 
                onProcessRowUpdateError={(error) => console.error(error)}
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
                {/* MODAL DE NUEVO REGISTRO (ESTILO PREMIUM) */}
      <Dialog 
        open={openAddModal} 
        onClose={() => setOpenAddModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.18)', border: '1px solid #e0e0e0', overflow: 'hidden', background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }
        }}
      >
        {/* ENCABEZADO ELEGANTE */}
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>Nuevo Movimiento</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>Registre un nuevo concepto de nómina en el catálogo.</Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton onClick={() => setOpenAddModal(false)} sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            
            {/* SECCIÓN 1: DATOS BÁSICOS */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} /> Datos Básicos
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField {...commonProps} type="number" label="Clave*" name="id_movimiento" value={formData.id_movimiento} onChange={handleInputChange} sx={{ width: '120px', ...commonProps.sx }} />
                    <TextField {...commonProps} label="Descripción*" name="descripcion" value={formData.descripcion} onChange={handleInputChange} sx={{ width: '300px', ...commonProps.sx }} />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* SECCIÓN 2: CONFIGURACIÓN CONTABLE */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} /> Configuración y Tipo
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <TextField {...commonProps} type="number" label="Gasto" name="id_gasto" value={formData.id_gasto} onChange={handleInputChange} sx={{ width: '120px', ...commonProps.sx }} />
                    <TextField {...commonProps} type="number" label="Subgasto" name="id_subgasto" value={formData.id_subgasto} onChange={handleInputChange} sx={{ width: '120px', ...commonProps.sx }} />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField {...selectProps} select label="Tipo de Movimiento*" name="tipo_movto" value={formData.tipo_movto} onChange={handleInputChange} sx={{ width: '300px', ...selectProps.sx }}>
                    <MenuItem value="">-- SELECCIONE --</MenuItem>
                    {tiposMovimiento.map(tipo => (<MenuItem key={tipo.id} value={tipo.id}>{tipo.descripcion}</MenuItem>))}
                  </TextField>
                </Grid>
              </Grid>
            </Box>

            {/* SECCIÓN 3: OPCIONES */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} /> Opciones
              </Typography>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <FormControlLabel control={<Checkbox size="small" name="deduccion" checked={formData.deduccion} onChange={handleInputChange} />} label={<Typography variant="body2" sx={{fontWeight: 600, color: '#555'}}>Es Deducción</Typography>} />
                <FormControlLabel control={<Checkbox size="small" name="depositar" checked={formData.depositar} onChange={handleInputChange} />} label={<Typography variant="body2" sx={{fontWeight: 600, color: '#555'}}>Se Deposita</Typography>} />
              </Box>
            </Box>

          </Box>
        </DialogContent>

        <DialogActions sx={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0', p: 3 }}>
          <Button onClick={() => setOpenAddModal(false)} sx={{ borderRadius: '8px', fontWeight: 600, px: 3, color: '#666' }}>Cancelar</Button>
          <Button 
            variant='contained' 
            onClick={handleAgregarNuevo} 
            disabled={saving} 
            startIcon={<AddIcon />} 
            sx={{ bgcolor: '#333333', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#555555' } }}
          >
            {saving ? 'Guardando...' : 'Guardar Movimiento'}
          </Button>
        </DialogActions>
      </Dialog>

      
    </Box>
  );
}