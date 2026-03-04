"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  MenuItem, Snackbar, Alert, Paper, IconButton, Divider, TableContainer 
} from '@mui/material'; 
import { 
  DataGrid, GridColDef, GridToolbar, 
  GridPaginationModel, GridPagination, GridRenderCellParams
} from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import useConsumoApi from '../../../hooks/useConsumoApi'; 

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
    '& .MuiInputLabel-root': { 
      transform: 'translate(14px, 14px) scale(1)',
      color: '#666',
      fontWeight: 500
    },
    '& .MuiInputLabel-shrink': { 
      transform: 'translate(14px, -9px) scale(0.75)',
      color: '#333',
      fontWeight: 600
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#e0e0e0',
      borderWidth: '1.5px'
    }
  }
};

const selectProps = {
  ...commonProps,
  SelectProps: { MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } },
  sx: { 
    ...commonProps.sx, 
    '& .MuiSelect-select': { 
      display: 'block !important', 
      whiteSpace: 'nowrap !important', 
      overflow: 'hidden !important', 
      textOverflow: 'ellipsis !important' 
    } 
  }
};

function CustomPagination() { return <GridPagination />; }

const initialFormState = {
    año: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    sucursal: '',
    empleado: '',
    metaMes: 0,
    unidades: 0,
    area: '%',
    depto: '%',
    clase: '%'
};

export default function MetasEmpleados() {
  const { consumoApi } = useConsumoApi();

  // Estados de la tabla
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });

  // Estados de Catálogos (Blindados)
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [deptos, setDeptos] = useState<any[]>([]);
  const [clases, setClases] = useState<any[]>([]);
  
  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const meses = [
      { id: 1, desc: '1 - Enero' }, { id: 2, desc: '2 - Febrero' }, { id: 3, desc: '3 - Marzo' }, { id: 4, desc: '4 - Abril' },
      { id: 5, desc: '5 - Mayo' }, { id: 6, desc: '6 - Junio' }, { id: 7, desc: '7 - Julio' }, { id: 8, desc: '8 - Agosto' },
      { id: 9, desc: '9 - Septiembre' }, { id: 10, desc: '10 - Octubre' }, { id: 11, desc: '11 - Noviembre' }, { id: 12, desc: '12 - Diciembre' }
  ];

  useEffect(() => {
      fetchCatalogosBase();
      fetchTablaMetas();
  }, []);

  const fetchCatalogosBase = async () => {
      try {
          const [resSuc, resEmp, resArea] = await Promise.all([
              consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_sucursales'),
              consumoApi.get('/api/MetasEmpleados/combo_empleados'),
              consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_areas')
          ]);
          setSucursales(Array.isArray(resSuc?.data) ? resSuc.data : []);
          setEmpleados(Array.isArray(resEmp?.data) ? resEmp.data : []);
          setAreas(Array.isArray(resArea?.data) ? resArea.data : []);
      } catch (error) { 
          setMessage({ text: 'Error al cargar catálogos base.', type: 'error' }); 
      }
  };

