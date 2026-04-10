"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, IconButton, Grid, 
  Snackbar, Alert, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Paper
} from '@mui/material';
import { 
  DataGrid, GridColDef, GridRenderCellParams, GridToolbar 
} from '@mui/x-data-grid';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';

import useConsumoApi from "../../../hooks/useConsumoApi"; 
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
      '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderColor: '#999' }
    },
    '& .MuiInputLabel-root': { transform: 'translate(14px, 14px) scale(1)', color: '#666', fontWeight: 500 },
    '& .MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)', color: '#333', fontWeight: 600 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0', borderWidth: '1.5px' }
  }
};

export default function CatPerfilesPermisos() {
  const [openModalCuentas, setOpenModalCuentas] = useState(false);
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  // --- ESTADOS ---
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [permisos, setPermisos] = useState<any[]>([]);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<any>(null);
  
  const [loadingPerfiles, setLoadingPerfiles] = useState(false);
  const [loadingPermisos, setLoadingPermisos] = useState(false);
  // Función interceptora para SweetAlert2
  const setMessage = (msg: { text: string, type: 'success' | 'error' } | null) => {
    if (!msg) return;
    Swal.fire({
      title: msg.type === 'success' ? '¡Éxito!' : 'Error',
      text: msg.text,
      icon: msg.type,
      timer: msg.type === 'success' ? 2000 : undefined,
      showConfirmButton: msg.type !== 'success',
      confirmButtonColor: '#333'
    });
  };

const [openModalMovProv, setOpenModalMovProv] = useState(false);

  // Modal Nuevo/Editar Perfil
  const [openModal, setOpenModal] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ clave_perfil: 0, descripcion_perfil: '' });

  // --- 1. CARGA DE DATOS ---
  const fetchPerfiles = async () => {
    setLoadingPerfiles(true);
    try {
      const response = await consumoApi.get('/api/CatPerfiles/sel');
      setPerfiles(response.data || []);
    } catch (error) {
      setMessage({ text: "Error al cargar perfiles", type: 'error' });
    } finally {
      setLoadingPerfiles(false);
    }
  };

  const fetchPermisos = async (clave_perfil: number) => {
    setLoadingPermisos(true);
    try {
      const response = await consumoApi.get(`/api/CatPerfiles/permisos_sel?clave_perfil=${clave_perfil}`);
      setPermisos(response.data || []);
    } catch (error) {
      setMessage({ text: "Error al cargar permisos", type: 'error' });
    } finally {
      setLoadingPermisos(false);
    }
  };

  useEffect(() => {
    fetchPerfiles();
  }, []);

  // --- 2. ACCIONES DE PERFILES ---
const handleGuardarPerfil = async () => {
    if (!perfilForm.descripcion_perfil.trim()) {
      setMessage({ text: "El nombre del perfil no puede estar vacío", type: 'error' });
      return;
    }
    
    try {
      if (perfilForm.clave_perfil === 0) {
        await consumoApi.post('/api/CatPerfiles/ins', perfilForm);
        setMessage({ text: "Perfil creado con éxito", type: 'success' });
      } else {
        await consumoApi.put('/api/CatPerfiles/upd', perfilForm);
        setMessage({ text: "Perfil actualizado", type: 'success' });
      }
      setOpenModal(false);
      fetchPerfiles();
      if (perfilSeleccionado?.clave_perfil === perfilForm.clave_perfil) {
         setPerfilSeleccionado({ ...perfilSeleccionado, descripcion_perfil: perfilForm.descripcion_perfil });
      }
    } catch (error: any) {
      // MAGIA AQUÍ: Atrapamos el mensaje real que devuelve C# / SQL
      const errorDelServidor = error.response?.data?.mensaje || error.response?.data || "Error 500 Interno del Servidor";
      setMessage({ text: `Error backend: ${errorDelServidor}`, type: 'error' });
      console.error("Detalle completo del error:", error.response);
    }
  };

  const handleEliminarPerfil = async (clave: number) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Desea eliminar el perfil ${clave} y todos sus permisos?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#333',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!confirmacion.isConfirmed) return;

    try {
      await consumoApi.delete(`/api/CatPerfiles/del?clave_perfil=${clave}`);
      setMessage({ text: "Perfil eliminado", type: 'success' });
      if (perfilSeleccionado?.clave_perfil === clave) {
        setPerfilSeleccionado(null);
        setPermisos([]);
      }
      fetchPerfiles();
    } catch (error) {
      setMessage({ text: "Error al eliminar", type: 'error' });
    }
  };

  // --- 3. ACCIONES DE PERMISOS ---
  const handleTogglePermiso = async (formulario: string, valorActual: boolean) => {
    if (!perfilSeleccionado) return;
    try {
      const nuevoValor = !valorActual;
      await consumoApi.put('/api/CatPerfiles/permisos_upd', {
        clave_perfil: perfilSeleccionado.clave_perfil,
        formulario: formulario,
        permiso: nuevoValor
      });
      // Actualizamos visualmente sin recargar todo de BD
      setPermisos(prev => prev.map(p => p.formulario === formulario ? { ...p, permiso: nuevoValor } : p));
    } catch (error) {
      setMessage({ text: "Error al cambiar permiso", type: 'error' });
    }
  };

