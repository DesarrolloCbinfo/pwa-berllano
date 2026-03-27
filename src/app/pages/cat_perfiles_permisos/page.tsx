"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, IconButton, Grid, 
  Snackbar, Alert, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem 
} from '@mui/material';
import { 
  DataGrid, GridColDef, GridRenderCellParams, GridToolbar 
} from '@mui/x-data-grid';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';

import useConsumoApi from "../../../hooks/useConsumoApi"; // Ajusta la ruta si es necesario

export default function CatPerfilesPermisos() {
  const [openModalCuentas, setOpenModalCuentas] = useState(false);
  const { consumoApi } = useConsumoApi();

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

return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      
      {/* 🚀 MAGIA AQUÍ: Forzamos a SweetAlert a saltar al frente de cualquier modal de MUI */}
      <style>{`
        .swal2-container {
          z-index: 9999 !important;
        }
      `}</style>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 40, height: 40, backgroundColor: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>🔐</Box> 
          Perfiles y Permisos de Usuarios
        </Typography>
      </Box>

      <Grid container spacing={3}>
{/* PANEL IZQUIERDO: PERFILES */}
        <Grid item xs={12} md={5}>
          <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', mb: 2 }}>
            
            {/* Encabezado sin botón */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">Lista de Perfiles</Typography>
            </Box>
            
            {/* Tabla */}
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <DataGrid 
                rows={perfiles} 
                columns={colsPerfiles} 
                getRowId={(row) => row.clave_perfil} 
                loading={loadingPerfiles}
                density="compact"
                onRowClick={(params) => {
                    setPerfilSeleccionado(params.row);
                    fetchPermisos(params.row.clave_perfil);
                }}
                sx={{ 
                  '& .MuiDataGrid-row': { cursor: 'pointer' },
                  '& .MuiDataGrid-row:hover': { bgcolor: '#f0f8ff' }
                }}
              />
            </Box>
          </Box>

          {/* Botón AFUERA del contenedor blanco */}
          <Button 
            variant="contained" 
            fullWidth
            onClick={() => { setPerfilForm({ clave_perfil: 0, descripcion_perfil: '' }); setOpenModal(true); }} 
            sx={{ bgcolor: '#333', py: 1, fontWeight: 'bold' }}
          >
            + Nuevo Perfil
          </Button>
        </Grid>

{/* PANEL DERECHO: PERMISOS */}
        <Grid item xs={12} md={7}>
          <Box sx={{ 
            bgcolor: 'white', 
            p: 2, 
            borderRadius: 2, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
            height: 'calc(100vh - 180px)', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            mb: 1.5, // Margen inferior
            maxWidth: '750px' // <--- 1. Ampliamos un poco para que los botones quepan bien
          }}>
            
            {!perfilSeleccionado ? (
              <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#999' }}>

                <Typography variant="h6" align="center">Seleccione un perfil de la lista para gestionar sus accesos</Typography>
              </Box>
            ) : (
              <>
                {/* Encabezado */}
                <Box sx={{ mb: 2, bgcolor: '#f8f9fa', p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">Configurando permisos para:</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">{perfilSeleccionado.descripcion_perfil}</Typography>
                </Box>

                {/* Tabla */}
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <DataGrid 
                    rows={permisos} 
                    columns={colsPermisos} 
                    getRowId={(row) => row.formulario} 
                    loading={loadingPermisos}
                    density="compact"
                    disableRowSelectionOnClick
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{ toolbar: { showQuickFilter: true } }}
                  />
                </Box>
              </>
            )}
          </Box>

          {/* BOTONES AFUERA PERFECTAMENTE ALINEADOS EN UN RENGLÓN */}
          {perfilSeleccionado && (
             <Box sx={{ 
               display: 'flex', 
               justifyContent: 'space-between', 
               alignItems: 'center', 
               maxWidth: '750px', // <--- Debe coincidir con el maxWidth de la tabla de arriba
               gap: 1 
             }}>
               
               {/* Izquierda: Configuración Extra */}
               <Box sx={{ display: 'flex', gap: 1 }}>
                 <Button 
                   size="small" 
                   variant="outlined" 
                   color="primary" 
                   onClick={() => setOpenModalMovProv(true)} 
                   sx={{ fontWeight: 'bold', bgcolor: 'white', whiteSpace: 'nowrap' }}
                 >
                   Movimientos
                 </Button>
                 <Button 
                   size="small" 
                   variant="outlined" 
                   color="secondary" 
                   onClick={() => setOpenModalCuentas(true)} 
                   sx={{ fontWeight: 'bold', bgcolor: 'white', whiteSpace: 'nowrap' }}
                 >
                   Cuentas Bancarias
                 </Button>
               </Box>

               {/* Derecha: Acciones Masivas */}
               <Box sx={{ display: 'flex', gap: 1 }}>
                 <Button 
                   size="small" 
                   variant="contained" 
                   color="success" 
                   startIcon={<CheckCircleIcon />} 
                   onClick={() => handlePermisosMasivo(true)} 
                   sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}
                 >
                   Otorgar Todo
                 </Button>
                 <Button 
                   size="small" 
                   variant="contained" 
                   color="error" 
                   startIcon={<CancelIcon />} 
                   onClick={() => handlePermisosMasivo(false)} 
                   sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}
                 >
                   Quitar Todo
                 </Button>
               </Box>
               
             </Box>
          )}
        </Grid>
      </Grid>

      {/* MODAL CREAR/EDITAR PERFIL */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            background: 'white'
          }
        }}
      >
        {/* HEADER ELEGANTE BERLLANO */}
        <Box sx={{ 
          p: 3,
          background: 'linear-gradient(135deg, #333333 0%, #555555 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
            pointerEvents: 'none'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 48, 
              height: 48, 
              background: 'rgba(255,255,255,0.15)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              {perfilForm.clave_perfil === 0 ? "➕" : "✏️"}
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {perfilForm.clave_perfil === 0 ? "Crear Nuevo Perfil" : "Editar Perfil"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                {perfilForm.clave_perfil === 0 ? "Configura un nuevo perfil de acceso" : "Modifica los datos del perfil"}
              </Typography>
            </Box>
          </Box>
          <Button 
            onClick={() => setOpenModal(false)} 
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
              px: 2,
              py: 1,
              fontWeight: 600,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            ✕ Cerrar
          </Button>
        </Box>
        
        <DialogContent sx={{ 
          p: 3, 
          bgcolor: '#f5f5f5',
          mt: 0
        }}>
          <Box sx={{ 
            p: 3, 
            background: 'white',
            borderRadius: 3,
            border: '1px solid #e0e0e0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          }}>
            <Typography variant="body2" sx={{ mb: 3, color: '#666666', lineHeight: 1.6 }}>
              {perfilForm.clave_perfil === 0 
                ? "📝 Al crear un nuevo perfil, se le asignarán automáticamente todos los módulos del sistema con acceso denegado (apagado)." 
                : "📝 Modifica el nombre del perfil según sea necesario."
              }
            </Typography>
            <TextField 
              fullWidth 
              label="Nombre / Descripción del Perfil" 
              variant="outlined" 
              value={perfilForm.descripcion_perfil}
              onChange={(e) => setPerfilForm({ ...perfilForm, descripcion_perfil: e.target.value })}
              autoFocus
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  fontSize: '1rem',
                  '&:hover fieldset': { borderColor: '#333333' },
                  '&.Mui-focused fieldset': { 
                    borderColor: '#333333',
                    borderWidth: 2
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#666666',
                  '&.Mui-focused': { color: '#333333' }
                }
              }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          bgcolor: '#f5f5f5',
          gap: 2
        }}>
          <Button 
            onClick={() => setOpenModal(false)} 
            sx={{ 
              color: '#666666',
              fontWeight: 600,
              borderRadius: 3,
              px: 3,
              py: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.05)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardarPerfil} 
            variant="contained"
            sx={{ 
              background: '#333333',
              color: 'white',
              fontWeight: 600,
              borderRadius: 3,
              px: 3,
              py: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: '#555555',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }
            }}
          >
            💾 Guardar Perfil
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
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          background: 'white'
        }
      }}
    >
      {/* HEADER ELEGANTE BERLLANO */}
      <Box sx={{ 
        p: 3,
        background: 'linear-gradient(135deg, #333333 0%, #555555 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
          pointerEvents: 'none'
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            width: 48, 
            height: 48, 
            background: 'rgba(255,255,255,0.15)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '24px',
            backdropFilter: 'blur(10px)'
          }}>📋</Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Permisos por Movimientos de Proveedor
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Gestiona los accesos a movimientos por perfil
            </Typography>
          </Box>
        </Box>
        <Button 
          onClick={onClose} 
          sx={{ 
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: 3,
            px: 2,
            py: 1,
            fontWeight: 600,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.2)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          ✕ Cerrar
        </Button>
      </Box>
      
      <DialogContent sx={{ 
        p: 3, 
        bgcolor: '#f5f5f5',
        height: '600px' 
      }}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          
          {/* LADO IZQUIERDO: PERFILES */}
          <Grid item xs={5} sx={{ height: '100%' }}>
            <Box sx={{ 
              background: 'white',
              p: 2, 
              borderRadius: 3, 
              height: '100%', 
              border: '1px solid #e0e0e0', 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                transform: 'translateY(-1px)'
              }
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 2, 
                  p: 1.5, 
                  color: '#333333',
                  borderBottom: '2px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                📁 Perfiles
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
                    '& .MuiDataGrid-root': { border: 'none' },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#f8f9fa',
                      borderBottom: '2px solid #e0e0e0',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#495057'
                    },
                    '& .MuiDataGrid-row': { 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { 
                        bgcolor: '#f0f0f0',
                        transform: 'scale(1.005)'
                      }
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #f1f3f4',
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {/* LADO DERECHO: PERMISOS */}
          <Grid item xs={7} sx={{ height: '100%' }}>
            <Box sx={{ 
              background: 'white',
              p: 2, 
              borderRadius: 3, 
              height: '100%', 
              border: '1px solid #e0e0e0', 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                transform: 'translateY(-1px)'
              }
            }}>
              {!perfilSeleccionado ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexGrow: 1, 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexDirection: 'column', 
                  color: '#666666',
                  background: '#f5f5f5',
                  borderRadius: 2,
                  m: 2,
                  p: 3
                }}>
                  <Typography variant="h2" sx={{ fontSize: '3rem', mb: 1, opacity: 0.7 }}>👈</Typography>
                  <Typography variant="h6" align="center" sx={{ fontWeight: 500 }}>
                    Seleccione un perfil<br/>para gestionar sus movimientos
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography 
                    fontWeight="bold" 
                    sx={{ 
                      mb: 2, 
                      p: 1.5, 
                      color: '#333333',
                      borderBottom: '2px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    🔑 {perfilSeleccionado.descripcion_perfil}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <DataGrid 
                      rows={permisosMov} 
                      columns={[
                        { 
                          field: 'permiso', 
                          headerName: 'Acceso', 
                          width: 80, 
                          renderCell: (p) => (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Checkbox 
                                checked={p.row.permiso} 
                                onChange={() => handleToggle(p.row.clave_movto, p.row.permiso)} 
                                color="default"
                                sx={{ 
                                  '&.Mui-checked': {
                                    color: '#333333'
                                  }
                                }}
                              />
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
                        '& .MuiDataGrid-root': { border: 'none' },
                        '& .MuiDataGrid-columnHeaders': {
                          backgroundColor: '#f8f9fa',
                          borderBottom: '2px solid #e0e0e0',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#495057'
                        },
                        '& .MuiDataGrid-row': { 
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            bgcolor: '#f0f0f0',
                            transform: 'scale(1.005)'
                          }
                        },
                        '& .MuiDataGrid-cell': {
                          borderBottom: '1px solid #f1f3f4',
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  </Box>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      {/* BOTONES ELEGANTES */}
      {perfilSeleccionado && (
        <Box sx={{ 
          p: 3, 
          bgcolor: '#f5f5f5',
          display: 'flex', 
          gap: 2, 
          justifyContent: 'flex-end',
          borderTop: '1px solid #e0e0e0'
        }}>
          <Button 
            size="small" 
            variant="contained" 
            onClick={() => handleMasivo(true)}
            sx={{ 
              background: '#333333',
              color: 'white',
              fontWeight: 600,
              borderRadius: 3,
              px: 3,
              py: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: '#555555',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }
            }}
          >
            ✅ Acceso Total
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => handleMasivo(false)}
            sx={{ 
              color: '#666666',
              fontWeight: 600,
              borderRadius: 3,
              px: 3,
              py: 1.5,
              border: '2px solid #666666',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: '#f0f0f0',
                borderColor: '#333333',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}
          >
            ❌ Ningún Acceso
          </Button>
        </Box>
      )}
    </Dialog>
  );
};
// =========================================================================================
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
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          background: 'white'
        }
      }}
    >
      {/* HEADER ELEGANTE BERLLANO */}
      <Box sx={{ 
        p: 3,
        background: 'linear-gradient(135deg, #333333 0%, #555555 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
          pointerEvents: 'none'
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            width: 48, 
            height: 48, 
            background: 'rgba(255,255,255,0.15)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '24px',
            backdropFilter: 'blur(10px)'
          }}>🏦</Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Acceso a Cuentas Bancarias
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Gestiona los permisos de acceso a cuentas bancarias por usuario
            </Typography>
          </Box>
        </Box>
        <Button 
          onClick={onClose} 
          sx={{ 
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: 3,
            px: 2,
            py: 1,
            fontWeight: 600,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.2)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          ✕ Cerrar
        </Button>
      </Box>

      <DialogContent sx={{ 
        p: 3, 
        bgcolor: '#f5f5f5',
        minHeight: '500px', 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        
        {/* Formulario elegante para agregar */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 3, 
          p: 3, 
          background: 'white',
          borderRadius: 3,
          border: '1px solid #e0e0e0',
          alignItems: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            transform: 'translateY(-1px)'
          }
        }}>
          
          <TextField 
            select 
            label="Compañía" 
            size="small" 
            value={formNuevo.Cia} 
            sx={{ 
              minWidth: 180,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': { borderColor: '#333333' },
                '&.Mui-focused fieldset': { borderColor: '#333333' }
              }
            }}
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
            label="Cuenta Bancaria" 
            size="small" 
            value={formNuevo.Cuenta} 
            onChange={e => setFormNuevo({...formNuevo, Cuenta: e.target.value})} 
            sx={{ 
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': { borderColor: '#333333' },
                '&.Mui-focused fieldset': { borderColor: '#333333' }
              }
            }} 
            disabled={!formNuevo.Cia}
          >
            {catCuentas.map(c => <MenuItem key={c.id} value={c.id}>{c.descripcion}</MenuItem>)}
          </TextField>

          <TextField 
            select 
            label="Usuario" 
            size="small" 
            value={formNuevo.usuario} 
            onChange={e => setFormNuevo({...formNuevo, usuario: e.target.value})} 
            sx={{ 
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': { borderColor: '#333333' },
                '&.Mui-focused fieldset': { borderColor: '#333333' }
              }
            }}
          >
            {catUsuarios.map(u => <MenuItem key={u.id} value={u.id}>{u.descripcion}</MenuItem>)}
          </TextField>

          <TextField 
            select 
            label="Op. Tesorería" 
            size="small" 
            value={formNuevo.op_tesoreria} 
            onChange={e => setFormNuevo({...formNuevo, op_tesoreria: e.target.value})} 
            sx={{ 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': { borderColor: '#333333' },
                '&.Mui-focused fieldset': { borderColor: '#333333' }
              }
            }}
          >
            {catOpTesoreria.map(o => <MenuItem key={o.id} value={o.id}>{o.descripcion}</MenuItem>)}
          </TextField>

          <Button 
            variant="contained" 
            onClick={handleAgregar}
            sx={{ 
              background: '#333333',
              color: 'white',
              fontWeight: 600,
              borderRadius: 3,
              px: 3,
              py: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: '#555555',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }
            }}
          >
            ➕ Agregar
          </Button>
        </Box>

