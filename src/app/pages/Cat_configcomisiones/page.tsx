"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  MenuItem, Snackbar, Alert, Paper, IconButton, TableContainer,
  Checkbox, FormControlLabel, FormGroup
} from '@mui/material'; 
import { 
  DataGrid, GridColDef, GridToolbar, 
  GridPaginationModel, GridPagination, GridRenderCellParams
} from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

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
  sucursal: '%', area: '%', depto: '%', clase: '%',
  idMarca: '%', idFamilia: '%', claveProd: '', puesto: '',
  fechaInicial: new Date().toISOString().split('T')[0],
  fechaFinal: new Date().toISOString().split('T')[0],
  basePrecioConIva: false, basePrecioSinIIva: true,
  comision: 0,
  aplicaL: true, aplicaM: true, aplicaMi: true, aplicaJ: true, aplicaV: true, aplicaS: true, aplicaD: true
};

export default function ConfigComisiones() {
  const { consumoApi } = useConsumoApi();

  // Estados de la tabla
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });

  // Estados de Catálogos
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [deptos, setDeptos] = useState<any[]>([]);
  const [clases, setClases] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);
  
  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
      fetchCatalogosBase();
      fetchTablaComisiones();
  }, []);

  const fetchCatalogosBase = async () => {
      try {
          const [resSuc, resArea, resMarca, resPuesto] = await Promise.all([
              consumoApi.get('/api/ConfigComisiones/sp_bw_cat_combo_sucursales'),
              consumoApi.get('/api/ConfigComisiones/sp_bw_cat_combo_areas'),
              consumoApi.get('/api/ConfigComisiones/sp_bw_cat_combo_marcas'),
              consumoApi.get('/api/ConfigComisiones/sp_bw_cat_combo_puestos')
          ]);
          setSucursales(Array.isArray(resSuc?.data) ? resSuc.data : []);
          setAreas(Array.isArray(resArea?.data) ? resArea.data : []);
          setMarcas(Array.isArray(resMarca?.data) ? resMarca.data : []);
          setPuestos(Array.isArray(resPuesto?.data) ? resPuesto.data : []);
      } catch (error) { 
          setMessage({ text: 'Error al cargar catálogos base.', type: 'error' }); 
      }
  };

  const fetchTablaComisiones = async () => {
      setLoading(true);
      try {
          const res = await consumoApi.get('/api/ConfigComisiones/sp_bw_cat_configComisiones_sel');
          setRows(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
          setRows([]);
          setMessage({ text: 'Error al cargar la tabla de comisiones.', type: 'error' });
      } finally { setLoading(false); }
  };

  // Manejo de Inputs de Texto y Selects
  const handleInputChange = async (e: any) => {
      const { name, value } = e.target;
      
      // Cascada 1: Área -> Depto -> Clase
      if (name === 'area') {
          setFormData(prev => ({ ...prev, area: value, depto: '%', clase: '%' }));
          try {
              if (value !== '%') {
                  const res = await consumoApi.get('/api/ConfigComisiones/sp_bw_cat_combo_deptos', { params: { area: value }});
                  setDeptos(Array.isArray(res?.data) ? res.data : []);
              } else { setDeptos([]); }
              setClases([]);
          } catch(e) { setDeptos([]); }
      } 
      else if (name === 'depto') {
          setFormData(prev => ({ ...prev, depto: value, clase: '%' }));
          try {
              if (value !== '%') {
                  const res = await consumoApi.get('/api/ConfigComisiones/sp_bw_cat_combo_clases', { params: { area: formData.area, depto: value }});
                  setClases(Array.isArray(res?.data) ? res.data : []);
              } else { setClases([]); }
          } catch(e) { setClases([]); }
      } 
      // Cascada 2: Marca -> Familia
      else if (name === 'idMarca') {
          setFormData(prev => ({ ...prev, idMarca: value, idFamilia: '%' }));
          try {
              if (value !== '%') {
                  const res = await consumoApi.get('/api/ConfigComisiones/sp_bw_cat_combo_familias', { params: { idMarca: value }});
                  setFamilias(Array.isArray(res?.data) ? res.data : []);
              } else { setFamilias([]); }
          } catch(e) { setFamilias([]); }
      }
      else {
          setFormData(prev => ({ ...prev, [name]: value }));
      }
  };

  // Manejo de Checkboxes (y la lógica exclusiva de IVA)
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      
      if (name === 'basePrecioConIva') {
          setFormData(prev => ({ ...prev, basePrecioConIva: checked, basePrecioSinIIva: !checked }));
      } else if (name === 'basePrecioSinIIva') {
          setFormData(prev => ({ ...prev, basePrecioSinIIva: checked, basePrecioConIva: !checked }));
      } else {
          setFormData(prev => ({ ...prev, [name]: checked }));
      }
  };