const handlePermisosMasivo = async (otorgarTodo: boolean) => {
    if (!perfilSeleccionado) return;
    const accion = otorgarTodo ? "otorgar todos los accesos al" : "quitar todos los accesos del";
    
    const confirmacion = await Swal.fire({
      title: 'Actualización Masiva',
      text: `¿Desea ${accion} perfil ${perfilSeleccionado.descripcion_perfil}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: otorgarTodo ? '#2e7d32' : '#d32f2f',
      cancelButtonColor: '#333',
      confirmButtonText: 'Sí, aplicar',
      cancelButtonText: 'Cancelar'
    });
    if (!confirmacion.isConfirmed) return;

    try {
      await consumoApi.put(`/api/CatPerfiles/permisos_masivo?clave_perfil=${perfilSeleccionado.clave_perfil}&permiso=${otorgarTodo}`);
      setMessage({ text: "Permisos actualizados masivamente", type: 'success' });
      fetchPermisos(perfilSeleccionado.clave_perfil);
    } catch (error) {
      setMessage({ text: "Error al actualizar masivamente", type: 'error' });
    }
  };

  // --- COLUMNAS GRID PERFILES ---
  const colsPerfiles: GridColDef[] = [
    { field: 'acciones', headerName: 'Acc.', width: 80, sortable: false, filterable: false,
      renderCell: (p) => (
        <Box sx={{ display: 'flex' }}>
          <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); setPerfilForm({ clave_perfil: p.row.clave_perfil, descripcion_perfil: p.row.descripcion_perfil }); setOpenModal(true); }}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleEliminarPerfil(p.row.clave_perfil); }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ),
    },
    { field: 'clave_perfil', headerName: 'Clave', width: 70 },
    { field: 'descripcion_perfil', headerName: 'Descripción del Perfil', flex: 1 },
  ];

// --- COLUMNAS GRID PERMISOS ---
  const colsPermisos: GridColDef[] = [
    { field: 'permiso', headerName: 'Acceso', width: 90, sortable: false, filterable: false,
      renderCell: (p) => (
        <Checkbox 
          checked={p.row.permiso} 
          onChange={() => handleTogglePermiso(p.row.formulario, p.row.permiso)}
          color="success"
        />
      ),
    },
    // Le quitamos el "flex: 1" y le ponemos un ancho fijo de 350px (puedes subir o bajar este número a tu gusto)
    { field: 'formulario', headerName: 'Nombre del Módulo / Formulario', width: 350 },
    
    { field: 'fecha_act', headerName: 'Últ. Modificación', width: 150, valueFormatter: (v) => v ? String(v).split('T')[0] : '' },
  ];

// --- RENDER ---
  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
      
      {/* MAGIA CSS: Forzamos a SweetAlert a saltar al frente de los modales */}
      <style>{`
        .swal2-container {
          z-index: 9999 !important;
        }
      `}</style>

      {/* PAPER 1: ENCABEZADO */}
      <Paper sx={{ p: 3, borderRadius: '8px', mb: 3 }}>
        
        {/* ENCABEZADO RECTANGULAR ELEGANTE CLONADO */}
        <Box sx={{ border: '1px solid #000000ff', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    PERFILES Y PERMISOS DE USUARIOS
                </Typography>
               
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
                
            </Box>
        </Box>
</Paper>

      {/* CONTENEDOR PRINCIPAL */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        
        {/* PANEL IZQUIERDO: PERFILES (Ocupa 4 columnas de 12) */}
        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: '8px', 
            boxShadow: '0 4px 8px rgba(0,0,0,0.08)', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            height: '700px' // <--- ALTURA EXACTA FIJADA
          }}>
            
            {/* Encabezado del Panel */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', fontSize: '1rem' }}>
                LISTA DE PERFILES
              </Typography>
            </Box>
            
            {/* Contenedor de la Tabla con límites estrictos */}
            <Box sx={{ flex: 1, minHeight: 0, width: '100%', mb: 2 }}>
              <DataGrid 
                rows={perfiles} 
                columns={colsPerfiles} 
                getRowId={(row) => row.clave_perfil} 
                loading={loadingPerfiles}
                density="compact"
                disableRowSelectionOnClick
                onRowClick={(params) => {
                    setPerfilSeleccionado(params.row);
                    fetchPermisos(params.row.clave_perfil);
                }}
                sx={{ 
                  border: 'none',
                  height: '100%', // Obliga al DataGrid a no rebasar el Box
                  '& .MuiDataGrid-columnHeaders': { borderBottom: '2px solid #000', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: '#f5f5f5' },
                  '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' },
                  '& .MuiDataGrid-row': { cursor: 'pointer' },
                  '& .MuiDataGrid-row:hover': { bgcolor: '#fafafa' }
                }}
              />
            </Box>

            {/* Botón Inferior */}
            <Button 
              variant="contained" 
              fullWidth
              onClick={() => { setPerfilForm({ clave_perfil: 0, descripcion_perfil: '' }); setOpenModal(true); }} 
              sx={{ 
                backgroundColor: '#333333', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', py: 1.5,
                boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', transition: 'all 0.3s ease',
                '&:hover': { backgroundColor: '#555555', boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', transform: 'translateY(-1px)' }
              }}
            >
              CREAR PERFIL
            </Button>
          </Paper>
        </Grid>

        {/* PANEL DERECHO: PERMISOS */}
        <Grid item xs={12} md={8} sx={{ display: 'flex' }}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: '8px', 
            boxShadow: '0 4px 8px rgba(0,0,0,0.08)', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            height: '700px' // <--- MISMA ALTURA EXACTA FIJADA
          }}>
            
            {!perfilSeleccionado ? (
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                <Typography variant="h6" align="center" sx={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}>
                  Seleccione un perfil de la lista para gestionar sus accesos
                </Typography>
              </Box>
            ) : (
              <>
                {/* Encabezado y Acciones Masivas */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', fontSize: '1rem', textTransform: 'uppercase' }}>
                    CONFIGURANDO: <span style={{ color: '#1a365d' }}>{perfilSeleccionado.descripcion_perfil}</span>
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    
                  </Box>
                </Box>

                {/* Contenedor de la Tabla con límites estrictos */}
                <Box sx={{ flex: 1, minHeight: 0, width: '100%', mb: 2 }}>
                  <DataGrid 
                    rows={permisos} 
                    columns={colsPermisos} 
                    getRowId={(row) => row.formulario} 
                    loading={loadingPermisos}
                    density="compact"
                    disableRowSelectionOnClick
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{ toolbar: { showQuickFilter: true } }}
                    sx={{ 
                      border: 'none',
                      height: '100%', // Obliga al DataGrid a no rebasar el Box
                      '& .MuiDataGrid-columnHeaders': { borderBottom: '2px solid #000', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: '#f5f5f5' },
                      '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' }
                    }}
                  />
                </Box>

                {/* BOTONES INFERIORES EXTRA */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                  <Button 
                      size="small" 
                      variant="contained" 
                      onClick={() => handlePermisosMasivo(true)} 
                      sx={{ bgcolor: '#333', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: '6px', '&:hover': { bgcolor: '#555' } }}
                    >
                      Otorgar Todo
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => handlePermisosMasivo(false)} 
                      sx={{ bgcolor: '#333', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: '6px', '&:hover': { bgcolor: '#555' } }}
                    >
                      Quitar Todo
                    </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setOpenModalMovProv(true)} 
                    sx={{ bgcolor: '#333', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: '6px', '&:hover': { bgcolor: '#555' } }}
                     >
                    Movimientos Proveedor
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setOpenModalCuentas(true)} 
                    sx={{ bgcolor: '#333', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: '6px', '&:hover': { bgcolor: '#555' } }}
                    >
                    Cuentas Bancarias
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>


{/* --- MODAL CREAR/EDITAR PERFIL --- */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
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
              {perfilForm.clave_perfil === 0 ? "Crear Nuevo Perfil" : "Editar Perfil"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              {perfilForm.clave_perfil === 0 ? "Configura un nuevo perfil de acceso" : "Modifica los datos del perfil"}
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton 
            onClick={() => setOpenModal(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 3, color: '#666', lineHeight: 1.6 }}>
              {perfilForm.clave_perfil === 0 
                ? " Al crear un nuevo perfil, se le asignarán automáticamente todos los módulos del sistema con acceso denegado." 
                : " Modifica el nombre del perfil según sea necesario."
              }
            </Typography>
            <TextField 
              {...commonProps}
              label="Nombre / Descripción del Perfil *"
              value={perfilForm.descripcion_perfil}
              onChange={(e) => setPerfilForm({ ...perfilForm, descripcion_perfil: e.target.value })}
              autoFocus
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={() => setOpenModal(false)}
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 500, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardarPerfil}
            variant="contained"
            sx={{ 
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            {perfilForm.clave_perfil === 0 ? "Guardar Perfil" : "Actualizar Perfil"}
          </Button>
        </DialogActions>
      </Dialog>
      <ModalPermisosMovProv 
        open={openModalMovProv} 
        onClose={() => setOpenModalMovProv(false)} 
        perfiles={perfiles} // Le pasamos la lista de perfiles que ya tenemos cargada
        consumoApi={consumoApi} 
        setMessage={setMessage} 
      />
      <ModalCuentasBancarias 
        open={openModalCuentas} 
        onClose={() => setOpenModalCuentas(false)} 
        consumoApi={consumoApi} 
        setMessage={setMessage} 
      />



    </Box>
  );
}
// =========================================================================================
// MODAL: PERMISOS DE MOVIMIENTOS POR PROVEEDOR
// =========================================================================================
const ModalPermisosMovProv = ({ open, onClose, perfiles, consumoApi, setMessage }: any) => {
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<any>(null);
  const [permisosMov, setPermisosMov] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPermisosMov = async (clave_perfil: number) => {
    setLoading(true);
    try {
      const response = await consumoApi.get(`/api/CatPerfiles/mov_prov_sel?clave_perfil=${clave_perfil}`);
      setPermisosMov(response.data || []);
    } catch (error) {
      setMessage({ text: "Error al cargar movimientos", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (clave_movto: number, valorActual: boolean) => {
    if (!perfilSeleccionado) return;
    try {
      const nuevoValor = !valorActual;
      await consumoApi.put('/api/CatPerfiles/mov_prov_upd', {
        clave_perfil: perfilSeleccionado.clave_perfil,
        clave_movto: clave_movto,
        permiso: nuevoValor
      });
      setPermisosMov(prev => prev.map(p => p.clave_movto === clave_movto ? { ...p, permiso: nuevoValor } : p));
    } catch (error) {
      setMessage({ text: "Error al cambiar permiso", type: 'error' });
    }
  };

const handleMasivo = async (otorgarTodo: boolean) => {
    if (!perfilSeleccionado) return;

    const confirmacion = await Swal.fire({
      title: 'Confirmación Masiva',
      text: `¿Seguro que desea ${otorgarTodo ? "otorgar" : "quitar"} todos los accesos al perfil ${perfilSeleccionado.descripcion_perfil}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: otorgarTodo ? '#2e7d32' : '#d32f2f',
      cancelButtonColor: '#333',
      confirmButtonText: 'Sí, aplicar',
      cancelButtonText: 'Cancelar'
    });
    if (!confirmacion.isConfirmed) return;

    try {
      await consumoApi.put(`/api/CatPerfiles/mov_prov_masivo?clave_perfil=${perfilSeleccionado.clave_perfil}&permiso=${otorgarTodo}`);
      setMessage({ text: "Actualizado correctamente", type: 'success' });
      fetchPermisosMov(perfilSeleccionado.clave_perfil);
    } catch (error) {
      setMessage({ text: "Error masivo", type: 'error' });
    }
  };

