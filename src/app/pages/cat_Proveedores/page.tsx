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

  // --- INTERFAZ ---
  interface Proveedor {
    cve_prov: string
    nombre: string
    rfc: string | null
    curp: string | null
    calle: string | null
    colonia: string | null
    telefono: string | null
    ciudad: string | null
    estado: string | null
    cp: string | null
    contacto: string | null
    fax: string | null
    email: string | null
    observaciones: string | null
    nombre_fiscal: string | null
    dias_financiamiento: number
    descuento_general: number
    fecha_alta: string | null
    persona_fisica: boolean
    cuenta_contable: string | null
    sucursal_origen: number
    version: string 
    fecha_act: string | null
    Surte_Tienda: boolean
    
    
  }

  export default function CatProveedores() {
    const { consumoApi } = useConsumoApi()

    // --- ESTADOS ---
    const [rows, setRows] = useState<Proveedor[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const emptyProveedor: Proveedor = {
      cve_prov: '',
      nombre: '',
      rfc: null,
      curp: null,
      calle: null,
      colonia: null,
      telefono: null,
      ciudad: null,
      estado: null,
      cp: null,
      contacto: null,
      fax: null,
      email: null,
      observaciones: null,
      nombre_fiscal: null,
      dias_financiamiento: 0,
      descuento_general: 0,
      fecha_alta: null,
      persona_fisica: false,
      cuenta_contable: null,
      sucursal_origen: 0,
      version: '1.0',
      fecha_act: null,
      Surte_Tienda: false,
    }

  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)

  const [formData, setFormData] = useState<Proveedor>(emptyProveedor)
  const [editFormData, setEditFormData] = useState<Proveedor>(emptyProveedor)
  const [deleteRow, setDeleteRow] = useState<Proveedor | null>(null)

  const [saving, setSaving] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // --- COLUMNAS ---
  const columns: GridColDef[] = [
    { field: 'cve_prov', headerName: 'Clave', width: 100 },
    { field: 'nombre', headerName: 'Nombre', width: 250 },
    { field: 'rfc', headerName: 'RFC', width: 150 },
    { field: 'nombre_fiscal', headerName: 'Nombre Fiscal', width: 250 },
    { field: 'dias_financiamiento', headerName: 'Días', width: 80 },
    { field: 'descuento_general', headerName: 'Descuento', width: 100 },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton color="primary" onClick={() => {
            setEditFormData(params.row)
            setOpenEdit(true)
          }}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => {
            setDeleteRow(params.row)
            setOpenDelete(true)
          }}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ]

  // --- SELECT ---
  const fetchProveedores = async () => {
    try {
      setLoading(true)
      const response = await consumoApi.get(
        '/api/CatProveedores/sp_bw_cat_proveedores_sel',
        { params: { cve_prov: 0 } }
      )
      setRows(response.data)
    } catch {
      setError('Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProveedores()
  }, [])

  // --- ADD ---
const handleAdd = async () => {
  if (!formData.nombre) return;

  try {
    setSaving(true);

    const response = await consumoApi.post(
      '/api/CatProveedores/sp_bw_cat_proveedores_add',
      null,
      {
        params: {
          cve_prov: Number(formData.cve_prov || 0),
          nombre: formData.nombre,
          rfc: formData.rfc,
          curp: formData.curp,
          calle: formData.calle,
          colonia: formData.colonia,
          telefono: formData.telefono,
          ciudad: formData.ciudad,
          estado: formData.estado,
          cp: formData.cp,
          contacto: formData.contacto,
          fax: formData.fax,
          email: formData.email,
          observaciones: formData.observaciones,
          nombre_fiscal: formData.nombre_fiscal,
          dias_financiamiento: formData.dias_financiamiento,
          descuento_general: formData.descuento_general,
          fecha_alta: "20260101", // 🔑 formato válido
          persona_fisica: formData.persona_fisica,
          cuenta_contable: formData.cuenta_contable,
          sucursal_origen: formData.sucursal_origen,
          version: formData.version || '1.0',
          Surte_Tienda: formData.Surte_Tienda,
        },
      }
    );

    if (response.data?.[0]?.codigo === 0) {
      setOpenAdd(false);
      setFormData(emptyProveedor);
      fetchProveedores();
    } else {
      alert(response.data?.[0]?.mensaje1 || 'Error al guardar');
    }
  } catch (err: any) {
    alert('Error de conexión');
    console.error(err.response?.data);
  } finally {
    setSaving(false);
  }
};



  // --- UPDATE ---
const handleUpdate = async () => {
  try {
    setSavingEdit(true);

    const response = await consumoApi.put(
      '/api/CatProveedores/sp_bw_cat_proveedores_upd',
      null,
      {
        params: {
          cve_prov: editFormData.cve_prov,
          nombre: editFormData.nombre,
          rfc: editFormData.rfc,
          curp: editFormData.curp,
          calle: editFormData.calle,
          colonia: editFormData.colonia,
          telefono: editFormData.telefono,
          ciudad: editFormData.ciudad,
          estado: editFormData.estado,
          cp: editFormData.cp,
          contacto: editFormData.contacto,
          fax: editFormData.fax,
          email: editFormData.email,
          observaciones: editFormData.observaciones,
          nombre_fiscal: editFormData.nombre_fiscal,
          dias_financiamiento: editFormData.dias_financiamiento,
          descuento_general: editFormData.descuento_general,
          fecha_act: '2026-01-01', // 🔑 evita SqlDateTime overflow
          persona_fisica: editFormData.persona_fisica,
          cuenta_contable: editFormData.cuenta_contable,
          sucursal_origen: editFormData.sucursal_origen,
          version: editFormData.version || '1.0',
          Surte_Tienda: editFormData.Surte_Tienda,
        },
      }
    );

    if (response.data?.[0]?.codigo === 0) {
      setOpenEdit(false);
      fetchProveedores();
    } else {
      alert(response.data?.[0]?.mensaje1 || 'Error al actualizar');
    }
  } catch (err) {
    alert('Error de conexión');
    console.error(err);
  } finally {
    setSavingEdit(false);
  }
};



  // --- DELETE ---
  const handleDelete = async () => {
    if (!deleteRow) return
    try {
      setDeleting(true)
      const response = await consumoApi.delete(
        '/api/CatProveedores/sp_bw_cat_proveedores_del',
        { params: { cve_prov: deleteRow.cve_prov } }
      )

      if (response.data?.[0]?.codigo === 0) {
        setOpenDelete(false)
        fetchProveedores()
      } else {
        alert(response.data?.[0]?.mensaje1)
      }
    } finally {
      setDeleting(false)
    }
  }

  // --- RENDER ---
  if (loading) return <CircularProgress />
  if (error) return <Alert severity="error">{error}</Alert>

  const renderFields = (data: Proveedor, setData: any, disableClave = false) => (
    <>
      <TextField label="Clave" disabled={disableClave}
        value={data.cve_prov}
        onChange={e => setData({ ...data, cve_prov: e.target.value })} />
      <TextField label="Nombre"
        value={data.nombre}
        onChange={e => setData({ ...data, nombre: e.target.value })} />
      <TextField label="RFC"
        value={data.rfc ?? ''}
        onChange={e => setData({ ...data, rfc: e.target.value || null })} />
      <TextField label="CURP"
        value={data.curp ?? ''}
        onChange={e => setData({ ...data, curp: e.target.value || null })} />
      <TextField label="Calle"
        value={data.calle ?? ''}
        onChange={e => setData({ ...data, calle: e.target.value || null })} />
      <TextField label="Colonia"
        value={data.colonia ?? ''}
        onChange={e => setData({ ...data, colonia: e.target.value || null })} />
      <TextField label="Teléfono"
        value={data.telefono ?? ''}
        onChange={e => setData({ ...data, telefono: e.target.value || null })} />
      <TextField label="Ciudad"
        value={data.ciudad ?? ''}
        onChange={e => setData({ ...data, ciudad: e.target.value || null })} />
      <TextField label="Estado"
        value={data.estado ?? ''}
        onChange={e => setData({ ...data, estado: e.target.value || null })} />
      <TextField label="CP"
        value={data.cp ?? ''}
        onChange={e => setData({ ...data, cp: e.target.value || null })} />
      <TextField label="Contacto"
        value={data.contacto ?? ''}
        onChange={e => setData({ ...data, contacto: e.target.value || null })} />
      <TextField label="Fax"
        value={data.fax ?? ''}
        onChange={e => setData({ ...data, fax: e.target.value || null })} />
      <TextField label="Email"
        value={data.email ?? ''}
        onChange={e => setData({ ...data, email: e.target.value || null })} />
      <TextField label="Observaciones"
        value={data.observaciones ?? ''}
        onChange={e => setData({ ...data, observaciones: e.target.value || null })} />
      <TextField label="Nombre Fiscal"
        value={data.nombre_fiscal ?? ''}
        onChange={e => setData({ ...data, nombre_fiscal: e.target.value || null })} />
      <TextField type="number" label="Días Financiamiento"
        value={data.dias_financiamiento}
        onChange={e => setData({ ...data, dias_financiamiento: Number(e.target.value) })} />
      <TextField type="number" label="Descuento"
        value={data.descuento_general}
        onChange={e => setData({ ...data, descuento_general: Number(e.target.value) })} />
      <TextField label="Cuenta Contable"
        value={data.cuenta_contable ?? ''}
        onChange={e => setData({ ...data, cuenta_contable: e.target.value || null })} />
      <TextField type="number" label="Sucursal Origen"
        value={data.sucursal_origen}
        onChange={e => setData({ ...data, sucursal_origen: Number(e.target.value) })} />

      <FormControlLabel
        control={<Checkbox checked={data.persona_fisica}
          onChange={e => setData({ ...data, persona_fisica: e.target.checked })} />}
        label="Persona Física"
      />
      <FormControlLabel
        control={<Checkbox checked={data.Surte_Tienda}
          onChange={e => setData({ ...data, Surte_Tienda: e.target.checked })} />}
        label="Surte Tienda"
      />
    </>
  )

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5">Catálogo Proveedores</Typography>
      <Button variant="contained" onClick={() => setOpenAdd(true)}>Nuevo</Button>

      <DataGrid rows={rows} columns={columns} getRowId={r => r.cve_prov} autoHeight />

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="md">
        <DialogTitle>Agregar</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2 }}>
          {renderFields(formData, setFormData)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
          <Button onClick={handleAdd} disabled={saving}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
        <DialogTitle>Editar</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2 }}>
          {renderFields(editFormData, setEditFormData, true)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button onClick={handleUpdate} disabled={savingEdit}>Actualizar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Eliminar</DialogTitle>
        <DialogContent>
          ¿Eliminar <strong>{deleteRow?.nombre}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>
          <Button color="error" onClick={handleDelete} disabled={deleting}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </Box>
  )
}