const fetchTablaMetas = async () => {
      setLoading(true);
      try {
          // AQUI ESTA LA CORRECCION
          const res = await consumoApi.get('/api/MetasEmpleados/sp_bw_cat_nominaMetasEmpleado_sel');
          setRows(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
          setRows([]);
          setMessage({ text: 'Error al cargar la lista de metas.', type: 'error' });
      } finally { setLoading(false); }
  };

  // Manejo de cascada de combos
  const handleInputChange = async (e: any) => {
      const { name, value } = e.target;
      
      if (name === 'area') {
          setFormData(prev => ({ ...prev, area: value, depto: '%', clase: '%' }));
          try {
              if (value !== '%') {
                  const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_deptos', { params: { area: value }});
                  setDeptos(Array.isArray(res?.data) ? res.data : []);
              } else { setDeptos([]); }
              setClases([]);
          } catch(e) { setDeptos([]); }
      } 
      else if (name === 'depto') {
          setFormData(prev => ({ ...prev, depto: value, clase: '%' }));
          try {
              if (value !== '%') {
                  const res = await consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_clases', { params: { area: formData.area, depto: value }});
                  setClases(Array.isArray(res?.data) ? res.data : []);
              } else { setClases([]); }
          } catch(e) { setClases([]); }
      } 
      else {
          setFormData(prev => ({ ...prev, [name]: value }));
      }
  };

  // Insertar Registro
  const handleGuardar = async () => {
      if (!formData.año) return setMessage({ text: "El Año es obligatorio.", type: 'error' });
      if (!formData.mes) return setMessage({ text: "El Mes es obligatorio.", type: 'error' });
      if (!formData.sucursal) return setMessage({ text: "Seleccione una Sucursal.", type: 'error' });
      if (!formData.empleado) return setMessage({ text: "Seleccione un Empleado.", type: 'error' });
      
      const metaVal = Number(formData.metaMes);
      const uniVal = Number(formData.unidades);
      
      if (isNaN(metaVal) || metaVal < 0) return setMessage({ text: "La Meta debe ser un número válido.", type: 'error' });
      if (isNaN(uniVal) || uniVal < 0) return setMessage({ text: "Las Unidades deben ser un número válido.", type: 'error' });

      setSaving(true);
      try {
          const payload = {
              año: formData.año,
              mes: formData.mes,
              sucursal: formData.sucursal,
              empleado: formData.empleado,
              metaMes: metaVal,
              unidades: uniVal,
              area: formData.area === '%' ? null : formData.area,
              depto: formData.depto === '%' ? null : formData.depto,
              clase: formData.clase === '%' ? null : formData.clase
          };

          const res = await consumoApi.post('/api/MetasEmpleados/sp_bw_cat_nominaMetasEmpleado_ins', payload);
          if (res.status === 200) {
              setMessage({ text: "✅ Meta registrada correctamente.", type: 'success' });
              fetchTablaMetas();
              // Limpiamos montos pero dejamos mes/sucursal para captura rápida continua
              setFormData(prev => ({ ...prev, metaMes: 0, unidades: 0 }));
          }
      } catch (error) {
          setMessage({ text: "Error al guardar la meta en el servidor.", type: 'error' });
      } finally {
          setSaving(false);
      }
  };

  // Eliminar Registro
  const handleEliminar = async (id: number) => {
      if (!window.confirm("¿Está seguro que desea eliminar esta meta? Esta acción no se puede deshacer.")) return;
      
      setSaving(true);
      try {
          const res = await consumoApi.delete(`/api/MetasEmpleados/sp_bw_cat_nominaMetasEmpleado_del?id=${id}`);
          if (res.status === 200) {
              setMessage({ text: "🗑️ Registro eliminado.", type: 'success' });
              fetchTablaMetas();
          }
      } catch (error) {
          setMessage({ text: "Error al eliminar el registro.", type: 'error' });
      } finally {
          setSaving(false);
      }
  };

  // Definición de columnas del DataGrid
  const columns = useMemo<GridColDef[]>(() => [
    { field: 'año', headerName: 'Año', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'mes', headerName: 'Mes', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'nombre_sucursal', headerName: 'Sucursal', width: 140 },
    { field: 'nombre_empleado', headerName: 'Empleado', flex: 1, minWidth: 220 },
    { field: 'nombre_area', headerName: 'Área', width: 140 },
    { field: 'nombre_depto', headerName: 'Depto', width: 140 },
    { field: 'nombre_clase', headerName: 'Clase', width: 140 },
    { 
        field: 'metaMes', headerName: 'Meta', width: 120, type: 'number',
        valueFormatter: (v: any) => isNaN(Number(v)) ? '$0.00' : `$${Number(v).toFixed(2)}` 
    },
    { field: 'unidades', headerName: 'Unidades', width: 90, align: 'center', headerAlign: 'center' },
    { 
        field: 'acciones', headerName: 'Eliminar', width: 80, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.id)}>
                <DeleteIcon />
            </IconButton>
        )
    }
  ], []);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 4 }}>
          CONFIGURACIÓN DE METAS POR EMPLEADO
        </Typography>

        {/* PANEL DE CAPTURA RÁPIDA */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            
            {/* Fila 1 */}
            <Grid item xs={12} sm={6} md={2}>
                <TextField {...commonProps} type="number" label="Año" name="año" value={formData.año} onChange={handleInputChange} 
                    sx={{ width: '120px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
                <TextField {...selectProps} select label="Mes" name="mes" value={formData.mes} onChange={handleInputChange}
                    sx={{ width: '160px', ...selectProps.sx }}>
                    {meses.map(m => <MenuItem key={m.id} value={m.id}>{m.desc}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <TextField {...selectProps} select label="Sucursal" name="sucursal" value={formData.sucursal} onChange={handleInputChange}
                    sx={{ width: '300px', ...selectProps.sx }}>
                    <MenuItem value="">-- Seleccione --</MenuItem>
                    {Array.isArray(sucursales) && sucursales.map(s => <MenuItem key={s.id || s.cve_sucursal} value={s.id || s.cve_sucursal}>{s.descripcion || s.nombre}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={5}>
                <TextField {...selectProps} select label="Empleado" name="empleado" value={formData.empleado} onChange={handleInputChange}
                    sx={{ width: '450px', ...selectProps.sx }}>
                    <MenuItem value="">-- Seleccione --</MenuItem>
                    {Array.isArray(empleados) && empleados.map(e => <MenuItem key={e.id} value={e.id}>{e.descripcion}</MenuItem>)}
                </TextField>
            </Grid>

            {/* Fila 2 */}
            <Grid item xs={12} sm={6} md={3}>
                <TextField {...selectProps} select label="Área (Opcional)" name="area" value={formData.area} onChange={handleInputChange}
                    sx={{ width: '300px', ...selectProps.sx }}>
                    <MenuItem value="%">-- TODAS --</MenuItem>
                    {Array.isArray(areas) && areas.map(a => <MenuItem key={a.id} value={a.id}>{a.descripcion}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <TextField {...selectProps} select label="Depto (Opcional)" name="depto" value={formData.depto} onChange={handleInputChange} disabled={formData.area === '%'}
                    sx={{ width: '300px', ...selectProps.sx }}>
                    <MenuItem value="%">-- TODOS --</MenuItem>
                    {Array.isArray(deptos) && deptos.map(d => <MenuItem key={d.id} value={d.id}>{d.descripcion}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
                <TextField {...selectProps} select label="Clase (Opcional)" name="clase" value={formData.clase} onChange={handleInputChange} disabled={formData.depto === '%'}
                    sx={{ width: '200px', ...selectProps.sx }}>
                    <MenuItem value="%">-- TODAS --</MenuItem>
                    {Array.isArray(clases) && clases.map(c => <MenuItem key={c.id} value={c.id}>{c.descripcion}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
                <TextField {...commonProps} type="number" label="Meta Mensual ($)" name="metaMes" value={formData.metaMes} onChange={handleInputChange} inputProps={{ step: "0.1" }}
                    sx={{ width: '160px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField {...commonProps} type="number" label="Unidades" name="unidades" value={formData.unidades} onChange={handleInputChange}
                        sx={{ width: '120px', ...commonProps.sx }} />
                    <Button 
                        variant="contained" 
                        onClick={handleGuardar} 
                        disabled={saving}
                        sx={{ 
                            backgroundColor: '#333333', 
                            color: 'white', 
                            borderRadius: '8px',
                            fontWeight: 600,
                            textTransform: 'none',
                            padding: '10px 20px',
                            boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
                            transition: 'all 0.3s ease',
                            minWidth: 'auto',
                            '&:hover': { 
                                backgroundColor: '#555555',
                                boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)',
                                transform: 'translateY(-1px)'
                            }
                        }}
                    >
                        <AddCircleOutlineIcon />
                    </Button>
                </Box>
            </Grid>

          </Grid>
        </Box>

        {/* TABLA PRINCIPAL */}
        <Box sx={{ mb: 3 }}>
          <TableContainer component={Paper} sx={{ maxHeight: 400, mb: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
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
          </TableContainer>
        </Box>

        {/* PIE DE PÁGINA ESTILO ACCESS */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>

          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            METAS_EMPLEADOS, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR:ADMIN
          </Typography>
        </Box>
      </Paper>

      {/* NOTIFICACIONES */}
      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type} onClose={() => setMessage(null)} sx={{ width: '100%' }}>{message?.text}</Alert>
      </Snackbar>
    </Box>
  );
}