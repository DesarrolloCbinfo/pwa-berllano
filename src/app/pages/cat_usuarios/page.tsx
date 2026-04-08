"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  Snackbar, Alert, Paper, MenuItem, IconButton 
} from '@mui/material'; 
import { 
  DataGrid, GridColDef, GridToolbar, 
  GridPaginationModel, GridPagination, GridRenderCellParams
} from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Swal from 'sweetalert2';

import useConsumoApi from '../../../hooks/useConsumoApi';
import { useSessionContext } from '../../../context/SessionProvider'; 

const commonProps = {
  fullWidth: true, size: "small" as const, variant: "outlined" as const,
  sx: {
    '& .MuiInputBase-root': { height: '50px', alignItems: 'center', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderColor: '#999' } },
    '& .MuiInputLabel-root': { transform: 'translate(14px, 14px) scale(1)', color: '#666', fontWeight: 500 },
    '& .MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)', color: '#333', fontWeight: 600 },
  }
};

const selectProps = {
    ...commonProps,
    SelectProps: { MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } }
};

function CustomPagination() { return <GridPagination />; }

const initialFormState = { 
    usuario: '', clave_perfiles: 0, password: '', 
    nombre: '', celular: '', telefono: '', email: '' 
};

export default function Usuarios() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  const isSavingRef = useRef(false);

  const [rows, setRows] = useState<any[]>([]);
  const [perfiles, setPerfiles] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
  const [formData, setFormData] = useState(initialFormState);
  
  // Función interceptora para SweetAlert2
  const setMessage = (msg: { text: string, type: 'success' | 'error' | 'info' } | null) => {
    if (!msg) return;
    
    // Si es un "info" (guardado de tabla DataGrid), mostramos un Toast rápido
    if (msg.type === 'info') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: msg.text,
            showConfirmButton: false,
            timer: 2000
        });
        return;
    }

    // Alertas estándar de SweetAlert2
    Swal.fire({
      title: msg.type === 'success' ? '¡Éxito!' : 'Error',
      text: msg.text,
      icon: msg.type,
      timer: msg.type === 'success' ? 2000 : undefined,
      showConfirmButton: msg.type !== 'success',
      confirmButtonColor: '#333'
    });
  };

  useEffect(() => { fetchCatalogos(); }, []);

  const fetchCatalogos = async () => {
      setLoading(true);
      try {
          // Cargamos la lista de perfiles
          const resPerfiles = await consumoApi.get('/api/Usuarios/sp_bw_cat_combo_perfiles');
          setPerfiles(Array.isArray(resPerfiles?.data) ? resPerfiles.data : []);

          // Cargamos la tabla principal de usuarios
          const resTabla = await consumoApi.get('/api/Usuarios/sp_bw_cat_usuarios_sel');
          setRows(Array.isArray(resTabla?.data) ? resTabla.data : []);
      } catch (error) {
          setMessage({ text: 'Error al cargar catálogos.', type: 'error' });
      } finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleAgregarNuevo = async () => {
        if (isSavingRef.current) return; 

        // Validaciones con SweetAlert directo (Warning)
        if (!formData.usuario.trim()) return Swal.fire('Atención', 'El Usuario es obligatorio.', 'warning');
        if (!formData.nombre.trim()) return Swal.fire('Atención', 'El Nombre es obligatorio.', 'warning');
        if (!formData.password.trim()) return Swal.fire('Atención', 'La Contraseña es obligatoria.', 'warning');
        if (formData.clave_perfiles === 0) return Swal.fire('Atención', 'Seleccione un Perfil válido.', 'warning');

        isSavingRef.current = true;
        setSaving(true);
        try {
            const payload = {
                usuario: formData.usuario.toUpperCase(),
                clave_perfiles: Number(formData.clave_perfiles),
                password: formData.password.toUpperCase(), 
                nombre: formData.nombre.toUpperCase(), 
                celular: formData.celular,
                telefono: formData.telefono,
                email: formData.email
            };

            const res = await consumoApi.post('/api/Usuarios/sp_bw_cat_usuarios_ins', payload);
            if (res.status === 200) {
                setMessage({ text: `Usuario agregado exitosamente.`, type: 'success' });
                fetchCatalogos();
                setFormData(initialFormState);
            }
        } catch (error: any) {
            setMessage({ text: error.response?.data?.mensaje || "Error al agregar el registro.", type: 'error' });
        } finally {
            isSavingRef.current = false;
            setSaving(false);
        }
    };

  const processRowUpdate = async (newRow: any, oldRow: any) => {
      if (
          newRow.clave_perfiles === oldRow.clave_perfiles &&
          newRow.password === oldRow.password &&
          newRow.nombre === oldRow.nombre &&
          newRow.celular === oldRow.celular &&
          newRow.telefono === oldRow.telefono &&
          newRow.email === oldRow.email
      ) return oldRow;

      try {
          const payload = {
              usuario: newRow.usuario,
              clave_perfiles: Number(newRow.clave_perfiles),
              password: newRow.password?.toUpperCase() || '',
              nombre: newRow.nombre?.toUpperCase() || '',
              celular: newRow.celular,
              telefono: newRow.telefono,
              email: newRow.email
          };

          const res = await consumoApi.put('/api/Usuarios/sp_bw_cat_usuarios_upd', payload);
          if (res.status === 200) {
              setMessage({ text: "💾 Cambios guardados automáticamente.", type: 'info' });
              return { ...newRow, nombre: payload.nombre, password: payload.password }; 
          } else throw new Error("Error en actualización");
      } catch (error) {
          setMessage({ text: "❌ Error al guardar los cambios.", type: 'error' });
          return oldRow;
      }
  };

const handleEliminar = async (clave: string) => {
      const confirmacion = await Swal.fire({
          title: '¿Estás seguro?',
          text: `¿Desea eliminar al usuario ${clave}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d32f2f',
          cancelButtonColor: '#333',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
      });

      if (!confirmacion.isConfirmed) return;

      setSaving(true);
      try {
          const res = await consumoApi.delete(`/api/Usuarios/sp_bw_cat_usuarios_del?usuario=${clave}`);
          if (res.status === 200) {
              setMessage({ text: "Usuario eliminado exitosamente.", type: 'success' });
              fetchCatalogos();
          }
      } catch (error: any) {
          setMessage({ text: error.response?.data?.mensaje || "Error al eliminar el registro.", type: 'error' });
      } finally {
          setSaving(false);
      }
  };

  const columns = useMemo<GridColDef[]>(() => [
        { 
        field: 'acciones', headerName: 'Eliminar', width: 90, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleEliminar(params.row.usuario)}>
                <DeleteIcon />
            </IconButton>
        )
    },
    { field: 'usuario', headerName: 'Usuario', width: 120, fontWeight: 'bold', align: 'center', headerAlign: 'center' },
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 200, editable: true, align: 'left', headerAlign: 'center' },
    { 
        field: 'clave_perfiles', headerName: 'Perfil ERP', width: 180, editable: true, align: 'center', headerAlign: 'center',
        type: 'singleSelect', valueOptions: [{ value: 0, label: '-- SELECCIONE --' }, ...perfiles.map(p => ({ value: p.id, label: p.descripcion }))]
    },
    { 
        field: 'password', headerName: 'Password', width: 120, editable: true, align: 'center', headerAlign: 'center',
        renderCell: () => '******' // Máscara para que no se vea en la tabla
    },
    { field: 'celular', headerName: 'Celular', width: 120, editable: true, align: 'center', headerAlign: 'center' },
    { field: 'telefono', headerName: 'Teléfono', width: 120, editable: true, align: 'center', headerAlign: 'center' },
    { field: 'email', headerName: 'Email', width: 200, editable: true, align: 'left', headerAlign: 'center' },

  ], [perfiles]);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
      <Paper sx={{ p: 3, borderRadius: '8px' }}>

        {/* ENCABEZADO */}
        <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Catálogo de Usuarios del Sistema
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                    Sucursal: {session?.dSucursal || 'Cargando...'}
                </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                    Usuario Activo: {session?.nombre || 'Cargando...'}
                </Typography>
            </Box>
        </Box>

        <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12} md={1}>
                <TextField {...commonProps} label="Usuario*" name="usuario" value={formData.usuario} onChange={handleInputChange} 
                    sx={{ width: '120px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField {...commonProps} label="Nombre Completo*" name="nombre" value={formData.nombre} onChange={handleInputChange} 
                    sx={{ width: '200px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={1}>
                <TextField {...selectProps} select label="Perfil ERP*" name="clave_perfiles" value={formData.clave_perfiles} onChange={handleInputChange}
                    sx={{ width: '120px', ...selectProps.sx }}>
                    <MenuItem value={0}>-- SELECCIONE --</MenuItem>
                    {perfiles.map(p => <MenuItem key={`p_${p.id}`} value={p.id}>{p.descripcion}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={1}>
                <TextField {...commonProps} type="password" label="Password*" name="password" value={formData.password} onChange={handleInputChange} 
                    sx={{ width: '120px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField {...commonProps} label="Email" name="email" value={formData.email} onChange={handleInputChange} 
                    sx={{ width: '200px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={1}>
                <TextField {...commonProps} label="Celular" name="celular" value={formData.celular} onChange={handleInputChange} 
                    sx={{ width: '120px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={1}>
                <TextField {...commonProps} label="Teléfono" name="telefono" value={formData.telefono} onChange={handleInputChange} 
                    sx={{ width: '120px', ...commonProps.sx }} />
            </Grid>
            <Grid item xs={12} md={2}>
                <Button variant="contained" onClick={handleAgregarNuevo} disabled={saving} fullWidth startIcon={<AddIcon />}
                    sx={{ 
                        height: '50px', backgroundColor: '#333333', color: 'white', fontWeight: 600, textTransform: 'none', borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', transition: 'all 0.3s ease',
                        '&:hover': { backgroundColor: '#555555', boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', transform: 'translateY(-1px)' }
                    }}>
                    AGREGAR
                </Button>
            </Grid>
        </Grid>
      </Paper>

        {/* TABLA PRINCIPAL */}
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 3, width: '100%', maxHeight: 600, mb: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
            <DataGrid 
                rows={Array.isArray(rows) ? rows : []} 
                columns={columns} 
                getRowId={(row) => row.usuario} 
                loading={loading || saving} 
                paginationModel={paginationModel} 
                onPaginationModelChange={setPaginationModel} 
                pageSizeOptions={[50, 100, 500]} 
                slots={{ toolbar: GridToolbar, pagination: CustomPagination }} 
                slotProps={{ toolbar: { showQuickFilter: true } }} 
                density="compact"
                disableRowSelectionOnClick
                processRowUpdate={processRowUpdate} 
                onProcessRowUpdateError={(error) => console.error(error)}
                sx={{ 
                    border: 'none', 
                    '& .MuiDataGrid-columnHeaders': { 
    borderBottom: '2px solid #000',
    textAlign: 'center',
    fontSize: '1rem',
    fontWeight: 'bold'
},
                    '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' },
                    '& .MuiDataGrid-cell--editable': { backgroundColor: '#f9fbfd', cursor: 'text' }, 
                    '& .MuiDataGrid-cell--editing': { backgroundColor: '#fff', boxShadow: '0 0 5px rgba(25,118,210,0.5)' }
                }} 
            />
          </Paper>
        </Box>

      {/* PIE DE PÁGINA */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          CAT_USUARIOS, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR:{session?.nombre || 'ADMIN'}
        </Typography>
      </Box>

    </Box>
  );
}