"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  Snackbar, Alert, Paper, IconButton,
  Dialog, DialogContent, DialogActions
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
  const [openAdd, setOpenAdd] = useState(false);
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
                setOpenAdd(false);
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
      
      {/* ENCABEZADO Y BOTÓN AGREGAR */}
      <Paper sx={{ p: 3, borderRadius: '8px', mb: 3, boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
        <Box sx={{ border: '1px solid #000000ff', p: 1.5, mb: 3, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button 
            variant="contained" 
            onClick={() => setOpenAdd(true)}
            startIcon={<AddIcon />}
            sx={{ 
              height: '45px', 
              backgroundColor: '#333333', 
              color: 'white', 
              fontWeight: 600, 
              textTransform: 'none', 
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(51, 51, 51, 0.2)', 
              transition: 'all 0.3s ease',
              '&:hover': { 
                backgroundColor: '#555555', 
                transform: 'translateY(-1px)' 
              }
            }}
          >
            AGREGAR TIPO DE DESCUENTO
          </Button>
        </Box>
      </Paper>

      {/* TABLA PRINCIPAL AL ESTILO OFICIAL */}
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
                '& .MuiDataGrid-columnHeaders': { 
                    borderBottom: '2px solid #000',
                    textAlign: 'center',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                },
                '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #e0e0e000'
                },
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

      {/* --- MODAL PARA AGREGAR NUEVO DESCUENTO --- */}
      <Dialog 
        open={openAdd} 
        onClose={() => setOpenAdd(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }
        }}
      >
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Nuevo Tipo de Descuento
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Ingrese la descripción y los límites porcentuales
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton 
            onClick={() => setOpenAdd(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 4, backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField 
              {...commonProps} 
              label="Descripción del Descuento *" 
              name="descripcion" 
              value={formData.descripcion} 
              onChange={handleInputChange} 
              autoFocus
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                {...commonProps} 
                type="number" 
                inputProps={{ step: "1" }} 
                label="Min Dto (%)" 
                name="min_descto" 
                value={formData.min_descto} 
                onChange={handleInputChange} 
                helperText="Ej: 15 = 15%"
                sx={{ ...commonProps.sx, '& .MuiFormHelperText-root': { ml: 0, fontWeight: 500, mt: 1 } }}
              />
              <TextField 
                {...commonProps} 
                type="number" 
                inputProps={{ step: "1" }} 
                label="Max Dto (%)" 
                name="max_descto" 
                value={formData.max_descto} 
                onChange={handleInputChange} 
                helperText="Ej: 100 = 100%"
                sx={{ ...commonProps.sx, '& .MuiFormHelperText-root': { ml: 0, fontWeight: 500, mt: 1 } }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={() => setOpenAdd(false)} 
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 600, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAgregarNuevo} 
            variant="contained" 
            disabled={saving}
            sx={{ 
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            {saving ? "Guardando..." : "Guardar Descuento"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}