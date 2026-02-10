"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, 
  Snackbar, Alert, MenuItem, FormControlLabel, Checkbox,
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
  Search as SearchIcon
} from '@mui/icons-material';

import useConsumoApi from '../../../hooks/useConsumoApi'; 

// --- ESTILOS BERLLANO ELEGANTE (COPIADOS DE CLIENTES) ---
// 1. Estilo General (Inputs de Texto)
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

// 2. Estilo SOLO para Selects (Hereda el general pero agrega ancho mínimo de 220px)
const selectProps = {
  ...commonProps,
  sx: {
      ...commonProps.sx,
      minWidth: '220px', // <--- ESTA ES LA CLAVE DEL TAMAÑO ÓPTIMO
  }
};

// --- PAGINACIÓN PERSONALIZADA ---
function CustomPagination() {
  return (
    <GridPagination 
      showFirstButton={true}
      showLastButton={true}
    />
  );
}

// --- INTERFACES ---
interface ProveedorRow {
  id: string; // cve_prov
  nombre: string;
  nombre_fiscal?: string;
  rfc?: string;
  curp?: string;
  domicilio?: string;
  colonia?: string;
  telefono?: string;
  fax?: string;
  ciudad?: string;
  cp?: string;
  estado?: string;
  contacto?: string;
  email?: string;
  observaciones?: string;
  dias_financiamiento?: number;
  sucursal_origen?: number;
  n_cuenta?: string;
  surte_tienda?: boolean;
}

interface CatalogoItem {
  id: number | string;
  descripcion: string;
}

const initialFormState = {
  cve_prov: '',
  nombre: '',
  nombre_fiscal: '',
  rfc: '',
  curp: '',
  domicilio: '',
  colonia: '',
  telefono: '',
  fax: '',
  ciudad: '',
  cp: '',
  estado: '',
  contacto: '',
  email: '',
  observaciones: '',
  dias_financiamiento: 0,
  sucursal_origen: '' as string | number,
  n_cuenta: '',
  surte_tienda: false
};

