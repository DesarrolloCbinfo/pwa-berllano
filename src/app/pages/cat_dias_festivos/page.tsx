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

import Swal from 'sweetalert2'; // <--- AGREGAR ESTA LÍNEA

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

export default function DiasFestivos() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
  
  // Como solo es un dato, el estado inicial es la fecha de hoy
  const [fechaFestivo, setFechaFestivo] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => { fetchTabla(); }, []);

const fetchTabla = async () => {
      setLoading(true);
      try {
          const res = await consumoApi.get('/api/DiasFestivos/sp_bw_cat_dias_festivos_sel');
          const dataConId = (Array.isArray(res?.data) ? res.data : []).map((row, index) => ({ ...row, id: index }));
          setRows(dataConId);
      } catch (error) {
          // CAMBIO: Alerta de error
          Swal.fire({ title: 'Error', text: 'Error al cargar la tabla.', icon: 'error', confirmButtonColor: '#333' });
      } finally { setLoading(false); }
  };

const handleAgregarNuevo = async () => {
        // CAMBIO: Validación con SweetAlert
        if (!fechaFestivo) {
            return Swal.fire({ title: 'Atención', text: 'Seleccione una fecha.', icon: 'warning', confirmButtonColor: '#333' });
        }

        setSaving(true);
        try {
            const payload = { fecha_festivo: fechaFestivo };
            const res = await consumoApi.post('/api/DiasFestivos/sp_bw_cat_dias_festivos_ins', payload);
            
            if (res.status === 200) {
                // CAMBIO: Éxito con SweetAlert (Se cierra solo en 2 seg)
                Swal.fire({ title: '¡Guardado!', text: 'Día festivo agregado.', icon: 'success', timer: 2000, showConfirmButton: false });
                fetchTabla();
            }
        } catch (error: any) {
            // CAMBIO: Error con SweetAlert
            Swal.fire({ title: 'Error', text: error.response?.data?.mensaje || "Error al agregar el registro.", icon: 'error', confirmButtonColor: '#333' });
        } finally {
            setSaving(false);
        }
    };

const handleEliminar = async (fechaString: string) => {
      // CAMBIO: Confirmación moderna con SweetAlert
      const confirmacion = await Swal.fire({
          title: '¿Estás seguro?',
          text: "¿Deseas eliminar este día festivo?",
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
          const res = await consumoApi.delete(`/api/DiasFestivos/sp_bw_cat_dias_festivos_del?fechaFestivo=${fechaString}`);
          if (res.status === 200) {
              // CAMBIO: Éxito con SweetAlert
              Swal.fire({ title: 'Eliminado', text: 'Día festivo eliminado.', icon: 'success', timer: 2000, showConfirmButton: false });
              fetchTabla();
          }
      } catch (error) {
          // CAMBIO: Error con SweetAlert
          Swal.fire({ title: 'Error', text: 'Error al eliminar.', icon: 'error', confirmButtonColor: '#333' });
      } finally {
          setSaving(false);
      }
  };

  const columns = useMemo<GridColDef[]>(() => [
    { 
        field: 'acciones', headerName: 'Eliminar', width: 120, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.fecha_festivo)}>
                <DeleteIcon />
            </IconButton>
        )
    },
    { 
        field: 'fecha_festivo', 
        headerName: 'Día Festivo', 
        flex: 1, 
        minWidth: 300, 
        align: 'center', 
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
            // Formatea la fecha para que diga "martes, 1 de enero de 2019"
            const date = new Date(params.value);
            return date.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
    }
    
  ], []);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
      <Paper sx={{ p: 3, borderRadius: '8px' }}>


        {/* ENCABEZADO ESTILO ACCESS */}
        <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Catálogo de Días Festivos
                </Typography>
                
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
                
            </Box>
        </Box>

        <Grid container spacing={2} justifyContent="center" alignItems="flex-end">
            <Grid item xs={12} md={4}>
                <TextField 
                    {...commonProps} 
                    type="date" 
                    label="Seleccionar Fecha" 
                    value={fechaFestivo} 
                    onChange={(e) => setFechaFestivo(e.target.value)} 
                    InputLabelProps={{ shrink: true }}
                />
            </Grid>

            {/* Botón Agregar */}
            <Grid item xs={12} md={3}>
                <Button variant="contained" onClick={handleAgregarNuevo} disabled={saving} fullWidth startIcon={<AddIcon />}
                    sx={{ 
                        height: '50px', backgroundColor: '#333333', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', transition: 'all 0.3s ease',
                        '&:hover': { backgroundColor: '#555555', boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', transform: 'translateY(-1px)' }
                    }}>
                    AGREGAR FESTIVO
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
                getRowId={(row) => row.id} 
                loading={loading || saving} 
                paginationModel={paginationModel} 
                onPaginationModelChange={setPaginationModel} 
                pageSizeOptions={[50, 100, 500]} 
                slots={{ toolbar: GridToolbar, pagination: CustomPagination }} 
                slotProps={{ toolbar: { showQuickFilter: true } }} 
                density="compact"
                disableRowSelectionOnClick
                sx={{ 
                    border: 'none', 
                    '& .MuiDataGrid-columnHeaders': { borderBottom: '2px solid #000', fontSize: '1rem', fontWeight: 'bold' },
                    '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' },
                }} 
            />
          </Paper>
        </Box>

    </Box>
  );
}