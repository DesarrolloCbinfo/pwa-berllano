"use client";
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
  Box, Typography, Button, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, 
  Snackbar, Alert, MenuItem, FormControlLabel, Checkbox, 
  Tabs, Tab, Autocomplete, Paper
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
import { useSessionContext } from '../../../context/SessionProvider';


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
  const { session } = useSessionContext();
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
  // --- ESTADO PARA EL MODAL DE ACUERDOS ---
  const [openListaAcuerdos, setOpenListaAcuerdos] = useState(false);
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    
    // Validación específica para días_financiamiento
    if (name === 'dias_financiamiento') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue < 0) {
        newValue = '0'; // Forzar a 0 si es negativo
      } else if (value === '' || value === '-') {
        newValue = '0'; // Evitar valores vacíos o negativos
      }
    }
    
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
        Swal.fire({
            title: 'Atención',
            text: 'Clave y Nombre son obligatorios',
            icon: 'warning',
            confirmButtonColor: '#333333'
        });
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
        Swal.fire({
            title: '¡Éxito!',
            text: 'Proveedor actualizado correctamente',
            icon: 'success',
            confirmButtonColor: '#333333'
        });
        setMessage({ text: 'Actualizado correctamente', type: 'success' });
      } else {
        await consumoApi.post('/api/CatProveedores/sp_bw_cat_proveedores_add', null, { params: paramsToSend });
        Swal.fire({
            title: '¡Éxito!',
            text: 'Proveedor creado correctamente',
            icon: 'success',
            confirmButtonColor: '#333333'
        });
        setMessage({ text: 'Creado correctamente', type: 'success' });
      }
      setOpenModal(false);
      fetchProveedores();
    } catch (error: any) {
        const errorMsg = error.response?.data?.mensaje || 'Error al guardar';
        Swal.fire({
            title: 'Error',
            text: errorMsg,
            icon: 'error',
            confirmButtonColor: '#333333'
        });
        setMessage({ text: errorMsg, type: 'error' });
    }
  };
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar Proveedor?',
      text: `¿Está seguro de eliminar el proveedor ${id}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#333333',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await consumoApi.delete('/api/CatProveedores/sp_bw_cat_proveedores_del', { params: { cve_prov: id } });
      Swal.fire({
        title: '¡Éxito!',
        text: 'Proveedor eliminado correctamente',
        icon: 'success',
        confirmButtonColor: '#333333'
      });
      setMessage({ text: 'Eliminado', type: 'success' });
      fetchProveedores();
    } catch (error: any) {
      const errorMsg = error.response?.data?.mensaje || 'Error al eliminar';
      Swal.fire({
        title: 'Error',
        text: errorMsg,
        icon: 'error',
        confirmButtonColor: '#333333'
      });
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
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
      
      {/* Forzamos a SweetAlert a saltar al frente de los modales */}
      <style>{`
        .swal2-container {
          z-index: 9999 !important;
        }
      `}</style>

      {/* PAPER 1: ENCABEZADO Y ACCIONES */}
      <Paper sx={{ p: 3, borderRadius: '8px', mb: 3 }}>
        
        {/* ENCABEZADO RECTANGULAR ELEGANTE */}
        <Box sx={{ border: '1px solid #000000ff', p: 1.5, mb: 2, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    CATÁLOGO DE PROVEEDORES
                </Typography>
                
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
               
            </Box>
        </Box>

        {/* BOTONES DE ACCIÓN Y BUSCADOR (Fuera del recuadro, dentro del Paper) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
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

          {/* BUSCADOR */}
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
                  borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.3s ease',
                  '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }
                }
              }}
            />
            <Button 
              variant="outlined" 
              onClick={handleSearch} 
              sx={{ 
                minWidth: 'auto', px: 2, borderRadius: '8px', borderColor: '#e0e0e0', borderWidth: '1.5px', color: '#666',
                transition: 'all 0.3s ease', '&:hover': { borderColor: '#999', color: '#333', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
              }}
            >
              <SearchIcon />
            </Button>
          </Box>
        </Box>
      </Paper>

{/* PAPER 2: TABLA PRINCIPAL Y FOOTER */}
      <Paper sx={{ p: 3, mt: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
        <Box sx={{ height: 600, width: '100%' }}>
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
                borderBottom: '1px solid #e0e0e000' 
              }
            }}
          />
        </Box>

      </Paper>
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
                      inputProps={{
                        min: 0,
                        step: 1,
                        onKeyPress: (e) => {
                          if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                            e.preventDefault();
                          }
                        }
                      }}
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
       <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, display: 'flex', justifyContent: 'space-between' }}>
          {/* LADO IZQUIERDO: Botón de Acuerdos (Solo visible si estamos editando) */}
          <Box>
            {isEditing && (
              <Button 
                variant="contained" 
                onClick={() => setOpenListaAcuerdos(true)} 
                sx={{ 
                  backgroundColor: '#000000ff', color: 'white', borderRadius: '8px',
                  fontWeight: 600, textTransform: 'none',
                  boxShadow: '0 2px 8px rgba(255, 255, 255, 0.4)', transition: 'all 0.3s ease',
                  '&:hover': { backgroundColor: '#636363ff', transform: 'translateY(-1px)' }
                }}
              >
                ACUERDOS CON PROVEEDOR
              </Button>
            )}
          </Box>
          {/* LADO DERECHO: Cancelar y Guardar */}
          <Box sx={{ display: 'flex', gap: 2 }}>
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
                boxShadow: '0 2px 8px rgba(255, 255, 255, 0.4)', transition: 'all 0.3s ease',
                '&:hover': { boxShadow: '0 4px 12px rgba(255, 255, 255, 0.4)', transform: 'translateY(-1px)' }
              }}
            >
              Guardar
            </Button>
          </Box>
        </DialogActions>
        {/* MODAL DE ACUERDOS (Se abre desde el botón interno) */}
      <ModalListaAcuerdos 
          open={openListaAcuerdos} 
          onClose={() => setOpenListaAcuerdos(false)} 
          proveedor={{ id: formData.cve_prov, nombre: formData.nombre }} 
          consumoApi={consumoApi} 
          setMessage={setMessage} 
      />
      </Dialog>
      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type} onClose={() => setMessage(null)} sx={{ width: '100%' }}>{message?.text}</Alert>
      </Snackbar>
    </Box>
  );
}
// =========================================================================================
// MODAL 1: LISTADO DE ACUERDOS DEL PROVEEDOR
// =========================================================================================
const ModalListaAcuerdos = ({ open, onClose, proveedor, consumoApi, setMessage }: any) => {
    const [acuerdos, setAcuerdos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [openCaptura, setOpenCaptura] = useState(false);
    const [acuerdoEdit, setAcuerdoEdit] = useState<any>(null);
    useEffect(() => {
        if (open && proveedor?.id) fetchAcuerdos();
    }, [open, proveedor]);
    const fetchAcuerdos = async () => {
        setLoading(true);
        try {
            const res = await consumoApi.get(`/api/CatProveedores/acuerdos_sel?cve_proveedor=${proveedor.id}`);
            setAcuerdos(res.data || []);
        } catch (error) {
            setMessage({ text: "Error al cargar los acuerdos", type: 'error' });
        } finally {
            setLoading(false);
        }
    };
    const handleDelete = async (id_acuerdo: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar Acuerdo?',
            text: '¿Seguro que desea eliminar este acuerdo y todas sus configuraciones? Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f',
            cancelButtonColor: '#333333',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        
        if (!result.isConfirmed) return;
        
        try {
            await consumoApi.delete(`/api/CatProveedores/acuerdos_del?id_acuerdo=${id_acuerdo}`);
            Swal.fire({
                title: '¡Éxito!',
                text: 'Acuerdo eliminado correctamente',
                icon: 'success',
                confirmButtonColor: '#333333'
            });
            setMessage({ text: "Acuerdo eliminado", type: 'success' });
            fetchAcuerdos();
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Error al eliminar acuerdo',
                icon: 'error',
                confirmButtonColor: '#333333'
            });
            setMessage({ text: "Error al eliminar", type: 'error' });
        }
    };
    const cols: GridColDef[] = [
        { field: 'acciones', headerName: 'Acciones', width: 100, sortable: false, filterable: false,
            renderCell: (params: GridRenderCellParams) => (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" color="primary" onClick={() => { setAcuerdoEdit(params.row); setOpenCaptura(true); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id_acuerdo)}><DeleteIcon fontSize="small" /></IconButton>
              </Box>
            ),
        },
        { field: 'id_acuerdo', headerName: 'ID', width: 70 },
        { field: 'descripcion', headerName: 'Descripción', flex: 1, minWidth: 200 },
        { field: 'fecha_inicio', headerName: 'F. Inicio', width: 110, valueFormatter: (v) => v ? String(v).split('T')[0] : '' },
        { field: 'fecha_final', headerName: 'F. Final', width: 110, valueFormatter: (v) => v ? String(v).split('T')[0] : '' },
        { field: 'porcent_desc', headerName: 'Descto (%)', width: 100, valueFormatter: (v) => v ? `${Math.round(Number(v) * 100)}%` : '0%' },
    ];
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <Box sx={{ p: 3, bgcolor: '#fdfdfd' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                        Acuerdos: <span style={{ color: '#000000ff' }}>{proveedor?.nombre}</span>
                    </Typography>
                    <Button variant="contained" onClick={() => { setAcuerdoEdit(null); setOpenCaptura(true); }} sx={{ bgcolor: '#333', color: 'white', fontWeight: 'bold' }}>
                        + NUEVO ACUERDO
                    </Button>
                </Box>
                <Box sx={{ height: 400, width: '100%', bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <DataGrid rows={acuerdos} columns={cols} getRowId={(row) => row.id_acuerdo} loading={loading} density="compact" disableRowSelectionOnClick />
                </Box>
                <Box sx={{ mt: 3, textAlign: 'right' }}>
                    <Button onClick={onClose} variant="outlined" sx={{ color: '#666', borderColor: '#ccc' }}>Cerrar Ventana</Button>
                </Box>
            </Box>
            <ModalCapturaAcuerdo 
                open={openCaptura} 
                onClose={() => { setOpenCaptura(false); fetchAcuerdos(); }} 
                acuerdoBase={acuerdoEdit}
                proveedor={proveedor}
                consumoApi={consumoApi}
                setMessage={setMessage}
            />
        </Dialog>
    );
};
// =========================================================================================
// MODAL 2: CAPTURA DETALLADA DEL ACUERDO
// =========================================================================================
const ModalCapturaAcuerdo = ({ open, onClose, acuerdoBase, proveedor, consumoApi, setMessage }: any) => {
    const hoy = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({
        id_acuerdo: 0, descripcion: '', fecha_inicio: hoy, fecha_final: hoy, 
        id_descuento: 1, porcent_desc: 0, area: '%', depto: '%', clase: '%', marca: '', familia: '', clave_prod: ''
    });
    
    // --- ESTADOS DE CATÁLOGOS ---
    const [areas, setAreas] = useState<any[]>([]);
    const [deptos, setDeptos] = useState<any[]>([]);
    const [clases, setClases] = useState<any[]>([]);
    const [marcas, setMarcas] = useState<any[]>([]);
    const [familiasFiltradas, setFamiliasFiltradas] = useState<any[]>([]);
    const [catBusquedaProd, setCatBusquedaProd] = useState<any[]>([]);
    const [descuentos, setDescuentos] = useState<any[]>([]);
    const [catSucursales, setCatSucursales] = useState<any[]>([]);

    // --- ESTADOS PARA TABLAS HIJAS ---
    const [excluidos, setExcluidos] = useState<any[]>([]);
    const [sucursalesSel, setSucursalesSel] = useState<any[]>([]);
    const [aplicaTodasSuc, setAplicaTodasSuc] = useState(true);

    // --- ESTADOS PARA AUTOCOMPLETES DE PRODUCTOS ---
    const [prodEspecifico, setProdEspecifico] = useState<any>(null);
    const [busqClaveProd, setBusqClaveProd] = useState("");
    const [busqDescProd, setBusqDescProd] = useState("");

    const [itemExcluido, setItemExcluido] = useState<any>(null);
    const [busqClaveEx, setBusqClaveEx] = useState("");
    const [busqDescEx, setBusqDescEx] = useState("");

    useEffect(() => {
        if (open) {
            inicializarDatos();
        }
    }, [open, acuerdoBase]);

    const inicializarDatos = async () => {
        try {
            // 1. Carga de catálogos base
            const [resA, resM, resP, resDesc, resSuc] = await Promise.all([
                consumoApi.get('/api/CatProductosC/sp_bw_cat_combo_areas'),
                consumoApi.get('/api/CatProveedores/marcas_sel'), // <--- API NUEVA
                consumoApi.get('/api/CatProductosC/sp_bw_cat_producto_busqueda_autocomplete?sucursal=1'),
                consumoApi.get('/api/CatProveedores/descuentos_sel'),
                consumoApi.get('/api/CatProveedores/sp_bw_cat_clientes_suc')
            ]);

            setAreas([{ id: '%', descripcion: 'TODAS' }, ...resA.data]);
            setMarcas(resM.data || []);
            setCatBusquedaProd(resP.data || []);
            setDescuentos(resDesc.data || []);
            setCatSucursales(resSuc.data || []);

            // 2. Llenado si es Edición
            if (acuerdoBase) {
                setForm({
                    ...acuerdoBase,
                    area: acuerdoBase.area || '%',
                    depto: acuerdoBase.depto || '%',
                    clase: acuerdoBase.clase || '%',
                    fecha_inicio: acuerdoBase.fecha_inicio ? String(acuerdoBase.fecha_inicio).split('T')[0] : hoy,
                    fecha_final: acuerdoBase.fecha_final ? String(acuerdoBase.fecha_final).split('T')[0] : hoy,
                });
                
                if (acuerdoBase.area) cargarDeptos(acuerdoBase.area);
                if (acuerdoBase.depto) cargarClases(acuerdoBase.area, acuerdoBase.depto);
                
                // Cargar familias si tiene marca
                if (acuerdoBase.marca) {
                    const marcaObj = resM.data.find((m:any) => m.descripcion === acuerdoBase.marca);
                    if (marcaObj) cargarFamilias(marcaObj.id);
                }

                if (acuerdoBase.clave_prod) {
                    const prod = resP.data.find((p:any) => p.clave === acuerdoBase.clave_prod);
                    if (prod) {
                        setProdEspecifico(prod);
                        setBusqClaveProd(prod.clave);
                        setBusqDescProd(prod.descripcion1);
                    }
                }
                cargarDetallesHijos(acuerdoBase.id_acuerdo, resSuc.data || []);
            } else {
                setForm({ id_acuerdo: 0, descripcion: '', fecha_inicio: hoy, fecha_final: hoy, id_descuento: 1, porcent_desc: 0, area: '%', depto: '%', clase: '%', marca: '', familia: '', clave_prod: '' });
                setExcluidos([]); setSucursalesSel([]); setAplicaTodasSuc(true);
                setProdEspecifico(null); setBusqClaveProd(""); setBusqDescProd("");
                setItemExcluido(null); setBusqClaveEx(""); setBusqDescEx("");
            }
        } catch (error) { console.error("Error catálogos", error); }
    };

    const cargarDeptos = async (idArea: string) => {
        const res = await consumoApi.get(`/api/CatProductosC/sp_bw_cat_combo_deptos?area=${idArea}`);
        setDeptos([{ id: '%', descripcion: 'TODOS' }, ...res.data]);
    };

    const cargarClases = async (idArea: string, idDepto: string) => {
        const res = await consumoApi.get(`/api/CatProductosC/sp_bw_cat_combo_clases?area=${idArea}&depto=${idDepto}`);
        setClases([{ id: '%', descripcion: 'TODAS' }, ...res.data]);
    };

    const cargarFamilias = async (idMarca: number) => {
        try {
            const res = await consumoApi.get(`/api/CatProveedores/familias_sel?id_marca=${idMarca}`);
            setFamiliasFiltradas(res.data || []);
        } catch (error) { console.error("Error al cargar familias", error); }
    };

    const cargarDetallesHijos = async (id: number, catalogoSucursales: any[]) => {
        try {
            const [resEx, resSuc] = await Promise.all([
                consumoApi.get(`/api/CatProveedores/acuerdos_excluidos_sel?id_acuerdo=${id}`),
                consumoApi.get(`/api/CatProveedores/acuerdos_suc_sel?id_acuerdo=${id}`)
            ]);
            setExcluidos(resEx.data || []);

            const sucsGuardadas = resSuc.data || [];
            if (sucsGuardadas.length === 0 || sucsGuardadas.some((s:any) => s.suc_aplica === null)) {
                setAplicaTodasSuc(true);
                setSucursalesSel([]);
            } else {
                setAplicaTodasSuc(false);
                const seleccionadas = catalogoSucursales.filter(cat => sucsGuardadas.some((sg:any) => sg.suc_aplica === cat.id));
                setSucursalesSel(seleccionadas);
            }
        } catch (e) {}
    };

    const handleFormChange = (e: any) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        if (name === 'area') {
            setForm(prev => ({ ...prev, depto: '%', clase: '%' }));
            cargarDeptos(value);
        } else if (name === 'depto') {
            setForm(prev => ({ ...prev, clase: '%' }));
            cargarClases(form.area, value);
        } else if (name === 'marca') {
            setForm(prev => ({ ...prev, familia: '' }));
            const marcaObj = marcas.find(m => m.descripcion === value);
            if (marcaObj) {
                cargarFamilias(marcaObj.id); // <--- Llama a la API de Familias
            } else {
                setFamiliasFiltradas([]);
            }
        }
    };

    const handleSave = async () => {
        if (!form.descripcion.trim()) {
            setMessage({ text: "La descripción del acuerdo es obligatoria.", type: 'error' });
            return;
        }

        try {
            const payload = { ...form, cve_proveedor: proveedor.id };
            const url = form.id_acuerdo === 0 ? '/api/CatProveedores/acuerdos_ins' : '/api/CatProveedores/acuerdos_upd';
            const method = form.id_acuerdo === 0 ? 'post' : 'put';
            
            const res = await consumoApi[method](url, payload);
            if(res.status === 200) {
                const idAcuerdoActual = form.id_acuerdo === 0 ? res.data.id_acuerdo : form.id_acuerdo;
                const sucursalesIds = aplicaTodasSuc ? [] : sucursalesSel.map(s => s.id);
                await consumoApi.post(`/api/CatProveedores/acuerdos_suc_save?id_acuerdo=${idAcuerdoActual}`, sucursalesIds);

                setMessage({ text: "✅ Acuerdo guardado con éxito", type: 'success' });
                
                if (form.id_acuerdo === 0 && idAcuerdoActual) {
                    setForm(prev => ({ ...prev, id_acuerdo: idAcuerdoActual }));
                } else {
                    onClose();
                }
            }
        } catch (error) {
            setMessage({ text: "Error al guardar el acuerdo", type: 'error' });
        }
    };

    const handleAgregarExcluido = async () => {
        if (!itemExcluido) return;
        if (form.id_acuerdo === 0) {
            alert("Debe guardar el acuerdo principal (Botón 'Guardar Acuerdo') antes de agregar excepciones.");
            return;
        }
        if (excluidos.some(e => e.clave_prod === itemExcluido.clave)) {
            alert("Este producto ya está excluido."); return;
        }

        try {
            const res = await consumoApi.post(`/api/CatProveedores/acuerdos_excluidos_ins?id_acuerdo=${form.id_acuerdo}&clave_prod=${itemExcluido.clave}`);
            if (res.status === 200) {
                const resEx = await consumoApi.get(`/api/CatProveedores/acuerdos_excluidos_sel?id_acuerdo=${form.id_acuerdo}`);
                setExcluidos(resEx.data || []);
                setItemExcluido(null); setBusqClaveEx(""); setBusqDescEx("");
            }
        } catch (error: any) {
            setMessage({ text: error.response?.data?.mensaje || "Error al excluir", type: 'error' });
        }
    };

    const handleBorrarExcluido = async (id_registro: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar Excepción?',
            text: '¿Está seguro de eliminar esta excepción del acuerdo?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f',
            cancelButtonColor: '#333333',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        
        if (!result.isConfirmed) return;
        
        try {
            await consumoApi.delete(`/api/CatProveedores/acuerdos_excluidos_del?id=${id_registro}`);
            const resEx = await consumoApi.get(`/api/CatProveedores/acuerdos_excluidos_sel?id_acuerdo=${form.id_acuerdo}`);
            setExcluidos(resEx.data || []);
            Swal.fire({
                title: '¡Éxito!',
                text: 'Excepción eliminada correctamente',
                icon: 'success',
                confirmButtonColor: '#333333'
            });
        } catch (e) { 
            Swal.fire({
                title: 'Error',
                text: 'Error al eliminar excepción',
                icon: 'error',
                confirmButtonColor: '#333333'
            });
            setMessage({ text: "Error al eliminar excepción", type: 'error' }); 
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <Box sx={{ p: 3, bgcolor: '#fdfdfd' }}>
                <Box sx={{ bgcolor: '#333', color: 'white', p: 2, borderRadius: 2, mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">Captura de Acuerdo: {proveedor?.nombre}</Typography>
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <TextField fullWidth size="small" variant="outlined" label="Descripción del Acuerdo" name="descripcion" value={form.descripcion} onChange={handleFormChange} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <TextField fullWidth size="small" variant="outlined" type="date" label="Vigencia Del" name="fecha_inicio" value={form.fecha_inicio} onChange={handleFormChange} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <TextField fullWidth size="small" variant="outlined" type="date" label="Al" name="fecha_final" value={form.fecha_final} onChange={handleFormChange} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                        <TextField select fullWidth size="small" variant="outlined" label="Descto. Acuerdo" name="id_descuento" value={form.id_descuento} onChange={handleFormChange}>
                            {descuentos.map(d => <MenuItem key={d.id} value={d.id}>{d.descripcion}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField fullWidth size="small" variant="outlined" type="number" label="% Descuento" name="porcent_desc" value={form.porcent_desc} onChange={handleFormChange} />
                    </Grid>
                </Grid>

                <Typography variant="subtitle2" sx={{ bgcolor: '#eee', p: 1, mb: 2, fontWeight: 'bold' }}>
                    APLICAR DESCUENTO SOBRE: (Deje en % o vacío para omitir)
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={4}>
                        <TextField select fullWidth size="small" variant="outlined" label="Área" name="area" value={form.area} onChange={handleFormChange}>
                            {areas.map(a => <MenuItem key={a.id} value={a.id}>{a.descripcion}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField select fullWidth size="small" variant="outlined" label="Depto" name="depto" value={form.depto} onChange={handleFormChange} disabled={!form.area || form.area === '%'}>
                            {deptos.map(d => <MenuItem key={d.id} value={d.id}>{d.descripcion}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField select fullWidth size="small" variant="outlined" label="Clase" name="clase" value={form.clase} onChange={handleFormChange} disabled={!form.depto || form.depto === '%'}>
                            {clases.map(c => <MenuItem key={c.id} value={c.id}>{c.descripcion}</MenuItem>)}
                        </TextField>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                        <TextField select fullWidth size="small" variant="outlined" label="Marca" name="marca" value={form.marca} onChange={handleFormChange}>
                            <MenuItem value="">TODAS</MenuItem>
                            {marcas.map(m => <MenuItem key={m.id} value={m.descripcion}>{m.descripcion}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField select fullWidth size="small" variant="outlined" label="Familia" name="familia" value={form.familia} onChange={handleFormChange} disabled={!form.marca}>
                            <MenuItem value="">TODAS</MenuItem>
                            {familiasFiltradas.map(f => <MenuItem key={f.id} value={f.id}>{f.descripcion}</MenuItem>)}
                        </TextField>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Autocomplete
                                sx={{ width: '130px' }}
                                options={catBusquedaProd}
                                getOptionLabel={(option) => option?.clave ? String(option.clave) : ""}
                                inputValue={busqClaveProd}
                                onInputChange={(e, val) => setBusqClaveProd(val || "")}
                                value={prodEspecifico}
                                onChange={(e, newValue) => {
                                    setProdEspecifico(newValue);
                                    setForm(prev => ({ ...prev, clave_prod: newValue?.clave || '' }));
                                    setBusqClaveProd(newValue?.clave ? String(newValue.clave) : "");
                                    setBusqDescProd(newValue?.descripcion1 || "");
                                }}
                                renderInput={(params) => <TextField {...params} label="Clave" size="small" variant="outlined" />}
                            />
                            <Autocomplete
                                sx={{ flex: 1 }}
                                options={catBusquedaProd}
                                getOptionLabel={(option) => option?.descripcion1 || ""}
                                inputValue={busqDescProd}
                                onInputChange={(e, val) => setBusqDescProd(val || "")}
                                value={prodEspecifico}
                                onChange={(e, newValue) => {
                                    setProdEspecifico(newValue);
                                    setForm(prev => ({ ...prev, clave_prod: newValue?.clave || '' }));
                                    setBusqDescProd(newValue?.descripcion1 || "");
                                    setBusqClaveProd(newValue?.clave ? String(newValue.clave) : "");
                                }}
                                renderInput={(params) => <TextField {...params} label="Producto Específico" size="small" variant="outlined" />}
                            />
                        </Box>
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    {/* PANEL IZQUIERDO: SUCURSALES */}
                    <Grid item xs={12} md={5}>
                        <Box sx={{ border: '1px solid #ccc', p: 2, borderRadius: 2, height: '100%', bgcolor: '#fcfcfc' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography fontWeight="bold">Aplica en las Sucursales:</Typography>
                                <FormControlLabel 
                                    control={
                                        <Checkbox 
                                            checked={aplicaTodasSuc} 
                                            onChange={(e) => {
                                                setAplicaTodasSuc(e.target.checked);
                                                if(e.target.checked) setSucursalesSel([]);
                                            }} 
                                            sx={{ color: '#d32f2f', '&.Mui-checked': { color: '#d32f2f' } }}
                                        />
                                    } 
                                    label={<Typography variant="body2" fontWeight="bold">TODAS</Typography>} 
                                />
                            </Box>
                            
                            <Autocomplete
                                multiple
                                disabled={aplicaTodasSuc}
                                options={catSucursales}
                                getOptionLabel={(option) => option.descripcion || ""}
                                value={sucursalesSel}
                                onChange={(e, newValue) => setSucursalesSel(newValue)}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => (
                                    <TextField {...params} variant="outlined" size="small" label={aplicaTodasSuc ? "Deshabilite 'TODAS' para seleccionar" : "Seleccione sucursales..."} />
                                )}
                                sx={{ bgcolor: aplicaTodasSuc ? '#eee' : 'white', mb: 1 }}
                            />
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                {aplicaTodasSuc ? "El acuerdo aplicará para cualquier sucursal automáticamente." : "El acuerdo solo aplicará en las sucursales seleccionadas."}
                            </Typography>
                        </Box>
                    </Grid>

                    {/* PANEL DERECHO: EXCLUIDOS */}
                    <Grid item xs={12} md={7}>
                        <Box sx={{ border: '1px solid #ccc', p: 2, borderRadius: 2, height: '100%' }}>
                            <Typography fontWeight="bold" sx={{ mb: 1 }}>Productos Excluidos del Acuerdo:</Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                                <Autocomplete
                                    sx={{ width: '130px' }}
                                    options={catBusquedaProd}
                                    getOptionLabel={(option) => option?.clave ? String(option.clave) : ""}
                                    inputValue={busqClaveEx}
                                    onInputChange={(e, val) => setBusqClaveEx(val || "")}
                                    value={itemExcluido}
                                    onChange={(e, newValue) => {
                                        setItemExcluido(newValue);
                                        setBusqClaveEx(newValue?.clave ? String(newValue.clave) : "");
                                        setBusqDescEx(newValue?.descripcion1 || "");
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Clave" size="small" variant="outlined" />}
                                />
                                <Autocomplete
                                    sx={{ flex: 1 }}
                                    options={catBusquedaProd}
                                    getOptionLabel={(option) => option?.descripcion1 || ""}
                                    inputValue={busqDescEx}
                                    onInputChange={(e, val) => setBusqDescEx(val || "")}
                                    value={itemExcluido}
                                    onChange={(e, newValue) => {
                                        setItemExcluido(newValue);
                                        setBusqDescEx(newValue?.descripcion1 || "");
                                        setBusqClaveEx(newValue?.clave ? String(newValue.clave) : "");
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Descripción del producto" size="small" variant="outlined" />}
                                />
                                <Button variant="contained" color="primary" onClick={handleAgregarExcluido} sx={{ minWidth: '45px', height: '40px' }}>
                                    {"+"}
                                </Button>
                            </Box>

                            <DataGrid 
                                rows={excluidos} 
                                columns={[
                                    { field: 'clave_prod', headerName: 'Clave', width: 100 }, 
                                    { field: 'descripcion', headerName: 'Descripción', flex: 1 },
                                    { field: 'acc', headerName: '', width: 50, sortable: false, filterable: false, 
                                      renderCell: (p) => <IconButton size="small" color="error" onClick={() => handleBorrarExcluido(p.row.id)}><DeleteIcon fontSize="small" /></IconButton> 
                                    }
                                ]} 
                                getRowId={(row) => row.id} 
                                density="compact"
                                disableRowSelectionOnClick
                                sx={{ height: 200, bgcolor: 'white' }}
                            />
                        </Box>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color={form.id_acuerdo === 0 ? "error" : "textSecondary"}>
                        {form.id_acuerdo === 0 ? "* Guarde el acuerdo primero para habilitar exclusiones." : `Acuerdo ID: ${form.id_acuerdo}`}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button onClick={onClose} variant="outlined" color="inherit">Cancelar</Button>
                        <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#000000ff', color: 'white' }}>
                            Guardar Acuerdo
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
};

