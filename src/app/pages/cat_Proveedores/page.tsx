import { useEffect, useState } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { 
  Box, CircularProgress, Typography, Button, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, 
  IconButton, FormControlLabel, Checkbox, Divider, Paper
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import useConsumoApi from '../../../hooks/useConsumoApi'
import PWABadge from "../../../PWABadge"

// 1. INTERFAZ COMPLETA (24 CAMPOS)
interface CatProveedor {
  cve_prov: string; nombre: string; rfc: string | null; curp: string | null;
  calle: string | null; colonia: string | null; telefono: string | null;
  ciudad: string | null; estado: string | null; cp: string | null;
  contacto: string | null; fax: string | null; email: string | null;
  observaciones: string | null; nombre_fiscal: string | null;
  dias_financiamiento: number; descuento_general: number; persona_fisica: boolean;
  cuenta_contable: string | null; sucursal_origen: number;
  version: string | null;  Surte_Tienda: boolean;
}

export default function CatProveedores() {
  const { consumoApi } = useConsumoApi()
  const [rows, setRows] = useState<CatProveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [openForm, setOpenForm] = useState(false)
  const [openView, setOpenView] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ESTADO INICIAL ACTUALIZADO
  const initialFormState: CatProveedor = {
    cve_prov: '', nombre: '', rfc: '', curp: '', calle: '', colonia: '',
    telefono: '', ciudad: '', estado: '', cp: '', contacto: '', fax: '',
    email: '', observaciones: '', nombre_fiscal: '', dias_financiamiento: 0,
    descuento_general: 0, persona_fisica: true, cuenta_contable: '', sucursal_origen: 0,
    version: '1', Surte_Tienda: false
  }

  const [formData, setFormData] = useState<CatProveedor>(initialFormState)

  const columns: GridColDef[] = [
    { field: 'cve_prov', headerName: 'Clave', width: 90 },
    { field: 'nombre', headerName: 'Nombre Comercial', width: 250 },
    { field: 'nombre_fiscal', headerName: 'Razón Social', width: 250 },
    { field: 'rfc', headerName: 'RFC', width: 140 },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton color="info" onClick={() => { setFormData(params.row); setOpenView(true); }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton color="primary" onClick={() => { setEditMode(true); setFormData(params.row); setOpenForm(true); }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton color="error" onClick={() => { setSelectedId(params.row.cve_prov); setOpenDelete(true); }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ]

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get('/api/CatProveedores/sp_bw_cat_proveedores_sel?cve_prov=0')
      setRows(response.data)
    } catch (err) { console.error("Error fetching:", err) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProveedores() }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const payload = {
        ...formData,
        dias_financiamiento: Number(formData.dias_financiamiento) || 0,
        descuento_general: Number(formData.descuento_general) || 0,
        sucursal_origen: Number(formData.sucursal_origen) || 0,
        persona_fisica: formData.persona_fisica ? 1 : 0,
        Surte_Tienda: formData.Surte_Tienda ? 1 : 0
      }

      const endpoint = editMode 
        ? '/api/CatProveedores/sp_bw_cat_proveedores_upd' 
        : '/api/CatProveedores/sp_bw_cat_proveedores_add'
      
      const response = await consumoApi({
        method: editMode ? 'PUT' : 'POST',
        url: endpoint,
        params: payload 
      })

      if (response.data?.[0]?.codigo === 0) {
        setOpenForm(false)
        fetchProveedores()
      } else {
        alert("Aviso del Servidor: " + (response.data?.[0]?.mensaje1 || "Error desconocido"))
      }
    } catch (err: any) {
      alert("Error al procesar: " + (err.response?.data?.mensaje1 || err.message))
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      setSaving(true)
      const response = await consumoApi.delete('/api/CatProveedores/sp_bw_cat_proveedores_del', { 
        params: { cve_prov: selectedId } 
      })
      if (response.data?.[0]?.codigo === 0) {
        setOpenDelete(false)
        fetchProveedores()
      }
    } catch (err) { alert("Error al eliminar") } 
    finally { setSaving(false) }
  }

  if (loading && rows.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Catálogo de Proveedores</Typography>
        <Button variant="contained" onClick={() => { setEditMode(false); setFormData(initialFormState); setOpenForm(true); }}>
          Nuevo Proveedor
        </Button>
      </Box>

      <DataGrid rows={rows} columns={columns} getRowId={(row) => row.cve_prov} autoHeight sx={{ bgcolor: 'white' }} />

      {/* VENTANA DETALLES */}
      <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'info.main', color: 'white' }}>Detalles del Proveedor</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f5f5f5' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Section title="I. Identificación">
              <DataField label="Clave" value={formData.cve_prov} />
              <DataField label="Nombre Comercial" value={formData.nombre} />
              <DataField label="RFC" value={formData.rfc} />
              <DataField label="CURP" value={formData.curp} />
              <DataField label="Razón Social" value={formData.nombre_fiscal} />
              <DataField label="Cuenta Contable" value={formData.cuenta_contable} />
            </Section>
            <Section title="II. Contacto">
              <DataField label="Calle" value={formData.calle} />
              <DataField label="Colonia" value={formData.colonia} />
              <DataField label="Ciudad" value={formData.ciudad} />
              <DataField label="Estado" value={formData.estado} />
              <DataField label="CP" value={formData.cp} />
              <DataField label="Teléfono" value={formData.telefono} />
              <DataField label="Email" value={formData.email} />
              <DataField label="Contacto (Atención)" value={formData.contacto} />
              <DataField label="Fax" value={formData.fax} />
            </Section>
            <Section title="III. Otros">
              <DataField label="Días Fin." value={formData.dias_financiamiento} />
              <DataField label="% Desc." value={formData.descuento_general} />
              <DataField label="Sucursal Origen" value={formData.sucursal_origen} />
              <DataField label="Versión" value={formData.version} />
              <DataField label="Persona Física" value={formData.persona_fisica ? 'SÍ' : 'NO'} />
              <DataField label="Surte Tienda" value={formData.Surte_Tienda ? 'SÍ' : 'NO'} />
            </Section>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>OBSERVACIONES</Typography>
              <Paper variant="outlined" sx={{ p: 1, minHeight: 40 }}>{formData.observaciones || 'Sin notas'}</Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* VENTANA FORMULARIO - CAMPOS FALTANTES AGREGADOS */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Clave" size="small" disabled={editMode} inputProps={{ maxLength: 20 }} value={formData.cve_prov} onChange={(e) => setFormData({ ...formData, cve_prov: e.target.value })} />
              <TextField label="Nombre Comercial" fullWidth size="small" inputProps={{ maxLength: 20 }} value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
            </Box>
            
            <TextField label="Razón Social (Nombre Fiscal)" fullWidth size="small" inputProps={{ maxLength: 100 }} value={formData.nombre_fiscal || ''} onChange={(e) => setFormData({ ...formData, nombre_fiscal: e.target.value })} />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="RFC" size="small" inputProps={{ maxLength: 20 }} value={formData.rfc || ''} onChange={(e) => setFormData({ ...formData, rfc: e.target.value })} />
              <TextField label="CURP" size="small" inputProps={{ maxLength: 100 }} value={formData.curp || ''} onChange={(e) => setFormData({ ...formData, curp: e.target.value })} />
              <TextField label="Cuenta Contable" size="small" inputProps={{ maxLength: 20 }} value={formData.cuenta_contable || ''} onChange={(e) => setFormData({ ...formData, cuenta_contable: e.target.value })} />
            </Box>
            
            <Divider>Ubicación y Contacto</Divider>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Calle" fullWidth size="small" inputProps={{ maxLength: 100 }} value={formData.calle || ''} onChange={(e) => setFormData({ ...formData, calle: e.target.value })} />
              <TextField label="Colonia" fullWidth size="small" inputProps={{ maxLength: 50 }} value={formData.colonia || ''} onChange={(e) => setFormData({ ...formData, colonia: e.target.value })} />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Ciudad" size="small" inputProps={{ maxLength: 50 }} value={formData.ciudad || ''} onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })} />
              <TextField label="Estado" size="small" inputProps={{ maxLength: 50 }} value={formData.estado || ''} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} />
              <TextField label="CP" size="small" inputProps={{ maxLength: 10 }} value={formData.cp || ''} onChange={(e) => setFormData({ ...formData, cp: e.target.value })} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Email" fullWidth size="small" inputProps={{ maxLength: 50 }} value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <TextField label="Teléfono" fullWidth size="small" inputProps={{ maxLength: 100 }} value={formData.telefono || ''} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Contacto (Atención)" fullWidth size="small" inputProps={{ maxLength: 80 }} value={formData.contacto || ''} onChange={(e) => setFormData({ ...formData, contacto: e.target.value })} />
              <TextField label="Fax" fullWidth size="small" inputProps={{ maxLength: 100 }} value={formData.fax || ''} onChange={(e) => setFormData({ ...formData, fax: e.target.value })} />
            </Box>
            
            <Divider>Configuración y Crédito</Divider>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField label="Días Financiamiento" type="number" size="small" value={formData.dias_financiamiento} onChange={(e) => setFormData({ ...formData, dias_financiamiento: Number(e.target.value) })} />
              <TextField label="% Descuento" type="number" size="small" value={formData.descuento_general} onChange={(e) => setFormData({ ...formData, descuento_general: Number(e.target.value) })} />
              <TextField label="Sucursal Origen" type="number" size="small" value={formData.sucursal_origen} onChange={(e) => setFormData({ ...formData, sucursal_origen: Number(e.target.value) })} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField label="Versión" size="small" inputProps={{ maxLength: 50 }} value={formData.version || ''} onChange={(e) => setFormData({ ...formData, version: e.target.value })} />
              <FormControlLabel control={<Checkbox checked={formData.persona_fisica} onChange={(e) => setFormData({ ...formData, persona_fisica: e.target.checked })} />} label="Persona Física" />
              <FormControlLabel control={<Checkbox checked={formData.Surte_Tienda} onChange={(e) => setFormData({ ...formData, Surte_Tienda: e.target.checked })} />} label="Surte Tienda" />
            </Box>

            <TextField label="Observaciones" multiline rows={2} fullWidth size="small" inputProps={{ maxLength: 100 }} value={formData.observaciones || ''} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VENTANA ELIMINAR */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>¿Eliminar el proveedor {selectedId}?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={saving}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </Box>
  )
}

function Section({ title, children }: any) {
  return (
    <Box>
      <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1.5 }}>
        {children}
      </Box>
    </Box>
  )
}

function DataField({ label, value }: any) {
  return (
    <Box sx={{ p: 1, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{value !== null && value !== undefined && value !== '' ? value : '---'}</Typography>
    </Box>
  )
}