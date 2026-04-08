"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  Snackbar, Alert, Paper, IconButton, MenuItem 
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

const selectProps = {
    ...commonProps,
    SelectProps: { MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } }
};

// Generar array de horas en formato 24h (de 00:00 a 23:30 cada 30 min)
const generarOpcionesHora = () => {
    const horas = [];
    for (let h = 0; h < 24; h++) {
        const horaStr = h.toString().padStart(2, '0');
        horas.push(`${horaStr}:00`);
        horas.push(`${horaStr}:30`);
    }
    return horas;
};
const opcionesHora = generarOpcionesHora();

function CustomPagination() { return <GridPagination />; }

const initialFormState = { horario: '', descripcion: '', h1: '', h2: '', h3: '', h4: '' };

export default function Horarios() {
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

    // Alertas estándar para validaciones, éxito o error
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
          const res = await consumoApi.get('/api/Horarios/sp_bw_cat_horarios_sel');
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
        // Usamos 'info' para que dispare un warning visual en el interceptor
        if (!formData.horario) return setMessage({ text: "La Clave es obligatoria.", type: 'info' });
        if (!formData.descripcion.trim()) return setMessage({ text: "La descripción es obligatoria.", type: 'info' });

        setSaving(true);
        try {
            const payload = {
                horario: Number(formData.horario),
                descripcion: formData.descripcion.toUpperCase(),
                h1: formData.h1,
                h2: formData.h2,
                h3: formData.h3,
                h4: formData.h4
            };

            const res = await consumoApi.post('/api/Horarios/sp_bw_cat_horarios_ins', payload);
            if (res.status === 200) {
                setMessage({ text: `Horario agregado exitosamente.`, type: 'success' });
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
          newRow.descripcion === oldRow.descripcion &&
          newRow.h1 === oldRow.h1 &&
          newRow.h2 === oldRow.h2 &&
          newRow.h3 === oldRow.h3 &&
          newRow.h4 === oldRow.h4
      ) return oldRow;

      try {
          const payload = {
              horario: newRow.horario,
              descripcion: newRow.descripcion?.toUpperCase() || '',
              h1: newRow.h1,
              h2: newRow.h2,
              h3: newRow.h3,
              h4: newRow.h4
          };

          const res = await consumoApi.put('/api/Horarios/sp_bw_cat_horarios_upd', payload);
          if (res.status === 200) {
              setMessage({ text: "💾 Cambios guardados automáticamente.", type: 'info' });
              return { ...newRow, descripcion: payload.descripcion }; 
          } else throw new Error("Error en actualización");
      } catch (error) {
          setMessage({ text: "❌ Error al guardar. (Revisa que el formato de hora sea HH:mm)", type: 'error' });
          return oldRow;
      }
  };

const handleEliminar = async (clave: number) => {
      const confirmacion = await Swal.fire({
          title: '¿Estás seguro?',
          text: "¿Desea eliminar este horario?",
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
          const res = await consumoApi.delete(`/api/Horarios/sp_bw_cat_horarios_del?horario=${clave}`);
          if (res.status === 200) {
              setMessage({ text: "Horario eliminado exitosamente.", type: 'success' });
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
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.horario)}>
                <DeleteIcon />
            </IconButton>
        )
    },
    { field: 'horario', headerName: 'Clave', width: 90, fontWeight: 'bold', align: 'center', headerAlign: 'center' },
    { field: 'descripcion', headerName: 'Descripción (Doble clic para editar)', flex: 1, minWidth: 200, editable: true, align: 'center', headerAlign: 'center' },
    { 
        field: 'h1', headerName: 'Entrada 1', width: 110, editable: true, type: 'singleSelect', valueOptions: opcionesHora, align: 'center', headerAlign: 'center' 
    },
    { 
        field: 'h2', headerName: 'Salida 1', width: 110, editable: true, type: 'singleSelect', valueOptions: opcionesHora, align: 'center', headerAlign: 'center' 
    },
    { 
        field: 'h3', headerName: 'Entrada 2', width: 110, editable: true, type: 'singleSelect', valueOptions: opcionesHora, align: 'center', headerAlign: 'center' 
    },
    { 
        field: 'h4', headerName: 'Salida 2', width: 110, editable: true, type: 'singleSelect', valueOptions: opcionesHora, align: 'center', headerAlign: 'center' 
    }
   
  ], []);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
      <Paper sx={{ p: 3, borderRadius: '8px' }}>

        {/* ENCABEZADO ESTILO ACCESS */}
        <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Catálogo de Horarios
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                    Sucursal: {session?.dSucursal || 'Cargando...'}
                </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                    Usuario: {session?.nombre || 'Cargando...'}
                </Typography>
            </Box>
        </Box>

        <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12} md={1}>
                <TextField {...commonProps} type="number" label="Clave*" name="horario" value={formData.horario} onChange={handleInputChange} 
                    sx={{ width: '120px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField {...commonProps} label="Descripción del Horario*" name="descripcion" value={formData.descripcion} onChange={handleInputChange} 
                    sx={{ width: '300px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={6} md={1}>
                <TextField {...selectProps} select label="Entrada 1" name="h1" value={formData.h1} onChange={handleInputChange}
                    sx={{ width: '120px', ...selectProps.sx }}>
                    <MenuItem value="">--:--</MenuItem>
                    {opcionesHora.map(hora => <MenuItem key={`h1_${hora}`} value={hora}>{hora}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={6} md={1}>
                <TextField {...selectProps} select label="Salida 1" name="h2" value={formData.h2} onChange={handleInputChange}
                    sx={{ width: '120px', ...selectProps.sx }}>
                    <MenuItem value="">--:--</MenuItem>
                    {opcionesHora.map(hora => <MenuItem key={`h2_${hora}`} value={hora}>{hora}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={6} md={1}>
                <TextField {...selectProps} select label="Entrada 2" name="h3" value={formData.h3} onChange={handleInputChange}
                    sx={{ width: '120px', ...selectProps.sx }}>
                    <MenuItem value="">--:--</MenuItem>
                    {opcionesHora.map(hora => <MenuItem key={`h3_${hora}`} value={hora}>{hora}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={6} md={1}>
                <TextField {...selectProps} select label="Salida 2" name="h4" value={formData.h4} onChange={handleInputChange}
                    sx={{ width: '120px', ...selectProps.sx }}>
                    <MenuItem value="">--:--</MenuItem>
                    {opcionesHora.map(hora => <MenuItem key={`h4_${hora}`} value={hora}>{hora}</MenuItem>)}
                </TextField>
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
                getRowId={(row) => row.horario} 
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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          CAT_HORARIOS, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR:{session?.nombre || 'ADMIN'}
        </Typography>
      </Box>

    </Box>
  );
}