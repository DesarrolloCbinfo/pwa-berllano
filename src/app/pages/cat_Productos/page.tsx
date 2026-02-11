"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, FormControl, 
  InputLabel, Select, MenuItem, Checkbox, FormControlLabel, 
  Snackbar, Alert, CircularProgress, Paper,
  Tabs, Tab 
} from '@mui/material';

import { 
  DataGrid, 
  GridColDef, 
  GridRenderCellParams, 
  GridToolbar, 
  GridPaginationModel, 
  GridPagination 
} from '@mui/x-data-grid';

import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Home as HomeIcon
} from '@mui/icons-material';

import useConsumoApi from '../../../hooks/useConsumoApi'; 

// --- ESTILOS BERLLANO ELEGANTE (TONALIDADES NEUTRAS) ---
// 1. Estilo General (Altura fija de 50px con detalles elegantes)
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

// 2. Estilo SOLO para Selects (Hereda el general pero agrega ancho mínimo)
const selectProps = {
  ...commonProps,
  sx: {
      ...commonProps.sx,
      minWidth: '220px',
  }
};

// --- PAGINACIÓN PERSONALIZADA ---
function CustomPagination() {
  return (
    <GridPagination />
  );
}

// --- INTERFACES ---
interface ProductoRow {
  id: string;
  origen: string;
  clave: string;
  descripcion: string;
  marca: string;
  ex: string;
  costo: number;
  precio: number;
  margen: number;
  iva: number;
  area: string;
  depto: string;
  clase: string;
  inv: boolean;
  obs: boolean;
  cont: boolean;
  prom: boolean;
  kit: boolean;
  TotalRegistros?: number;
}

interface CatalogoItem {
  id: number | string;
  descripcion: string;
}

const initialFormState = {
  area: '',
  depto: '',
  clase: '',
  descripcion: '',
  marca: '',
  origen: '',
  comprador: '',
  linea_com: '',
  mueble: '',
  tramo: '',
  incluir_obsoletos: false,
};

