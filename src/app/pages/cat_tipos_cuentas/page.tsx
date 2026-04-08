"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  Snackbar, Alert, Paper, IconButton, Checkbox, FormControlLabel 
} from '@mui/material'; 
import { 
  DataGrid, GridColDef, GridToolbar, 
  GridPaginationModel, GridPagination, GridRenderCellParams
} from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Swal from 'sweetalert2';

import useConsumoApi from '../../../hooks/useConsumoApi';
import { useSessionContext } from '../../../context/SessionProvider'; 

const commonProps = {
  fullWidth: true, size: "small" as const, variant: "outlined" as const,
  sx: {
    '& .MuiInputBase-root': { height: '50px', alignItems: 'center', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderColor: '#999' } },
    '& .MuiInputLabel-root': { transform: 'translate(14px, 14px) scale(1)', color: '#666', fontWeight: 500 },
    '& .MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)', color: '#333', fontWeight: 600 },
  }
};

function CustomPagination() { return <GridPagination />; }

const initialFormState = { tipo_cuenta: '', descripcion: '', acreedora: false, deudora: false };

export default function TiposCuentas() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
  const [formData, setFormData] = useState(initialFormState);
  
  // Función interceptora para SweetAlert2
  const setMessage = (msg: { text: string, type: 'success' | 'error' | 'info' } | null) => {
    if (!msg) return;
    
    // Si es "info" (cuando editas directo en la tabla), lanzamos un Toast discreto
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

    // Alertas estándar para éxito o error
    Swal.fire({
      title: msg.type === 'success' ? '¡Éxito!' : 'Error',
      text: msg.text,
      icon: msg.type,
      timer: msg.type === 'success' ? 2000 : undefined,
      showConfirmButton: msg.type !== 'success',
      confirmButtonColor: '#333'
    });
  };

  useEffect(() => { fetchTabla(); }, []);

  const fetchTabla = async () => {
      setLoading(true);
      try {
          const res = await consumoApi.get('/api/TiposCuentas/sp_bw_cat_tipos_cuentas_sel');
          setRows(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
          setMessage({ text: 'Error al cargar la tabla.', type: 'error' });
      } finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({ 
          ...prev, 
          [name]: type === 'checkbox' ? checked : value 
      }));
  };

