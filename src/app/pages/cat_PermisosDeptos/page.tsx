'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Grid,
  Snackbar,
  Alert,
  Paper,
  Dialog,
  DialogContent, 
  DialogActions,
  Divider,
  Checkbox
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { useSessionContext } from '../../../context/SessionProvider';

// --- INTERFACES ---
interface PerfilRow {
  clave_perfil: number;
  descripcion_perfil: string;
}

interface AccesoRow {
  perfil: number;
  area: string;
  area_descrip: string;
  depto: string;
  depto_descrip: string;
  permiso: boolean;
}

interface PerfilForm {
  clave_perfil?: number;
  descripcion_perfil: string;
}

interface AccesoForm {
  perfil: number;
  area: string;
  area_descrip: string;
  depto: string;
  depto_descrip: string;
  permiso: boolean;
}

// --- ESTILOS COMUNES ---
const commonProps = {
  fullWidth: true,
  size: "small" as const,
  variant: "outlined" as const,
  SelectProps: {
    native: true
  },
  sx: {
    '& .MuiInputBase-root': {
      height: '45px',
    },
  }
};

const modalSectionStyle = {
  mb: 3,
  p: 2,
  bgcolor: '#fafafa',
  borderRadius: '8px',
  border: '1px solid #e0e0e0'
};

