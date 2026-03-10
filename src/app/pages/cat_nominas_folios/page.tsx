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

import useConsumoApi from '../../../hooks/useConsumoApi';
import { useSessionContext } from '../../../context/SessionProvider'; 

const commonProps = {
  fullWidth: true, size: "small" as const, variant: "outlined" as const,
  InputLabelProps: { shrink: true }, // Obligatorio para los inputs de tipo "date"
  sx: {
    '& .MuiInputBase-root': { height: '50px', alignItems: 'center', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderColor: '#999' } },
    '& .MuiInputLabel-root': { transform: 'translate(14px, 14px) scale(1)', color: '#666', fontWeight: 500 },
    '& .MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)', color: '#333', fontWeight: 600 },
  }
};

function CustomPagination() { return <GridPagination />; }

// Función para evitar problemas de zona horaria al convertir a texto YYYY-MM-DD
const formatDateToString = (dateObj: any) => {
    if (!dateObj) return null;
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
};

const todayStr = new Date().toISOString().split('T')[0];

const initialFormState = { 
    folio: '', 
    fecha_folio: todayStr, 
    descripcion: '', 
    f1: '', 
    f2: '' 
};

export default function FoliosNomina() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  const isSavingRef = useRef(false);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => { fetchTabla(); }, []);

  const fetchTabla = async () => {
      setLoading(true);
      try {
          const res = await consumoApi.get('/api/FoliosNomina/sp_bw_cat_nominas_folios_sel?cia=1');
          
          // Mapeamos las fechas a objetos Date para que el DataGrid las pueda editar bonito
          const dataConFechas = (Array.isArray(res?.data) ? res.data : []).map(row => ({
              ...row,
              fecha_folio: row.fecha_folio ? new Date(row.fecha_folio) : null,
              f1: row.f1 ? new Date(row.f1) : null,
              f2: row.f2 ? new Date(row.f2) : null,
          }));
          
          setRows(dataConFechas);
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

        if (!formData.folio) return setMessage({ text: "El Folio es obligatorio.", type: 'error' });
        if (!formData.fecha_folio) return setMessage({ text: "La Fecha del Folio es obligatoria.", type: 'error' });
        if (!formData.descripcion.trim()) return setMessage({ text: "La descripción es obligatoria.", type: 'error' });

        isSavingRef.current = true;
        setSaving(true);
        try {
            const payload = {
                cia: 1, // Por defecto CIA 1, o puedes poner session?.cia si lo tienes en tu contexto
                folio: Number(formData.folio),
                fecha_folio: formData.fecha_folio,
                descripcion: formData.descripcion.toUpperCase(),
                f1: formData.f1 || null,
                f2: formData.f2 || null
            };

            const res = await consumoApi.post('/api/FoliosNomina/sp_bw_cat_nominas_folios_ins', payload);
            if (res.status === 200) {
                setMessage({ text: `✅ Folio de nómina agregado exitosamente.`, type: 'success' });
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
      // Si nada cambió, no hacemos la petición
      if (
          newRow.fecha_folio?.getTime() === oldRow.fecha_folio?.getTime() &&
          newRow.descripcion === oldRow.descripcion &&
          newRow.f1?.getTime() === oldRow.f1?.getTime() &&
          newRow.f2?.getTime() === oldRow.f2?.getTime()
      ) return oldRow;

      try {
          const payload = {
              cia: newRow.cia || 1,
              folio: newRow.folio,
              fecha_folio: formatDateToString(newRow.fecha_folio),
              descripcion: newRow.descripcion?.toUpperCase() || '',
              f1: formatDateToString(newRow.f1),
              f2: formatDateToString(newRow.f2)
          };

          const res = await consumoApi.put('/api/FoliosNomina/sp_bw_cat_nominas_folios_upd', payload);
          if (res.status === 200) {
              setMessage({ text: "💾 Cambios guardados automáticamente.", type: 'info' });
              return { ...newRow, descripcion: payload.descripcion }; 
          } else throw new Error("Error en actualización");
      } catch (error) {
          setMessage({ text: "❌ Error al guardar los cambios.", type: 'error' });
          return oldRow;
      }
  };

  const handleEliminar = async (cia: number, folio: number, descripcion: string) => {
      if (!window.confirm(`¿Está seguro que desea eliminar el folio: ${folio} - ${descripcion}?`)) return;
      setSaving(true);
      try {
          const res = await consumoApi.delete(`/api/FoliosNomina/sp_bw_cat_nominas_folios_del?cia=${cia}&folio=${folio}`);
          if (res.status === 200) {
              setMessage({ text: "🗑️ Folio eliminado.", type: 'success' });
              fetchTabla();
          }
      } catch (error: any) {
          setMessage({ text: error.response?.data?.mensaje || "Error al eliminar el registro.", type: 'error' });
      } finally {
          setSaving(false);
      }
  };

  const columns = useMemo<GridColDef[]>(() => [
    { field: 'folio', headerName: 'Folio', width: 90, fontWeight: 'bold', align: 'center', headerAlign: 'center' },
    { field: 'fecha_folio', headerName: 'Fecha Folio', width: 130, type: 'date', editable: true, align: 'center', headerAlign: 'center' },
    { field: 'descripcion', headerName: 'Descripción (Doble clic para editar)', flex: 1, minWidth: 250, editable: true, align: 'left', headerAlign: 'center' },
    { field: 'f1', headerName: 'F. Inicial', width: 130, type: 'date', editable: true, align: 'center', headerAlign: 'center' },
    { field: 'f2', headerName: 'F. Final', width: 130, type: 'date', editable: true, align: 'center', headerAlign: 'center' },
    { 
        field: 'acciones', headerName: 'Eliminar', width: 90, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.cia, params.row.folio, params.row.descripcion)}>
                <DeleteIcon />
            </IconButton>
        )
    }
  ], []);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Paper sx={{ p: 3 }}>

        {/* ENCABEZADO */}
        <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '6px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Folios de Nómina Activos
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
            <Grid item xs={12} md={2}>
                <TextField {...commonProps} type="number" label="No. Folio*" name="folio" value={formData.folio} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField {...commonProps} type="date" label="Fecha del Folio*" name="fecha_folio" value={formData.fecha_folio} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField {...commonProps} label="Descripción*" name="descripcion" value={formData.descripcion} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={6} md={2}>
                <TextField {...commonProps} type="date" label="F. Inicial (Opcional)" name="f1" value={formData.f1} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={6} md={2}>
                <TextField {...commonProps} type="date" label="F. Final (Opcional)" name="f2" value={formData.f2} onChange={handleInputChange} />
            </Grid>
            
            <Grid item xs={12} md={10}></Grid> {/* Espaciador */}
            
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
          <Paper sx={{ width: '100%', maxHeight: 600, mb: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
            <DataGrid 
                rows={Array.isArray(rows) ? rows : []} 
                columns={columns} 
                getRowId={(row) => row.folio} 
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
                    '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e0' },
                    '& .MuiDataGrid-cell--editable': { backgroundColor: '#f9fbfd', cursor: 'pointer' }, 
                    '& .MuiDataGrid-cell--editing': { backgroundColor: '#fff', boxShadow: '0 0 5px rgba(25,118,210,0.5)' }
                }} 
            />
          </Paper>
        </Box>

      {/* PIE DE PÁGINA */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          CAT_NOMINAS_MOVIMIENTOS_FOLIOS, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR:{session?.nombre || 'ADMIN'}
        </Typography>
      </Box>

      <Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type} onClose={() => setMessage(null)} sx={{ width: '100%' }}>{message?.text}</Alert>
      </Snackbar>
    </Box>
  );
}