return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
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
            Permisos por Movimientos de Proveedor
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
            Gestiona los accesos a movimientos por perfil
          </Typography>
        </Box>
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
        <IconButton 
          onClick={onClose}
          sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      <DialogContent sx={{ p: 3, backgroundColor: '#ffffff', height: '600px' }}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          
          {/* LADO IZQUIERDO: PERFILES */}
          <Grid item xs={5} sx={{ height: '100%' }}>
            <Box sx={{ 
              background: 'white', p: 2, borderRadius: 3, height: '100%', 
              border: '1px solid #e0e0e0', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                Perfiles
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                <DataGrid 
                  rows={perfiles} 
                  columns={[ { field: 'descripcion_perfil', headerName: 'Perfil', flex: 1 } ]} 
                  getRowId={(row) => row.clave_perfil} 
                  density="compact"
                  onRowClick={(p) => {
                    setPerfilSeleccionado(p.row);
                    fetchPermisosMov(p.row.clave_perfil);
                  }}
                  sx={{ 
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5', borderBottom: '2px solid #000', fontSize: '0.9rem', fontWeight: 'bold' },
                    '& .MuiDataGrid-row': { cursor: 'pointer', transition: 'all 0.2s ease', '&:hover': { bgcolor: '#fafafa' } },
                    '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' }
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {/* LADO DERECHO: PERMISOS */}
          <Grid item xs={7} sx={{ height: '100%' }}>
            <Box sx={{ 
              background: 'white', p: 2, borderRadius: 3, height: '100%', 
              border: '1px solid #e0e0e0', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
            }}>
              {!perfilSeleccionado ? (
                <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#999' }}>
                  <Typography variant="h6" align="center" sx={{ fontWeight: 500 }}>
                    Seleccione un perfil<br/>para gestionar sus movimientos
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                    {perfilSeleccionado.descripcion_perfil}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <DataGrid 
                      rows={permisosMov} 
                      columns={[
                        { 
                          field: 'permiso', headerName: 'Acceso', width: 80, 
                          renderCell: (p) => (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Checkbox checked={p.row.permiso} onChange={() => handleToggle(p.row.clave_movto, p.row.permiso)} color="success" />
                            </Box>
                          )
                        }, 
                        { field: 'clave_movto', headerName: 'Clave Movimiento', flex: 1 }
                      ]} 
                      getRowId={(row) => row.clave_movto} 
                      loading={loading}
                      density="compact"
                      disableRowSelectionOnClick
                      sx={{ 
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5', borderBottom: '2px solid #000', fontSize: '0.9rem', fontWeight: 'bold' },
                        '& .MuiDataGrid-row': { transition: 'all 0.2s ease', '&:hover': { bgcolor: '#fafafa' } },
                        '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' }
                      }}
                    />
                  </Box>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
  
};
// MODAL: ACCESO A CUENTAS BANCARIAS
// =========================================================================================
const ModalCuentasBancarias = ({ open, onClose, consumoApi, setMessage }: any) => {
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formNuevo, setFormNuevo] = useState({ Cia: '', Cuenta: '', usuario: '', op_tesoreria: '' });

  // Listas desplegables
  const [catCias, setCatCias] = useState<any[]>([]);
  const [catCuentas, setCatCuentas] = useState<any[]>([]);
  const [catUsuarios, setCatUsuarios] = useState<any[]>([]);
  const [catOpTesoreria, setCatOpTesoreria] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetchDatos();
      fetchCatalogosBase();
    }
  }, [open]);

  const fetchCatalogosBase = async () => {
    try {
      const [resCia, resUsu, resOp] = await Promise.all([
        consumoApi.get('/api/CatPerfiles/combo_cias'),
        consumoApi.get('/api/CatPerfiles/combo_usuarios'),
        consumoApi.get('/api/CatPerfiles/combo_op_tesoreria')
      ]);
      setCatCias(resCia.data || []);
      setCatUsuarios(resUsu.data || []);
      setCatOpTesoreria(resOp.data || []);
    } catch (e) {
      console.error("Error cargando catálogos", e);
    }
  };

  const fetchCuentasCascada = async (ciaId: number) => {
    try {
      const res = await consumoApi.get(`/api/CatPerfiles/combo_cuentas?Cia=${ciaId}`);
      setCatCuentas(res.data || []);
    } catch (e) {
      console.error("Error cargando cuentas", e);
    }
  };

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const res = await consumoApi.get('/api/CatPerfiles/cuentas_usuarios_sel');
      setDatos(res.data || []);
    } catch (e) {
      setMessage({ text: "Error al cargar las cuentas", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (row: any, valorActual: boolean) => {
    const nuevoValor = !valorActual;
    try {
      await consumoApi.put('/api/CatPerfiles/cuentas_usuarios_upd', { ...row, permiso: nuevoValor });
      setDatos(prev => prev.map(p => 
        (p.Cia === row.Cia && p.Cuenta === row.Cuenta && p.usuario === row.usuario && p.op_tesoreria === row.op_tesoreria) 
        ? { ...p, permiso: nuevoValor } : p
      ));
    } catch (e) {
      setMessage({ text: "Error al actualizar permiso", type: 'error' });
    }
  };

  const handleAgregar = async () => {
    if (!formNuevo.Cia || !formNuevo.Cuenta || !formNuevo.usuario || !formNuevo.op_tesoreria) {
      setMessage({ text: "Todos los campos son obligatorios", type: 'error' });
      return;
    }
    try {
      await consumoApi.post('/api/CatPerfiles/cuentas_usuarios_ins', { ...formNuevo, permiso: true });
      setMessage({ text: "Registro agregado exitosamente", type: 'success' });
      setFormNuevo({ Cia: '', Cuenta: '', usuario: '', op_tesoreria: '' });
      fetchDatos();
    } catch (error: any) {
      setMessage({ text: error.response?.data?.mensaje || "Error al insertar", type: 'error' });
    }
  };

 const handleEliminar = async (row: any) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Eliminar permiso para el usuario ${row.nombre_usuario} en la cuenta ${row.desc_cuenta}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#333',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!confirmacion.isConfirmed) return;

    try {
      await consumoApi.delete(`/api/CatPerfiles/cuentas_usuarios_del?Cia=${row.Cia}&Cuenta=${row.Cuenta}&usuario=${row.usuario}&op_tesoreria=${row.op_tesoreria}`);
      setMessage({ text: "Eliminado correctamente", type: 'success' });
      fetchDatos();
    } catch (e) {
      setMessage({ text: "Error al eliminar", type: 'error' });
    }
  };

return (
    <Dialog 
      open={open} 
      onClose={onClose} 
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
      <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Acceso a Cuentas Bancarias
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
            Gestiona los permisos de acceso a cuentas bancarias por usuario
          </Typography>
        </Box>
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
        <IconButton 
          onClick={onClose}
          sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, backgroundColor: '#ffffff', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Formulario elegante para agregar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, p: 2, background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0', alignItems: 'center' }}>
          <TextField 
            select 
            {...commonProps}
            label="Compañía" 
            value={formNuevo.Cia} 
            sx={{ ...commonProps.sx, flex: 1, minWidth: 120 }}
            onChange={e => {
              const nuevaCia = e.target.value;
              setFormNuevo({...formNuevo, Cia: nuevaCia, Cuenta: ''});
              fetchCuentasCascada(Number(nuevaCia));
            }} 
          >
            {catCias.map(c => <MenuItem key={c.id} value={c.id}>{c.descripcion}</MenuItem>)}
          </TextField>

          <TextField 
            select 
            {...commonProps}
            label="Cuenta Bancaria" 
            value={formNuevo.Cuenta} 
            onChange={e => setFormNuevo({...formNuevo, Cuenta: e.target.value})} 
            sx={{ ...commonProps.sx, flex: 1.5, minWidth: 120 }}
            disabled={!formNuevo.Cia}
          >
            {catCuentas.map(c => <MenuItem key={c.id} value={c.id}>{c.descripcion}</MenuItem>)}
          </TextField>

          <TextField 
            select 
            {...commonProps}
            label="Usuario" 
            value={formNuevo.usuario} 
            onChange={e => setFormNuevo({...formNuevo, usuario: e.target.value})} 
            sx={{ ...commonProps.sx, flex: 1.5, minWidth: 120 }}
          >
            {catUsuarios.map(u => <MenuItem key={u.id} value={u.id}>{u.descripcion}</MenuItem>)}
          </TextField>

          <TextField 
            select 
            {...commonProps}
            label="Op. Tesorería" 
            value={formNuevo.op_tesoreria} 
            onChange={e => setFormNuevo({...formNuevo, op_tesoreria: e.target.value})} 
            sx={{ ...commonProps.sx, flex: 1, minWidth: 120 }}
          >
            {catOpTesoreria.map(o => <MenuItem key={o.id} value={o.id}>{o.descripcion}</MenuItem>)}
          </TextField>

          <Button 
            variant="contained" 
            onClick={handleAgregar}
            sx={{ 
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', height: '50px', px: 3, minWidth: '100px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            Agregar
          </Button>
        </Box>

        {/* Grid de Datos elegante */}
        <Box sx={{ height: 450, width: '100%', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          <DataGrid 
            rows={datos} 
            getRowId={(row) => `${row.Cia}-${row.Cuenta}-${row.usuario}-${row.op_tesoreria}`} 
            loading={loading}
            density="compact"
            disableRowSelectionOnClick
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true } }}
            sx={{ 
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5', borderBottom: '2px solid #000', fontSize: '0.9rem', fontWeight: 'bold' },
              '& .MuiDataGrid-row': { transition: 'all 0.2s ease', '&:hover': { bgcolor: '#fafafa' } },
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' }
            }}
            columns={[
              { field: 'desc_cia', headerName: 'Compañía', width: 150 },
              { field: 'desc_cuenta', headerName: 'Cuenta Bancaria', flex: 1 },
              { field: 'nombre_usuario', headerName: 'Usuario', flex: 1 },
              { field: 'desc_op_tesoreria', headerName: 'Op. Tesorería', width: 200 },
              { field: 'permiso', headerName: 'Permiso', width: 90, sortable: false, filterable: false,
                renderCell: (p) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Checkbox checked={p.row.permiso} onChange={() => handleToggle(p.row, p.row.permiso)} color="success" />
                  </Box>
                )
              },
              { field: 'acciones', headerName: '', width: 80, sortable: false, filterable: false,
                renderCell: (p) => (
                  <IconButton size="small" color="error" onClick={() => handleEliminar(p.row)}>
                    <DeleteIcon fontSize="small"/>
                  </IconButton>
                )
              }
            ]} 
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};


