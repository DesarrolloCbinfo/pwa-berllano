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

function CustomPagination() { return <GridPagination />; }

const initialFormState = { tipo_movimiento: '', descripcion: '', porcentaje: 0, importe_minimo: 0 };

export default function TiposMovimientos() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  // Estados
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

  useEffect(() => {
      fetchTabla();
  }, []);

  const fetchTabla = async () => {
      setLoading(true);
      try {
          const res = await consumoApi.get('/api/TipoMovimiento/sp_bw_cat_tipo_movimiento_sel');
          setRows(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
          setMessage({ text: 'Error al cargar la tabla.', type: 'error' });
      } finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

// 1. GUARDAR NUEVO
  const handleAgregarNuevo = async () => {
        // Usamos 'info' para que dispare un warning visual
        if (!formData.tipo_movimiento) return setMessage({ text: "La Clave es obligatoria.", type: 'info' });
        if (!formData.descripcion.trim()) return setMessage({ text: "La descripción es obligatoria.", type: 'info' });

        setSaving(true);
        try {
            const payload = {
                tipo_movimiento: Number(formData.tipo_movimiento),
                descripcion: formData.descripcion,
                porcentaje: Number(formData.porcentaje),
                importe_minimo: Number(formData.importe_minimo)
            };

            const res = await consumoApi.post('/api/TipoMovimiento/sp_bw_cat_tipo_movimiento_ins', payload);
            if (res.status === 200) {
                setMessage({ text: `Nuevo movimiento agregado exitosamente.`, type: 'success' });
                fetchTabla();
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
      if (newRow.descripcion === oldRow.descripcion && newRow.porcentaje === oldRow.porcentaje && newRow.importe_minimo === oldRow.importe_minimo) {
          return oldRow;
      }

      try {
          const payload = {
              tipo_movimiento: newRow.tipo_movimiento,
              descripcion: newRow.descripcion,
              porcentaje: Number(newRow.porcentaje),
              importe_minimo: Number(newRow.importe_minimo)
          };

          const res = await consumoApi.put('/api/TipoMovimiento/sp_bw_cat_tipo_movimiento_upd', payload);
          
          if (res.status === 200) {
              setMessage({ text: "Cambios guardados automáticamente.", type: 'info' });
              return newRow; 
          } else {
              throw new Error("Error en la actualización");
          }
      } catch (error) {
          setMessage({ text: "Error al guardar los cambios.", type: 'error' });
          return oldRow; 
      }
  };

  // 3. ELIMINAR
  const handleEliminar = async (clave: number) => {
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
          const res = await consumoApi.delete(`/api/TipoMovimiento/sp_bw_cat_tipo_movimiento_del?tipoMovimiento=${clave}`);
          if (res.status === 200) {
              setMessage({ text: "Movimiento eliminado exitosamente.", type: 'success' });
              fetchTabla();
          }
      } catch (error) {
          setMessage({ text: "Error al eliminar el registro.", type: 'error' });
      } finally {
          setSaving(false);
      }
  };

  const columns = useMemo<GridColDef[]>(() => [
    { field: 'tipo_movimiento', headerName: 'Clave', width: 100, fontWeight: 'bold', align: 'center', headerAlign: 'center' },
    { field: 'descripcion', headerName: 'Descripción del Movimiento (Doble clic para editar)', flex: 1, minWidth: 200, editable: true, align: 'center', headerAlign: 'center' },
    { field: 'porcentaje', headerName: 'Porcentaje', width: 120, type: 'number', editable: true, align: 'center', headerAlign: 'center' },
    { field: 'importe_minimo', headerName: 'Descto. Mínimo', width: 150, type: 'number', editable: true, align: 'center', headerAlign: 'center' },
    { 
        field: 'acciones', headerName: 'Eliminar', width: 120, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.tipo_movimiento)}>
                <DeleteIcon />
            </IconButton>
        )
    }
  ], []);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Paper sx={{ p: 3 }}>
        

        {/* ENCABEZADO ESTILO ACCESS */}
        <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '6px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Catálogo de Tipos de Movimientos
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

        <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
                <TextField 
                    {...commonProps} 
                    type="number" 
                    label="Clave*" 
                    name="tipo_movimiento" 
                    value={formData.tipo_movimiento} 
                    onChange={handleInputChange} 
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField 
                    {...commonProps} 
                    label="Descripción del Movimiento*" 
                    name="descripcion" 
                    value={formData.descripcion} 
                    onChange={handleInputChange} 
                />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField 
                    {...commonProps} 
                    type="number" 
                    label="Porcentaje" 
                    name="porcentaje" 
                    value={formData.porcentaje} 
                    onChange={handleInputChange} 
                />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField 
                    {...commonProps} 
                    type="number" 
                    label="Descto. Mínimo" 
                    name="importe_minimo" 
                    value={formData.importe_minimo} 
                    onChange={handleInputChange} 
                />
            </Grid>

            {/* Botón Agregar */}
            <Grid item xs={12} md={2}>
                <Button variant="contained" onClick={handleAgregarNuevo} disabled={saving} fullWidth startIcon={<AddIcon />}
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
                    AGREGAR
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
                getRowId={(row) => row.tipo_movimiento} 
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
                    '& .MuiDataGrid-columnHeaders': {
                        borderBottom: '2px solid #000',
                        textAlign: 'center',
                        fontSize: '1rem',
                        fontWeight: 'bold'
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid #e0e0e0'
                    },
                    '& .MuiDataGrid-cell--editable': { backgroundColor: '#f9fbfd', cursor: 'text' }, 
                    '& .MuiDataGrid-cell--editing': { backgroundColor: '#fff', boxShadow: '0 0 5px rgba(25,118,210,0.5)' }
                }} 
            />
          </Paper>
        </Box>

      {/* PIE DE PÁGINA ESTILO ACCESS */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          CAT_MOVIMIENTOS, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR:{session?.nombre || 'ADMIN'}
        </Typography>
      </Box>

    </Box>
  );
}