// --- COMPONENTE PRINCIPAL ---
export default function CatPermisosDeptos() {
  const consumoApi = useConsumoApi();
  const { session } = useSessionContext();
  
  // --- ESTADOS PRINCIPALES ---
  const [perfiles, setPerfiles] = useState<PerfilRow[]>([]);
  const [accesos, setAccesos] = useState<AccesoRow[]>([]);
  const [loading, setLoading] = useState(false);
  
  // --- ESTADOS DE MODALES ---
  const [openPerfilModal, setOpenPerfilModal] = useState(false);
  const [openAccesoModal, setOpenAccesoModal] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // --- ESTADOS DEL FORMULARIO ---
  const [perfilForm, setPerfilForm] = useState<PerfilForm>({
    descripcion_perfil: ''
  });
  
  const [accesoForm, setAccesoForm] = useState<AccesoForm>({
    perfil: 0,
    area: '',
    area_descrip: '',
    depto: '',
    depto_descrip: '',
    permiso: false
  });
  
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<PerfilRow | null>(null);
  const [deptos, setDeptos] = useState<{ depto: string; descripcion: string }[]>([]);
  const [areas, setAreas] = useState<{ area: string; descripcion: string }[]>([]);

  // --- FUNCIONES DE API ---
  const fetchPerfiles = async () => {
    setLoading(true);
    try {
      const res = await consumoApi.consumoApi.get('/api/CatPermisosDeptos/sp_bw_cat_perfiles_sel');
      if (res.status === 200) {
        setPerfiles(res.data || []);
      }
    } catch (error: any) {
      setMessage({ text: "Error al cargar perfiles", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccesos = async (perfil: number) => {
    setLoading(true);
    try {
      const res = await consumoApi.consumoApi.get('/api/CatPermisosDeptos/sp_bw_cat_permisos_deptos_sel', {
        params: { perfil }
      });
      if (res.status === 200) {
        setAccesos(res.data || []);
      }
    } catch (error: any) {
      setMessage({ text: "Error al cargar accesos", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeptos = async (area: string) => {
    try {
      const res = await consumoApi.consumoApi.get('/api/CatPermisosDeptos/sp_bw_cat_deptos_sel', {
        params: { area }
      });
      if (res.status === 200) {
        setDeptos(res.data || []);
      }
    } catch (error: any) {
      console.error("Error al cargar departamentos:", error);
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await consumoApi.consumoApi.get('/api/CatPermisosDeptos/sp_bw_cat_areas_sel', {
        params: { area: 0 }
      });
      if (res.status === 200) {
        setAreas(res.data || []);
      }
    } catch (error: any) {
      console.error("Error al cargar áreas:", error);
    }
  };

  // --- MANEJO DE PERFILES ---
  const handleOpenNewPerfil = () => {
    setPerfilForm({ descripcion_perfil: '' });
    setOpenPerfilModal(true);
  };

  const handleClosePerfilModal = () => {
    setOpenPerfilModal(false);
    setPerfilForm({ descripcion_perfil: '' });
  };

  const handlePerfilChange = (e: any) => {
    const { name, value } = e.target;
    setPerfilForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditPerfil = async (perfil: PerfilRow) => {
    setPerfilForm({
      clave_perfil: perfil.clave_perfil,
      descripcion_perfil: perfil.descripcion_perfil
    });
    setOpenPerfilModal(true);
  };

  const handleSavePerfil = async () => {
    if (!perfilForm.descripcion_perfil.trim()) {
      setMessage({ text: "La descripción del perfil es obligatoria", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      let res;
      
      if (perfilForm.clave_perfil) {
        //  Editar perfil existente (PUT)
        res = await consumoApi.consumoApi.put('/api/CatPermisosDeptos/upd', {
          clave_perfil: perfilForm.clave_perfil,
          descripcion_perfil: perfilForm.descripcion_perfil.trim()
        });
      } else {
        //  Crear nuevo perfil (POST)
        res = await consumoApi.consumoApi.post('/api/CatPermisosDeptos/ins', {
          clave_perfil: Math.floor(Math.random() * 9000) + 1000,
          descripcion_perfil: perfilForm.descripcion_perfil.trim()
        });
      }
      
      if (res.status === 200) {
        const response = res.data;
        if (response && response.mensaje) {
          setMessage({ 
            text: response.mensaje, 
            type: 'success' 
          });
          setOpenPerfilModal(false);
          fetchPerfiles();
        } else {
          setMessage({ 
            text: "Error al procesar la operación", 
            type: 'error' 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al guardar perfil", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePerfil = async (perfil: PerfilRow) => {
    if (!window.confirm(`¿Seguro que desea eliminar el perfil "${perfil.descripcion_perfil}"?`)) {
      return;
    }

    try {
      const res = await consumoApi.consumoApi.delete(`/api/CatPermisosDeptos/del?clave_perfil=${perfil.clave_perfil}`);
      
      if (res.status === 200) {
        const response = res.data;
        if (response && response.mensaje) {
          setMessage({ 
            text: response.mensaje, 
            type: 'success' 
          });
          fetchPerfiles();
          if (perfilSeleccionado?.clave_perfil === perfil.clave_perfil) {
            setPerfilSeleccionado(null);
            setAccesos([]);
          }
        } else {
          setMessage({ 
            text: "Error al eliminar perfil", 
            type: 'error' 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al eliminar perfil", 
        type: 'error' 
      });
    }
  };

  // --- MANEJO DE ACCESOS ---
  const handleOpenPerfiles = async (perfil: PerfilRow) => {
    setPerfilSeleccionado(perfil);
    await fetchAccesos(perfil.clave_perfil);
  };

  const handleOpenNewAcceso = () => {
    if (perfilSeleccionado) {
      setAccesoForm({
        perfil: perfilSeleccionado.clave_perfil,
        area: '',
        area_descrip: '',
        depto: '',
        depto_descrip: '',
        permiso: false
      });
      fetchAreas(); // Cargar áreas al abrir el modal
      setOpenAccesoModal(true);
    }
  };

  const handleCloseAccesoModal = () => {
    setOpenAccesoModal(false);
    setAccesoForm({
      perfil: 0,
      area: '',
      area_descrip: '',
      depto: '',
      depto_descrip: '',
      permiso: false
    });
  };

  const handleAccesoChange = (e: any) => {
    const { name, value } = e.target;
    setAccesoForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Si cambia la descripción del área, actualizar el ID y cargar departamentos
    if (name === 'area_descrip') {
      const selectedArea = areas.find(a => a.descripcion === value);
      if (selectedArea) {
        setAccesoForm(prev => ({
          ...prev,
          area: selectedArea.area,
          depto: '',
          depto_descrip: ''
        }));
        fetchDeptos(selectedArea.area);
      }
    }
    
    // Si cambia la descripción del departamento, actualizar el ID
    if (name === 'depto_descrip') {
      const selectedDepto = deptos.find(d => d.descripcion === value);
      if (selectedDepto) {
        setAccesoForm(prev => ({
          ...prev,
          depto: selectedDepto.depto
        }));
      }
    }
  };

  const handleEditAcceso = async (acceso: AccesoRow) => {
    setAccesoForm({
      perfil: acceso.perfil,
      area: acceso.area,
      area_descrip: acceso.area_descrip,
      depto: acceso.depto,
      depto_descrip: acceso.depto_descrip,
      permiso: acceso.permiso
    });
    setOpenAccesoModal(true);
  };

  const handleSaveAcceso = async () => {
    if (!accesoForm.area.trim() || !accesoForm.area_descrip.trim() || !accesoForm.depto.trim() || !accesoForm.depto_descrip.trim()) {
      setMessage({ text: "Todos los campos del acceso son obligatorios", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      let res;
      
      // Verificar si es edición (buscando si existe un acceso con las mismas claves)
      const accesoExistente = accesos.find(a => 
        a.perfil === accesoForm.perfil && 
        a.area === accesoForm.area && 
        a.depto === accesoForm.depto
      );

      if (accesoExistente) {
        // Editar acceso existente (PUT)
        res = await consumoApi.consumoApi.put('/api/CatPermisosDeptos/sp_bw_cat_permisos_deptos_upd', null, {
          params: {
            perfil: accesoForm.perfil,
            area: accesoForm.area,
            depto: accesoForm.depto,
            permiso: accesoForm.permiso
          }
        });
      } else {
        // Crear nuevo acceso (POST)
        res = await consumoApi.consumoApi.post('/api/CatPermisosDeptos/sp_bw_cat_permisos_deptos_add', {
          perfil: accesoForm.perfil,
          area: accesoForm.area,
          area_descrip: accesoForm.area_descrip,
          depto: accesoForm.depto,
          depto_descrip: accesoForm.depto_descrip,
          permiso: accesoForm.permiso
        });
      }
      
      if (res.status === 200) {
        const response = res.data;
        if (response && response.length > 0 && response[0].codigo === 0) {
          setMessage({ 
            text: response[0].mensaje1 || "Acceso guardado exitosamente", 
            type: 'success' 
          });
          setOpenAccesoModal(false);
          if (perfilSeleccionado) {
            fetchAccesos(perfilSeleccionado.clave_perfil);
          }
        } else {
          setMessage({ 
            text: response?.[0]?.mensaje1 || "Error al guardar acceso", 
            type: 'error' 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al guardar acceso", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAcceso = async (acceso: AccesoRow) => {
    if (!window.confirm(`¿Seguro que desea eliminar el acceso "${acceso.area_descrip} - ${acceso.depto_descrip}"?`)) {
      return;
    }

    try {
      const res = await consumoApi.consumoApi.delete('/api/CatPermisosDeptos/sp_bw_cat_permisos_deptos_del', {
        params: { 
          perfil: acceso.perfil,
          area: acceso.area,
          depto: acceso.depto
        }
      });
      
      if (res.status === 200) {
        const response = res.data;
        if (response && response.length > 0 && response[0].codigo === 0) {
          setMessage({ 
            text: response[0].mensaje1 || "Acceso eliminado exitosamente", 
            type: 'success' 
          });
          if (perfilSeleccionado) {
            fetchAccesos(perfilSeleccionado.clave_perfil);
          }
        } else {
          setMessage({ 
            text: response?.[0]?.mensaje1 || "Error al eliminar acceso", 
            type: 'error' 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al eliminar acceso", 
        type: 'error' 
      });
    }
  };

  // --- FUNCIONES DE CONTROL DE ACCESO MASIVO ---
  const handleAccesoTotal = async () => {
    if (!perfilSeleccionado) return;
    
    if (!window.confirm(`¿Seguro que desea dar ACCESO TOTAL a todos los departamentos para el perfil "${perfilSeleccionado.descripcion_perfil}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await consumoApi.consumoApi.put(`/api/CatPermisosDeptos/sp_bw_cat_permisos_deptos_todo_upd?perfil=${perfilSeleccionado.clave_perfil}`);
      
      if (res.status === 200) {
        const response = res.data;
        if (response && response.length > 0 && response[0].codigo === 0) {
          setMessage({ 
            text: response[0].mensaje1 || "Acceso total aplicado correctamente", 
            type: 'success' 
          });
          fetchAccesos(perfilSeleccionado.clave_perfil);
        } else {
          setMessage({ 
            text: response?.[0]?.mensaje1 || "Error al aplicar acceso total", 
            type: 'error' 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al aplicar acceso total", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNingunAcceso = async () => {
    if (!perfilSeleccionado) return;
    
    if (!window.confirm(`¿Seguro que desea eliminar TODOS los accesos del perfil "${perfilSeleccionado.descripcion_perfil}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await consumoApi.consumoApi.put(`/api/CatPermisosDeptos/sp_bw_cat_permisos_deptos_ninguno_upd?perfil=${perfilSeleccionado.clave_perfil}`);
      
      if (res.status === 200) {
        const response = res.data;
        if (response && response.length > 0 && response[0].codigo === 0) {
          setMessage({ 
            text: response[0].mensaje1 || "Todos los accesos eliminados correctamente", 
            type: 'success' 
          });
          fetchAccesos(perfilSeleccionado.clave_perfil);
        } else {
          setMessage({ 
            text: response?.[0]?.mensaje1 || "Error al eliminar accesos", 
            type: 'error' 
          });
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.mensaje || "Error al eliminar accesos", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerfiles();
  }, []);

return (
    <Box sx={{ p: 3, bgcolor: '#ececec', minHeight: '100vh' }}>
      
      {/* MAGIA CSS: Forzamos a SweetAlert a saltar al frente de los modales */}
      <style>{`
        .swal2-container {
          z-index: 9999 !important;
        }
      `}</style>

      {/* PAPER 1: ENCABEZADO ESTILO BERLLANO */}
      <Paper sx={{ p: 3, borderRadius: '8px', mb: 3, boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
        <Box sx={{ border: '1px solid #000000ff', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    PERMISOS POR DEPARTAMENTO
                </Typography>
               
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
                
            </Box>
        </Box>
      </Paper>

      {/* --- DOS TABLAS EN LÍNEA --- */}
      <Grid container spacing={3}>
        {/* TABLA DE PERFILES */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '& .super-app-theme--header': {
              backgroundColor: '#707070ff',
              color: 'white',
              fontWeight: 'bold',
            }
          }}>
            <Box sx={{ p: 2, bgcolor: '#555555ff', color: 'white', borderRadius: '12px 12px 0 0' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Perfiles
              </Typography>
            </Box>
            <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<AddIcon />}
                onClick={handleOpenNewPerfil}
                sx={{ 
                  bgcolor: '#000000ff', 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  px: 2,
                  py: 0.5,
                  borderRadius: '6px',
                  width: '100%'
                }}
              >
                Agregar Perfil
              </Button>
            </Box>
            <DataGrid
              rows={perfiles}
              columns={[
                {
                  field: 'acciones',
                  headerName: 'Acciones',
                  width: 120,
                  headerClassName: 'super-app-theme--header',
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#707070ff' }}
                        onClick={() => handleEditPerfil(params.row)}
                        title="Editar Perfil"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#555555ff' }}
                        onClick={() => handleDeletePerfil(params.row)}
                        title="Eliminar Perfil"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ),
                },
                {
                  field: 'clave_perfil',
                  headerName: 'ID',
                  width: 80,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'descripcion_perfil',
                  headerName: 'Descripción',
                  width: 200,
                  headerClassName: 'super-app-theme--header',
                },
                
              ]}
              loading={loading}
              getRowId={(row) => row.clave_perfil}
              hideFooter
              onRowClick={(params) => handleOpenPerfiles(params.row)}
              components={{
                Toolbar: () => null,
              }}
              sx={{
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#555555ff',
                  color: 'white',
                  fontWeight: 'bold',
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    cursor: 'pointer',
                  },
                  cursor: 'pointer',
                },
              }}
            />
          </Paper>
        </Grid>

        {/* TABLA DE ACCESOS */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '& .super-app-theme--header': {
              backgroundColor: '#535353ff',
              color: 'white',
              fontWeight: 'bold',
            }
          }}>
            <Box sx={{ p: 1, bgcolor: '#555555ff', color: 'white', borderRadius: '12px 12px 0 0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '14px' }}>
                Accesos
              </Typography>
              {perfilSeleccionado && (
                <Typography variant="caption" sx={{ fontSize: '10px' }}>
                  Perfil: {perfilSeleccionado.descripcion_perfil}
                </Typography>
              )}
            </Box>
            <Box sx={{ p: 0.5, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<AddIcon />}
                disabled={!perfilSeleccionado}
                onClick={handleOpenNewAcceso}
                sx={{ 
                  bgcolor: '#000000ff', 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  px: 1,
                  py: 0.25,
                  borderRadius: '4px',
                  width: '100%',
                  minHeight: '28px'
                }}
              >
                Agregar Acceso
              </Button>
            </Box>
            {perfilSeleccionado ? (
              <DataGrid
                rows={accesos}
                columns={[
                  {
                    field: 'area',
                    headerName: 'Área',
                    width: 90,
                    headerClassName: 'super-app-theme--header',
                  },
                  {
                    field: 'area_descrip',
                    headerName: 'Descripción Área',
                    width: 160,
                    headerClassName: 'super-app-theme--header',
                  },
                  {
                    field: 'depto',
                    headerName: 'Depto',
                    width: 90,
                    headerClassName: 'super-app-theme--header',
                  },
                  {
                    field: 'depto_descrip',
                    headerName: 'Descripción Depto',
                    width: 160,
                    headerClassName: 'super-app-theme--header',
                  },
                  {
                    field: 'permiso',
                    headerName: 'Permiso',
                    width: 100,
                    headerClassName: 'super-app-theme--header',
                    renderCell: (params) => (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Checkbox
                          checked={params.value === true}
                          disabled
                          size="small"
                          sx={{
                            color: params.value === true ? '#000000ff' : '#646464ff',
                            '&.Mui-checked': {
                              color: '#313131ff',
                            },
                            '& .MuiSvgIcon-root': {
                              fontSize: '20px',
                            }
                          }}
                        />
                      </Box>
                    ),
                  },
                ]}
                loading={loading}
                getRowId={(row) => `${row.perfil}-${row.area}-${row.depto}`}
                hideFooter
                sx={{
                  height: 400,
                  '& .super-app-theme--header': {
                    backgroundColor: '#707070ff',
                    color: 'white',
                    fontWeight: 'bold',
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    maxHeight: 320,
                    overflowY: 'auto',
                  }
                }}
              />
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="#666">
                  Seleccione un perfil para ver sus accesos
                </Typography>
              </Box>
            )}
            
            {/* Botones de control de acceso */}
            {perfilSeleccionado && (
              <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained"
                  size="small"
                  onClick={handleAccesoTotal}
                  sx={{ 
                    bgcolor: '#000000ff',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    px: 1,
                    py: 0.25,
                    borderRadius: '4px',
                    flex: 1,
                    minHeight: '28px',
                    '&:hover': { bgcolor: '#000000ff' }
                  }}
                >
                   Acceso Total
                </Button>
                <Button 
                  variant="contained"
                  size="small"
                  onClick={handleNingunAcceso}
                  sx={{ 
                    bgcolor: '#000000ff',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    px: 1,
                    py: 0.25,
                    borderRadius: '4px',
                    flex: 1,
                    minHeight: '28px',
                    '&:hover': { bgcolor: '#000000ff' }
                  }}
                >
                   Ningún Acceso
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

    {/* --- MODAL DE FORMULARIO DE PERFILES --- */}
      <Dialog 
        open={openPerfilModal} 
        onClose={handleClosePerfilModal} 
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
              {perfilForm.clave_perfil ? 'Editar Perfil' : 'Nuevo Perfil'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              {perfilForm.clave_perfil ? 'Modifique la descripción del perfil' : 'Ingrese la información del nuevo perfil'}
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton 
            onClick={handleClosePerfilModal}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                {...commonProps}
                label="Descripción del Perfil *"
                name="descripcion_perfil"
                value={perfilForm.descripcion_perfil}
                onChange={handlePerfilChange}
                placeholder="Ej. Asistente, Gerencia, etc."
                autoFocus
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={handleClosePerfilModal}
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 500, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSavePerfil}
            variant="contained"
            disabled={loading}
            sx={{ 
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL DE FORMULARIO DE ACCESOS --- */}
      <Dialog 
        open={openAccesoModal} 
        onClose={handleCloseAccesoModal} 
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
              {accesoForm.area ? 'Editar Acceso' : 'Nuevo Acceso'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              {perfilSeleccionado ? `Perfil: ${perfilSeleccionado.descripcion_perfil}` : 'Gestione los accesos del perfil'}
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton 
            onClick={handleCloseAccesoModal}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            
           
            <Grid item xs={12} sm={8}>
              <TextField
                {...commonProps}
                label="Descripción Área *"
                name="area_descrip"
                value={accesoForm.area_descrip}
                onChange={handleAccesoChange}
                select
                SelectProps={{ native: true }}
              >
                <option value=""> </option>
                {areas.map((area) => (
                  <option key={area.area} value={area.descripcion}>
                    {area.descripcion}
                  </option>
                ))}
              </TextField>
            </Grid>
            
           
            <Grid item xs={12} sm={8}>
              <TextField
                {...commonProps}
                label="Descripción Depto *"
                name="depto_descrip"
                value={accesoForm.depto_descrip}
                onChange={handleAccesoChange}
                select
                SelectProps={{ native: true }}
              >
                <option value=""> </option>
                {deptos.map((depto) => (
                  <option key={depto.depto} value={depto.descripcion}>
                    {depto.descripcion}
                  </option>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '8px', border: '1.5px solid #e0e0e0', bgcolor: '#f8f9fa', transition: 'all 0.3s ease', '&:hover': { borderColor: '#999', bgcolor: '#f5f5f5' } }}>
                <Checkbox
                  checked={accesoForm.permiso}
                  onChange={(e) => setAccesoForm(prev => ({ ...prev, permiso: e.target.checked }))}
                  sx={{ color: '#333', p: 0, '&.Mui-checked': { color: '#333' } }}
                />
                <Box>
                  <Typography variant='body2' sx={{ fontWeight: 600, color: '#333' }}>
                    Permiso {accesoForm.permiso ? '(Concedido)' : '(Denegado)'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
          </Grid>
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={handleCloseAccesoModal}
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 500, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveAcceso}
            variant="contained"
            disabled={loading}
            sx={{ 
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* --- SNACKBAR --- */}
      <Snackbar 
        open={!!message} 
        autoHideDuration={4000} 
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity={message?.type} 
          onClose={() => setMessage(null)} 
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}