export default function CatProductos() {
  const { consumoApi } = useConsumoApi();

  // --- ESTADOS ---
  const [rows, setRows] = useState<ProductoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<CatalogoItem[]>([]);
  const [deptos, setDeptos] = useState<CatalogoItem[]>([]);
  const [clases, setClases] = useState<CatalogoItem[]>([]);
  const [marcas, setMarcas] = useState<CatalogoItem[]>([]);
  const [origenes, setOrigenes] = useState<CatalogoItem[]>([]);
  const [compradores, setCompradores] = useState<CatalogoItem[]>([]);
  const [lineasCom, setLineasCom] = useState<CatalogoItem[]>([]);

  // --- PAGINACIÓN ---
  const [rowCount, setRowCount] = useState(0); 
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,      
    pageSize: 10 
  });

  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  
  // Estado para Pestañas
  const [tabValue, setTabValue] = useState(0);

  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- CARGAS DE DATOS ---
  const fetchCatalogos = async () => {
    try {
      // Mock data para desarrollo - reemplazar con llamadas reales cuando el backend esté listo
      const mockAreas = [
        { id: 'INSUMOS', descripcion: 'INSUMOS' },
        { id: 'TECNICO', descripcion: 'TECNICO' },
        { id: 'VENTA', descripcion: 'VENTA' }
      ];
      
      const mockDeptos = [
        { id: 'GENERAL', descripcion: 'GENERAL' },
        { id: 'ESPECIALIZADO', descripcion: 'ESPECIALIZADO' },
        { id: 'SERVICIOS', descripcion: 'SERVICIOS' }
      ];
      
      const mockClases = [
        { id: 'ALACIADOS', descripcion: 'Alaciados' },
        { id: 'TINTES', descripcion: 'Tintes' },
        { id: 'CREMAS', descripcion: 'Cremas' },
        { id: 'ACCESORIOS', descripcion: 'Accesorios' }
      ];
      
      const mockMarcas = [
        { id: 'PREMIERE', descripcion: 'DISTRIBUIDORA PREMIERE' },
        { id: 'LREAL', descripcion: 'L\'OREAL' },
        { id: 'WELLA', descripcion: 'WELLA' }
      ];
      
      const mockOrigenes = [
        { id: 'NACIONAL', descripcion: 'NACIONAL' },
        { id: 'IMPORTADO', descripcion: 'IMPORTADO' }
      ];
      
      const mockCompradores = [
        { id: 'COMPRA1', descripcion: 'Comprador 1' },
        { id: 'COMPRA2', descripcion: 'Comprador 2' }
      ];
      
      const mockLineasCom = [
        { id: 'LINEA1', descripcion: 'Línea Comercial 1' },
        { id: 'LINEA2', descripcion: 'Línea Comercial 2' }
      ];
      
      setAreas(mockAreas);
      setDeptos(mockDeptos);
      setClases(mockClases);
      setMarcas(mockMarcas);
      setOrigenes(mockOrigenes);
      setCompradores(mockCompradores);
      setLineasCom(mockLineasCom);
      
      /*
      // Descomentar cuando el backend esté listo
      const [areasRes, deptosRes, clasesRes, marcasRes, origenesRes, compradoresRes, lineasRes] = await Promise.all([
        consumoApi.get('/api/CatProductos/sp_bw_cat_productos_areas'),
        consumoApi.get('/api/CatProductos/sp_bw_cat_productos_deptos'),
        consumoApi.get('/api/CatProductos/sp_bw_cat_productos_clases'),
        consumoApi.get('/api/CatProductos/sp_bw_cat_productos_marcas'),
        consumoApi.get('/api/CatProductos/sp_bw_cat_productos_origenes'),
        consumoApi.get('/api/CatProductos/sp_bw_cat_productos_compradores'),
        consumoApi.get('/api/CatProductos/sp_bw_cat_productos_lineas_com')
      ]);
      
      setAreas(areasRes.data);
      setDeptos(deptosRes.data);
      setClases(clasesRes.data);
      setMarcas(marcasRes.data);
      setOrigenes(origenesRes.data);
      setCompradores(compradoresRes.data);
      setLineasCom(lineasRes.data);
      */
    } catch (error) {
      console.error("Error cargando catálogos", error);
    }
  };

  const fetchProductos = async () => {
    setLoading(true);
    try {
      // Mock data para desarrollo - reemplazar con llamada real cuando el backend esté listo
      const mockProductos: ProductoRow[] = [
        {
          id: 'PROD001',
          origen: 'NACIONAL',
          clave: 'PROD001',
          descripcion: 'Diamond Black Professional',
          marca: 'DISTRIBUIDORA PREMIERE',
          ex: '-1',
          costo: 28.50,
          precio: 45.00,
          margen: 36.67,
          iva: 16.00,
          area: 'INSUMOS',
          depto: 'Tecnico',
          clase: 'General',
          inv: true,
          obs: false,
          cont: true,
          prom: false,
          kit: false
        },
        {
          id: 'PROD002',
          origen: 'IMPORTADO',
          clave: 'PROD002',
          descripcion: 'Tinte Profesional Rubi 5.66',
          marca: 'L\'OREAL',
          ex: '0',
          costo: 65.00,
          precio: 95.00,
          margen: 31.58,
          iva: 16.00,
          area: 'INSUMOS',
          depto: 'Tecnico',
          clase: 'Tintes',
          inv: true,
          obs: false,
          cont: true,
          prom: true,
          kit: false
        },
        {
          id: 'PROD003',
          origen: 'NACIONAL',
          clave: 'PROD003',
          descripcion: 'Crema Alaciadora Premium',
          marca: 'WELLA',
          ex: '2',
          costo: 45.75,
          precio: 72.00,
          margen: 36.46,
          iva: 16.00,
          area: 'INSUMOS',
          depto: 'Tecnico',
          clase: 'Alaciados',
          inv: true,
          obs: false,
          cont: true,
          prom: false,
          kit: false
        }
      ];
      
      setRows(mockProductos);
      setRowCount(mockProductos.length);
      
      /*
      // Descomentar cuando el backend esté listo
      const pageToSend = paginationModel.page + 1; 
      const response = await consumoApi.get('/api/CatProductos/sp_bw_cat_productos_sel', {
        params: {
            page: pageToSend,
            pageSize: paginationModel.pageSize,
            busqueda: searchTerm,
            ...formData
        },
        timeout: 120000 
      });

      const data = response.data;
      setRows(data);

      if (data && data.length > 0 && data[0].TotalRegistros) {
          setRowCount(data[0].TotalRegistros);
      } else {
          if (paginationModel.page === 0) setRowCount(0);
      }
      */
    } catch (error: any) {
      console.error("Error:", error);
      if (error.code === 'ECONNABORTED') {
         setMessage({ text: 'El servidor tardó demasiado en responder', type: 'error' });
      } else {
         setMessage({ text: 'Error al cargar productos', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    if (paginationModel.page === 0) fetchProductos();
  };

  const handleApplyFilters = () => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    fetchProductos();
  };

  useEffect(() => { fetchProductos(); }, [paginationModel]); 
  useEffect(() => { fetchCatalogos(); }, []);

  // --- LÓGICA FORMULARIO ---
  const handleInputChange = (e: any) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setTabValue(0); 
    setOpenModal(true);
  };

  const handleOpenEdit = (row: ProductoRow) => {
    setFormData({
      area: row.area || '',
      depto: row.depto || '',
      clase: row.clase || '',
      descripcion: row.descripcion || '',
      marca: row.marca || '',
      origen: row.origen || '',
      comprador: '',
      linea_com: '',
      mueble: '',
      tramo: '',
      incluir_obsoletos: false,
    });
    setIsEditing(true);
    setTabValue(0);
    setOpenModal(true);
  };

  const handleSave = async () => {
    // Implementar lógica de guardado
    setMessage({ text: 'Funcionalidad en desarrollo', type: 'success' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`¿Eliminar producto ${id}?`)) return;
    // Implementar lógica de eliminación
    setMessage({ text: 'Funcionalidad en desarrollo', type: 'success' });
  };

  const columns: GridColDef[] = [
    {
      field: 'acciones', headerName: 'Acci.', width: 100, sortable: false, filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(params.row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ),
    },
    { field: 'origen', headerName: 'Origen', width: 200 },
    { field: 'clave', headerName: 'Clave', width: 120 },
    { field: 'descripcion', headerName: 'Descripción', flex: 1, minWidth: 200 },
    { field: 'marca', headerName: 'Marca', width: 150 },
    { field: 'ex', headerName: 'Ex', width: 80 },
    { field: 'costo', headerName: 'Costo', width: 100, type: 'number' },
    { field: 'precio', headerName: 'Precio', width: 100, type: 'number' },
    { field: 'margen', headerName: 'Margen', width: 100, type: 'number' },
    { field: 'iva', headerName: 'IVA', width: 80, type: 'number' },
    { field: 'area', headerName: 'Área', width: 100 },
    { field: 'depto', headerName: 'Depto.', width: 100 },
    { field: 'clase', headerName: 'Clase', width: 100 },
    { field: 'inv', headerName: 'INV', width: 60, type: 'boolean' },
    { field: 'obs', headerName: 'OBS', width: 60, type: 'boolean' },
    { field: 'cont', headerName: 'CONT', width: 60, type: 'boolean' },
    { field: 'prom', headerName: 'PROM', width: 60, type: 'boolean' },
    { field: 'kit', headerName: 'KIT', width: 60, type: 'boolean' },
  ];

  return (
    <Box sx={{ p: 0, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            backgroundColor: '#333333', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white',
            boxShadow: '0 4px 8px rgba(51, 51, 51, 0.3)',
            transition: 'all 0.3s ease'
          }}>📦</Box>
          CATÁLOGO DE PRODUCTOS
        </Typography>
      </Box>

      {/* SECCIÓN DE FILTROS */}
      <Paper sx={{ mx: 3, mb: 3, p: 3, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}>
          Filtros de Búsqueda
        </Typography>
        <Grid container spacing={2}>
          {/* Columna 1 */}
          <Grid item xs={12} sm={6} md={4} lg={3} xl={3}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  {...selectProps} 
                  select 
                  label="Área" 
                  name="area" 
                  value={formData.area} 
                  onChange={handleInputChange}
                >
                  <MenuItem value="">TODAS</MenuItem>
                  {areas.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.descripcion}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  {...selectProps} 
                  select 
                  label="Depto" 
                  name="depto" 
                  value={formData.depto} 
                  onChange={handleInputChange}
                >
                  <MenuItem value="">TODOS</MenuItem>
                  {deptos.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.descripcion}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  {...selectProps} 
                  select 
                  label="Clase" 
                  name="clase" 
                  value={formData.clase} 
                  onChange={handleInputChange}
                >
                  <MenuItem value="">TODAS</MenuItem>
                  {clases.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.descripcion}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Grid>

          {/* Columna 2 */}
          <Grid item xs={12} sm={6} md={4} lg={3} xl={3}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  {...commonProps} 
                  label='Descripción' 
                  name="descripcion" 
                  value={formData.descripcion} 
                  onChange={handleInputChange} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  {...selectProps} 
                  select 
                  label="Marca" 
                  name="marca" 
                  value={formData.marca} 
                  onChange={handleInputChange}
                >
                  <MenuItem value="">TODAS</MenuItem>
                  {marcas.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.descripcion}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  {...selectProps} 
                  select 
                  label="Origen" 
                  name="origen" 
                  value={formData.origen} 
                  onChange={handleInputChange}
                >
                  <MenuItem value="">TODAS</MenuItem>
                  {origenes.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.descripcion}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Grid>

          {/* Columna 3 */}
          <Grid item xs={12} sm={6} md={4} lg={3} xl={3}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  {...selectProps} 
                  select 
                  label="Comprador" 
                  name="comprador" 
                  value={formData.comprador} 
                  onChange={handleInputChange}
                >
                  <MenuItem value="">TODOS</MenuItem>
                  {compradores.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.descripcion}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  {...commonProps} 
                  label='Mueble' 
                  name="mueble" 
                  value={formData.mueble} 
                  onChange={handleInputChange} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  {...commonProps} 
                  label='Tramo' 
                  name="tramo" 
                  value={formData.tramo} 
                  onChange={handleInputChange} 
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Columna 4 */}
          <Grid item xs={12} sm={6} md={4} lg={3} xl={3}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  {...selectProps} 
                  select 
                  label="Línea Com." 
                  name="linea_com" 
                  value={formData.linea_com} 
                  onChange={handleInputChange}
                >
                  <MenuItem value="">TODAS</MenuItem>
                  {lineasCom.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.descripcion}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{
                  p: 2,
                  border: '1.5px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  height: '50px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#999',
                    backgroundColor: '#f5f5f5'
                  }
                }}>
                  <Checkbox 
                    checked={formData.incluir_obsoletos} 
                    onChange={handleInputChange} 
                    name="incluir_obsoletos"
                    sx={{
                      color: '#333',
                      '&.Mui-checked': {
                        color: '#333'
                      }
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                    Incluir obsoletos
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  onClick={handleApplyFilters}
                  fullWidth
                  sx={{ 
                    height: '50px',
                    backgroundColor: '#333333', 
                    color: 'white', 
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      backgroundColor: '#555555',
                      boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  Consultar y aplicar Filtros
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* BOTONES DE ACCIÓN */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0, p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={handleOpenAdd} 
            sx={{ 
              backgroundColor: '#333333', 
              color: 'white', 
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'none',
              padding: '10px 20px',
              boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                backgroundColor: '#555555',
                boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            ALTA DE CLAVES
          </Button>
          <Button 
            variant="outlined" 
            onClick={fetchProductos}
            sx={{ 
              borderRadius: '8px',
              borderColor: '#e0e0e0',
              borderWidth: '1.5px',
              color: '#666',
              transition: 'all 0.3s ease',
              '&:hover': { 
                borderColor: '#999',
                color: '#333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }
            }}
          >
            <RefreshIcon />
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }
              }
            }}
          />
          <Button 
            variant="outlined" 
            onClick={handleSearch} 
            sx={{ 
              minWidth: 'auto', 
              px: 2,
              borderRadius: '8px',
              borderColor: '#e0e0e0',
              borderWidth: '1.5px',
              color: '#666',
              transition: 'all 0.3s ease',
              '&:hover': { 
                borderColor: '#999',
                color: '#333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }
            }}
          >
            <SearchIcon />
          </Button>
        </Box>
      </Box>

      {/* TABLA DE RESULTADOS */}
      <Box sx={{ 
        height: 'auto', 
        width: '100vw', 
        marginLeft: '-24px', 
        bgcolor: 'white', 
        borderTop: '1px solid #e0e0e0', 
        borderBottom: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        minHeight: 400,
        transition: 'all 0.3s ease'
      }}>
        <DataGrid 
          rows={rows} 
          columns={columns} 
          getRowId={(row) => row.id} 
          loading={loading}
          paginationMode="server" 
          rowCount={rowCount}
          paginationModel={paginationModel} 
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 30, 40, 50, 100]}
          slots={{ toolbar: GridToolbar, pagination: CustomPagination }}
          slotProps={{ toolbar: { showQuickFilter: true } }}
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5' } }}
        />
      </Box>

      {/* BOTONES INFERIORES */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, p: 3 }}>
        <Button 
          variant="outlined" 
          sx={{ 
            backgroundColor: '#e0e0e0', 
            color: '#000', 
            fontWeight: 'bold',
            px: 4,
            borderRadius: '8px',
            '&:hover': { backgroundColor: '#d0d0d0' }
          }}
        >
          Reasignacion de Area, Depto y Clase
        </Button>
        <Button 
          variant="outlined" 
          sx={{ 
            backgroundColor: '#e0e0e0', 
            color: '#000', 
            fontWeight: 'bold',
            px: 4,
            borderRadius: '8px',
            '&:hover': { backgroundColor: '#d0d0d0' }
          }}
        >
          Salida a Excel
        </Button>
        <Button 
          variant="outlined" 
          sx={{ 
            backgroundColor: '#e0e0e0', 
            color: '#000', 
            fontWeight: 'bold',
            px: 4,
            borderRadius: '8px',
            '&:hover': { backgroundColor: '#d0d0d0' }
          }}
        >
          Reportes por clave
        </Button>
        <Button 
          variant="outlined" 
          sx={{ 
            backgroundColor: '#e0e0e0', 
            color: '#000', 
            fontWeight: 'bold',
            px: 4,
            borderRadius: '8px',
            '&:hover': { backgroundColor: '#d0d0d0' }
          }}
        >
          Salir
        </Button>
      </Box>

      {/* PIE DE PÁGINA ESTILO ACCESS */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        py: 2,
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #e0e0e0'
      }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666' }}>
          CATÁLOGO DE PRODUCTOS, ARAUCARIAS, 203, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR:ADMIN
        </Typography>
      </Box>

      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type} onClose={() => setMessage(null)} sx={{ width: '100%' }}>{message?.text}</Alert>
      </Snackbar>
    </Box>
  );
}
