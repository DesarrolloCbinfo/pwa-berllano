"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  Snackbar, Alert, Paper, IconButton, MenuItem, Checkbox, FormControlLabel 
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
      <Paper sx={{ p: 3, borderRadius: '8px' }}>
        {/* ENCABEZADO BERLLANO ELEGANTE 2 */}
        <Box sx={{ border: '1px solid #2c3e50', borderRadius: '8px', backgroundColor: '#fff', p: 1.5, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 'bold', color: '#1a365d', fontSize: '1.1rem' }}>
                    Catálogo de Movimientos de Nómina
                </Typography>
                
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
                
            </Box>
        </Box>

        <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12} md={1}>
                <TextField {...commonProps} type="number" label="Clave*" name="id_movimiento" value={formData.id_movimiento} onChange={handleInputChange} 
                    sx={{ width: '120px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField {...commonProps} label="Descripción*" name="descripcion" value={formData.descripcion} onChange={handleInputChange} 
                    sx={{ width: '300px', ...commonProps.sx }} />
            </Grid>
            
            <Grid item xs={6} md={1}>
                <TextField {...commonProps} type="number" label="Gasto" name="id_gasto" value={formData.id_gasto} onChange={handleInputChange} 
                    sx={{ width: '100px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={6} md={1}>
                <TextField {...commonProps} type="number" label="Subgasto" name="id_subgasto" value={formData.id_subgasto} onChange={handleInputChange} 
                    sx={{ width: '100px', ...commonProps.sx }} />
            </Grid>

            {/* Checkboxes Centrados y Elegantes */}
            <Grid item xs={6} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                <FormControlLabel control={<Checkbox size="small" name="deduccion" checked={formData.deduccion} onChange={handleInputChange} />} label={<Typography variant="body2" sx={{fontWeight: 500, color: '#555'}}>Deducción</Typography>} />
            </Grid>
            <Grid item xs={6} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                <FormControlLabel control={<Checkbox size="small" name="depositar" checked={formData.depositar} onChange={handleInputChange} />} label={<Typography variant="body2" sx={{fontWeight: 500, color: '#555'}}>Depositar</Typography>} />
            </Grid>

            {/* Lista Desplegable de Tipo Movimiento */}
            <Grid item xs={12} md={2}>
                <TextField {...selectProps} select label="Tipo de Movimiento*" name="tipo_movto" value={formData.tipo_movto} onChange={handleInputChange}
                    sx={{ width: '200px', ...selectProps.sx }}>
                    <MenuItem value="">-- SELECCIONE --</MenuItem>
                    {tiposMovimiento.map(tipo => (
                        <MenuItem key={tipo.id} value={tipo.id}>{tipo.descripcion}</MenuItem>
                    ))}
                </TextField>
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


      
    </Box>
  );
}