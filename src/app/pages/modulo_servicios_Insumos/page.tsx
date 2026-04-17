import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, IconButton, Paper, Grid } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import Swal from 'sweetalert2'
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
  const [openAddModal, setOpenAddModal] = useState(false)
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
    if (!selectedArea || !selectedDepto || !selectedServicio) {
      Swal.fire('Atención', 'Todos los campos son obligatorios', 'warning')
      return
    }

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
      setOpenAddModal(false)
      setSelectedArea('')
      setSelectedDepto('')
      setSelectedServicio('')

      Swal.fire({ title: '¡Éxito!', text: 'Servicio Insumo agregado correctamente', icon: 'success', timer: 2000, showConfirmButton: false });

    } catch (err) {
      Swal.fire('Error', err instanceof Error ? err.message : 'Error desconocido', 'error')
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

      Swal.fire({ title: '¡Éxito!', text: 'Registro eliminado correctamente', icon: 'success', timer: 2000, showConfirmButton: false });

    } catch (err) {
      console.error('Error completo al eliminar:', err)
      Swal.fire('Error', err instanceof Error ? err.message : 'Error desconocido', 'error')
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
      {/* MAGIA CSS: Evita que SweetAlert quede por detrás del Dialog de eliminar */}
      <style>{`
        .swal2-container {
          z-index: 9999 !important;
        }
      `}</style>
      <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
        <Paper sx={{ p: 3, borderRadius: '8px' }}>
        {/* ENCABEZADO CON BOTÓN NUEVO */}
          <Box sx={{ border: '1px solid #000000ff', p: 1.5, mb: 2, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                Administración de Servicios Insumos
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
              </Typography>
             
            </Box>
          </Box>
           <Button 
                variant="contained" 
                onClick={() => setOpenAddModal(true)} 
                startIcon={<AddIcon />}
                sx={{ 
                  backgroundColor: '#000000ff', 
                  color: 'white', 
                  fontWeight: 600, 
                  textTransform: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', 
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    backgroundColor: '#333333', 
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)', 
                    transform: 'translateY(-1px)' 
                  }
                }}
              >
                NUEVO REGISTRO
              </Button>
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

{/* =========================================
            MODAL DE NUEVO REGISTRO (DISEÑO PREMIUM)
        ========================================= */}
        <Dialog 
          open={openAddModal} 
          onClose={() => setOpenAddModal(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
              border: '1px solid #e0e0e0',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
            }
          }}
        >
          {/* ENCABEZADO DEGRADADO */}
          <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Nuevo Servicio/Insumo
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                Seleccione el área, departamento y servicio a relacionar.
              </Typography>
            </Box>
            {/* Círculo decorativo */}
            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
            
            <IconButton 
              onClick={() => setOpenAddModal(false)}
              sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              
              {/* Sección de Formulario */}
              <Box>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, color: '#333', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                  Información de la Relación
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
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

                  <Grid item xs={12}>
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

                  <Grid item xs={12}>
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
                </Grid>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
            <Button 
              onClick={() => setOpenAddModal(false)}
              color="inherit"
              sx={{ borderRadius: '8px', fontWeight: 500, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
            >
              Cancelar
            </Button>
            <Button
              variant='contained'
              onClick={handleAdd}
              disabled={!selectedArea || !selectedDepto || !selectedServicio || saving}
              startIcon={<AddIcon />}
              sx={{ 
                bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
                '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' },
                '&.Mui-disabled': { backgroundColor: '#a0a0a0', color: '#ffffff' }
              }}
            >
              {saving ? 'Guardando...' : 'Guardar Registro'}
            </Button>
          </DialogActions>
        </Dialog>


        {/* =========================================
            MODAL ELIMINAR (DISEÑO PREMIUM ROJO)
        ========================================= */}
        <Dialog 
          open={openDelete} 
          onClose={() => setOpenDelete(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
              border: '1px solid #e0e0e0',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
            }
          }}
        >
          {/* ENCABEZADO DEGRADADO ROJO PARA ALERTA */}
          <Box sx={{ background: 'linear-gradient(135deg, #d32f2f 0%, #9a0007 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Eliminar Registro
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                Atención: Esta acción es irreversible.
              </Typography>
            </Box>
            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
            
            <IconButton 
              onClick={() => setOpenDelete(false)}
              sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 4, bgcolor: '#ffffff' }}>
            <Typography sx={{ fontSize: '1.1rem', textAlign: 'center', mt: 2 }}>
              ¿Seguro que deseas eliminar este registro de Insumos/Servicios?
            </Typography>
          </DialogContent>

          <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa', justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={() => setOpenDelete(false)}
              color="inherit"
              sx={{ borderRadius: '8px', fontWeight: 500, px: 3, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
            >
              Cancelar
            </Button>
            <Button
              color='error'
              variant='contained'
              onClick={handleDelete}
              disabled={deleting}
              sx={{ 
                fontWeight: 600, textTransform: 'none', borderRadius: '8px', px: 4,
                boxShadow: '0 4px 12px rgba(211, 47, 47, 0.4)', transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 6px 16px rgba(211, 47, 47, 0.5)' }
              }}
            >
              {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <PWABadge />
    </>
  )
}