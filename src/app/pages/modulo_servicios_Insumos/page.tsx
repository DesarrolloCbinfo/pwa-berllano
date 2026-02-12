import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, IconButton } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import useConsumoApi from '../../../hooks/useConsumoApi'
import PWABadge from '../../../PWABadge'

interface Area {
  area: string
  descripcion: string
}

interface Departamento {
  depto: string
  descripcion: string
}

interface ProductoServicio {
  clave_prod: string
  descripcion: string
}

export default function AdministracionServiciosInsumos() {
  const { consumoApi } = useConsumoApi()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [areas, setAreas] = useState<Area[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [servicios, setServicios] = useState<ProductoServicio[]>([])

  const [selectedArea, setSelectedArea] = useState('')
  const [selectedDepto, setSelectedDepto] = useState('')
  const [selectedServicio, setSelectedServicio] = useState('')

  const [saving, setSaving] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [deleteId, setDeleteId] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          color="error"
          onClick={() => handleDeleteOpen(params.row)}
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
    { field: 'area', headerName: 'Área', width: 150 },
    { field: 'depto', headerName: 'Depto.', width: 150 },
    { field: 'clave_servicio', headerName: 'Servicio', width: 400 },
  ]

  const fetchAreas = async () => {
    try {
      const response = await consumoApi.get('/api/CatAdminInsuServ/sp_bw_cat_areas_sel?area=0')
      setAreas(response.data)
    } catch (err) {
      console.error('Error al cargar áreas:', err)
    }
  }

  const fetchDepartamentos = async (areaParam?: string) => {
    try {
      const areaToFetch = areaParam || selectedArea
      if (!areaToFetch) return
      
      const response = await consumoApi.get(`/api/CatAdminInsuServ/sp_bw_cat_deptos_sel?area=${areaToFetch}`)
      setDepartamentos(response.data)
    } catch (err) {
      console.error('Error al cargar departamentos:', err)
    }
  }

  const fetchServicios = async () => {
    try {
      const response = await consumoApi.get<ProductoServicio[]>('/api/CatAdminInsuServ/sp_bw_cat_productos_sel')
      setServicios(response.data)
    } catch (err) {
      console.error('Error al cargar servicios', err)
    }
  }

  const fetchServiciosInsumos = async () => {
    console.log('FETCH EJECUTADO')
    try {
      const response = await consumoApi.get('/api/CatAdminInsuServ/sp_bw_servicios_insumos_sel')
      console.log('Registros recibidos:', response.data.length)
      setRows(response.data)
    } catch (err) {
      console.error('Error al cargar servicios insumos:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await fetchAreas()
      await fetchServicios()
      await fetchServiciosInsumos()
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (selectedArea) {
      fetchDepartamentos(selectedArea)
      setSelectedDepto('')
    }
  }, [selectedArea])

  const handleAdd = async () => {
    if (!selectedArea || !selectedDepto || !selectedServicio) return

    try {
      setSaving(true)

      const response = await consumoApi.post(
        `/api/CatAdminInsuServ/sp_bw_servicios_insumos_add`,
        null,
        {
          params: {
            clave_servicio: selectedServicio,
            area: selectedArea,
            depto: selectedDepto,
          },
        }
      )

      const result = response.data?.[0]

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al guardar')
      }

      await fetchServiciosInsumos()
      
      setSelectedArea('')
      setSelectedDepto('')
      setSelectedServicio('')

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOpen = (row: any) => {
    setDeleteId(row)
    setOpenDelete(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      setDeleting(true)

      console.log('Eliminando registro:', {
        clave_servicio: deleteId.clave_servicio,
        area: deleteId.area,
        depto: deleteId.depto,
      })

      const response = await consumoApi.delete(
        `/api/CatAdminInsuServ/sp_bw_servicios_insumos_del`,
        {
          params: {
            clave_servicio: deleteId.clave_servicio,
            area: deleteId.area,
            depto: deleteId.depto,
          },
        }
      )

      console.log('Respuesta del servidor:', response.data)

      const result = response.data?.[0]

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje || 'Error al eliminar')
      }

      setOpenDelete(false)
      setDeleteId(null)
      await fetchServiciosInsumos()

    } catch (err) {
      console.error('Error completo al eliminar:', err)
      alert(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setDeleting(false)
    }
  }

  const handleSalir = () => {
    window.history.back()
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="h6" sx={{ color: '#999', mb: 0.5, fontSize: '0.9rem' }}>
            Módulo de
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, borderBottom: '3px solid black', pb: 1 }}>
            Administración de Servicios Insumos
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Área</InputLabel>
              <Select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                label="Área"
              >
                {areas.map((area) => (
                  <MenuItem key={area.area} value={area.area}>
                    {area.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Depto.</InputLabel>
              <Select
                value={selectedDepto}
                onChange={(e) => setSelectedDepto(e.target.value)}
                label="Depto."
              >
                {departamentos.map((depto) => (
                  <MenuItem key={depto.depto} value={depto.depto}>
                    {depto.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 400 }}>
              <InputLabel>Servicio</InputLabel>
              <Select
                value={selectedServicio}
                onChange={(e) => setSelectedServicio(e.target.value)}
                label="Servicio"
              >
                {servicios.map((servicio) => (
                  <MenuItem key={servicio.clave_prod} value={servicio.clave_prod}>
                    {servicio.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={!selectedArea || !selectedDepto || !selectedServicio || saving}
              sx={{ height: 56 }}
            >
              {saving ? 'Guardando...' : 'Agregar'}
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>Error: {error}</Alert>}

          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => `${row.clave_servicio}-${row.area}-${row.depto}`}
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                },
              },
            }}
            sx={{ 
              height: 500,
              backgroundColor: 'white',
              '& .MuiDataGrid-row:nth-of-type(even)': {
                backgroundColor: '#f9f9f9',
              },
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleSalir}
              sx={{ minWidth: 100 }}
            >
              Salir
            </Button>
          </Box>

          <Typography sx={{ mt: 3, fontSize: '0.85rem', color: '#666' }}>
            ADMINISTRACIÓN DE SERVICIOS INSUMOS, {new Date().toLocaleDateString('es-MX')}, USR:ADMIN
          </Typography>
        </Box>

        <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
          <DialogTitle>Eliminar Insumo</DialogTitle>

          <DialogContent>
            <Typography>
              ¿Seguro que deseas eliminar este registro?
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
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <PWABadge />
    </>
  )
}