import { useEffect, useState } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { 
  Box, CircularProgress, Alert, Typography, Button, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, 
  IconButton, Divider, InputAdornment 
} from '@mui/material'
import { FormControlLabel, Checkbox } from '@mui/material'

import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import useConsumoApi from '../../../hooks/useConsumoApi'
import PWABadge from "../../../PWABadge"

// 1. Interfaz con todos los campos del JSON
interface CatCliente {
  No_cliente: string
  nombre: string
  ap_paterno: string
  ap_materno: string | null
  domicilio: string | null
  Calle: string | null
  Num_Exterior: string | null
  Num_Interior: string | null
  ciudad: string | null
  Municipio: string | null
  estado: string | null
  colonia: string | null
  cp: string | null
  rfc: string | null
  curp: string | null
  telefono: string | null
  fax: string | null
  email: string | null
  contacto: string | null
  nombre_fiscal: string | null
  limite_credito: number
  persona_fisica: boolean
  mayoreo: boolean
  dias_credito: number
  suspendido: boolean
  sucursal_origen: number
  especial: boolean
  plus: boolean
  version: string
  lista_precio_especial: number
  clave_lista_credito: number
  clave_lista_mayoreo: number
  cuenta_contable: string | null
  referencias: string | null
  clave_puntos: string | null
  num_plastico: string | null
  suc_asig_plast: number
  fecha_asig_plast: string | null
  usr_asig_plast: string | null
  plastico_activo: boolean
  genero: string | null
  fecha_nac: string | null
  correo_factura: string | null
  contraseña: string | null
  noInfoAM: boolean
  regimenFiscal: string | null
  claveRegistroMovil: string | null
}


const emptyCliente: CatCliente = {
  No_cliente: '',
  nombre: '',
  ap_paterno: '',
  ap_materno: null,
  domicilio: null,
  Calle: null,
  Num_Exterior: null,
  Num_Interior: null,
  ciudad: null,
  Municipio: null,
  estado: null,
  colonia: null,
  cp: null,
  rfc: null,
  curp: null,
  telefono: null,
  fax: null,
  email: null,
  contacto: null,
  nombre_fiscal: null,
  limite_credito: 0,
  persona_fisica: false,
  mayoreo: false,
  dias_credito: 0,
  suspendido: false,
  sucursal_origen: 0,
  especial: false,
  plus: false,
  version: '1.0',
  lista_precio_especial: 0,
  clave_lista_credito: 0,
  clave_lista_mayoreo: 0,
  cuenta_contable: null,
  referencias: null,
  clave_puntos: null,
  num_plastico: null,
  suc_asig_plast: 0,
  fecha_asig_plast: null,
  usr_asig_plast: null,
  plastico_activo: false,
  genero: null,
  fecha_nac: null,
  correo_factura: null,
  contraseña: null,
  noInfoAM: false,
  regimenFiscal: null,
  claveRegistroMovil: null
}


export default function CatClientes() {
  const { consumoApi } = useConsumoApi()
  const [rows, setRows] = useState<CatCliente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Control de búsqueda (0 para todos, o ID específico para rapidez)
  const [searchId, setSearchId] = useState('0')

  // Estados de formularios
  const [openForm, setOpenForm] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [formData, setFormData] = useState<CatCliente>(emptyCliente)
  const [openDelete, setOpenDelete] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  // 2. Función SEL (Carga de datos)
const fetchClientes = async (idBusqueda: string) => {
  try {
    setLoading(true)
    setError(null)

    const response = await consumoApi.get(
      `/api/CatClientes/sp_bw_cat_clientes_suc_sel?No_cliente=${idBusqueda}`
    )

    let data = Array.isArray(response.data)
      ? response.data
      : [response.data]

    // 🔹 SI ES CARGA INICIAL (0) SOLO MOSTRAMOS EL PRIMERO
    if (idBusqueda === '0' && data.length > 0) {
      setRows([data[0]])
      return
    }

    // 🔹 BÚSQUEDA NORMAL
    if (data.length > 0) {
      setRows(data)
    } else {
      setRows([])
      setError('No se encontraron resultados.')
    }

  } catch (err) {
    setError('No se encontraron resultados o hubo un error de conexión.')
    setRows([])
  } finally {
    setLoading(false)
  }
}


  useEffect(() => {
    fetchClientes('0') // Carga inicial
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClientes(searchId);
  }

  // 3. Definición de Columnas
  const columns: GridColDef[] = [
    { field: 'No_cliente', headerName: 'ID', width: 90 },
    { field: 'nombre', headerName: 'Nombre', width: 220 },
    { field: 'ap_paterno', headerName: 'Apellido', width: 150 },
    { field: 'rfc', headerName: 'RFC', width: 140 },
    { field: 'Municipio', headerName: 'Municipio', width: 130 },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => { setFormData(params.row); setIsEdit(true); setOpenForm(true); }} color="primary"><EditIcon /></IconButton>
          <IconButton size="small" onClick={() => { setSelectedId(params.row.No_cliente); setOpenDelete(true); }} color="error"><DeleteIcon /></IconButton>
        </Box>
      ),
    },
  ]

  // 4. Guardar (ADD / UPD)
  //add
