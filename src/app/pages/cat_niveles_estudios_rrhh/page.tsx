"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  Snackbar, Alert, Paper, IconButton 
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

const initialFormState = { clave_nivel: '', descripcion_escolaridad: '' };

export default function NivelesEstudios() {
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
    
    // Toast chiquito para los guardados automáticos de la tabla DataGrid
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

    // Alertas pop-up para las validaciones y los éxitos de guardado principal
    Swal.fire({
      title: msg.type === 'success' ? '¡Éxito!' : 'Atención',
      text: msg.text,
      icon: msg.type === 'success' ? 'success' : (msg.type === 'error' ? 'error' : 'warning'),
      timer: msg.type === 'success' ? 2000 : undefined,
      showConfirmButton: msg.type !== 'success',
      confirmButtonColor: '#333'
    });
  };

  useEffect(() => { fetchTabla(); }, []);

  const fetchTabla = async () => {
      setLoading(true);
      try {
          const res = await consumoApi.get('/api/NivelesEscolaridad/sp_bw_cat_niveles_escolaridad_sel');
          setRows(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
          setMessage({ text: 'Error al cargar la tabla.', type: 'error' });
      } finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleAgregarNuevo = async () => {
        // Validaciones elegantes
        if (!formData.clave_nivel) return setMessage({ text: "La Clave es obligatoria.", type: 'info' });
        if (!formData.descripcion_escolaridad.trim()) return setMessage({ text: "La descripción es obligatoria.", type: 'info' });

        setSaving(true);
        try {
            const payload = {
                clave_nivel: Number(formData.clave_nivel),
                descripcion_escolaridad: formData.descripcion_escolaridad.toUpperCase()
            };

            const res = await consumoApi.post('/api/NivelesEscolaridad/sp_bw_cat_niveles_escolaridad_ins', payload);
            if (res.status === 200) {
                setMessage({ text: `Nivel de estudios agregado exitosamente.`, type: 'success' });
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
      if (newRow.descripcion_escolaridad === oldRow.descripcion_escolaridad) return oldRow;

      try {
          const payload = {
              clave_nivel: newRow.clave_nivel,
              descripcion_escolaridad: newRow.descripcion_escolaridad.toUpperCase()
          };

          const res = await consumoApi.put('/api/NivelesEscolaridad/sp_bw_cat_niveles_escolaridad_upd', payload);
          if (res.status === 200) {
              setMessage({ text: "💾 Cambios guardados automáticamente.", type: 'info' });
              return { ...newRow, descripcion_escolaridad: payload.descripcion_escolaridad }; 
          } else throw new Error("Error en actualización");
      } catch (error) {
          setMessage({ text: "❌ Error al guardar.", type: 'error' });
          return oldRow;
      }
  };

const handleEliminar = async (clave: number) => {
      const confirmacion = await Swal.fire({
          title: '¿Estás seguro?',
          text: "¿Desea eliminar este nivel de estudios?",
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
          const res = await consumoApi.delete(`/api/NivelesEscolaridad/sp_bw_cat_niveles_escolaridad_del?claveNivel=${clave}`);
          if (res.status === 200) {
              setMessage({ text: "Nivel de estudios eliminado exitosamente.", type: 'success' });
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
        field: 'acciones', headerName: 'Eliminar', width: 120, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.clave_nivel)}>
                <DeleteIcon />
            </IconButton>
        )
    },
    { field: 'clave_nivel', headerName: 'Clave', width: 120, fontWeight: 'bold', align: 'center', headerAlign: 'center' },
    { field: 'descripcion_escolaridad', headerName: 'Descripción del Nivel (Doble clic para editar)', flex: 1, minWidth: 250, editable: true, align: 'left', headerAlign: 'center' },

  ], []);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
      <Paper sx={{ p: 3, borderRadius: '8px' }}>

        {/* ENCABEZADO ESTILO ACCESS */}
        <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Niveles de estudios RRHH
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
                <TextField {...commonProps} type="number" label="Clave*" name="clave_nivel" value={formData.clave_nivel} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField {...commonProps} label="Descripción del Nivel*" name="descripcion_escolaridad" value={formData.descripcion_escolaridad} onChange={handleInputChange} />
            </Grid>
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
                getRowId={(row) => row.clave_nivel} 
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

  

    </Box>
  );
}