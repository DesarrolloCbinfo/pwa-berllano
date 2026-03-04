"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  MenuItem, Snackbar, Alert, Paper 
} from '@mui/material'; 
import { 
  DataGrid, GridColDef, GridRenderCellParams, GridToolbar, 
  GridPaginationModel, GridPagination 
} from '@mui/x-data-grid';

import useConsumoApi from '../../../hooks/useConsumoApi'; 

// --- ESTILOS ---
const commonProps = {
  fullWidth: true,
  size: "small" as const,
  variant: "outlined" as const,
  sx: {
      width: '100%',
      '& .MuiInputBase-root': { 
          height: '40px', 
          borderRadius: '8px',
          bgcolor: 'white',
          width: '100%', 
          maxWidth: '100%', 
          overflow: 'hidden'
      },
      '& .MuiInputBase-input': {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
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
          textOverflow: 'ellipsis !important', 
          paddingRight: '30px !important', 
          minHeight: 'auto !important' 
      }
  }
};

const gridItemStyle = { minWidth: 0, flexBasis: 'auto', flexGrow: 0, flexShrink: 0, maxWidth: '100%' };

function CustomPagination() { return <GridPagination />; }

interface CatalogoItem { id: number | string; descripcion: string; }

const initialFormState = { area: '%', depto: '%', marca: '%', listaPrecio: 1, porcentaje: 0 };