const handleAdd = async () => {
  if (!formData.No_cliente || !formData.nombre) {
    alert('No. Cliente y Nombre son obligatorios')
    return
  }

  try {
    setProcessing(true)

    const response = await consumoApi.post(
      '/api/CatClientes/sp_bw_cat_clientes_suc_add',
      null,
      {
        params: {
          No_cliente: formData.No_cliente,
          nombre: formData.nombre,
          ap_paterno: formData.ap_paterno,
          ap_materno: formData.ap_materno,
          domicilio: formData.domicilio,
          Calle: formData.Calle,
          Num_Exterior: formData.Num_Exterior,
          Num_Interior: formData.Num_Interior,
          ciudad: formData.ciudad,
          Municipio: formData.Municipio,
          estado: formData.estado,
          colonia: formData.colonia,
          cp: formData.cp,
          rfc: formData.rfc,
          curp: formData.curp,
          telefono: formData.telefono,
          fax: formData.fax,
          email: formData.email,
          contacto: formData.contacto,
          nombre_fiscal: formData.nombre_fiscal,
          limite_credito: formData.limite_credito,
          persona_fisica: formData.persona_fisica,
          mayoreo: formData.mayoreo,
          dias_credito: formData.dias_credito,
          suspendido: formData.suspendido,
          sucursal_origen: formData.sucursal_origen,
          especial: formData.especial,
          plus: formData.plus,
          version: formData.version,
          lista_precio_especial: formData.lista_precio_especial,
          clave_lista_credito: formData.clave_lista_credito,
          clave_lista_mayoreo: formData.clave_lista_mayoreo,
          cuenta_contable: formData.cuenta_contable,
          referencias: formData.referencias,
          clave_puntos: formData.clave_puntos,
          num_plastico: formData.num_plastico,
          suc_asig_plast: formData.suc_asig_plast,
          fecha_asig_plast: formData.fecha_asig_plast,
          usr_asig_plast: formData.usr_asig_plast,
          plastico_activo: formData.plastico_activo,
          genero: formData.genero,
          fecha_nac: formData.fecha_nac,
          correo_factura: formData.correo_factura,
          contraseña: formData.contraseña,
          noInfoAM: formData.noInfoAM,
          regimenFiscal: formData.regimenFiscal,
          claveRegistroMovil: formData.claveRegistroMovil
        }
      }
    )

    if (response.data?.[0]?.codigo === 0) {
      setOpenForm(false)
      fetchClientes(formData.No_cliente)
    } else {
      alert(response.data?.[0]?.mensaje1 || 'Error al guardar')
    }
  } catch (err) {
    alert('Error de conexión')
    console.error(err)
  } finally {
    setProcessing(false)
  }
}

