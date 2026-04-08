"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
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

const initialFormState = { descripcion: '', min_descto: 0, max_descto: 0 };

export default function CatTipoDescuentos() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  const isSavingRef = useRef(false);

  const [rows, setRows] = useState<any[]>([]);
const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
  const [formData, setFormData] = useState(initialFormState);

  // Función interceptora para SweetAlert2
  const setMessage = (msg: { text: string, type: 'success' | 'error' | 'info' | 'warning' } | null) => {
    if (!msg) return;
    
    // Toast chiquito para los guardados automáticos de la tabla (DataGrid)
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

    // Alertas pop-up para las validaciones y los éxitos
    Swal.fire({
      title: msg.type === 'success' ? '¡Éxito!' : 'Atención',
      text: msg.text,
      icon: (msg.type === 'info' || msg.type === 'warning') ? 'warning' : msg.type,
      timer: msg.type === 'success' ? 2000 : undefined,
      showConfirmButton: msg.type !== 'success',
      confirmButtonColor: '#333'
    });
  };

  useEffect(() => { fetchTabla(); }, []);

const fetchTabla = async () => {
      setLoading(true);
      try {
          const res = await consumoApi.get('/api/CatTipoDescuento/sp_bw_cat_tipos_descuento_sel');
          
          // Mapeamos para que la tabla reciba enteros en lugar de decimales
          const dataMapeada = (Array.isArray(res?.data) ? res.data : []).map(row => ({
    ...row,
    min_descto: Number(row.min_descto || 0) * 100,
    max_descto: Number(row.max_descto || 0) * 100
}));

          setRows(dataMapeada);
      } catch (error) {
          setMessage({ text: 'Error al cargar la tabla.', type: 'error' });
      } finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleAgregarNuevo = async () => {
        if (isSavingRef.current) return; 
        if (!formData.descripcion.trim()) return setMessage({ text: "La descripción es obligatoria.", type: 'warning' as any });

        isSavingRef.current = true;
        setSaving(true);
        try {
            // CÓMO DEBE QUEDAR (Convierte 10 a 0.10 y 20 a 0.20):
const payload = {
    descripcion: formData.descripcion.toUpperCase(),
    min_descto: Number(formData.min_descto) / 100,
    max_descto: Number(formData.max_descto) / 100
};

            const res = await consumoApi.post('/api/CatTipoDescuento/sp_bw_cat_tipos_descuento_ins', payload);
            if (res.status === 200) {
                setMessage({ text: `Descuento agregado exitosamente.`, type: 'success' });
                fetchTabla();
                setFormData(initialFormState);
            }
        } catch (error: any) {
            setMessage({ text: error.response?.data?.mensaje || "Error al agregar el registro.", type: 'error' });
        } finally {
            isSavingRef.current = false;
            setSaving(false);
        }
    };

  const processRowUpdate = async (newRow: any, oldRow: any) => {
      if (
          newRow.descripcion === oldRow.descripcion &&
          newRow.min_descto === oldRow.min_descto &&
          newRow.max_descto === oldRow.max_descto
      ) return oldRow;

      try {
         const payload = {
    tipo_descuento: newRow.tipo_descuento,
    descripcion: newRow.descripcion?.toUpperCase() || '',
    // Convertimos el entero editado en la celda a decimal para la BD
    min_descto: Number(newRow.min_descto) / 100,
    max_descto: Number(newRow.max_descto) / 100
};

          const res = await consumoApi.put('/api/CatTipoDescuento/sp_bw_cat_tipos_descuento_upd', payload);
          if (res.status === 200) {
              Swal.fire({
                title: '¡Éxito!',
                text: 'Cambios guardados automáticamente',
                icon: 'success',
                confirmButtonColor: '#000000ff',
                timer: 2000,
                showConfirmButton: false
              });
              return { ...newRow, descripcion: payload.descripcion }; 
          } else throw new Error("Error en actualización");
      } catch (error) {
          Swal.fire({
            title: 'Error',
            text: 'Error al guardar los cambios',
            icon: 'error',
            confirmButtonColor: '#000000ff'
          });
          return oldRow;
      }
  };

  const handleEliminar = async (clave: number, nombre: string) => {
      const confirmacion = await Swal.fire({
          title: '¿Estás seguro?',
          text: `¿Desea eliminar el descuento: ${nombre}?`,
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
          const res = await consumoApi.delete(`/api/CatTipoDescuento/sp_bw_cat_tipos_descuento_del?tipo_descuento=${clave}`);
          if (res.status === 200) {
              setMessage({ text: "Descuento eliminado exitosamente.", type: 'success' });
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
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.tipo_descuento, params.row.descripcion)}>
                <DeleteIcon />
            </IconButton>
        )
    },
    { field: 'tipo_descuento', headerName: 'ID', width: 90, fontWeight: 'bold', align: 'center', headerAlign: 'center' },
    { field: 'descripcion', headerName: 'Descripción (Doble clic para editar)', flex: 1, minWidth: 250, editable: true, align: 'left', headerAlign: 'center' },
    { 
    field: 'min_descto', headerName: 'Min Dto (%)', width: 120, editable: true, align: 'center', headerAlign: 'center',
    type: 'number' 
    // Sin valueFormatter. Perfecto.
},
    { 
        field: 'max_descto', headerName: 'Max Dto (%)', width: 120, editable: true, align: 'center', headerAlign: 'center',
        type: 'number'
    }
  ], []);
  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Paper sx={{ p: 3 }}>

        {/* ENCABEZADO */}
        <Box sx={{ border: '1px solid #000000ff', p: 1.5, mb: 2, borderRadius: '6px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Catálogo de Tipos de Descuentos
                </Typography>
                
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
                
            </Box>
        </Box>

        <Grid container spacing={2} justifyContent="center" alignItems="center">
            {/* NO se pide ID porque es autogenerado por SQL */}
            <Grid item xs={12} md={4}>
                <TextField {...commonProps} label="Descripción del Descuento*" name="descripcion" value={formData.descripcion} onChange={handleInputChange} />
            </Grid>
           <Grid item xs={6} md={2}>
    <TextField {...commonProps} type="number" inputProps={{ step: "1" }} label="Min Dto (Ej: 15 = 15%)" name="min_descto" value={formData.min_descto} onChange={handleInputChange} />
</Grid>
<Grid item xs={6} md={2}>
    <TextField {...commonProps} type="number" inputProps={{ step: "1" }} label="Max Dto (Ej: 100 = 100%)" name="max_descto" value={formData.max_descto} onChange={handleInputChange} />
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

{/* ============================================================ */}
        {/* --- TABLA PRINCIPAL AL ESTILO OFICIAL (TURNOS DOBLES) --- */}
        {/* ============================================================ */}
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 3, width: '100%', maxHeight: 600, mb: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
            <DataGrid 
                rows={Array.isArray(rows) ? rows : []} 
                columns={columns} 
                getRowId={(row) => row.tipo_descuento} 
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
                    // Encabezados estilo oficial (Borde inferior grueso, centrado, letra clara)
                    '& .MuiDataGrid-columnHeaders': { 
                        borderBottom: '2px solid #000',
                        textAlign: 'center',
                        fontSize: '1rem',
                        fontWeight: 'bold'
                    },
                    // Línea divisoria muy sutil entre celdas
                    '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid #e0e0e000' // Borde invisible para diseño limpio
                    },
                    // Estilos de edición (Igual a tu base oficial)
                    '& .MuiDataGrid-cell--editable': { 
                        backgroundColor: '#f9fbfd', 
                        cursor: 'text' 
                    }, 
                    '& .MuiDataGrid-cell--editing': { 
                        backgroundColor: '#fff', 
                        boxShadow: '0 4px 12px rgba(255, 255, 255, 0.4)' 
                    }
                }} 
            />
          </Paper>
        </Box>
        {/* ============================================================ */}
    </Box>
  );
}