export default function CatProveedores() {
  const { consumoApi } = useConsumoApi();

  // --- ESTADOS ---
  const [rows, setRows] = useState<ProveedorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0); 
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,      
    pageSize: 10 
  });

  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [tabValue, setTabValue] = useState(0);

  // Catálogos
  const [sucursales, setSucursales] = useState<CatalogoItem[]>([]);
  
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- 1. CARGAS DE DATOS ---
  const fetchSucursales = async () => {
    try {
      const response = await consumoApi.get('/api/CatProveedores/sp_bw_cat_clientes_suc');
      setSucursales(response.data);
    } catch (error) {
      console.error("Error cargando sucursales", error);
    }
  };

  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const pageToSend = paginationModel.page + 1; 
      const response = await consumoApi.get('/api/CatProveedores/sp_bw_cat_proveedores_sel', {
        params: {
            page: pageToSend,
            pageSize: paginationModel.pageSize,
            busqueda: searchTerm 
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
    } catch (error: any) {
      console.error("Error:", error);
      if (error.code === 'ECONNABORTED') {
         setMessage({ text: 'El servidor tardó demasiado en responder', type: 'error' });
      } else {
         setMessage({ text: 'Error al cargar proveedores', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    if (paginationModel.page === 0) fetchProveedores();
  };

  useEffect(() => { fetchProveedores(); }, [paginationModel]); 
  useEffect(() => { fetchSucursales(); }, []);

  // --- 2. LÓGICA FORMULARIO ---
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

  const handleOpenEdit = (row: ProveedorRow) => {
    setFormData({
      cve_prov: row.id,
      nombre: row.nombre || '',
      nombre_fiscal: row.nombre_fiscal || '',
      rfc: row.rfc || '',
      curp: row.curp || '',
      domicilio: row.domicilio || '',
      colonia: row.colonia || '',
      telefono: row.telefono || '',
      fax: row.fax || '',
      ciudad: row.ciudad || '',
      cp: row.cp || '',
      estado: row.estado || '',
      contacto: row.contacto || '',
      email: row.email || '',
      observaciones: row.observaciones || '',
      dias_financiamiento: row.dias_financiamiento || 0,
      sucursal_origen: row.sucursal_origen || '',
      n_cuenta: row.n_cuenta || '',
      surte_tienda: row.surte_tienda || false
    });
    setIsEditing(true);
    setTabValue(0);
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (!formData.cve_prov || !formData.nombre) {
        setMessage({ text: 'Clave y Nombre son obligatorios', type: 'error' });
        return;
    }
    
    const paramsToSend = {
        ...formData,
        dias_financiamiento: Number(formData.dias_financiamiento),
        sucursal_origen: Number(formData.sucursal_origen)
    };

    try {
      if (isEditing) {
        await consumoApi.put('/api/CatProveedores/sp_bw_cat_proveedores_upd', null, { params: paramsToSend });
        setMessage({ text: 'Actualizado correctamente', type: 'success' });
      } else {
        await consumoApi.post('/api/CatProveedores/sp_bw_cat_proveedores_add', null, { params: paramsToSend });
        setMessage({ text: 'Creado correctamente', type: 'success' });
      }
      setOpenModal(false);
      fetchProveedores(); 
    } catch (error: any) {
        const errorMsg = error.response?.data?.mensaje || 'Error al guardar';
        setMessage({ text: errorMsg, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`¿Eliminar proveedor ${id}?`)) return;
    try {
      await consumoApi.delete('/api/CatProveedores/sp_bw_cat_proveedores_del', { params: { cve_prov: id } });
      setMessage({ text: 'Eliminado', type: 'success' });
      fetchProveedores();
    } catch (error: any) {
      const errorMsg = error.response?.data?.mensaje || 'Error al eliminar';
      setMessage({ text: errorMsg, type: 'error' });
    }
  };

  // --- COLUMNAS DEL GRID ---
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
    { field: 'id', headerName: 'Clave', width: 120 },
    { field: 'nombre', headerName: 'Nombre Proveedor', flex: 1, minWidth: 200 },
    { field: 'nombre_fiscal', headerName: 'Nombre Fiscal', flex: 1, minWidth: 200 },
    { field: 'rfc', headerName: 'RFC', width: 130 },
    { field: 'telefono', headerName: 'Teléfono', width: 130 },
    { field: 'ciudad', headerName: 'Ciudad', width: 130 },
  ];

  return (
    <Box sx={{ p: 0, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            width: 40, height: 40, backgroundColor: '#333333', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 4px 8px rgba(51, 51, 51, 0.3)', transition: 'all 0.3s ease'
          }}>📦</Box> 
          PROVEEDORES
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0, p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={handleOpenAdd} 
            sx={{ 
              backgroundColor: '#333333', color: 'white', borderRadius: '8px',
              fontWeight: 600, textTransform: 'none', padding: '10px 20px',
              boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', transition: 'all 0.3s ease',
              '&:hover': { backgroundColor: '#555555', boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', transform: 'translateY(-1px)' }
            }}
          >
            CREAR PROVEEDOR
          </Button>
          <Button 
            variant="outlined" 
            onClick={fetchProveedores}
            sx={{ 
              borderRadius: '8px', borderColor: '#e0e0e0', borderWidth: '1.5px', color: '#666',
              transition: 'all 0.3s ease', '&:hover': { borderColor: '#999', color: '#333', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
            }}
          >
            <RefreshIcon />
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            {...commonProps} 
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ ...commonProps.sx, minWidth: 200 }}
          />
          <Button 
            variant="outlined" 
            onClick={handleSearch} 
            sx={{ 
              minWidth: 'auto', px: 2, height: '50px', 
              borderRadius: '8px', borderColor: '#e0e0e0', borderWidth: '1.5px', color: '#666',
              transition: 'all 0.3s ease', '&:hover': { borderColor: '#999', color: '#333', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
            }}
          >
            <SearchIcon />
          </Button>
        </Box>
      </Box>

      <Box sx={{ 
        height: 'auto', width: '100vw', marginLeft: '-24px', 
        bgcolor: 'white', borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minHeight: 400, transition: 'all 0.3s ease'
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

      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        maxWidth="lg" 
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
        <Box sx={{ 
          background: 'linear-gradient(135deg, #333333 0%, #555555 100%)',
          color: 'white',
          p: 3,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              {isEditing ? `Editar Proveedor: ${formData.cve_prov}` : 'Nuevo Proveedor'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Complete la información del proveedor en los campos correspondientes
            </Typography>
          </Box>
          <Box sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            zIndex: 1
          }} />
        </Box>
        
        {/* --- PESTAÑAS (TABS) --- */}
        <Box sx={{ 
          backgroundColor: '#f8f9fa',
          borderBottom: '2px solid #e0e0e0',
          px: 3,
          py: 1
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="tabs proveedor"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                minHeight: 48,
                color: '#666',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#333',
                  backgroundColor: 'rgba(51, 51, 51, 0.04)'
                },
                '&.Mui-selected': {
                  color: '#333',
                  backgroundColor: 'rgba(51, 51, 51, 0.08)'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#333333',
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab 
              label="Información General" 
              sx={{ fontWeight: 600 }} 
            />
            <Tab 
              label="Contacto y Dirección" 
              sx={{ fontWeight: 600 }} 
            />
          </Tabs>
        </Box>

        <DialogContent sx={{ 
          p: 3, 
          backgroundColor: '#ffffff',
          minHeight: 400,
          '& .MuiDialogContent-dividers': {
            borderColor: '#e0e0e0'
          }
        }}>
          
          {/* --- PESTAÑA 1: INFORMACIÓN GENERAL --- */}
          {tabValue === 0 && (
            <Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              {/* Sección: Identificación */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 600, 
                  color: '#333', 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Box sx={{ 
                    width: 4, 
                    height: 20, 
                    backgroundColor: '#333333', 
                    borderRadius: 2 
                  }} />
                  Identificación del Proveedor
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      {...commonProps} 
                      label='Clave Proveedor' 
                      name="cve_prov" 
                      value={formData.cve_prov} 
                      onChange={handleInputChange} 
                      disabled={isEditing}
                      sx={{
                        ...commonProps.sx,
                        '& .MuiOutlinedInput-root.Mui-disabled': {
                          backgroundColor: '#f5f5f5',
                          '& .MuiInputBase-input': {
                            color: '#666'
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField 
                      {...commonProps} 
                      label='Nombre Comercial' 
                      name="nombre" 
                      value={formData.nombre} 
                      onChange={handleInputChange} 
                      required
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Sección: Información Fiscal */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 600, 
                  color: '#333', 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Box sx={{ 
                    width: 4, 
                    height: 20, 
                    backgroundColor: '#333333', 
                    borderRadius: 2 
                  }} />
                  Información Fiscal
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={8}>
                    <TextField 
                      {...commonProps} 
                      label='Nombre Fiscal' 
                      name="nombre_fiscal" 
                      value={formData.nombre_fiscal} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      {...commonProps} 
                      label='RFC' 
                      name="rfc" 
                      value={formData.rfc} 
                      onChange={handleInputChange}
                      sx={{
                        ...commonProps.sx,
                        '& .MuiInputBase-input': {
                          textTransform: 'uppercase'
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      {...commonProps} 
                      label='CURP' 
                      name="curp" 
                      value={formData.curp} 
                      onChange={handleInputChange}
                      sx={{
                        ...commonProps.sx,
                        '& .MuiInputBase-input': {
                          textTransform: 'uppercase'
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Sección: Configuración */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 600, 
                  color: '#333', 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Box sx={{ 
                    width: 4, 
                    height: 20, 
                    backgroundColor: '#333333', 
                    borderRadius: 2 
                  }} />
                  Configuración y Operación
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      {...selectProps} 
                      select 
                      label="Sucursal Origen" 
                      name="sucursal_origen" 
                      value={formData.sucursal_origen} 
                      onChange={handleInputChange}
                    >
                      {sucursales.map((suc) => (
                        <MenuItem key={suc.id} value={suc.id}>
                          {suc.descripcion}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField 
                      {...commonProps} 
                      label='Días Financiamiento' 
                      name="dias_financiamiento" 
                      type="number" 
                      value={formData.dias_financiamiento} 
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField 
                      {...commonProps} 
                      label='Cuenta Contable' 
                      name="n_cuenta" 
                      value={formData.n_cuenta} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{
                      p: 2,
                      border: '1.5px solid #e0e0e0',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#999',
                        backgroundColor: '#f5f5f5'
                      }
                    }}>
                      <Checkbox 
                        checked={formData.surte_tienda} 
                        onChange={handleInputChange} 
                        name="surte_tienda"
                        sx={{
                          color: '#333',
                          '&.Mui-checked': {
                            color: '#333'
                          }
                        }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                          Surte a Tienda
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Habilitar para surtir directamente a tiendas
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Sección: Observaciones */}
              <Box>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 600, 
                  color: '#333', 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Box sx={{ 
                    width: 4, 
                    height: 20, 
                    backgroundColor: '#333333', 
                    borderRadius: 2 
                  }} />
                  Observaciones
                </Typography>
                <TextField 
                  {...commonProps} 
                  label='Notas y Observaciones' 
                  name="observaciones" 
                  value={formData.observaciones} 
                  onChange={handleInputChange} 
                  multiline 
                  rows={3}
                  sx={{
                    ...commonProps.sx,
                    '& .MuiInputBase-root': { 
                      height: 'auto', 
                      minHeight: '100px',
                      alignItems: 'flex-start'
                    }
                  }}
                />
              </Box>
            </Box>
          )}

          {/* --- PESTAÑA 2: CONTACTO Y DIRECCIÓN --- */}
          {tabValue === 1 && (
            <Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              {/* Sección: Contacto */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 600, 
                  color: '#333', 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Box sx={{ 
                    width: 4, 
                    height: 20, 
                    backgroundColor: '#333333', 
                    borderRadius: 2 
                  }} />
                  Información de Contacto
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      {...commonProps} 
                      label='Nombre de Contacto' 
                      name="contacto" 
                      value={formData.contacto} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      {...commonProps} 
                      label='Email' 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange}
                      type="email"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      {...commonProps} 
                      label='Teléfono' 
                      name="telefono" 
                      value={formData.telefono} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      {...commonProps} 
                      label='Fax' 
                      name="fax" 
                      value={formData.fax} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Sección: Dirección */}
              <Box>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 600, 
                  color: '#333', 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Box sx={{ 
                    width: 4, 
                    height: 20, 
                    backgroundColor: '#333333', 
                    borderRadius: 2 
                  }} />
                  Dirección Fiscal
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField 
                      {...commonProps} 
                      label='Domicilio (Calle y Número)' 
                      name="domicilio" 
                      value={formData.domicilio} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField 
                      {...commonProps} 
                      label='C.P.' 
                      name="cp" 
                      value={formData.cp} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField 
                      {...commonProps} 
                      label='Colonia' 
                      name="colonia" 
                      value={formData.colonia} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      {...commonProps} 
                      label='Ciudad' 
                      name="ciudad" 
                      value={formData.ciudad} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      {...commonProps} 
                      label='Estado' 
                      name="estado" 
                      value={formData.estado} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3 }}>
          <Button 
            onClick={() => setOpenModal(false)} 
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 500, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#f5f5f5', color: '#333' } }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            sx={{
              borderRadius: '8px', fontWeight: 600, textTransform: 'none',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)', transition: 'all 0.3s ease',
              '&:hover': { boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)', transform: 'translateY(-1px)' }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type} onClose={() => setMessage(null)} sx={{ width: '100%' }}>{message?.text}</Alert>
      </Snackbar>
    </Box>
  );
}