//upd
const handleUpd = async () => {
  if (!formData.No_cliente || !formData.nombre) {
    alert('No. Cliente y Nombre son obligatorios')
    return
  }

  try {
    setProcessing(true)

    const response = await consumoApi.put(
      '/api/CatClientes/sp_bw_cat_clientes_suc_upd',
      null,
      {
        params: {
          No_cliente: formData.No_cliente,
          nombre: formData.nombre,
          ap_paterno: formData.ap_paterno,
          ap_materno: formData.ap_materno,
          domicilio: formData.domicilio,
          Calle: formData.Calle,
          Num_Exterior: formData.Num_Exterior,
          Num_Interior: formData.Num_Interior,
          ciudad: formData.ciudad,
          Municipio: formData.Municipio,
          estado: formData.estado,
          colonia: formData.colonia,
          cp: formData.cp,
          rfc: formData.rfc,
          curp: formData.curp,
          telefono: formData.telefono,
          fax: formData.fax,
          email: formData.email,
          contacto: formData.contacto,
          nombre_fiscal: formData.nombre_fiscal,
          limite_credito: formData.limite_credito,
          persona_fisica: formData.persona_fisica,
          mayoreo: formData.mayoreo,
          dias_credito: formData.dias_credito,
          suspendido: formData.suspendido,
          sucursal_origen: formData.sucursal_origen,
          especial: formData.especial,
          plus: formData.plus,
          version: formData.version,
          lista_precio_especial: formData.lista_precio_especial,
          clave_lista_credito: formData.clave_lista_credito,
          clave_lista_mayoreo: formData.clave_lista_mayoreo,
          cuenta_contable: formData.cuenta_contable,
          referencias: formData.referencias,
          clave_puntos: formData.clave_puntos,
          num_plastico: formData.num_plastico,
          suc_asig_plast: formData.suc_asig_plast,
          fecha_asig_plast: formData.fecha_asig_plast,
          usr_asig_plast: formData.usr_asig_plast,
          plastico_activo: formData.plastico_activo,
          genero: formData.genero,
          fecha_nac: formData.fecha_nac,
          correo_factura: formData.correo_factura,
          contraseña: formData.contraseña,
          noInfoAM: formData.noInfoAM,
          regimenFiscal: formData.regimenFiscal,
          claveRegistroMovil: formData.claveRegistroMovil
        }
      }
    )

    if (response.data?.[0]?.codigo === 0) {
      setOpenForm(false)
      fetchClientes(formData.No_cliente)
    } else {
      alert(response.data?.[0]?.mensaje1 || 'Error al actualizar')
    }
  } catch (err) {
    alert('Error de conexión')
    console.error(err)
  } finally {
    setProcessing(false)
  }
}
const handleSave = async () => {
  if (isEdit) {
    await handleUpd()
  } else {
    await handleAdd()
  }
}



  // 5. Eliminar (DEL)
  const handleDelete = async () => {
    setProcessing(true)
    try {
      const response = await consumoApi.delete('/api/CatClientes/sp_bw_cat_clientes_suc_del', { 
        params: { No_cliente: selectedId } 
      })
      if (response.data?.[0]?.codigo === 0) {
        setOpenDelete(false);
        fetchClientes('0');
      }
    } catch (err) { alert('Error al eliminar'); } finally { setProcessing(false); }
  }

  

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2' }}>
        Catálogo de Clientes
      </Typography>
      <Button
  variant="contained"
  sx={{ mb: 2 }}
  onClick={() => {
    setFormData(emptyCliente)
    setIsEdit(false)
    setOpenForm(true)
  }}
>
  Nuevo Cliente