const handleAgregarNuevo = async () => {
        // Validaciones elegantes con SweetAlert
        if (!formData.tipo_cuenta) return Swal.fire('Atención', 'La Clave es obligatoria.', 'warning');
        if (!formData.descripcion.trim()) return Swal.fire('Atención', 'La descripción es obligatoria.', 'warning');

        setSaving(true);
        try {
            const payload = {
                tipo_cuenta: Number(formData.tipo_cuenta),
                descripcion: formData.descripcion.toUpperCase(),
                acreedora: formData.acreedora,
                deudora: formData.deudora
            };

            const res = await consumoApi.post('/api/TiposCuentas/sp_bw_cat_tipos_cuentas_ins', payload);
            if (res.status === 200) {
                setMessage({ text: `Tipo de cuenta agregado exitosamente.`, type: 'success' });
                fetchTabla();
                setFormData(initialFormState);
            }
        } catch (error: any) {
            setMessage({ text: error.response?.data?.mensaje || "Error al agregar el registro.", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

  const processRowUpdate = async (newRow: any, oldRow: any) => {
      if (
          newRow.Descripcion === oldRow.Descripcion &&
          newRow.Acreedora === oldRow.Acreedora &&
          newRow.Deudora === oldRow.Deudora
      ) return oldRow;

      try {
          const payload = {
              tipo_cuenta: newRow.Tipo_cuenta,
              descripcion: newRow.Descripcion?.toUpperCase() || '',
              acreedora: newRow.Acreedora,
              deudora: newRow.Deudora
          };

          const res = await consumoApi.put('/api/TiposCuentas/sp_bw_cat_tipos_cuentas_upd', payload);
          if (res.status === 200) {
              setMessage({ text: "💾 Cambios guardados automáticamente.", type: 'info' });
              return { ...newRow, Descripcion: payload.descripcion }; 
          } else throw new Error("Error en actualización");
      } catch (error) {
          setMessage({ text: "❌ Error al guardar los cambios.", type: 'error' });
          return oldRow;
      }
  };

const handleEliminar = async (clave: number) => {
      const confirmacion = await Swal.fire({
          title: '¿Estás seguro?',
          text: "¿Desea eliminar este Tipo de Cuenta?",
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
          const res = await consumoApi.delete(`/api/TiposCuentas/sp_bw_cat_tipos_cuentas_del?tipoCuenta=${clave}`);
          if (res.status === 200) {
              setMessage({ text: "Tipo de cuenta eliminado exitosamente.", type: 'success' });
              fetchTabla();
          }
      } catch (error: any) {
          setMessage({ text: error.response?.data?.mensaje || "Error al eliminar el registro.", type: 'error' });
      } finally {
          setSaving(false);
      }
  };

  const columns = useMemo<GridColDef[]>(() => [
        { 
        field: 'acciones', headerName: 'Eliminar', width: 100, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.Tipo_cuenta)}>
                <DeleteIcon />
            </IconButton>
        )
    },
    { field: 'Tipo_cuenta', headerName: 'Clave', width: 100, fontWeight: 'bold', align: 'center', headerAlign: 'center' },
    { field: 'Descripcion', headerName: 'Descripción (Doble clic para editar)', flex: 1, minWidth: 250, editable: true, align: 'left', headerAlign: 'center' },
    { field: 'Acreedora', headerName: 'Acreedora', width: 120, type: 'boolean', editable: true, align: 'center', headerAlign: 'center' },
    { field: 'Deudora', headerName: 'Deudora', width: 120, type: 'boolean', editable: true, align: 'center', headerAlign: 'center' },

  ], []);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
      <Paper sx={{ p: 3, borderRadius: '8px' }}>
        {/* ENCABEZADO ESTILO ACCESS */}
        <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Catálogo de Tipos de Cuentas
                </Typography>
               
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
                
            </Box>
        </Box>

        <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12} md={2}>
                <TextField {...commonProps} type="number" label="Clave*" name="tipo_cuenta" value={formData.tipo_cuenta} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField {...commonProps} label="Descripción*" name="descripcion" value={formData.descripcion} onChange={handleInputChange} />
            </Grid>
            
            {/* Checkboxes Centrados */}
            <Grid item xs={6} md={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                <FormControlLabel control={<Checkbox size="small" name="acreedora" checked={formData.acreedora} onChange={handleInputChange} />} label={<Typography variant="body2" sx={{fontWeight: 500, color: '#555'}}>Acreedora</Typography>} />
            </Grid>
            <Grid item xs={6} md={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                <FormControlLabel control={<Checkbox size="small" name="deudora" checked={formData.deudora} onChange={handleInputChange} />} label={<Typography variant="body2" sx={{fontWeight: 500, color: '#555'}}>Deudora</Typography>} />
            </Grid>

            {/* Botón Agregar */}
            <Grid item xs={12} md={2}>
                <Button variant="contained" onClick={handleAgregarNuevo} disabled={saving} fullWidth startIcon={<AddIcon />}
                    sx={{ 
                        height: '50px', backgroundColor: '#333333', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', transition: 'all 0.3s ease',
                        '&:hover': { backgroundColor: '#555555', boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', transform: 'translateY(-1px)' }
                    }}>
                    AGREGAR
                </Button>
            </Grid>
        </Grid>
      </Paper>

        {/* TABLA PRINCIPAL */}
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 3, width: '100%', maxHeight: 600, mb: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
            <DataGrid 
                rows={Array.isArray(rows) ? rows : []} 
                columns={columns} 
                getRowId={(row) => row.Tipo_cuenta} 
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
                    '& .MuiDataGrid-columnHeaders': { borderBottom: '2px solid #000', fontSize: '1rem', fontWeight: 'bold' },
                    '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' },
                    '& .MuiDataGrid-cell--editable': { backgroundColor: '#f9fbfd', cursor: 'text' }, 
                    '& .MuiDataGrid-cell--editing': { backgroundColor: '#fff', boxShadow: '0 0 5px rgba(25,118,210,0.5)' }
                }} 
            />
          </Paper>
        </Box>

      {/* PIE DE PÁGINA */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          CAT_TIPOS_CUENTAS, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR:{session?.nombre || 'ADMIN'}
        </Typography>
      </Box>

    </Box>
  );
}