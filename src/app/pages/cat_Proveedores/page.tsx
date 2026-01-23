import { useEffect, useState } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { 
  Box, CircularProgress, Alert, Typography, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, IconButton, Grid, MenuItem 
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import useConsumoApi from '../../../hooks/useConsumoApi'
import PWABadge from "../../../PWABadge"

// --- 1. Interfaz de Datos ---
interface Proveedor {
  cve_prov: string
  nombre: string
  rfc: string
  curp: string
  calle: string
  colonia: string
  telefono: string
  ciudad: string
  estado: string
  cp: string
  contacto: string
  fax: string
  email: string
  observaciones: string
  nombre_fiscal: string
  dias_financiamiento: number
  descuento_general: number
  persona_fisica: number | boolean
  cuenta_contable: string
  sucursal_origen: number
  version: string
  Surte_Tienda: number | boolean
}

export default function CatProveedores() {
  const { consumoApi } = useConsumoApi()
  
  const [rows, setRows] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado inicial para limpiar formularios
  const initialState = {
    cve_prov: '', nombre: '', rfc: '', curp: '', calle: '', colonia: '',
    telefono: '', ciudad: '', estado: '', cp: '', contacto: '', fax: '',
    email: '', observaciones: '', nombre_fiscal: '', dias_financiamiento: 0,
    descuento_general: 0, persona_fisica: 0, cuenta_contable: '',
    sucursal_origen: 0, version: '', Surte_Tienda: 0
  }

  // --- 2. Estados para "Agregar" ---
  const [openAdd, setOpenAdd] = useState(false)
  const [formData, setFormData] = useState(initialState)
  const [saving, setSaving] = useState(false)

  // --- 3. Estados para "Editar" ---
  const [openEdit, setOpenEdit] = useState(false)
  const [editFormData, setEditFormData] = useState<any>(initialState)
  const [savingEdit, setSavingEdit] = useState(false)

  // --- 4. Estados para "Eliminar" ---
  const [openDelete, setOpenDelete] = useState(false)
  const [deleteRow, setDeleteRow] = useState<Proveedor | null>(null)
  const [deleting, setDeleting] = useState(false)

  // --- 5. Definición de Columnas ---
  const columns: GridColDef[] = [
    { field: 'cve_prov', headerName: 'Clave', width: 100 },
    { field: 'nombre', headerName: 'Nombre Comercial', width: 220 },
    { field: 'nombre_fiscal', headerName: 'Nombre Fiscal', width: 220 },
    { field: 'rfc', headerName: 'RFC', width: 130 },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton color="primary" onClick={() => {
            const data = { ...params.row };
            data.persona_fisica = data.persona_fisica ? 1 : 0;
            data.Surte_Tienda = data.Surte_Tienda ? 1 : 0;
            setEditFormData(data);
            setOpenEdit(true);
          }}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => {
            setDeleteRow(params.row);
            setOpenDelete(true);
          }}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ]

  // --- 6. Funciones de API ---
  const fetchProveedores = async () => {
    try {
      setLoading(true)
      const response = await consumoApi.get('/api/CatProveedores/sp_bw_cat_proveedores_sel?cve_prov=0')
      setRows(response.data)
    } catch (err) {
      setError('Error al cargar los proveedores')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchProveedores() }, [])

const handleAdd = async () => {
  try {
    setSaving(true);
    const response = await consumoApi.post('/api/CatProveedores/sp_bw_cat_proveedores_add', null, {
      params: {
        cve_prov: formData.cve_prov,
        nombre: formData.nombre || '',
        rfc: formData.rfc || '',
        curp: formData.curp || '',
        calle: formData.calle || '',
        colonia: formData.colonia || '',
        telefono: formData.telefono || '',
        ciudad: formData.ciudad || '',
        estado: formData.estado || '',
        cp: formData.cp || '',
        contacto: formData.contacto || '',
        fax: formData.fax || '',
        email: formData.email || '',
        observaciones: formData.observaciones || '',
        nombre_fiscal: formData.nombre_fiscal || '',
        dias_financiamiento: Number(formData.dias_financiamiento) || 0,
        descuento_general: Number(formData.descuento_general) || 0,
        fecha_alta: null, 
        // Enviamos booleano puro para que el nuevo C# (bool) lo reciba bien
        persona_fisica: formData.persona_fisica === 1,
        cuenta_contable: formData.cuenta_contable || '',
        sucursal_origen: Number(formData.sucursal_origen) || 0,
        version: formData.version || '',
        Surte_Tienda: formData.Surte_Tienda === 1
      },
    });

    if (response.data?.[0]?.codigo === 0) {
      setOpenAdd(false);
      setFormData(initialState);
      fetchProveedores();
    } else {
      alert(response.data?.[0]?.mensaje1 || 'Error al guardar');
    }
  } catch (err) {
    console.error("Error en Agregar:", err);
    alert('Error de conexión al guardar.');
  } finally {
    setSaving(false);
  }
};
const handleUpdate = async () => {
  try {
    setSavingEdit(true);

    const response = await consumoApi.put('/api/CatProveedores/sp_bw_cat_proveedores_upd', null, {
      params: {
        cve_prov: editFormData.cve_prov,
        nombre: editFormData.nombre || '',
        rfc: editFormData.rfc || '',
        curp: editFormData.curp || '',
        calle: editFormData.calle || '',
        colonia: editFormData.colonia || '',
        telefono: editFormData.telefono || '',
        ciudad: editFormData.ciudad || '',
        estado: editFormData.estado || '',
        cp: editFormData.cp || '',
        contacto: editFormData.contacto || '',
        fax: editFormData.fax || '',
        email: editFormData.email || '',
        observaciones: editFormData.observaciones || '',
        nombre_fiscal: editFormData.nombre_fiscal || '',
        dias_financiamiento: Number(editFormData.dias_financiamiento) || 0,
        descuento_general: Number(editFormData.descuento_general) || 0,
        persona_fisica: editFormData.persona_fisica === 1, 
        cuenta_contable: editFormData.cuenta_contable || '',
        sucursal_origen: Number(editFormData.sucursal_origen) || 0,
        version: editFormData.version || '',
        fecha_act: null, 
        Surte_Tienda: editFormData.Surte_Tienda === 1 
      },
    });

    if (response.data?.[0]?.codigo === 0) {
      setOpenEdit(false);
      fetchProveedores();
    } else {
      alert(response.data?.[0]?.mensaje1 || 'Error en respuesta de base de datos');
    }
  } catch (err: any) {
    console.error("Error de validación:", err.response?.data?.errors || err.message);
    alert('Error al actualizar. Verifica que los datos coincidan.');
  } finally {
    setSavingEdit(false);
  }
};

  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      setDeleting(true);
      const response = await consumoApi.delete('/api/CatProveedores/sp_bw_cat_proveedores_del', {
        params: { cve_prov: deleteRow.cve_prov },
      });
      if (response.data?.[0]?.codigo === 0) {
        setOpenDelete(false);
        fetchProveedores();
      } else { alert(response.data?.[0]?.mensaje1 || 'Error'); }
    } catch (err) { alert('Error de conexión'); } finally { setDeleting(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Catálogo de Proveedores</Typography>
      <Button variant="contained" onClick={() => setOpenAdd(true)} sx={{ mb: 2 }}>Nuevo Proveedor</Button>

      <DataGrid rows={rows} columns={columns} getRowId={(row) => row.cve_prov} autoHeight sx={{ backgroundColor: 'white' }} />

      {/* --- MODAL AGREGAR --- */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="md">
        <DialogTitle>Agregar Nuevo Proveedor</DialogTitle>
       <DialogContent sx={{ pt: 2 }}>
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="Clave" fullWidth value={formData.cve_prov} onChange={(e) => setFormData({...formData, cve_prov: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 5 }}><TextField label="Nombre Comercial" fullWidth value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 4 }}><TextField label="Nombre Fiscal" fullWidth value={formData.nombre_fiscal} onChange={(e) => setFormData({...formData, nombre_fiscal: e.target.value})} /></Grid>
    
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="RFC" fullWidth value={formData.rfc} onChange={(e) => setFormData({...formData, rfc: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="CURP" fullWidth value={formData.curp} onChange={(e) => setFormData({...formData, curp: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="Cuenta Contable" fullWidth value={formData.cuenta_contable} onChange={(e) => setFormData({...formData, cuenta_contable: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="Versión" fullWidth value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} /></Grid>
    
    <Grid size={{ xs: 12, sm: 4 }}><TextField label="Calle" fullWidth value={formData.calle} onChange={(e) => setFormData({...formData, calle: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 4 }}><TextField label="Colonia" fullWidth value={formData.colonia} onChange={(e) => setFormData({...formData, colonia: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 2 }}><TextField label="Ciudad" fullWidth value={formData.ciudad} onChange={(e) => setFormData({...formData, ciudad: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 2 }}><TextField label="Estado" fullWidth value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 2 }}><TextField label="CP" fullWidth value={formData.cp} onChange={(e) => setFormData({...formData, cp: e.target.value})} /></Grid>
    
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="Teléfono" fullWidth value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="Fax" fullWidth value={formData.fax} onChange={(e) => setFormData({...formData, fax: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 4 }}><TextField label="Email" fullWidth value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="Contacto" fullWidth value={formData.contacto} onChange={(e) => setFormData({...formData, contacto: e.target.value})} /></Grid>
    
    <Grid size={{ xs: 6, sm: 3 }}>
      <TextField select label="Persona Física" fullWidth value={formData.persona_fisica} onChange={(e) => setFormData({...formData, persona_fisica: Number(e.target.value)})}>
        <MenuItem value={1}>Sí (1)</MenuItem>
        <MenuItem value={0}>No (0)</MenuItem>
      </TextField>
    </Grid>
    <Grid size={{ xs: 6, sm: 3 }}>
      <TextField select label="Surte Tienda" fullWidth value={formData.Surte_Tienda} onChange={(e) => setFormData({...formData, Surte_Tienda: Number(e.target.value)})}>
        <MenuItem value={1}>Sí (1)</MenuItem>
        <MenuItem value={0}>No (0)</MenuItem>
      </TextField>
    </Grid>
    
    <Grid size={{ xs: 6, sm: 3 }}><TextField label="Sucursal Origen" type="number" fullWidth value={formData.sucursal_origen} onChange={(e) => setFormData({...formData, sucursal_origen: Number(e.target.value)})} /></Grid>
    <Grid size={{ xs: 6, sm: 3 }}><TextField label="Días Crédito" type="number" fullWidth value={formData.dias_financiamiento} onChange={(e) => setFormData({...formData, dias_financiamiento: Number(e.target.value)})} /></Grid>
    <Grid size={{ xs: 6, sm: 3 }}><TextField label="Descuento" type="number" fullWidth value={formData.descuento_general} onChange={(e) => setFormData({...formData, descuento_general: Number(e.target.value)})} /></Grid>
    <Grid size={{ xs: 12, sm: 9 }}><TextField label="Observaciones" fullWidth value={formData.observaciones} onChange={(e) => setFormData({...formData, observaciones: e.target.value})} /></Grid>
  </Grid>
</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
          <Button onClick={handleAdd} variant="contained" disabled={saving}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL EDITAR --- */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
        <DialogTitle>Editar Proveedor: {editFormData.cve_prov}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="Clave" disabled fullWidth value={editFormData.cve_prov} /></Grid>
    <Grid size={{ xs: 12, sm: 5 }}><TextField label="Nombre Comercial" fullWidth value={editFormData.nombre} onChange={(e) => setEditFormData({...editFormData, nombre: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 4 }}><TextField label="Nombre Fiscal" fullWidth value={editFormData.nombre_fiscal} onChange={(e) => setEditFormData({...editFormData, nombre_fiscal: e.target.value})} /></Grid>
    
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="RFC" fullWidth value={editFormData.rfc} onChange={(e) => setEditFormData({...editFormData, rfc: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="CURP" fullWidth value={editFormData.curp} onChange={(e) => setEditFormData({...editFormData, curp: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="Cuenta Contable" fullWidth value={editFormData.cuenta_contable} onChange={(e) => setEditFormData({...editFormData, cuenta_contable: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="Versión" fullWidth value={editFormData.version} onChange={(e) => setEditFormData({...editFormData, version: e.target.value})} /></Grid>
    
    <Grid size={{ xs: 12, sm: 4 }}><TextField label="Calle" fullWidth value={editFormData.calle} onChange={(e) => setEditFormData({...editFormData, calle: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 4 }}><TextField label="Colonia" fullWidth value={editFormData.colonia} onChange={(e) => setEditFormData({...editFormData, colonia: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 2 }}><TextField label="Ciudad" fullWidth value={editFormData.ciudad} onChange={(e) => setEditFormData({...editFormData, ciudad: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 2 }}><TextField label="Estado" fullWidth value={editFormData.estado} onChange={(e) => setEditFormData({...editFormData, estado: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 2 }}><TextField label="CP" fullWidth value={editFormData.cp} onChange={(e) => setEditFormData({...editFormData, cp: e.target.value})} /></Grid>
    
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="Teléfono" fullWidth value={editFormData.telefono} onChange={(e) => setEditFormData({...editFormData, telefono: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="Fax" fullWidth value={editFormData.fax} onChange={(e) => setEditFormData({...editFormData, fax: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 4 }}><TextField label="Email" fullWidth value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} /></Grid>
    <Grid size={{ xs: 12, sm: 3 }}><TextField label="Contacto" fullWidth value={editFormData.contacto} onChange={(e) => setEditFormData({...editFormData, contacto: e.target.value})} /></Grid>
    
    <Grid size={{ xs: 6, sm: 3 }}>
      <TextField select label="Persona Física" fullWidth value={editFormData.persona_fisica} onChange={(e) => setEditFormData({...editFormData, persona_fisica: Number(e.target.value)})}>
        <MenuItem value={1}>Sí (1)</MenuItem>
        <MenuItem value={0}>No (0)</MenuItem>
      </TextField>
    </Grid>
    <Grid size={{ xs: 6, sm: 3 }}>
      <TextField select label="Surte Tienda" fullWidth value={editFormData.Surte_Tienda} onChange={(e) => setEditFormData({...editFormData, Surte_Tienda: Number(e.target.value)})}>
        <MenuItem value={1}>Sí (1)</MenuItem>
        <MenuItem value={0}>No (0)</MenuItem>
      </TextField>
    </Grid>
    
    <Grid size={{ xs: 6, sm: 3 }}><TextField label="Sucursal Origen" type="number" fullWidth value={editFormData.sucursal_origen} onChange={(e) => setEditFormData({...editFormData, sucursal_origen: Number(e.target.value)})} /></Grid>
    <Grid size={{ xs: 6, sm: 3 }}><TextField label="Días Crédito" type="number" fullWidth value={editFormData.dias_financiamiento} onChange={(e) => setEditFormData({...editFormData, dias_financiamiento: Number(e.target.value)})} /></Grid>
    <Grid size={{ xs: 6, sm: 3 }}><TextField label="Descuento" type="number" fullWidth value={editFormData.descuento_general} onChange={(e) => setEditFormData({...editFormData, descuento_general: Number(e.target.value)})} /></Grid>
    <Grid size={{ xs: 12, sm: 9 }}><TextField label="Observaciones" fullWidth value={editFormData.observaciones} onChange={(e) => setEditFormData({...editFormData, observaciones: e.target.value})} /></Grid>
  </Grid>
</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button onClick={handleUpdate} variant="contained" disabled={savingEdit}>Actualizar</Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL ELIMINAR --- */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Eliminar</DialogTitle>
        <DialogContent>¿Deseas eliminar a <strong>{deleteRow?.nombre}</strong>?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </Box>
  )
}