export default function AjusteMasivoPrecios() {
  const { consumoApi } = useConsumoApi();

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // BLINDAJE INICIAL: Siempre inician como arreglos vacíos
  const [areas, setAreas] = useState<CatalogoItem[]>([]);
  const [deptos, setDeptos] = useState<CatalogoItem[]>([]);
  const [marcas, setMarcas] = useState<CatalogoItem[]>([]);
  
  const [loadingDeptos, setLoadingDeptos] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const catalogoListas = [
    { id: 1, descripcion: 'PRECIO PÚBLICO' },
    { id: 2, descripcion: 'MEDIO MAYOREO' },
    { id: 3, descripcion: 'MAYOREO' },
    { id: 4, descripcion: 'DISTRIBUIDOR' }
  ];

  useEffect(() => { fetchCatalogos(); }, []);

  const fetchCatalogos = async () => {
    try {
      const [areasRes, marcasRes] = await Promise.all([
        consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_areas'),
        consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_marcas')
      ]);
      // BLINDAJE: Solo asginar si es un arreglo, si no, arreglo vacío
      setAreas(Array.isArray(areasRes?.data) ? areasRes.data : []);
      setMarcas(Array.isArray(marcasRes?.data) ? marcasRes.data : []);
      fetchDeptos('%');
    } catch (error) { 
        setAreas([]); setMarcas([]);
        setMessage({ text: 'Error al cargar filtros (Áreas/Marcas)', type: 'error' }); 
    }
  };

  const fetchDeptos = async (areaId: string) => {
    setLoadingDeptos(true);
    try {
        const response = await consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_deptos', { params: { area: areaId || '%' }});
        // BLINDAJE
        setDeptos(Array.isArray(response?.data) ? response.data : []);
    } catch (error) { 
        setDeptos([]);
    } finally { 
        setLoadingDeptos(false); 
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    if (name === 'area') {
        fetchDeptos(value);
        setFormData(prev => ({ ...prev, [name]: value, depto: '%' }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const fetchProductos = async () => {
    setLoading(true);
    setFormData(prev => ({ ...prev, porcentaje: 0 })); 
    
    try {
      const params = {
        area: formData.area || '%', 
        depto: formData.depto || '%', 
        marca: formData.marca || '%',
        clave_lista: formData.listaPrecio
      };

      const response = await consumoApi.get('/api/AjustePrecios/sp_bw_visor_precios_productos', { params });
      
      if (Array.isArray(response?.data)) {
          const rowsMapped = response.data.map((item: any, idx: number) => ({
              id: item.clave_prod ? `${item.clave_prod}-${item.clave_lista}` : `temp-${idx}`,
              clave_prod: item.clave_prod || '',
              descripcion: item.descripcion || '',
              // BLINDAJE MATEMÁTICO: Convertir a número seguro
              precio: isNaN(Number(item.precio)) ? 0 : Number(item.precio),
              ajustee: isNaN(Number(item.ajustee)) ? 0 : Number(item.ajustee),
              clave_lista: item.clave_lista || 1
          }));
          setRows(rowsMapped);
          if(rowsMapped.length === 0) setMessage({ text: 'No se encontraron productos con esos filtros.', type: 'error' });
      } else {
          setRows([]);
      }
    } catch (error: any) {
      setRows([]);
      setMessage({ text: 'Error al consultar lista en el servidor.', type: 'error' });
    } finally { 
      setLoading(false); 
    }
  };

  const handleSimularAjuste = () => {
      if (rows.length === 0) {
          setMessage({ text: "Realice una consulta primero.", type: 'error' });
          return;
      }
      const valPorcentaje = Number(formData.porcentaje);
      if (isNaN(valPorcentaje) || valPorcentaje === 0) {
          setMessage({ text: "Ingrese un porcentaje válido.", type: 'error' });
          return;
      }

      const factor = 1 + (valPorcentaje / 100);
      const filasActualizadas = rows.map(r => {
          const nuevo = r.precio * factor;
          return { ...r, ajustee: isNaN(nuevo) ? 0 : parseFloat(nuevo.toFixed(2)) };
      });

      setRows(filasActualizadas);
      setMessage({ text: "Ajuste simulado en pantalla. Revise antes de guardar.", type: 'success' });
  };

  const handleGuardarCambios = async () => {
      if (rows.length === 0) return;
      const tieneCambios = rows.some(r => r.ajustee > 0 && r.ajustee !== r.precio);
      if (!tieneCambios) {
          setMessage({ text: "Debe aplicar un porcentaje antes de guardar.", type: 'error' });
          return;
      }
      if (!window.confirm(`¿Está seguro que desea APLICAR el ajuste a estos ${rows.length} productos en la Base de Datos?`)) return;

      setSaving(true);
      try {
          let usuarioActivo = "SISTEMA";
          try {
              const tokenData = localStorage.getItem('token');
              if (tokenData) usuarioActivo = JSON.parse(tokenData).usuario || "SISTEMA";
          } catch(e) {}

          const datosAEnviar = rows.map(r => ({
              clave_prod: String(r.clave_prod),
              precio: Number(r.precio),
              ajuste: Number(r.ajustee), 
              clave_lista: Number(r.clave_lista)
          }));

          const res = await consumoApi.post('/api/AjustePrecios/sp_act_precios_prod', { usuario: usuarioActivo, datos: datosAEnviar });
          if (res.status === 200) {
              setMessage({ text: "✅ Precios actualizados en el servidor correctamente.", type: 'success' });
              fetchProductos(); 
          }
      } catch (error) {
          setMessage({ text: "Error al guardar en el servidor.", type: 'error' });
      } finally {
          setSaving(false);
      }
  };

  const columns = useMemo<GridColDef[]>(() => [
    { field: 'clave_prod', headerName: 'Clave', width: 150 },
    { field: 'descripcion', headerName: 'Descripción', flex: 1, minWidth: 250 },
    { field: 'clave_lista', headerName: 'Lista P.', width: 100, align: 'center', headerAlign: 'center' },
    { 
        field: 'precio', headerName: 'Precio Actual', width: 150, type: 'number',
        valueFormatter: (v: any) => isNaN(Number(v)) ? '$0.00' : `$${Number(v).toFixed(2)}` 
    },
    { 
        field: 'ajustee', headerName: 'Precio con Ajuste', width: 150, type: 'number',
        renderCell: (params: GridRenderCellParams) => {
            const actual = Number(params.row?.precio || 0);
            const ajuste = Number(params.value || 0);
            let color = '#333', fw = 'normal';
            if (ajuste > actual) { color = '#2e7d32'; fw = 'bold'; } 
            else if (ajuste > 0 && ajuste < actual) { color = '#d32f2f'; fw = 'bold'; }
            return (
                <Typography sx={{ color, fontWeight: fw, fontSize: '0.875rem' }}>
                    {ajuste === 0 || isNaN(ajuste) ? '-' : `$${ajuste.toFixed(2)}`}
                </Typography>
            );
        }
    },
  ], []);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5', overflow: 'hidden' }}>
      <Box sx={{ height: 'auto', flexShrink: 0, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.2rem' }}>
            <Box sx={{ width: 28, height: 28, backgroundColor: '#1976d2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem' }}>💲</Box>
            ACTUALIZACIÓN GENERAL DE PRECIOS POR GRUPO
          </Typography>
        </Box>

        <Paper sx={{ p: 2, backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3} sx={gridItemStyle}>
              <TextField {...selectProps} select label="Área" name="area" value={formData.area} onChange={handleInputChange}>
                <MenuItem value="%"> TODAS </MenuItem>
                {Array.isArray(areas) && areas.map((item) => (<MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={gridItemStyle}>
              <TextField {...selectProps} select label={loadingDeptos ? "..." : "Depto"} name="depto" value={formData.depto} onChange={handleInputChange} disabled={loadingDeptos}>
                <MenuItem value="%"> TODOS </MenuItem>
                {Array.isArray(deptos) && deptos.map((item) => (<MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={gridItemStyle}>
              <TextField {...selectProps} select label="Marca" name="marca" value={formData.marca} onChange={handleInputChange}>
                <MenuItem value="%"> TODAS </MenuItem>
                {Array.isArray(marcas) && marcas.map((item) => (<MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={gridItemStyle}>
              <TextField {...selectProps} select label="Lista de Precios" name="listaPrecio" value={formData.listaPrecio} onChange={handleInputChange}>
                {catalogoListas.map((item) => (<MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={12}><Divider sx={{ my: 1 }} /></Grid>

            <Grid item xs={12} sm={6} md={4} display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" fontWeight="bold" color="#333">Ajuste al precio (%):</Typography>
                <TextField {...commonProps} type="number" name="porcentaje" value={formData.porcentaje} onChange={handleInputChange} inputProps={{ step: "0.1" }} sx={{ width: '120px' }} />
            </Grid>
            <Grid item xs={12} sm={6} md={8} display="flex" justifyContent="flex-end" gap={2}>
              <Button variant="outlined" onClick={fetchProductos} disabled={loading} sx={{ borderRadius: '8px', height: '40px', fontWeight: 'bold' }}>1. CONSULTAR LISTA</Button>
              <Button variant="contained" onClick={handleSimularAjuste} sx={{ bgcolor: '#1976d2', color: 'white', borderRadius: '8px', height: '40px', fontWeight: 'bold' }}>2. APLICAR PORCENTAJE</Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, p: 2, pt: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper sx={{ flex: 1, width: '100%', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', bgcolor: 'white', mb: 2 }}>
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
            sx={{ border: 'none', height: '100%' }} 
          />
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
           <Button variant="contained" onClick={handleGuardarCambios} disabled={saving || rows.length === 0} sx={{ backgroundColor: '#d32f2f', color: 'white', borderRadius: '8px', fontWeight: 'bold', padding: '10px 24px', '&:hover': { backgroundColor: '#b71c1c' } }}>
             💾 3. APLICAR CAMBIO A BASE DE DATOS
           </Button>
           <Button variant="contained" onClick={() => window.history.back()} sx={{ backgroundColor: '#333333', color: 'white', borderRadius: '8px', fontWeight: 'bold', padding: '10px 24px' }}>
             SALIR
           </Button>
        </Box>
      </Box>

      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type} onClose={() => setMessage(null)} sx={{ width: '100%' }}>{message?.text}</Alert>
      </Snackbar>
    </Box>
  );
}