const handleGuardar = async () => {
        if (!formData.puesto) return setMessage({ text: "El Puesto es obligatorio.", type: 'error' });
        if (!formData.fechaInicial || !formData.fechaFinal) return setMessage({ text: "Las fechas son obligatorias.", type: 'error' });
        
        const comisionVal = Number(formData.comision);
        if (isNaN(comisionVal) || comisionVal < 0) return setMessage({ text: "La comisión debe ser un número válido.", type: 'error' });

        setSaving(true);
        try {
            // AQUI ESTÁ LA CORRECCIÓN: Le agregamos .toString() a los campos de texto
            const payload = { 
                ...formData, 
                sucursal: formData.sucursal?.toString(),
                area: formData.area?.toString(),
                depto: formData.depto?.toString(),
                clase: formData.clase?.toString(),
                idMarca: formData.idMarca?.toString(),
                idFamilia: formData.idFamilia?.toString(),
                comision: comisionVal, 
                puesto: Number(formData.puesto) // El puesto sí debe ser número
            };
            
            const res = await consumoApi.post('/api/ConfigComisiones/sp_bw_cat_configComisiones_ins', payload);
            if (res.status === 200) {
                setMessage({ text: "✅ Comisión configurada correctamente.", type: 'success' });
                fetchTablaComisiones();
                setFormData(prev => ({ ...prev, comision: 0, claveProd: '' }));
            }
        } catch (error) {
            setMessage({ text: "Error al guardar la comisión.", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

  const handleEliminar = async (id: number) => {
      if (!window.confirm("¿Está seguro que desea eliminar esta configuración?")) return;
      setSaving(true);
      try {
          const res = await consumoApi.delete(`/api/ConfigComisiones/sp_bw_cat_configComisiones_del?id=${id}`);
          if (res.status === 200) {
              setMessage({ text: "🗑️ Registro eliminado.", type: 'success' });
              fetchTablaComisiones();
          }
      } catch (error) {
          setMessage({ text: "Error al eliminar el registro.", type: 'error' });
      } finally {
          setSaving(false);
      }
  };

  // Formateador de días activos para la tabla
  const renderDias = (params: GridRenderCellParams) => {
      const { row } = params;
      const dias = [
          row.aplicaL ? 'L' : '-', row.aplicaM ? 'M' : '-', row.aplicaMi ? 'Mi' : '-', 
          row.aplicaJ ? 'J' : '-', row.aplicaV ? 'V' : '-', row.aplicaS ? 'S' : '-', row.aplicaD ? 'D' : '-'
      ].filter(d => d !== '-');
      return dias.length === 7 ? 'Toda la semana' : dias.join(', ');
  };

  const columns = useMemo<GridColDef[]>(() => [
    { field: 'nombre_sucursal', headerName: 'Sucursal', width: 140 },
    { field: 'nombre_area', headerName: 'Área', width: 120 },
    { field: 'nombre_depto', headerName: 'Depto', width: 120 },
    { field: 'nombre_clase', headerName: 'Clase', width: 120 },
    { field: 'nombre_marca', headerName: 'Marca', width: 120 },
    { field: 'nombre_familia', headerName: 'Familia', width: 120 },
    { field: 'claveProd', headerName: 'Producto', width: 120, valueFormatter: (v: any) => v || 'TODOS' },
    { field: 'nombre_puesto', headerName: 'Puesto', width: 150 },
    { field: 'fechaInicial', headerName: 'F. Inicial', width: 100, valueFormatter: (v: any) => new Date(v).toLocaleDateString() },
    { field: 'fechaFinal', headerName: 'F. Final', width: 100, valueFormatter: (v: any) => new Date(v).toLocaleDateString() },
    { field: 'comision', headerName: 'Comisión', width: 90, type: 'number', valueFormatter: (v: any) => `${Number(v).toFixed(2)}%` },
    { field: 'iva', headerName: 'Base IVA', width: 100, valueGetter: (params, row) => row.basePrecioConIva ? 'CON IVA' : 'SIN IVA' },
    { field: 'dias', headerName: 'Días Aplica', width: 150, renderCell: renderDias },
    { 
        field: 'acciones', headerName: 'Eliminar', width: 80, sortable: false, filterable: false, align: 'center',
        renderCell: (params: GridRenderCellParams) => (
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.id)}>
                <DeleteIcon />
            </IconButton>
        )
    }
  ], []);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5', overflow: 'hidden', p: 2 }}>
      
      {/* PANEL SUPERIOR: FORMULARIO */}
      <Paper sx={{ p: 3, mb: 3, flexShrink: 0, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: '#2c3e50', borderBottom: '2px solid #e0e0e0', pb: 1 }}>
           CONFIGURACIÓN DE COMISIONES
        </Typography>

        <Grid container spacing={2}>

            {/* --- SECCIÓN 1: UBICACIÓN Y CLASIFICACIÓN --- */}
            <Grid item xs={12} md={3}>
                <TextField {...selectProps} select label="Sucursal (Opcional)" name="sucursal" value={formData.sucursal} onChange={handleInputChange}
                    sx={{ width: '160px', ...selectProps.sx }}>
                    <MenuItem value="%">-- TODAS --</MenuItem>
                    {sucursales.map(s => <MenuItem key={s.id || s.cve_sucursal} value={s.id || s.cve_sucursal}>{s.descripcion || s.nombre}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField {...selectProps} select label="Área (Opcional)" name="area" value={formData.area} onChange={handleInputChange}
                    sx={{ width: '160px', ...selectProps.sx }}>
                    <MenuItem value="%">-- TODAS --</MenuItem>
                    {areas.map(a => <MenuItem key={a.id} value={a.id}>{a.descripcion}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField {...selectProps} select label="Depto (Opcional)" name="depto" value={formData.depto} onChange={handleInputChange} disabled={formData.area === '%'}
                    sx={{ width: '160px', ...selectProps.sx }}>
                    <MenuItem value="%">-- TODOS --</MenuItem>
                    {deptos.map(d => <MenuItem key={d.id} value={d.id}>{d.descripcion}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField {...selectProps} select label="Clase (Opcional)" name="clase" value={formData.clase} onChange={handleInputChange} disabled={formData.depto === '%'}
                    sx={{ width: '160px', ...selectProps.sx }}>
                    <MenuItem value="%">-- TODAS --</MenuItem>
                    {clases.map(c => <MenuItem key={c.id} value={c.id}>{c.descripcion}</MenuItem>)}
                </TextField>
            </Grid>

            {/* --- SECCIÓN 2: PRODUCTO Y PUESTO --- */}
            <Grid item xs={12} md={3}>
                <TextField {...selectProps} select label="Marca (Opcional)" name="idMarca" value={formData.idMarca} onChange={handleInputChange}
                    sx={{ width: '160px', ...selectProps.sx }}>
                    <MenuItem value="%">-- TODAS --</MenuItem>
                    {marcas.map(m => <MenuItem key={m.id} value={m.id}>{m.descripcion || m.marca}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField {...selectProps} select label="Familia (Opcional)" name="idFamilia" value={formData.idFamilia} onChange={handleInputChange} disabled={formData.idMarca === '%'}
                    sx={{ width: '160px', ...selectProps.sx }}>
                    <MenuItem value="%">-- TODAS --</MenuItem>
                    {familias.map(f => <MenuItem key={f.id} value={f.id}>{f.descripcion}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField {...commonProps} label="Clave Producto (Opcional)" name="claveProd" value={formData.claveProd} onChange={handleInputChange} placeholder="Ej. PROD-001" 
                    sx={{ width: '160px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField {...selectProps} select label="Puesto (Obligatorio)*" name="puesto" value={formData.puesto} onChange={handleInputChange} 
                    sx={{ width: '160px', ...selectProps.sx, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' } }}>
                    <MenuItem value="">-- SELECCIONE --</MenuItem>
                    {puestos.map(p => <MenuItem key={p.id} value={p.id}>{p.descripcion}</MenuItem>)}
                </TextField>
            </Grid>

            {/* --- SECCIÓN 3: PARÁMETROS ECONÓMICOS Y DÍAS (ESTILO ACCESS COMPACTO) --- */}
            <Grid item xs={12} md={2}>
                <TextField {...commonProps} type="date" label="Fecha Inicial" name="fechaInicial" value={formData.fechaInicial} onChange={handleInputChange} InputLabelProps={{ shrink: true }} 
                    sx={{ width: '160px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField {...commonProps} type="date" label="Fecha Final" name="fechaFinal" value={formData.fechaFinal} onChange={handleInputChange} InputLabelProps={{ shrink: true }} 
                    sx={{ width: '160px', ...commonProps.sx }} />
            </Grid>

            {/* Checkboxes de IVA estilo cabecera superior */}
            <Grid item xs={6} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                <FormControlLabel
                    control={<Checkbox size="small" checked={formData.basePrecioConIva} onChange={handleCheckboxChange} name="basePrecioConIva" color="primary" sx={{ p: 0.5 }} />}
                    label={<Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 'bold', lineHeight: 1, textAlign: 'center' }}>Base<br/>Con IVA</Typography>}
                    labelPlacement="top"
                    sx={{ m: 0 }}
                />
            </Grid>
            <Grid item xs={6} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                <FormControlLabel
                    control={<Checkbox size="small" checked={formData.basePrecioSinIIva} onChange={handleCheckboxChange} name="basePrecioSinIIva" color="secondary" sx={{ p: 0.5 }} />}
                    label={<Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 'bold', lineHeight: 1, textAlign: 'center' }}>Base Sin<br/>IVA</Typography>}
                    labelPlacement="top"
                    sx={{ m: 0 }}
                />
            </Grid>

            <Grid item xs={12} md={1.5} sx={{ display: 'flex', alignItems: 'flex-end', pb: 0.5 }}>
                <TextField {...commonProps} type="number" label="Comisión (%)" name="comision" value={formData.comision} onChange={handleInputChange} inputProps={{ step: "0.01" }} 
                    sx={{ width: '120px', ...commonProps.sx }} />
            </Grid>

            {/* Días de la semana pegaditos como en Access */}
            <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 0 }}>
                <FormControlLabel control={<Checkbox size="small" checked={formData.aplicaL} onChange={handleCheckboxChange} name="aplicaL" sx={{ p: 0.3 }}/>} label={<Typography variant="caption" sx={{ fontWeight: 'bold' }}>L</Typography>} labelPlacement="top" sx={{ m: 0 }} />
                <FormControlLabel control={<Checkbox size="small" checked={formData.aplicaM} onChange={handleCheckboxChange} name="aplicaM" sx={{ p: 0.3 }}/>} label={<Typography variant="caption" sx={{ fontWeight: 'bold' }}>M</Typography>} labelPlacement="top" sx={{ m: 0 }} />
                <FormControlLabel control={<Checkbox size="small" checked={formData.aplicaMi} onChange={handleCheckboxChange} name="aplicaMi" sx={{ p: 0.3 }}/>} label={<Typography variant="caption" sx={{ fontWeight: 'bold' }}>Mi</Typography>} labelPlacement="top" sx={{ m: 0 }} />
                <FormControlLabel control={<Checkbox size="small" checked={formData.aplicaJ} onChange={handleCheckboxChange} name="aplicaJ" sx={{ p: 0.3 }}/>} label={<Typography variant="caption" sx={{ fontWeight: 'bold' }}>J</Typography>} labelPlacement="top" sx={{ m: 0 }} />
                <FormControlLabel control={<Checkbox size="small" checked={formData.aplicaV} onChange={handleCheckboxChange} name="aplicaV" sx={{ p: 0.3 }}/>} label={<Typography variant="caption" sx={{ fontWeight: 'bold' }}>V</Typography>} labelPlacement="top" sx={{ m: 0 }} />
                <FormControlLabel control={<Checkbox size="small" checked={formData.aplicaS} onChange={handleCheckboxChange} name="aplicaS" sx={{ p: 0.3 }}/>} label={<Typography variant="caption" sx={{ fontWeight: 'bold' }}>S</Typography>} labelPlacement="top" sx={{ m: 0 }} />
                <FormControlLabel control={<Checkbox size="small" checked={formData.aplicaD} onChange={handleCheckboxChange} name="aplicaD" sx={{ p: 0.3 }}/>} label={<Typography variant="caption" sx={{ fontWeight: 'bold' }}>D</Typography>} labelPlacement="top" sx={{ m: 0 }} />
            </Grid>

            {/* Botón Guardar */}
            <Grid item xs={12} md={1.5} sx={{ display: 'flex', alignItems: 'flex-end', pb: 0.5 }}>
                <Button variant="contained" onClick={handleGuardar} disabled={saving} fullWidth startIcon={<SaveIcon />}
                    sx={{ 
                        height: '45px', 
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
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ maxHeight: 600, mb: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
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

      {/* NOTIFICACIONES */}
      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type} onClose={() => setMessage(null)} sx={{ width: '100%' }}>{message?.text}</Alert>
      </Snackbar>
    </Box>
  );
}