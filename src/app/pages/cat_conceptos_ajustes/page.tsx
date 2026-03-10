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

const initialFormState = { descripcion: '', ajuste: 0 };

export default function ConceptosAjustes() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  // Estados
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
  
  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
      fetchTablaConceptos();
  }, []);

  const fetchTablaConceptos = async () => {
      setLoading(true);
      try {
          const res = await consumoApi.get('/api/ConceptoAjuste/sp_bw_cat_concepto_ajuste_sel');
          setRows(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
          setMessage({ text: 'Error al cargar la tabla de conceptos.', type: 'error' });
      } finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 1. GUARDAR NUEVO (Desde el formulario superior)
  const handleAgregarNuevo = async () => {
        if (!formData.descripcion.trim()) return setMessage({ text: "La descripción es obligatoria.", type: 'error' });
        if (formData.ajuste === '' || isNaN(Number(formData.ajuste))) return setMessage({ text: "El ajuste debe ser un número.", type: 'error' });

        setSaving(true);
        try {
            const payload = {
                concepto: 0,
                descripcion: formData.descripcion,
                ajuste: Number(formData.ajuste)
            };

            const res = await consumoApi.post('/api/ConceptoAjuste/sp_bw_cat_concepto_ajuste_ins', payload);
            if (res.status === 200) {
                setMessage({ text: `✅ Nuevo concepto agregado.`, type: 'success' });
                fetchTablaConceptos();
                setFormData(initialFormState); // Limpiar formulario
            }
        } catch (error) {
            setMessage({ text: "Error al agregar el registro.", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

  // 2. AUTO-GUARDADO AL EDITAR LA TABLA (Magia en línea)
  const processRowUpdate = async (newRow: any, oldRow: any) => {
      // Si el usuario no cambió nada, no hacemos la petición a la base de datos
      if (newRow.descripcion === oldRow.descripcion && newRow.ajuste === oldRow.ajuste) {
          return oldRow;
      }

      try {
          const payload = {
              concepto: newRow.concepto,
              descripcion: newRow.descripcion,
              ajuste: Number(newRow.ajuste)
          };

          const res = await consumoApi.put('/api/ConceptoAjuste/sp_bw_cat_concepto_ajuste_upd', payload);
          
          if (res.status === 200) {
              setMessage({ text: "💾 Cambios guardados automáticamente.", type: 'info' });
              return newRow; // Actualiza la celda en la pantalla
          } else {
              throw new Error("Error en la actualización");
          }
      } catch (error) {
          setMessage({ text: "❌ Error al guardar los cambios.", type: 'error' });
          return oldRow; // Si falla, regresa el texto a como estaba antes
      }
  };

  // 3. ELIMINAR
  const handleEliminar = async (concepto: number) => {
      if (!window.confirm("¿Está seguro que desea eliminar este concepto?")) return;
      setSaving(true);
      try {
          const res = await consumoApi.delete(`/api/ConceptoAjuste/sp_bw_cat_concepto_ajuste_del?concepto=${concepto}`);
          if (res.status === 200) {
              setMessage({ text: "🗑️ Concepto eliminado.", type: 'success' });
              fetchTablaConceptos();
          }
      } catch (error) {
          setMessage({ text: "Error al eliminar el registro.", type: 'error' });
      } finally {
          setSaving(false);
      }
  };

  const columns = useMemo<GridColDef[]>(() => [
    { field: 'concepto', headerName: 'Concepto (ID)', width: 150, fontWeight: 'bold', align: 'center', headerAlign: 'center' },
    // Agregamos editable: true a las columnas que queremos modificar directo en la tabla
    { field: 'descripcion', headerName: 'Descripción del Ajuste (Doble clic para editar)', flex: 1, minWidth: 200, editable: true, align: 'center', headerAlign: 'center' },
    { field: 'ajuste', headerName: 'Ajuste', width: 120, type: 'number', editable: true, align: 'center', headerAlign: 'center' },
    { 
        field: 'acciones', headerName: 'Eliminar', width: 120, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.concepto)}>
                <DeleteIcon />
            </IconButton>
        )
    }
  ], []);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 4 }}>
          CATÁLOGO DE CONCEPTOS DE AJUSTES
        </Typography>

        {/* ENCABEZADO ESTILO ACCESS */}
        <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '6px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Catálogo de Conceptos de Ajustes
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
            <Grid item xs={12} md={6}>
                <TextField 
                    {...commonProps} 
                    label="Descripción del Ajuste" 
                    name="descripcion" 
                    value={formData.descripcion} 
                    onChange={handleInputChange} 
                />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField 
                    {...commonProps} 
                    type="number" 
                    label="Valor de Ajuste" 
                    name="ajuste" 
                    value={formData.ajuste} 
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
                getRowId={(row) => row.concepto} 
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
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          CONCEPTOS_AJUSTES, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR:ADMIN
        </Typography>
      </Box>

      {/* NOTIFICACIONES */}
      <Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type} onClose={() => setMessage(null)} sx={{ width: '100%' }}>{message?.text}</Alert>
      </Snackbar>
    </Box>
  );
}