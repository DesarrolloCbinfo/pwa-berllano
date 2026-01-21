import { useEffect, useState } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Box, CircularProgress, Alert, Typography } from '@mui/material'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { IconButton } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

import PWABadge from "../../../PWABadge"




interface CatSucursal {
  cve_sucursal: number
  nombre: string
  direccion: string | null
  version: string | null
  fecha_alta: string | null
  fecha_act: string | null
}




export default function CatSucursales2() {
  const { consumoApi } = useConsumoApi()
  const [rows, setRows] = useState<CatSucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  //elementos const para add sucursal
  const [openAdd, setOpenAdd] = useState(false)
const [cve_sucursal, setCveSucursal] = useState('')
const [nombre, setNombre] = useState('')
const [direccion, setDireccion] = useState('')
const [saving, setSaving] = useState(false)


//elementos para editar sucursal
const [openEdit, setOpenEdit] = useState(false)
const [editCveSucursal, setEditCveSucursal] = useState<number | null>(null)
const [editNombre, setEditNombre] = useState('')
const [editDireccion, setEditDireccion] = useState('')
const [savingEdit, setSavingEdit] = useState(false)


//elementos para eliminar sucursal
const [openDelete, setOpenDelete] = useState(false)
const [deleteCveSucursal, setDeleteCveSucursal] = useState<number | null>(null)
const [deleteNombre, setDeleteNombre] = useState<string | null>(null)
const [deleting, setDeleting] = useState(false)







const columns: GridColDef[] = [
  { field: 'cve_sucursal', headerName: 'ID', width: 80, type: 'number' },
  { field: 'nombre', headerName: 'Nombre', width: 150, type: 'string' },
  { field: 'direccion', headerName: 'Dirección', width: 250 },
  { field: 'version', headerName: 'Versión', width: 100 },
  { 
    field: 'fecha_alta', 
    headerName: 'Fecha Alta', 
    width: 180,
    renderCell: (params) => params.value ? new Date(params.value).toLocaleString() : '-'
  },
  { 
    field: 'fecha_act', 
    headerName: 'Fecha Actualización', 
    width: 180,
    renderCell: (params) => params.value ? new Date(params.value).toLocaleString() : '-'
  },
    {
    field: 'acciones',
    headerName: 'Acciones',
    width: 100,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
        <>
      <IconButton onClick={() => handleEditOpen(params.row)}>
        <EditIcon />
      </IconButton>
       <IconButton
        color="error"
        onClick={() => handleDeleteOpen(params.row)}
      >
        <DeleteIcon />
      </IconButton>
      </>
    ),
  },
]


const handleEditOpen = (row: CatSucursal) => {
  setEditCveSucursal(row.cve_sucursal)
  setEditNombre(row.nombre)
  setEditDireccion(row.direccion || '')
  setOpenEdit(true)
}

