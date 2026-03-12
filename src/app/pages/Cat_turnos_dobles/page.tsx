"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  Snackbar, Alert, Paper, IconButton, Divider, InputAdornment, Autocomplete
} from '@mui/material';
import { 
  DataGrid, GridColDef, GridToolbar, GridRenderCellParams 
} from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';

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

const todayStr = new Date().toISOString().split('T')[0];

const initialFormState = { 
    clave_empleado: '', 
    fecha: todayStr, 
    observacion: '', 
    salario: '' 
};

export default function TurnosDobles() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();
  const isSavingRef = useRef(false);

  const [formData, setFormData] = useState(initialFormState);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [empleados, setEmpleados] = useState<any[]>([]); // <-- NUEVO ESTADO

  // NUEVO USEEFFECT PARA DESCARGAR EMPLEADOS
  useEffect(() => {
      const fetchEmpleados = async () => {
          const idSucursal = session?.sucursal || 1; 
          try {
              const res = await consumoApi.get(`/api/TurnosDobles/sp_bw_cat_asig_hora_lista_emple?sucursal=${idSucursal}`); 
              setEmpleados(Array.isArray(res?.data) ? res.data : []);
          } catch (error) {
              console.error("Error al cargar empleados", error);
          }
      };
      fetchEmpleados();
  }, [session?.sucursal, consumoApi]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Función para buscar el historial cuando el usuario teclea la clave del empleado y sale del campo
  const fetchHistorial = async (clave: string) => {
      if (!clave.trim()) {
          setHistorial([]);
          return;
      }
      setLoading(true);
      try {
          const res = await consumoApi.get(`/api/TurnosDobles/sp_bw_cat_nominas_turnos_dobles_sel?clave_empleado=${clave.trim()}`);
          setHistorial(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
          setMessage({ text: 'Error al cargar el historial del empleado.', type: 'error' });
          setHistorial([]);
      } finally { 
          setLoading(false); 
      }
  };

  // Se dispara cuando el usuario presiona Enter o quita el foco de la Clave de Empleado
  const handleBlurEmpleado = () => {
      fetchHistorial(formData.clave_empleado);
  };

  const handleAutorizar = async () => {
        if (isSavingRef.current) return; 

        if (!formData.clave_empleado.trim()) return setMessage({ text: "Seleccione un empleado.", type: 'error' });
        if (!formData.fecha) return setMessage({ text: "La Fecha es obligatoria.", type: 'error' });
        if (!formData.observacion.trim()) return setMessage({ text: "Escriba las Observaciones.", type: 'error' });
        if (!formData.salario || Number(formData.salario) <= 0) return setMessage({ text: "Escriba un salario válido.", type: 'error' });

        if (!window.confirm("¿Desea autorizar el turno doble de este empleado?")) return;

        isSavingRef.current = true;
        setSaving(true);
        try {
            const payload = {
                clave_empleado: formData.clave_empleado.trim(),
                fecha: formData.fecha,
                observacion: formData.observacion.toUpperCase(),
                salario: Number(formData.salario)
            };

            const res = await consumoApi.post('/api/TurnosDobles/sp_bw_cat_nominas_turnos_dobles_ins', payload);
            if (res.status === 200) {
                setMessage({ text: `✅ Se registró la autorización.`, type: 'success' });
                fetchHistorial(formData.clave_empleado); // Refresca la tabla
                // Limpiamos solo observacion y salario, dejamos al empleado por si le quieren meter otro turno
                setFormData(prev => ({ ...prev, observacion: '', salario: '' }));
            }
        } catch (error: any) {
            setMessage({ text: error.response?.data?.mensaje || "Error al registrar el turno doble.", type: 'error' });
        } finally {
            isSavingRef.current = false;
            setSaving(false);
        }
    };

  const handleEliminar = async (clave_empleado: string, fecha: string) => {
      if (!window.confirm(`¿Está seguro que desea eliminar este turno doble del historial?`)) return;
      setSaving(true);
      try {
          // Formateamos la fecha para mandarla segura por la URL
          const fechaLimpia = new Date(fecha).toISOString().split('T')[0];
          const res = await consumoApi.delete(`/api/TurnosDobles/sp_bw_cat_nominas_turnos_dobles_del?clave_empleado=${clave_empleado}&fecha=${fechaLimpia}`);
          
          if (res.status === 200) {
              setMessage({ text: "🗑️ Turno eliminado.", type: 'success' });
              fetchHistorial(formData.clave_empleado); // Refresca la tabla
          }
      } catch (error: any) {
          setMessage({ text: error.response?.data?.mensaje || "Error al eliminar el registro.", type: 'error' });
      } finally {
          setSaving(false);
      }
  };

const columns = useMemo<GridColDef[]>(() => [
    { 
        field: 'clave_empleado', 
        headerName: 'Empleado', 
        width: 100, 
        align: 'center', 
        headerAlign: 'center',
        fontWeight: 'bold'
    },
    { 
        field: 'fecha', 
        headerName: 'Fecha', 
        width: 110, 
        align: 'center', 
        headerAlign: 'center',
        valueFormatter: (value) => {
            if (!value) return '';
            return new Date(value).toLocaleDateString('es-MX', { timeZone: 'UTC' });
        }
    },
    { 
        field: 'observacion', 
        headerName: 'Observación', 
        flex: 1, 
        minWidth: 200 
    },
    { 
        field: 'salario', 
        headerName: 'Salario', 
        width: 110, 
        align: 'right', 
        headerAlign: 'center',
        valueFormatter: (value) => {
            if (value == null || value === '') return '';
            return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));
        }
    },
    { 
        field: 'acciones', 
        headerName: 'Borrar', 
        width: 70, 
        sortable: false, 
        filterable: false, 
        align: 'center', 
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.clave_empleado, params.row.fecha)}>
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
                    Autorización de Turnos Dobles
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
                    Usuario Activo: {session?.nombre || 'Cargando...'}
                </Typography>
            </Box>
        </Box>

        <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12} md={4}>
                <Autocomplete
                    options={empleados}
                    getOptionLabel={(option) => `${option.clave_empleado} - ${option.NombreCompleto || ''}`}
                    isOptionEqualToValue={(option, value) => option.clave_empleado === value.clave_empleado}
                    onChange={(event, newValue) => {
                        const clave = newValue ? newValue.clave_empleado : '';
                        setFormData(prev => ({ ...prev, clave_empleado: clave }));
                        fetchHistorial(clave); // Busca historial automáticamente al seleccionar
                    }}
                    renderInput={(params) => (
                        <TextField 
                            {...params} 
                            {...commonProps} 
                            label="Empleado*" 
                            placeholder="Buscar..."
                            sx={{ width: '300px', ...commonProps.sx }} 
                        />
                    )}
                />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField {...commonProps} type="date" label="Fecha Turno*" name="fecha" value={formData.fecha} onChange={handleInputChange} 
                    sx={{ width: '150px', ...commonProps.sx }}
                />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField {...commonProps} type="number" label="Salario*" name="salario" value={formData.salario} onChange={handleInputChange} 
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    sx={{ width: '120px', ...commonProps.sx }}
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField {...commonProps} label="Observaciones*" name="observacion" value={formData.observacion} onChange={handleInputChange} 
                    sx={{ width: '250px', ...commonProps.sx }}
                />
            </Grid>
            <Grid item xs={12} md={2}>
                <Button variant="contained" onClick={handleAutorizar} disabled={saving} fullWidth startIcon={<SaveIcon />}
                    sx={{ 
                        height: '50px', backgroundColor: '#333333', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', transition: 'all 0.3s ease',
                        '&:hover': { backgroundColor: '#555555', boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', transform: 'translateY(-1px)' }
                    }}>
                    AUTORIZAR
                </Button>
            </Grid>
        </Grid>
      </Paper>

        {/* TABLA PRINCIPAL */}
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ width: '100%', maxHeight: 600, mb: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
            <DataGrid 
                rows={historial} 
                columns={columns} 
                getRowId={(row) => row.fecha}
                loading={loading || saving} 
                disableRowSelectionOnClick
                density="compact"
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true } }}
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

      {/* PIE DE PÁGINA */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          CAT_TURNOS_DOBLES, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR:{session?.nombre || 'ADMIN'}
        </Typography>
      </Box>

      <Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type} onClose={() => setMessage(null)} sx={{ width: '100%' }}>{message?.text}</Alert>
      </Snackbar>
    </Box>
  );
}