{/* Grid de Datos elegante */}
        <Box sx={{ 
          height: 450, 
          width: '100%',
          background: 'white',
          borderRadius: 3, 
          border: '1px solid #e0e0e0', 
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            transform: 'translateY(-1px)'
          }
        }}>
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
              '& .MuiDataGrid-root': { border: 'none' },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e0e0e0',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#495057'
              },
              '& .MuiDataGrid-row': { 
                transition: 'all 0.2s ease',
                '&:hover': { 
                  bgcolor: '#f0f0f0',
                  transform: 'scale(1.005)'
                }
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f1f3f4',
                fontSize: '0.875rem'
              },
              '& .MuiCheckbox-root': {
                color: '#333333',
                '&.Mui-checked': {
                  color: '#555555'
                }
              }
            }}
            columns={[
              { field: 'desc_cia', headerName: 'Compañía', width: 150 },
              { field: 'desc_cuenta', headerName: 'Cuenta Bancaria', flex: 1 },
              { field: 'nombre_usuario', headerName: 'Usuario', flex: 1 },
              { field: 'desc_op_tesoreria', headerName: 'Op. Tesorería', width: 200 },
              { field: 'permiso', headerName: 'Permiso', width: 90, sortable: false, filterable: false,
                renderCell: (p) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Checkbox 
                      checked={p.row.permiso} 
                      onChange={() => handleToggle(p.row, p.row.permiso)} 
                      color="default"
                      sx={{ 
                        '&.Mui-checked': {
                          color: '#333333'
                        }
                      }}
                    />
                  </Box>
                )
              },
              { field: 'acciones', headerName: '', width: 80, sortable: false, filterable: false,
                renderCell: (p) => (
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleEliminar(p.row)}
                    sx={{ 
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: '#ffebee',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
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