const handleDeleteOpen = (row: CatSucursal) => {
  setDeleteCveSucursal(row.cve_sucursal)
  setDeleteNombre(row.nombre)
  setOpenDelete(true)
}





    const fetchSucursales = async () => {
      try {
        setLoading(true)
        const response = await consumoApi.get('/api/CatSucursales/sp_bw_cat_sucursales_sel?cve_sucursal=0')
        setRows(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }




  useEffect(() => {
  fetchSucursales()
}, [])





const handleAdd = async () => {
  if (!nombre) return

  try {
    setSaving(true)

    const response = await consumoApi.post(
      `/api/CatSucursales/sp_bw_cat_sucursales_add`,
      null,
      {
        params: {
          cia: 1,
          cve_sucursal: cve_sucursal || 32,
          nombre,
          direccion,
          es_ruta: 0,
          es_bodega: 0,
          dias_devolucion: 0,
          en_linea: 1,
          supervisor: 1,
          version: 'gt',
          VALIDAR_TX: 1,
          VALIDAR_RM: 1,
          MIN_RECORDS_VAL_TX: 1,
          MIN_RECORDS_VAL_RM: 1,
          clave_timbrador: 1,
          RECIBE_FV: 0,
          RECIBE_PROV_ALL: '00',
          EDITA_COSTOS_RM: 0,
          NOCTURNA: 0,
          CREDITO: 0,
          VENCIMIENTO_DEPOSITO: 1,
          TOLERANCIA_EXISTENCIA: 1,
          CONTROL_TRASPASOS: 1,
          BANCOMER_ONLINE: 0,
          AFILIACION_BANCOMER: 0,
          SERVICIO_DOMICILIO: 0,
          APLICA_CINEPOLIS: 0,
          APLICA_CINETIX: 0,
          AREA_DEPOSITO: 0,
          DEPTO_DEPOSITO: 0,
          LIMITE_SOBRANTE: 0,
          LIMITE_FALTANTE: 0,
          importe_retiros: 3000,
          fondo: 2000,
          montoAviso: 0,
          numeroAvisos: 0,
          importeCajaDespuesRetiros: 520,
        },
      }
    )

    const result = response.data?.[0]

    if (result?.codigo !== 0) {
      throw new Error(result?.mensaje1 || 'Error al guardar')
    }

    setOpenAdd(false)
    setCveSucursal('')
    setNombre('')
    setDireccion('')
    fetchSucursales() // 🔁 refresca grid

  } catch (err) {
    alert(err instanceof Error ? err.message : 'Error desconocido')
  } finally {
    setSaving(false)
  }
}
const handleUpdate = async () => {
  if (!editCveSucursal || !editNombre) return

  try {
    setSavingEdit(true)

    const response = await consumoApi.put(
      `/api/CatSucursales/sp_bw_cat_sucursales_upd`,
      null,
      {
        params: {
          cve_sucursal: editCveSucursal,
          nombre: editNombre,
          direccion: editDireccion,
        },
      }
    )

    const result = response.data?.[0]

    if (result?.codigo !== 0) {
      throw new Error(result?.mensaje1 || 'Error al actualizar')
    }

    setOpenEdit(false)
    setEditCveSucursal(null)
    fetchSucursales() // 🔄 refrescar grid

  } catch (err) {
    alert(err instanceof Error ? err.message : 'Error desconocido')
  } finally {
    setSavingEdit(false)
  }
}


const handleDelete = async () => {
  if (!deleteCveSucursal) return

  try {
    setDeleting(true)

    const response = await consumoApi.delete(
      `/api/CatSucursales/sp_bw_cat_sucursales_del`,
      {
        params: {
          cve_sucursal: deleteCveSucursal,
        },
      }
    )

    const result = response.data?.[0]

    if (result?.codigo !== 0) {
      throw new Error(result?.mensaje || 'Error al eliminar')
    }

    setOpenDelete(false)
    setDeleteCveSucursal(null)
    setDeleteNombre(null)
    fetchSucursales() // 🔄 refresca grid

  } catch (err) {
    alert(err instanceof Error ? err.message : 'Error desconocido')
  } finally {
    setDeleting(false)
  }
}





  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">Error al cargar los datos: {error}</Alert>
  }

  return (
    <>
      <Box sx={{ p: 2 }}>
        <h1>Catálogo de Sucursales</h1>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>

  <Button variant="contained" onClick={() => setOpenAdd(true)}>
    Agregar Sucursal
  </Button>
</Box>

        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.cve_sucursal}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          sx={{ height: 600 }}
        />

<Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Agregar Sucursal</DialogTitle>

  <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
    <TextField
      label="Nombre *"
      value={nombre}
      onChange={(e) => setNombre(e.target.value)}
      fullWidth
      required
    />

    <TextField
      label="Dirección"
      value={direccion}
      onChange={(e) => setDireccion(e.target.value)}
      fullWidth
    />

    <TextField
      label="Clave Sucursal"
      value={cve_sucursal}
      onChange={(e) => setCveSucursal(e.target.value)}
      fullWidth
      type="number"
      inputProps={{ min: 0 }}
    />
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
    <Button
      variant="contained"
      onClick={handleAdd}
      disabled={saving}
    >
      Guardar
    </Button>
  </DialogActions>
</Dialog>

<Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Editar Sucursal</DialogTitle>

  <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
    <TextField
      label="ID"
      value={editCveSucursal || ''}
      disabled
      fullWidth
    />

    <TextField
      label="Nombre"
      value={editNombre}
      onChange={(e) => setEditNombre(e.target.value)}
      fullWidth
    />

    <TextField
      label="Dirección"
      value={editDireccion}
      onChange={(e) => setEditDireccion(e.target.value)}
      fullWidth
    />
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
    <Button
      variant="contained"
      onClick={handleUpdate}
      disabled={savingEdit}
    >
      Guardar cambios
    </Button>
  </DialogActions>
</Dialog>


<Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
  <DialogTitle>Eliminar Sucursal</DialogTitle>

  <DialogContent>
    <Typography>
      ¿Seguro que deseas eliminar la sucursal <strong>{deleteNombre}</strong>?
    </Typography>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenDelete(false)}>
      Cancelar
    </Button>

    <Button
      color="error"
      variant="contained"
      onClick={handleDelete}
      disabled={deleting}
    >
      Eliminar
    </Button>
  </DialogActions>
</Dialog>




      </Box>
      <PWABadge />
    </>
  )
}
