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
    { field: 'formulario', headerName: 'Nombre del Módulo / Formulario', flex: 1 },
    { field: 'fecha_act', headerName: 'Últ. Modificación', width: 150, valueFormatter: (v) => v ? String(v).split('T')[0] : '' },
  ];

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      
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
          <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            
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

            {/* Botón abajo */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => { setPerfilForm({ clave_perfil: 0, descripcion_perfil: '' }); setOpenModal(true); }} 
                sx={{ bgcolor: '#333', py: 1, fontWeight: 'bold' }}
              >
                + Nuevo Perfil
              </Button>
            </Box>

          </Box>
        </Grid>

{/* PANEL DERECHO: PERMISOS */}
        <Grid item xs={12} md={7}>
          <Box sx={{ 
            bgcolor: 'white', 
            p: 2, 
            borderRadius: 2, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
            height: 'calc(100vh - 120px)', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            
            {!perfilSeleccionado ? (
              <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#999' }}>
                <Typography variant="h1">👈</Typography>
                <Typography variant="h6">Seleccione un perfil de la lista para gestionar sus accesos</Typography>
              </Box>
            ) : (
              <>
                {/* Encabezado sin botones */}
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

               {/* Botones abajo */}
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  {/* Botones Extra a la Izquierda */}
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={() => setOpenModalMovProv(true)}
                      sx={{ fontWeight: 'bold' }}
                    >
                      Permisos por movimientos
                    </Button>
                    
                    <Button 
  variant="outlined" 
  color="secondary" 
  onClick={() => setOpenModalCuentas(true)} // <-- AQUÍ
  sx={{ fontWeight: 'bold' }}
>
  Acceso a cuentas bancarias
</Button>
                  </Box>

                  {/* Botones de Acción Masiva a la Derecha */}
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handlePermisosMasivo(true)}>
                      Acceso Total
                    </Button>
                    <Button variant="contained" color="error" startIcon={<CancelIcon />} onClick={() => handlePermisosMasivo(false)}>
                      Ningún Acceso
                    </Button>
                  </Box>
                  
                </Box>
              </>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* MODAL CREAR/EDITAR PERFIL */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#333', color: 'white', fontWeight: 'bold' }}>
          {perfilForm.clave_perfil === 0 ? "Crear Nuevo Perfil" : "Editar Perfil"}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            {perfilForm.clave_perfil === 0 ? "Al crear un nuevo perfil, se le asignarán automáticamente todos los módulos del sistema con acceso denegado (apagado)." : ""}
          </Typography>
          <TextField 
            fullWidth 
            label="Nombre / Descripción del Perfil" 
            variant="outlined" 
            value={perfilForm.descripcion_perfil}
            onChange={(e) => setPerfilForm({ ...perfilForm, descripcion_perfil: e.target.value })}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenModal(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleGuardarPerfil} variant="contained" color="primary">Guardar Perfil</Button>
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box sx={{ p: 2, bgcolor: '#333', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">Permisos por Movimientos de Proveedor</Typography>
        <Button onClick={onClose} sx={{ color: 'white' }}>Cerrar</Button>
      </Box>
      <DialogContent sx={{ p: 3, bgcolor: '#f5f5f5', height: '600px' }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          
          {/* LADO IZQUIERDO: PERFILES */}
          <Grid item xs={5} sx={{ height: '100%' }}>
            <Box sx={{ bgcolor: 'white', p: 1, borderRadius: 2, height: '100%', border: '1px solid #ccc', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Typography fontWeight="bold" sx={{ mb: 1, p: 1 }}>Perfiles</Typography>
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
                  sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' }, '& .MuiDataGrid-row:hover': { bgcolor: '#f0f8ff' } }}
                />
              </Box>
            </Box>
          </Grid>

          {/* LADO DERECHO: MOVIMIENTOS */}
          <Grid item xs={7} sx={{ height: '100%' }}>
            <Box sx={{ bgcolor: 'white', p: 1, borderRadius: 2, height: '100%', border: '1px solid #ccc', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {!perfilSeleccionado ? (
                 <Typography sx={{ p: 2, color: '#999', textAlign: 'center', mt: 10 }}>Seleccione un perfil a la izquierda</Typography>
              ) : (
                <>
                  <Typography fontWeight="bold" sx={{ mb: 1, p: 1, color: '#1976d2' }}>
                    {perfilSeleccionado.descripcion_perfil}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <DataGrid 
                      rows={permisosMov} 
                      columns={[
                        { field: 'permiso', headerName: 'Acceso', width: 80, renderCell: (p) => <Checkbox checked={p.row.permiso} onChange={() => handleToggle(p.row.clave_movto, p.row.permiso)} color="success"/> },
                        { field: 'clave_movto', headerName: 'Clave Movimiento', flex: 1 }
                      ]} 
                      getRowId={(row) => row.clave_movto} 
                      loading={loading}
                      density="compact"
                      disableRowSelectionOnClick
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, p: 1, borderTop: '1px solid #eee' }}>
                    <Button size="small" variant="contained" color="success" onClick={() => handleMasivo(true)}>Acceso Total</Button>
                    <Button size="small" variant="contained" color="error" onClick={() => handleMasivo(false)}>Ningún Acceso</Button>
                  </Box>
                </>
              )}
            </Box>
          </Grid>

        </Grid>
      </DialogContent>
    </Dialog>
  );
};// =========================================================================================
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
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <Box sx={{ p: 2, bgcolor: '#9c27b0', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">Acceso a Cuentas Bancarias y Usuarios</Typography>
        <Button onClick={onClose} sx={{ color: 'white' }}>Cerrar</Button>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Formulario para agregar (Con Combos Dinámicos) */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #ddd', alignItems: 'center' }}>
          
          <TextField select label="Cía" size="small" value={formNuevo.Cia} sx={{ minWidth: 150 }}
            onChange={e => {
              const nuevaCia = e.target.value;
              setFormNuevo({...formNuevo, Cia: nuevaCia, Cuenta: ''});
              fetchCuentasCascada(Number(nuevaCia));
            }} 
          >
            {catCias.map(c => <MenuItem key={c.id} value={c.id}>{c.descripcion}</MenuItem>)}
          </TextField>

          <TextField select label="Cuenta Bancaria" size="small" value={formNuevo.Cuenta} onChange={e => setFormNuevo({...formNuevo, Cuenta: e.target.value})} sx={{ flex: 1 }} disabled={!formNuevo.Cia}>
            {catCuentas.map(c => <MenuItem key={c.id} value={c.id}>{c.descripcion}</MenuItem>)}
          </TextField>

          <TextField select label="Usuario" size="small" value={formNuevo.usuario} onChange={e => setFormNuevo({...formNuevo, usuario: e.target.value})} sx={{ flex: 1 }}>
            {catUsuarios.map(u => <MenuItem key={u.id} value={u.id}>{u.descripcion}</MenuItem>)}
          </TextField>

          <TextField select label="Op. Tesorería" size="small" value={formNuevo.op_tesoreria} onChange={e => setFormNuevo({...formNuevo, op_tesoreria: e.target.value})} sx={{ minWidth: 180 }}>
            {catOpTesoreria.map(o => <MenuItem key={o.id} value={o.id}>{o.descripcion}</MenuItem>)}
          </TextField>

          <Button variant="contained" color="secondary" onClick={handleAgregar}>+ Agregar</Button>
        </Box>

        {/* Grid de Datos (Muestra nombres descriptivos) */}
        <Box sx={{ flexGrow: 1, bgcolor: 'white', borderRadius: 2, border: '1px solid #ddd', overflow: 'hidden' }}>
          <DataGrid 
            rows={datos} 
            getRowId={(row) => `${row.Cia}-${row.Cuenta}-${row.usuario}-${row.op_tesoreria}`} 
            loading={loading}
            density="compact"
            disableRowSelectionOnClick
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true } }}
            columns={[
              { field: 'desc_cia', headerName: 'Compañía', width: 150 },
              { field: 'desc_cuenta', headerName: 'Cuenta Bancaria', flex: 1 },
              { field: 'nombre_usuario', headerName: 'Usuario', flex: 1 },
              { field: 'desc_op_tesoreria', headerName: 'Op. Tesorería', width: 200 },
              { field: 'permiso', headerName: 'Permiso', width: 90, sortable: false, filterable: false,
                renderCell: (p) => <Checkbox checked={p.row.permiso} onChange={() => handleToggle(p.row, p.row.permiso)} color="success"/> 
              },
              { field: 'acciones', headerName: '', width: 50, sortable: false, filterable: false,
                renderCell: (p) => <IconButton size="small" color="error" onClick={() => handleEliminar(p.row)}><DeleteIcon fontSize="small"/></IconButton>
              }
            ]} 
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};