</Button>


      {/* CABECERA: Búsqueda y Botón Nuevo */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center', bgcolor: '#f8f9fa', p: 2, borderRadius: 2 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <TextField 
            size="small"
            label="Buscar por ID"
            variant="outlined"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            }}
            sx={{ bgcolor: 'white' }}
          />
          <Button variant="contained" type="submit" color="info">Buscar</Button>
        </form>
        
        <Box sx={{ flexGrow: 1 }} />

      </Box>

      {/* DATA GRID */}
      <Box sx={{ height: 600, width: '100%', bgcolor: 'white' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="info">{error}</Alert>
        ) : (
          <DataGrid 
            rows={rows} 
            columns={columns} 
            getRowId={(row) => row.No_cliente} 
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          />
        )}
      </Box>

      {/* FORMULARIO DIALOG (ADD/EDIT) - USANDO CSS GRID NATIVO */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
  <DialogTitle sx={{ borderBottom: '1px solid #eee' }}>
    {isEdit ? `Editando Cliente: ${formData.No_cliente}` : 'Registrar Nuevo Cliente'}
  </DialogTitle>

  <DialogContent sx={{ p: 3 }}>
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
      gap: 2.5,
      pt: 2
    }}
  >
    {/* ================= IDENTIFICACIÓN ================= */}
    <TextField
      label="No. Cliente"
      fullWidth
      disabled={isEdit}
      value={formData.No_cliente}
      onChange={(e) => setFormData({ ...formData, No_cliente: e.target.value })}
    />

    <TextField
      label="Versión"
      fullWidth
      value={formData.version}
      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
    />

    <Box sx={{ gridColumn: { sm: 'span 2' } }}>
      <TextField
        label="Nombre / Razón Social"
        fullWidth
        value={formData.nombre}
        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
      />
    </Box>

    <TextField
      label="Apellido Paterno"
      fullWidth
      value={formData.ap_paterno}
      onChange={(e) => setFormData({ ...formData, ap_paterno: e.target.value })}
    />

    <TextField
      label="Apellido Materno"
      fullWidth
      value={formData.ap_materno || ''}
      onChange={(e) => setFormData({ ...formData, ap_materno: e.target.value })}
    />

    <TextField
      label="RFC"
      fullWidth
      value={formData.rfc || ''}
      onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
    />

    <TextField
      label="CURP"
      fullWidth
      value={formData.curp || ''}
      onChange={(e) => setFormData({ ...formData, curp: e.target.value })}
    />

    <TextField
      label="Nombre Fiscal"
      fullWidth
      value={formData.nombre_fiscal || ''}
      onChange={(e) => setFormData({ ...formData, nombre_fiscal: e.target.value })}
    />

    {/* ================= CONTACTO ================= */}
    <TextField
      label="Teléfono"
      fullWidth
      value={formData.telefono || ''}
      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
    />

    <TextField
      label="Fax"
      fullWidth
      value={formData.fax || ''}
      onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
    />

    <TextField
      label="Email"
      fullWidth
      value={formData.email || ''}
      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
    />

    <TextField
      label="Correo Facturación"
      fullWidth
      value={formData.correo_factura || ''}
      onChange={(e) => setFormData({ ...formData, correo_factura: e.target.value })}
    />

    <TextField
      label="Contacto"
      fullWidth
      value={formData.contacto || ''}
      onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
    />

    {/* ================= DIRECCIÓN ================= */}
    <TextField
      label="Domicilio"
      fullWidth
      value={formData.domicilio || ''}
      onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
    />

    <TextField
      label="Calle"
      fullWidth
      value={formData.Calle || ''}
      onChange={(e) => setFormData({ ...formData, Calle: e.target.value })}
    />

    <TextField
      label="Número Exterior"
      fullWidth
      value={formData.Num_Exterior || ''}
      onChange={(e) => setFormData({ ...formData, Num_Exterior: e.target.value })}
    />

    <TextField
      label="Número Interior"
      fullWidth
      value={formData.Num_Interior || ''}
      onChange={(e) => setFormData({ ...formData, Num_Interior: e.target.value })}
    />

    <TextField
      label="Colonia"
      fullWidth
      value={formData.colonia || ''}
      onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
    />

    <TextField
      label="Ciudad"
      fullWidth
      value={formData.ciudad || ''}
      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
    />

    <TextField
      label="Municipio"
      fullWidth
      value={formData.Municipio || ''}
      onChange={(e) => setFormData({ ...formData, Municipio: e.target.value })}
    />

    <TextField
      label="Estado"
      fullWidth
      value={formData.estado || ''}
      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
    />

    <TextField
      label="Código Postal"
      fullWidth
      value={formData.cp || ''}
      onChange={(e) => setFormData({ ...formData, cp: e.target.value })}
    />

    {/* ================= CRÉDITO ================= */}
    <TextField
      label="Límite Crédito"
      type="number"
      fullWidth
      value={formData.limite_credito}
      onChange={(e) => setFormData({ ...formData, limite_credito: Number(e.target.value) })}
    />

    <TextField
      label="Días Crédito"
      type="number"
      fullWidth
      value={formData.dias_credito}
      onChange={(e) => setFormData({ ...formData, dias_credito: Number(e.target.value) })}
    />

    <TextField
      label="Sucursal Origen"
      type="number"
      fullWidth
      value={formData.sucursal_origen}
      onChange={(e) => setFormData({ ...formData, sucursal_origen: Number(e.target.value) })}
    />

    <TextField
      label="Lista Precio Especial"
      type="number"
      fullWidth
      value={formData.lista_precio_especial}
      onChange={(e) => setFormData({ ...formData, lista_precio_especial: Number(e.target.value) })}
    />

    <TextField
      label="Lista Crédito"
      type="number"
      fullWidth
      value={formData.clave_lista_credito}
      onChange={(e) => setFormData({ ...formData, clave_lista_credito: Number(e.target.value) })}
    />

    <TextField
      label="Lista Mayoreo"
      type="number"
      fullWidth
      value={formData.clave_lista_mayoreo}
      onChange={(e) => setFormData({ ...formData, clave_lista_mayoreo: Number(e.target.value) })}
    />

    {/* ================= CONTABLE ================= */}
    <TextField
      label="Cuenta Contable"
      fullWidth
      value={formData.cuenta_contable || ''}
      onChange={(e) => setFormData({ ...formData, cuenta_contable: e.target.value })}
    />

    <TextField
      label="Referencias"
      fullWidth
      value={formData.referencias || ''}
      onChange={(e) => setFormData({ ...formData, referencias: e.target.value })}
    />

    {/* ================= TARJETA ================= */}
    <TextField
      label="Clave Puntos"
      fullWidth
      value={formData.clave_puntos || ''}
      onChange={(e) => setFormData({ ...formData, clave_puntos: e.target.value })}
    />

    <TextField
      label="Número Plástico"
      fullWidth
      value={formData.num_plastico || ''}
      onChange={(e) => setFormData({ ...formData, num_plastico: e.target.value })}
    />

    <TextField
      label="Sucursal Asignación Plástico"
      type="number"
      fullWidth
      value={formData.suc_asig_plast}
      onChange={(e) => setFormData({ ...formData, suc_asig_plast: Number(e.target.value) })}
    />

    <TextField
      label="Fecha Asignación Plástico"
      type="date"
      InputLabelProps={{ shrink: true }}
      fullWidth
      value={formData.fecha_asig_plast || ''}
      onChange={(e) => setFormData({ ...formData, fecha_asig_plast: e.target.value })}
    />

    <TextField
      label="Usuario Asignó Plástico"
      fullWidth
      value={formData.usr_asig_plast || ''}
      onChange={(e) => setFormData({ ...formData, usr_asig_plast: e.target.value })}
    />

    {/* ================= DATOS EXTRA ================= */}
    <TextField
      label="Género"
      fullWidth
      value={formData.genero || ''}
      onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
    />

    <TextField
      label="Fecha Nacimiento"
      type="date"
      InputLabelProps={{ shrink: true }}
      fullWidth
      value={formData.fecha_nac || ''}
      onChange={(e) => setFormData({ ...formData, fecha_nac: e.target.value })}
    />

    <TextField
      label="Contraseña"
      fullWidth
      value={formData.contraseña || ''}
      onChange={(e) => setFormData({ ...formData, contraseña: e.target.value })}
    />

    <TextField
      label="Régimen Fiscal"
      fullWidth
      value={formData.regimenFiscal || ''}
      onChange={(e) => setFormData({ ...formData, regimenFiscal: e.target.value })}
    />

    <TextField
      label="Clave Registro Móvil"
      fullWidth
      value={formData.claveRegistroMovil || ''}
      onChange={(e) => setFormData({ ...formData, claveRegistroMovil: e.target.value })}
    />

    {/* ================= BOOLEANOS ================= */}
