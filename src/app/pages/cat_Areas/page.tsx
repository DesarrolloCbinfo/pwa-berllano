import { useEffect, useState } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Box, CircularProgress, Alert, Typography } from '@mui/material'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { IconButton } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

import PWABadge from "../../../PWABadge"




interface CatArea {
  area: string
  descripcion: string
  version: string | null
  fecha_alta: string | null
  fecha_act: string | null
}




export default function CatAreas() {
  const { consumoApi } = useConsumoApi()
  const [rows, setRows] = useState<CatArea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  //elementos const para add area
  const [openAdd, setOpenAdd] = useState(false)
const [area, setArea] = useState('')
const [descripcion, setDescripcion] = useState('')
const [saving, setSaving] = useState(false)


//elementos para editar areas
const [openEdit, setOpenEdit] = useState(false)
const [editArea, setEditArea] = useState('')
const [editDescripcion, setEditDescripcion] = useState('')
const [savingEdit, setSavingEdit] = useState(false)


//elementos para eliminar areas
const [openDelete, setOpenDelete] = useState(false)
const [deleteArea, setDeleteArea] = useState<string | null>(null)
const [deleting, setDeleting] = useState(false)







const columns: GridColDef[] = [
  { field: 'area', headerName: 'Área', width: 80, type: 'string' },
  { field: 'descripcion', headerName: 'Descripción', width: 250 },
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


const handleEditOpen = (row: CatArea) => {
  setEditArea(row.area)
  setEditDescripcion(row.descripcion)
  setOpenEdit(true)
}

const handleDeleteOpen = (row: CatArea) => {
  setDeleteArea(row.area)
  setOpenDelete(true)
}





    const fetchAreas = async () => {
      try {
        setLoading(true)
        const response = await consumoApi.get('/api/CatAreas/sp_bw_cat_areas_sel?area=0')
        setRows(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }




  useEffect(() => {
  fetchAreas()
}, [])





const handleAdd = async () => {
  if (!area || !descripcion) return

  try {
    setSaving(true)

    const response = await consumoApi.post(
      `/api/CatAreas/sp_bw_cat_areas_add`,
      null,
      {
        params: {
          area,
          descripcion,
        },
      }
    )

    const result = response.data?.[0]

    if (result?.codigo !== 0) {
      throw new Error(result?.mensaje1 || 'Error al guardar')
    }

    setOpenAdd(false)
    setArea('')
    setDescripcion('')
    fetchAreas() // 🔁 refresca grid

  } catch (err) {
    alert(err instanceof Error ? err.message : 'Error desconocido')
  } finally {
    setSaving(false)
  }
}
const handleUpdate = async () => {
  if (!editArea || !editDescripcion) return

  try {
    setSavingEdit(true)

    const response = await consumoApi.put(
      `/api/CatAreas/sp_bw_cat_areas_upd`,
      null,
      {
        params: {
          area: editArea,
          descripcion: editDescripcion,
        },
      }
    )

    const result = response.data?.[0]

    if (result?.codigo !== 0) {
      throw new Error(result?.mensaje1 || 'Error al actualizar')
    }

    setOpenEdit(false)
    fetchAreas() // 🔄 refrescar grid

  } catch (err) {
    alert(err instanceof Error ? err.message : 'Error desconocido')
  } finally {
    setSavingEdit(false)
  }
}


const handleDelete = async () => {
  if (!deleteArea) return

  try {
    setDeleting(true)

    const response = await consumoApi.delete(
      `/api/CatAreas/sp_bw_cat_areas_del`,
      {
        params: {
          area: deleteArea,
        },
      }
    )

    const result = response.data?.[0]

    if (result?.codigo !== 0) {
      throw new Error(result?.mensaje || 'Error al eliminar')
    }

    setOpenDelete(false)
    setDeleteArea(null)
    fetchAreas() // 🔄 refresca grid

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
        <h1>Catálogo de Áreas</h1>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>

  <Button variant="contained" onClick={() => setOpenAdd(true)}>
    Agregar Área
  </Button>
</Box>

        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.area}
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
  <DialogTitle>Agregar Área</DialogTitle>

  <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
    <TextField
      label="Área"
      value={area}
      onChange={(e) => setArea(e.target.value)}
      fullWidth
    />

    <TextField
      label="Descripción"
      value={descripcion}
      onChange={(e) => setDescripcion(e.target.value)}
      fullWidth
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
  <DialogTitle>Editar Área</DialogTitle>

  <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
    <TextField
      label="Área"
      value={editArea}
      disabled
      fullWidth
    />

    <TextField
      label="Descripción"
      value={editDescripcion}
      onChange={(e) => setEditDescripcion(e.target.value)}
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
  <DialogTitle>Eliminar Área</DialogTitle>

  <DialogContent>
    <Typography>
      ¿Seguro que deseas eliminar el área <strong>{deleteArea}</strong>?
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