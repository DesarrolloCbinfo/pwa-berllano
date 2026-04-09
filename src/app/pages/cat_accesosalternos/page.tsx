"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  MenuItem, Snackbar, Alert, Paper, IconButton 
} from '@mui/material'; 
import { 
  DataGrid, GridColDef, GridToolbar, 
  GridPaginationModel, GridPagination, GridRenderCellParams
} from '@mui/x-data-grid';

import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import Swal from 'sweetalert2'; // <--- AGREGAR ESTA LÍNEA

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
      '&:hover': {
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        borderColor: '#999'
      }
    },
    '& .MuiInputLabel-root': { transform: 'translate(14px, 14px) scale(1)', color: '#666', fontWeight: 500 },
    '& .MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)', color: '#333', fontWeight: 600 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0', borderWidth: '1.5px' }
  }
};

const selectProps = {
  ...commonProps,
  SelectProps: { MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } },
  sx: { 
    ...commonProps.sx, 
    '& .MuiSelect-select': { display: 'block !important', whiteSpace: 'nowrap !important', overflow: 'hidden !important', textOverflow: 'ellipsis !important' } 
  }
};

function CustomPagination() { return <GridPagination />; }

const initialFormState = {
  fecha1: new Date().toISOString().split('T')[0],
  fecha2: new Date().toISOString().split('T')[0],
  claveEmpleado: ''
};

export default function AccesosAlternos() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  // Estados
  const [rows, setRows] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
      fetchEmpleados();
      fetchTablaAccesos();
  }, []);