<Box sx={{ gridColumn: { sm: 'span 2' } }}>
  <Divider sx={{ my: 2 }}>
    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'gray' }}>
      CONFIGURACIÓN
    </Typography>
  </Divider>
</Box>

<FormControlLabel
  control={
    <Checkbox
      checked={formData.persona_fisica}
      onChange={(e) =>
        setFormData({ ...formData, persona_fisica: e.target.checked })
      }
    />
  }
  label="Persona Física"
/>

<FormControlLabel
  control={
    <Checkbox
      checked={formData.mayoreo}
      onChange={(e) =>
        setFormData({ ...formData, mayoreo: e.target.checked })
      }
    />
  }
  label="Cliente Mayoreo"
/>

<FormControlLabel
  control={
    <Checkbox
      checked={formData.suspendido}
      onChange={(e) =>
        setFormData({ ...formData, suspendido: e.target.checked })
      }
    />
  }
  label="Cliente Suspendido"
/>

<FormControlLabel
  control={
    <Checkbox
      checked={formData.especial}
      onChange={(e) =>
        setFormData({ ...formData, especial: e.target.checked })
      }
    />
  }
  label="Cliente Especial"
/>

<FormControlLabel
  control={
    <Checkbox
      checked={formData.plus}
      onChange={(e) =>
        setFormData({ ...formData, plus: e.target.checked })
      }
    />
  }
  label="Cliente Plus"
/>

<FormControlLabel
  control={
    <Checkbox
      checked={formData.plastico_activo}
      onChange={(e) =>
        setFormData({ ...formData, plastico_activo: e.target.checked })
      }
    />
  }
  label="Plástico Activo"
/>

<FormControlLabel
  control={
    <Checkbox
      checked={formData.noInfoAM}
      onChange={(e) =>
        setFormData({ ...formData, noInfoAM: e.target.checked })
      }
    />
  }
  label="No enviar información AM"
/>

    
  </Box>
</DialogContent>


  <DialogActions sx={{ p: 3, borderTop: '1px solid #eee' }}>
    <Button onClick={() => setOpenForm(false)} color="inherit">
      Cancelar
    </Button>
    <Button variant="contained" onClick={handleSave} disabled={processing}>
      {processing ? 'Procesando...' : 'Guardar Cliente'}
    </Button>
  </DialogActions>
</Dialog>


      {/* CONFIRMAR ELIMINAR */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>¿Eliminar registro?</DialogTitle>
        <DialogContent>Confirma que deseas eliminar al cliente <b>{selectedId}</b>. Esta acción no se puede deshacer.</DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={processing}>Confirmar Eliminación</Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </Box>
  )
}