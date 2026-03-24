import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, IconButton, Paper, Grid } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { useSessionContext } from '../../../context/SessionProvider'
import PWABadge from '../../../PWABadge'

// Props comunes para campos de formulario estilo Berllano Elegante
const commonProps = {
  fullWidth: true,
  size: "small" as const,
  variant: "outlined" as const,
  sx: {
    '& .MuiInputBase-root': { 
      height: '50px', 
      alignItems: 'center',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      '&:hover': {
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        borderColor: '#999'
      }
    },
    '& .MuiInputLabel-root': { 
      transform: 'translate(14px, 14px) scale(1)',
      color: '#666',
      fontWeight: 500
    },
    '& .MuiInputLabel-shrink': { 
      transform: 'translate(14px, -9px) scale(0.75)',
      color: '#333',
      fontWeight: 600
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#e0e0e0',
      borderWidth: '1.5px'
    }
  }
};

// Estilo SOLO para Selects (Hereda el general pero agrega ancho mínimo y bordes redondeados)
const selectProps = {
  ...commonProps,
  sx: {
    ...commonProps.sx,
    minWidth: '220px', 
    '& .MuiInputBase-root': { 
      height: '50px', 
      alignItems: 'center', 
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      '&:hover': {
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        borderColor: '#999'
      }
    },
  }
};

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
  const { session } = useSessionContext()
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
          sx={{
            ...commonProps.sx,
            '&:hover': {
              backgroundColor: 'rgba(211, 47, 47, 0.04)',
            }
          }}
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
      <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
        <Paper sx={{ p: 3, borderRadius: '8px' }}>
          {/* ENCABEZADO */}
          <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                Administración de Servicios Insumos
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
                Usuario: {session?.nombre || 'Cargando...'}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2} justifyContent="flex-start" alignItems="center" sx={{ mb: 0.5 }}>
            <Grid item xs={12} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Área</InputLabel>
                <Select
                  {...selectProps}
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
            </Grid>

            <Grid item xs={12} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Depto.</InputLabel>
                <Select
                  {...selectProps}
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
            </Grid>

            <Grid item xs={12} md={4.5}>
              <FormControl fullWidth>
                <InputLabel>Servicio</InputLabel>
                <Select
                  {...selectProps}
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
            </Grid>

            <Grid item xs={12} md={2.5}>
              <Button 
                variant="contained" 
                onClick={handleAdd} 
                disabled={!selectedArea || !selectedDepto || !selectedServicio || saving}
                fullWidth
                startIcon={<AddIcon />}
                sx={{ 
                  height: '50px', 
                  backgroundColor: '#333333', 
                  color: 'white', 
                  fontWeight: 600, 
                  textTransform: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', 
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    backgroundColor: '#555555', 
                    boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', 
                    transform: 'translateY(-1px)' 
                  }
                }}
              >
                {saving ? 'Guardando...' : 'AGREGAR'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* TABLA PRINCIPAL */}
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ 
            p: 3, 
            width: '100%', 
            maxHeight: 600, 
            mb: 3, 
            borderRadius: '8px', 
            boxShadow: '0 4px 8px rgba(0,0,0,0.08)' 
          }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>Error: {error}</Alert>}

            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => `${row.clave_servicio}-${row.area}-${row.depto}`}
              pageSizeOptions={[5, 10, 25, 50]}
              density="compact"
              disableRowSelectionOnClick
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                  },
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  borderBottom: '2px solid #000',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textAlign: 'center'
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #e0e0e000'
                }
              }}
            />
          </Paper>
        </Box>

        {/* PIE DE PÁGINA */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
          <Button 
            variant="contained" 
            onClick={handleSalir}
            sx={{ 
              backgroundColor: '#e0e0e0', 
              color: '#000', 
              fontWeight: 'bold', 
              px: 4, 
              mb: 2, 
              '&:hover': { backgroundColor: '#d0d0d0' } 
            }}
          >
            Salir
          </Button>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            ADMINISTRACIÓN DE SERVICIOS INSUMOS, ARAUCARIAS, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR:{session?.nombre || 'ADMIN'}
          </Typography>
        </Box>

        <Dialog 
          open={openDelete} 
          onClose={() => setOpenDelete(false)}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid #e0e0e0'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)', 
            color: 'white',
            fontFamily: 'Georgia, "Times New Roman", serif'
          }}>
            Eliminar Registro
          </DialogTitle>

          <DialogContent sx={{ p: 3, bgcolor: '#fff' }}>
            <Typography sx={{ fontSize: '1.1rem', mb: 2 }}>
              ¿Seguro que deseas eliminar este registro?
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={() => setOpenDelete(false)}
              sx={{ 
                backgroundColor: '#e0e0e0', 
                color: '#000', 
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#d0d0d0' 
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              color='error'
              variant='contained'
              onClick={handleDelete}
              disabled={deleting}
              sx={{ 
                backgroundColor: '#d32f2f',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#b71c1c',
                  boxShadow: '0 6px 16px rgba(211, 47, 47, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
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