const fetchEmpleados = async () => {
      try {
          const res = await consumoApi.get('/api/AccesosAlternos/sp_bw_cat_combo_trabajadores_activos');
          setEmpleados(Array.isArray(res?.data) ? res.data : []);
      } catch (error) { 
          Swal.fire({ title: 'Error', text: 'Error al cargar la lista de empleados.', icon: 'error', confirmButtonColor: '#333' });
      }
  };

  const fetchTablaAccesos = async () => {
      setLoading(true);
      try {
          const res = await consumoApi.get('/api/AccesosAlternos/sp_bw_cat_accesosAlternos_sel');
          setRows(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
          setRows([]);
          Swal.fire({ title: 'Error', text: 'Error al cargar la tabla de accesos.', icon: 'error', confirmButtonColor: '#333' });
      } finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleGuardar = async () => {
        if (!formData.claveEmpleado) return Swal.fire({ title: 'Atención', text: 'El Empleado es obligatorio.', icon: 'warning', confirmButtonColor: '#333' });
        if (!formData.fecha1 || !formData.fecha2) return Swal.fire({ title: 'Atención', text: 'Las fechas son obligatorias.', icon: 'warning', confirmButtonColor: '#333' });

        // Validación extra: Fecha 2 no puede ser menor a Fecha 1
        if (new Date(formData.fecha2) < new Date(formData.fecha1)) {
            return Swal.fire({ title: 'Atención', text: 'La Fecha Final no puede ser menor a la Fecha Inicial.', icon: 'warning', confirmButtonColor: '#333' });
        }

        setSaving(true);
        try {
            const res = await consumoApi.post('/api/AccesosAlternos/sp_bw_cat_accesosAlternos_ins', formData);
            if (res.status === 200) {
                Swal.fire({ title: '¡Guardado!', text: 'Acceso alterno guardado correctamente.', icon: 'success', timer: 2000, showConfirmButton: false });
                fetchTablaAccesos();
                // Limpiamos solo el empleado para capturar otro rápidamente
                setFormData(prev => ({ ...prev, claveEmpleado: '' }));
            }
        } catch (error) {
            Swal.fire({ title: 'Error', text: 'Error al guardar el registro.', icon: 'error', confirmButtonColor: '#333' });
        } finally {
            setSaving(false);
        }
    };

const handleEliminar = async (id: number) => {
      const confirmacion = await Swal.fire({
          title: '¿Estás seguro?',
          text: "¿Deseas eliminar este acceso?",
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
          const res = await consumoApi.delete(`/api/AccesosAlternos/sp_bw_cat_accesosAlternos_del?id=${id}`);
          if (res.status === 200) {
              Swal.fire({ title: 'Eliminado', text: 'Registro eliminado.', icon: 'success', timer: 2000, showConfirmButton: false });
              fetchTablaAccesos();
          }
      } catch (error) {
          Swal.fire({ title: 'Error', text: 'Error al eliminar el registro.', icon: 'error', confirmButtonColor: '#333' });
      } finally {
          setSaving(false);
      }
  };

  const columns = useMemo<GridColDef[]>(() => [
        { 
        field: 'acciones', headerName: 'Eliminar', flex: 0.5, minWidth: 80, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.id)}>
                <DeleteIcon />
            </IconButton>
        )
    },
    { field: 'claveEmpleado', headerName: 'Clave', flex: 1, minWidth: 100, fontWeight: 'bold', align: 'center', headerAlign: 'center' },
    { field: 'nombreEmpleado', headerName: 'Nombre del Empleado', flex: 2, minWidth: 200, align: 'center', headerAlign: 'center' },
    { field: 'fecha1', headerName: 'Fecha Inicial', flex: 1, minWidth: 120, valueFormatter: (v: any) => new Date(v).toLocaleDateString(), align: 'center', headerAlign: 'center' },
    { field: 'fecha2', headerName: 'Fecha Final', flex: 1, minWidth: 120, valueFormatter: (v: any) => new Date(v).toLocaleDateString(), align: 'center', headerAlign: 'center' },

  ], []);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Paper sx={{ p: 3 }}>
        {/* ENCABEZADO ESTILO ACCESS */}
        <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '6px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Accesos Alternos (Sin Huella)
                </Typography>
                
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
                
            </Box>
        </Box>

        <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} md={2}>
                <TextField {...commonProps} type="date" label="Fecha Inicial" name="fecha1" value={formData.fecha1} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField {...commonProps} type="date" label="Fecha Final" name="fecha2" value={formData.fecha2} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            
            {/* NUEVO CAMPO: CAJA DE TEXTO PARA LA CLAVE */}
            <Grid item xs={12} md={2}>
                <TextField 
                    {...commonProps} 
                    label="Clave" 
                    name="claveEmpleado" 
                    value={formData.claveEmpleado} 
                    onChange={handleInputChange} 
                    placeholder="Ej. 1045"
                    sx={{...commonProps.sx, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' }}}
                />
            </Grid>

            {/* LISTA DESPLEGABLE SINCRONIZADA */}
            <Grid item xs={12} md={4}>
                <TextField {...selectProps} select label="Nombre del Empleado*" name="claveEmpleado" value={formData.claveEmpleado} onChange={handleInputChange} 
                    sx={{ width: '300px', ...selectProps.sx, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' } }}>
                    <MenuItem value="">-- SELECCIONE UN EMPLEADO --</MenuItem>
                    {empleados.map(emp => (
                        <MenuItem key={emp.id} value={emp.id}>
                            {emp.descripcion}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>

            {/* Botón Guardar */}
            <Grid item xs={12} md={2}>
                <Button variant="contained" onClick={handleGuardar} disabled={saving} fullWidth startIcon={<SaveIcon />}
                    sx={{ 
                        height: '50px', 
                        backgroundColor: '#333333', 
                        color: 'white', 
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                            backgroundColor: '#555555',
                            boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)',
                            transform: 'translateY(-1px)'
                        }
                    }}>
                    GUARDAR
                </Button>
            </Grid>
        </Grid>
      </Paper>

        {/* TABLA PRINCIPAL */}
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ maxHeight: 400, mb: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
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
                    '& .MuiDataGrid-columnHeaders': {
                        borderBottom: '2px solid #000',
                        textAlign: 'center',
                        fontSize: '1rem',
                        fontWeight: 'bold'
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid #e0e0e0'
                    }
                }} 
            />
          </Paper>
        </Box>


    </Box>
  );
}