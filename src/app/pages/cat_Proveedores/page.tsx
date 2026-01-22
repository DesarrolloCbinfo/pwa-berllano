import { useEffect, useState } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { 
  Box, CircularProgress, Alert, Typography, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, IconButton, Checkbox, FormControlLabel 
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
  persona_fisica: boolean
  cuenta_contable: string
  sucursal_origen: number
  version: string
  Surte_Tienda: boolean
  fecha_alta?: string
  fecha_act?: string | null
}

export default function CatProveedores() {
  const { consumoApi } = useConsumoApi()

  // --- Estados principales ---
  const [rows, setRows] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Agregar ---
  const [openAdd, setOpenAdd] = useState(false)
  const [formData, setFormData] = useState<Proveedor>({
    cve_prov: '', nombre: '', rfc: '', curp: '', calle: '', colonia: '',
    telefono: '', ciudad: '', estado: '', cp: '', contacto: '', fax: '', email: '',
    observaciones: '', nombre_fiscal: '', dias_financiamiento: 0, descuento_general: 0,
    persona_fisica: false, cuenta_contable: '', sucursal_origen: 0, version: '', Surte_Tienda: false
  })
  const [saving, setSaving] = useState(false)

  // --- Editar ---
  const [openEdit, setOpenEdit] = useState(false)
  const [editFormData, setEditFormData] = useState<Proveedor>({
    cve_prov: '', nombre: '', rfc: '', curp: '', calle: '', colonia: '',
    telefono: '', ciudad: '', estado: '', cp: '', contacto: '', fax: '', email: '',
    observaciones: '', nombre_fiscal: '', dias_financiamiento: 0, descuento_general: 0,
    persona_fisica: false, cuenta_contable: '', sucursal_origen: 0, version: '', Surte_Tienda: false
  })
  const [savingEdit, setSavingEdit] = useState(false)

  // --- Eliminar ---
  const [openDelete, setOpenDelete] = useState(false)
  const [deleteRow, setDeleteRow] = useState<Proveedor | null>(null)
  const [deleting, setDeleting] = useState(false)

  // --- Columnas ---
  const columns: GridColDef[] = [
    { field: 'cve_prov', headerName: 'Clave', width: 100 },
    { field: 'nombre', headerName: 'Nombre', width: 200 },
    { field: 'rfc', headerName: 'RFC', width: 120 },
    { field: 'curp', headerName: 'CURP', width: 150 },
    { field: 'telefono', headerName: 'Teléfono', width: 120 },
    { field: 'email', headerName: 'Email', width: 180 },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton color="primary" onClick={() => { setEditFormData(params.row); setOpenEdit(true); }}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => { setDeleteRow(params.row); setOpenDelete(true); }}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ]

  // --- Funciones de API ---
  const fetchProveedores = async () => {
    try {
      setLoading(true)
      const response = await consumoApi.get('/api/CatProveedores/sp_bw_cat_proveedores_sel?cve_prov=0')
      setRows(response.data)
    } catch (err) {
      setError('Error al cargar los proveedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProveedores() }, [])

  const handleAdd = async () => {
    if (!formData.cve_prov || !formData.nombre) return alert('Clave y nombre son obligatorios')
    try {
      setSaving(true)
      const response = await consumoApi.post('/api/CatProveedores/sp_bw_cat_proveedores_add', null, {
        params: {
          ...formData,
          dias_financiamiento: Number(formData.dias_financiamiento),
          descuento_general: Number(formData.descuento_general),
          persona_fisica: formData.persona_fisica ? 1 : 0,
          Surte_Tienda: formData.Surte_Tienda ? 1 : 0
        }
      })
      if (response.data?.[0]?.codigo === 0) {
        setOpenAdd(false)
        setFormData({
          cve_prov: '', nombre: '', rfc: '', curp: '', calle: '', colonia: '',
          telefono: '', ciudad: '', estado: '', cp: '', contacto: '', fax: '', email: '',
          observaciones: '', nombre_fiscal: '', dias_financiamiento: 0, descuento_general: 0,
          persona_fisica: false, cuenta_contable: '', sucursal_origen: 0, version: '', Surte_Tienda: false
        })
        fetchProveedores()
      } else {
        alert(response.data?.[0]?.mensaje1 || 'Error al guardar')
      }
    } catch {
      alert('Error de conexión')
    } finally { setSaving(false) }
  }

  const handleUpdate = async () => {
    try {
      setSavingEdit(true)
      const response = await consumoApi.put('/api/CatProveedores/sp_bw_cat_proveedores_upd', null, {
        params: {
          ...editFormData,
          dias_financiamiento: Number(editFormData.dias_financiamiento),
          descuento_general: Number(editFormData.descuento_general),
          persona_fisica: editFormData.persona_fisica ? 1 : 0,
          Surte_Tienda: editFormData.Surte_Tienda ? 1 : 0
        }
      })
      if (response.data?.[0]?.codigo === 0) {
        setOpenEdit(false)
        fetchProveedores()
      } else {
        alert(response.data?.[0]?.mensaje1 || 'Error al actualizar')
      }
    } catch {
      alert('Error de conexión')
    } finally { setSavingEdit(false) }
  }

  const handleDelete = async () => {
    if (!deleteRow) return
    try {
      setDeleting(true)
      const response = await consumoApi.delete('/api/CatProveedores/sp_bw_cat_proveedores_del', {
        params: { cve_prov: deleteRow.cve_prov }
      })
      if (response.data?.[0]?.codigo === 0) {
        setOpenDelete(false)
        fetchProveedores()
      } else {
        alert(response.data?.[0]?.mensaje1 || 'Error al eliminar')
      }
    } catch {
      alert('Error de conexión')
    } finally { setDeleting(false) }
  }

  // --- Renderizado ---
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Catálogo Proveedores</Typography>

      <Button variant="contained" onClick={() => setOpenAdd(true)} sx={{ mb: 2 }}>Nuevo Proveedor</Button>

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.cve_prov}
        autoHeight
        sx={{ backgroundColor: 'white', borderRadius: 2, boxShadow: 1 }}
      />

      {/* --- MODAL AGREGAR --- */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogTitle>Agregar Proveedor</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Clave" value={formData.cve_prov} onChange={e => setFormData({...formData, cve_prov: e.target.value})}/>
          <TextField label="Nombre" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}/>
          <TextField label="RFC" value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value})}/>
          <TextField label="CURP" value={formData.curp} onChange={e => setFormData({...formData, curp: e.target.value})}/>
          <TextField label="Calle" value={formData.calle} onChange={e => setFormData({...formData, calle: e.target.value})}/>
          <TextField label="Colonia" value={formData.colonia} onChange={e => setFormData({...formData, colonia: e.target.value})}/>
          <TextField label="Teléfono" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})}/>
          <TextField label="Ciudad" value={formData.ciudad} onChange={e => setFormData({...formData, ciudad: e.target.value})}/>
          <TextField label="Estado" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})}/>
          <TextField label="CP" value={formData.cp} onChange={e => setFormData({...formData, cp: e.target.value})}/>
          <TextField label="Contacto" value={formData.contacto} onChange={e => setFormData({...formData, contacto: e.target.value})}/>
          <TextField label="Fax" value={formData.fax} onChange={e => setFormData({...formData, fax: e.target.value})}/>
          <TextField label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}/>
          <TextField label="Observaciones" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})}/>
          <TextField label="Nombre Fiscal" value={formData.nombre_fiscal} onChange={e => setFormData({...formData, nombre_fiscal: e.target.value})}/>
          <TextField label="Días Financiamiento" type="number" value={formData.dias_financiamiento} onChange={e => setFormData({...formData, dias_financiamiento: Number(e.target.value)})}/>
          <TextField label="Descuento General" type="number" value={formData.descuento_general} onChange={e => setFormData({...formData, descuento_general: Number(e.target.value)})}/>
          <TextField label="Cuenta Contable" value={formData.cuenta_contable} onChange={e => setFormData({...formData, cuenta_contable: e.target.value})}/>
          <TextField label="Sucursal Origen" type="number" value={formData.sucursal_origen} onChange={e => setFormData({...formData, sucursal_origen: Number(e.target.value)})}/>
          <TextField label="Versión" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})}/>
          <FormControlLabel control={<Checkbox checked={formData.persona_fisica} onChange={e => setFormData({...formData, persona_fisica: e.target.checked})}/>} label="Persona Física"/>
          <FormControlLabel control={<Checkbox checked={formData.Surte_Tienda} onChange={e => setFormData({...formData, Surte_Tienda: e.target.checked})}/>} label="Surte Tienda"/>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
          <Button onClick={handleAdd} variant="contained" disabled={saving}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL EDITAR --- */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar Proveedor</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Clave" disabled value={editFormData.cve_prov}/>
          <TextField label="Nombre" value={editFormData.nombre} onChange={e => setEditFormData({...editFormData, nombre: e.target.value})}/>
          <TextField label="RFC" value={editFormData.rfc} onChange={e => setEditFormData({...editFormData, rfc: e.target.value})}/>
          <TextField label="CURP" value={editFormData.curp} onChange={e => setEditFormData({...editFormData, curp: e.target.value})}/>
          <TextField label="Calle" value={editFormData.calle} onChange={e => setEditFormData({...editFormData, calle: e.target.value})}/>
          <TextField label="Colonia" value={editFormData.colonia} onChange={e => setEditFormData({...editFormData, colonia: e.target.value})}/>
          <TextField label="Teléfono" value={editFormData.telefono} onChange={e => setEditFormData({...editFormData, telefono: e.target.value})}/>
          <TextField label="Ciudad" value={editFormData.ciudad} onChange={e => setEditFormData({...editFormData, ciudad: e.target.value})}/>
          <TextField label="Estado" value={editFormData.estado} onChange={e => setEditFormData({...editFormData, estado: e.target.value})}/>
          <TextField label="CP" value={editFormData.cp} onChange={e => setEditFormData({...editFormData, cp: e.target.value})}/>
          <TextField label="Contacto" value={editFormData.contacto} onChange={e => setEditFormData({...editFormData, contacto: e.target.value})}/>
          <TextField label="Fax" value={editFormData.fax} onChange={e => setEditFormData({...editFormData, fax: e.target.value})}/>
          <TextField label="Email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})}/>
          <TextField label="Observaciones" value={editFormData.observaciones} onChange={e => setEditFormData({...editFormData, observaciones: e.target.value})}/>
          <TextField label="Nombre Fiscal" value={editFormData.nombre_fiscal} onChange={e => setEditFormData({...editFormData, nombre_fiscal: e.target.value})}/>
          <TextField label="Días Financiamiento" type="number" value={editFormData.dias_financiamiento} onChange={e => setEditFormData({...editFormData, dias_financiamiento: Number(e.target.value)})}/>
          <TextField label="Descuento General" type="number" value={editFormData.descuento_general} onChange={e => setEditFormData({...editFormData, descuento_general: Number(e.target.value)})}/>
          <TextField label="Cuenta Contable" value={editFormData.cuenta_contable} onChange={e => setEditFormData({...editFormData, cuenta_contable: e.target.value})}/>
          <TextField label="Sucursal Origen" type="number" value={editFormData.sucursal_origen} onChange={e => setEditFormData({...editFormData, sucursal_origen: Number(e.target.value)})}/>
          <TextField label="Versión" value={editFormData.version} onChange={e => setEditFormData({...editFormData, version: e.target.value})}/>
          <FormControlLabel control={<Checkbox checked={editFormData.persona_fisica} onChange={e => setEditFormData({...editFormData, persona_fisica: e.target.checked})}/>} label="Persona Física"/>
          <FormControlLabel control={<Checkbox checked={editFormData.Surte_Tienda} onChange={e => setEditFormData({...editFormData, Surte_Tienda: e.target.checked})}/>} label="Surte Tienda"/>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button onClick={handleUpdate} variant="contained" disabled={savingEdit}>Actualizar</Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL ELIMINAR --- */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Eliminar</DialogTitle>
        <DialogContent>¿Deseas eliminar el proveedor: <strong>{deleteRow?.nombre}</strong>?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </Box>
  )
}
