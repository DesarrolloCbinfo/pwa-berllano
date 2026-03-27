import { useEffect, useState } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Box, CircularProgress, Alert, Typography, Paper, Grid } from '@mui/material'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { IconButton } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { Divider } from '@mui/material'

import PWABadge from "../../../PWABadge"

// Interfaces para las tres entidades
interface CatArea {
  area: string
  descripcion: string
  version: string | null
  fecha_alta: string | null
  fecha_act: string | null
}

interface CatDepto {
  depto: string
  area: string
  descripcion: string
  version: string | null
  fecha_alta: string | null
  fecha_act: string | null
}

interface CatClase {
  clase: string
  depto: string
  area: string
  descripcion: string
  dias_min: number
  dias_max: number
  dias_muestra: number
  margen_minimo_remates: number
  tasa_iva: number
  version: string | null
  fecha_alta: string | null
  fecha_act: string | null
}

// Form types
interface AreaForm {
  area: string
  descripcion: string
}

interface DeptoForm {
  depto: string
  area: string
  descripcion: string
}

interface ClaseForm {
  clase: string
  depto: string
  area: string
  descripcion: string
  dias_min: number
  dias_max: number
  dias_muestra: number
  margen_minimo_remates: number
  tasa_iva: number
}

export default function CatAreasDeptosClases() {
  const consumoApi = useConsumoApi()
  
  // Estados para Áreas
  const [areas, setAreas] = useState<CatArea[]>([])
  const [openAreaModal, setOpenAreaModal] = useState(false)
  const [areaForm, setAreaForm] = useState<AreaForm>({ area: '', descripcion: '' })
  const [editingArea, setEditingArea] = useState<CatArea | null>(null)
  
  // Estados para Departamentos
  const [deptos, setDeptos] = useState<CatDepto[]>([])
  const [openDeptoModal, setOpenDeptoModal] = useState(false)
  const [deptoForm, setDeptoForm] = useState<DeptoForm>({ depto: '', area: '', descripcion: '' })
  const [editingDepto, setEditingDepto] = useState<CatDepto | null>(null)
  
  // Estados para Clases
  const [clases, setClases] = useState<CatClase[]>([])
  const [openClaseModal, setOpenClaseModal] = useState(false)
  const [claseForm, setClaseForm] = useState<ClaseForm>({ clase: '', depto: '', area: '', descripcion: '', dias_min: 0, dias_max: 0, dias_muestra: 0, margen_minimo_remates: 0, tasa_iva: 0 })
  const [editingClase, setEditingClase] = useState<CatClase | null>(null)
  
  // Estados generales
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Funciones de API
  const fetchAreas = async () => {
    setLoading(true)
    try {
      const res = await consumoApi.consumoApi.get('/api/CatPermisosDeptos/sp_bw_cat_areas_sel?area=0')
      if (res.status === 200) {
        setAreas(res.data || [])
      }
    } catch (error: any) {
      setMessage({ text: "Error al cargar áreas", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchDeptos = async () => {
    setLoading(true)
    try {
      const res = await consumoApi.consumoApi.get('/api/CatPermisosDeptos/sp_bw_cat_deptos_sel?depto=0')
      if (res.status === 200) {
        setDeptos(res.data || [])
      }
    } catch (error: any) {
      setMessage({ text: "Error al cargar departamentos", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchClases = async () => {
    setLoading(true)
    try {
      const res = await consumoApi.consumoApi.get('/api/CatAreas/sp_bw_cat_clases_sel?area=0&depto=0')
      if (res.status === 200) {
        setClases(res.data || [])
      }
    } catch (error: any) {
      setMessage({ text: "Error al cargar clases", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAreas()
    fetchDeptos()
    fetchClases()
  }, [])

  // Handlers para Áreas
  const handleOpenNewArea = () => {
    setAreaForm({ area: '', descripcion: '' })
    setEditingArea(null)
    setOpenAreaModal(true)
  }

  const handleEditArea = (area: CatArea) => {
    setAreaForm({ area: area.area, descripcion: area.descripcion })
    setEditingArea(area)
    setOpenAreaModal(true)
  }

  const handleSaveArea = async () => {
    if (!areaForm.area || !areaForm.descripcion) return

    setLoading(true)
    try {
      if (editingArea) {
        // Editar área
        const res = await consumoApi.consumoApi.put('/api/CatAreas/sp_bw_cat_areas_upd', null, {
          params: { area: areaForm.area, descripcion: areaForm.descripcion }
        })
        if (res.data?.[0]?.codigo === 0) {
          setMessage({ text: "Área actualizada correctamente", type: 'success' })
        }
      } else {
        // Agregar área
        const res = await consumoApi.consumoApi.post('/api/CatAreas/sp_bw_cat_areas_add', null, {
          params: { area: areaForm.area, descripcion: areaForm.descripcion }
        })
        if (res.data?.[0]?.codigo === 0) {
          setMessage({ text: "Área agregada correctamente", type: 'success' })
        }
      }
      fetchAreas()
      setOpenAreaModal(false)
    } catch (error: any) {
      setMessage({ text: "Error al guardar área", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteArea = async (area: CatArea) => {
    if (!window.confirm(`¿Seguro que desea eliminar el área "${area.descripcion}"?`)) return

    setLoading(true)
    try {
      const res = await consumoApi.consumoApi.delete('/api/CatAreas/sp_bw_cat_areas_del', {
        params: { area: area.area }
      })
      if (res.data?.[0]?.codigo === 0) {
        setMessage({ text: "Área eliminada correctamente", type: 'success' })
        fetchAreas()
      }
    } catch (error: any) {
      setMessage({ text: "Error al eliminar área", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Handlers para Departamentos
  const handleOpenNewDepto = () => {
    setDeptoForm({ depto: '', area: '', descripcion: '' })
    setEditingDepto(null)
    setOpenDeptoModal(true)
  }

  const handleEditDepto = (depto: CatDepto) => {
    setDeptoForm({ depto: depto.depto, area: depto.area, descripcion: depto.descripcion })
    setEditingDepto(depto)
    setOpenDeptoModal(true)
  }

  const handleSaveDepto = async () => {
    if (!deptoForm.depto || !deptoForm.area || !deptoForm.descripcion) return

    setLoading(true)
    try {
      if (editingDepto) {
        const res = await consumoApi.consumoApi.put('/api/CatAreas/sp_bw_cat_deptos_upd', null, {
          params: { depto: deptoForm.depto, area: deptoForm.area, descripcion: deptoForm.descripcion }
        })
        if (res.data?.[0]?.codigo === 0) {
          setMessage({ text: "Departamento actualizado correctamente", type: 'success' })
        }
      } else {
        const res = await consumoApi.consumoApi.post('/api/CatAreas/sp_bw_cat_deptos_add', null, {
          params: { depto: deptoForm.depto, area: deptoForm.area, descripcion: deptoForm.descripcion }
        })
        if (res.data?.[0]?.codigo === 0) {
          setMessage({ text: "Departamento agregado correctamente", type: 'success' })
        }
      }
      fetchDeptos()
      setOpenDeptoModal(false)
    } catch (error: any) {
      setMessage({ text: "Error al guardar departamento", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDepto = async (depto: CatDepto) => {
    if (!window.confirm(`¿Seguro que desea eliminar el departamento "${depto.descripcion}"?`)) return

    setLoading(true)
    try {
      const res = await consumoApi.consumoApi.delete('/api/CatAreas/sp_bw_cat_deptos_del', {
        params: { depto: depto.depto }
      })
      if (res.data?.[0]?.codigo === 0) {
        setMessage({ text: "Departamento eliminado correctamente", type: 'success' })
        fetchDeptos()
      }
    } catch (error: any) {
      setMessage({ text: "Error al eliminar departamento", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Handlers para Clases
  const handleOpenNewClase = () => {
    setClaseForm({ clase: '', depto: '', area: '', descripcion: '', dias_min: 0, dias_max: 0, dias_muestra: 0, margen_minimo_remates: 0, tasa_iva: 0 })
    setEditingClase(null)
    setOpenClaseModal(true)
  }

  const handleEditClase = (clase: CatClase) => {
    setClaseForm({ 
      clase: clase.clase, 
      depto: clase.depto, 
      area: clase.area, 
      descripcion: clase.descripcion,
      dias_min: clase.dias_min,
      dias_max: clase.dias_max,
      dias_muestra: clase.dias_muestra,
      margen_minimo_remates: clase.margen_minimo_remates,
      tasa_iva: clase.tasa_iva
    })
    setEditingClase(clase)
    setOpenClaseModal(true)
  }

  const handleSaveClase = async () => {
    if (!claseForm.clase || !claseForm.depto || !claseForm.descripcion) return

    setLoading(true)
    try {
      if (editingClase) {
        const res = await consumoApi.consumoApi.put('/api/CatAreas/sp_bw_cat_clases_upd', null, {
          params: { 
            clase: claseForm.clase, 
            depto: claseForm.depto, 
            area: claseForm.area, 
            descripcion: claseForm.descripcion,
            dias_min: claseForm.dias_min,
            dias_max: claseForm.dias_max,
            dias_muestra: claseForm.dias_muestra,
            margen_minimo_remates: claseForm.margen_minimo_remates,
            tasa_iva: claseForm.tasa_iva
          }
        })
        if (res.data?.[0]?.codigo === 0) {
          setMessage({ text: "Clase actualizada correctamente", type: 'success' })
        }
      } else {
        const res = await consumoApi.consumoApi.post('/api/CatAreas/sp_bw_cat_clases_add', null, {
          params: { 
            clase: claseForm.clase, 
            depto: claseForm.depto, 
            area: claseForm.area, 
            descripcion: claseForm.descripcion,
            dias_min: claseForm.dias_min,
            dias_max: claseForm.dias_max,
            dias_muestra: claseForm.dias_muestra,
            margen_minimo_remates: claseForm.margen_minimo_remates,
            tasa_iva: claseForm.tasa_iva
          }
        })
        if (res.data?.[0]?.codigo === 0) {
          setMessage({ text: "Clase agregada correctamente", type: 'success' })
        }
      }
      fetchClases()
      setOpenClaseModal(false)
    } catch (error: any) {
      setMessage({ text: "Error al guardar clase", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClase = async (clase: CatClase) => {
    if (!window.confirm(`¿Seguro que desea eliminar la clase "${clase.descripcion}"?`)) return

    setLoading(true)
    try {
      const res = await consumoApi.consumoApi.delete('/api/CatAreas/sp_bw_cat_clases_del', {
        params: { area: clase.area, depto: clase.depto, clase: clase.clase }
      })
      if (res.data?.[0]?.codigo === 0) {
        setMessage({ text: "Clase eliminada correctamente", type: 'success' })
        fetchClases()
      }
    } catch (error: any) {
      setMessage({ text: "Error al eliminar clase", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* --- HEADER --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
          Áreas, Departamentos y Clases
        </Typography>
      </Box>

      {/* --- TRES TABLAS EN LÍNEA --- */}
      <Grid container spacing={3}>
        {/* TABLA DE ÁREAS */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '& .super-app-theme--header': {
              backgroundColor: '#707070ff',
              color: 'white',
              fontWeight: 'bold',
            }
          }}>
            <Box sx={{ p: 2, bgcolor: '#555555ff', color: 'white', borderRadius: '12px 12px 0 0' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Áreas
              </Typography>
            </Box>
            <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<AddIcon />}
                onClick={handleOpenNewArea}
                sx={{ 
                  bgcolor: '#000000ff', 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  px: 2,
                  py: 0.5,
                  borderRadius: '6px',
                  width: '100%'
                }}
              >
                Agregar Área
              </Button>
            </Box>
            <DataGrid
              rows={areas}
              columns={[
                {
                  field: 'area',
                  headerName: 'ID',
                  width: 60,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'descripcion',
                  headerName: 'Descripción',
                  width: 150,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'acciones',
                  headerName: 'Acciones',
                  width: 100,
                  headerClassName: 'super-app-theme--header',
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#707070ff' }}
                        onClick={() => handleEditArea(params.row)}
                        title="Editar Área"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#555555ff' }}
                        onClick={() => handleDeleteArea(params.row)}
                        title="Eliminar Área"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ),
                },
              ]}
              loading={loading}
              getRowId={(row) => row.area}
              hideFooter
              sx={{
                height: 400,
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#555555ff',
                  color: 'white',
                  fontWeight: 'bold',
                },
              }}
            />
          </Paper>
        </Grid>

        {/* TABLA DE DEPARTAMENTOS */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '& .super-app-theme--header': {
              backgroundColor: '#707070ff',
              color: 'white',
              fontWeight: 'bold',
            }
          }}>
            <Box sx={{ p: 2, bgcolor: '#555555ff', color: 'white', borderRadius: '12px 12px 0 0' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Departamentos
              </Typography>
            </Box>
            <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<AddIcon />}
                onClick={handleOpenNewDepto}
                sx={{ 
                  bgcolor: '#000000ff', 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  px: 2,
                  py: 0.5,
                  borderRadius: '6px',
                  width: '100%'
                }}
              >
                Agregar Departamento
              </Button>
            </Box>
            <DataGrid
              rows={deptos}
              columns={[
                {
                  field: 'depto',
                  headerName: 'ID',
                  width: 60,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'area',
                  headerName: 'Área',
                  width: 60,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'descripcion',
                  headerName: 'Descripción',
                  width: 120,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'acciones',
                  headerName: 'Acciones',
                  width: 100,
                  headerClassName: 'super-app-theme--header',
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#707070ff' }}
                        onClick={() => handleEditDepto(params.row)}
                        title="Editar Departamento"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#555555ff' }}
                        onClick={() => handleDeleteDepto(params.row)}
                        title="Eliminar Departamento"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ),
                },
              ]}
              loading={loading}
              getRowId={(row) => row.depto}
              hideFooter
              sx={{
                height: 400,
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#555555ff',
                  color: 'white',
                  fontWeight: 'bold',
                },
              }}
            />
          </Paper>
        </Grid>

        {/* TABLA DE CLASES */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '& .super-app-theme--header': {
              backgroundColor: '#707070ff',
              color: 'white',
              fontWeight: 'bold',
            }
          }}>
            <Box sx={{ p: 2, bgcolor: '#555555ff', color: 'white', borderRadius: '12px 12px 0 0' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Clases
              </Typography>
            </Box>
            <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<AddIcon />}
                onClick={handleOpenNewClase}
                sx={{ 
                  bgcolor: '#000000ff', 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  px: 2,
                  py: 0.5,
                  borderRadius: '6px',
                  width: '100%'
                }}
              >
                Agregar Clase
              </Button>
            </Box>
            <DataGrid
              rows={clases}
              columns={[
                {
                  field: 'clase',
                  headerName: 'ID',
                  width: 60,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'depto',
                  headerName: 'Depto',
                  width: 60,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'descripcion',
                  headerName: 'Descripción',
                  width: 120,
                  headerClassName: 'super-app-theme--header',
                },
                {
                  field: 'acciones',
                  headerName: 'Acciones',
                  width: 100,
                  headerClassName: 'super-app-theme--header',
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#707070ff' }}
                        onClick={() => handleEditClase(params.row)}
                        title="Editar Clase"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#555555ff' }}
                        onClick={() => handleDeleteClase(params.row)}
                        title="Eliminar Clase"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ),
                },
              ]}
              loading={loading}
              getRowId={(row) => row.clase}
              hideFooter
              sx={{
                height: 400,
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#555555ff',
                  color: 'white',
                  fontWeight: 'bold',
                },
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* --- MODAL DE ÁREAS --- */}
      <Dialog 
        open={openAreaModal} 
        onClose={() => setOpenAreaModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <Box sx={{ p: 4, bgcolor: '#fdfdfd' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              {editingArea ? '✏️ Editar Área' : 'Nueva Área'}
            </Typography>
            <IconButton onClick={() => setOpenAreaModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 3, borderBottomWidth: 2, borderColor: '#000000ff' }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="ID Área"
              value={areaForm.area}
              onChange={(e) => setAreaForm({ ...areaForm, area: e.target.value })}
              disabled={!!editingArea}
              fullWidth
            />
            <TextField
              label="Descripción"
              value={areaForm.descripcion}
              onChange={(e) => setAreaForm({ ...areaForm, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button onClick={() => setOpenAreaModal(false)} variant="outlined">
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveArea}
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#000000ff' }}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* --- MODAL DE DEPARTAMENTOS --- */}
      <Dialog 
        open={openDeptoModal} 
        onClose={() => setOpenDeptoModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <Box sx={{ p: 4, bgcolor: '#fdfdfd' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              {editingDepto ? '✏️ Editar Departamento' : 'Nuevo Departamento'}
            </Typography>
            <IconButton onClick={() => setOpenDeptoModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 3, borderBottomWidth: 2, borderColor: '#000000ff' }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="ID Departamento"
              value={deptoForm.depto}
              onChange={(e) => setDeptoForm({ ...deptoForm, depto: e.target.value })}
              disabled={!!editingDepto}
              fullWidth
            />
            <TextField
              label="ID Área"
              value={deptoForm.area}
              onChange={(e) => setDeptoForm({ ...deptoForm, area: e.target.value })}
              fullWidth
            />
            <TextField
              label="Descripción"
              value={deptoForm.descripcion}
              onChange={(e) => setDeptoForm({ ...deptoForm, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button onClick={() => setOpenDeptoModal(false)} variant="outlined">
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveDepto}
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#000000ff' }}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* --- MODAL DE CLASES --- */}
      <Dialog 
        open={openClaseModal} 
        onClose={() => setOpenClaseModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <Box sx={{ p: 4, bgcolor: '#fdfdfd' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              {editingClase ? '✏️ Editar Clase' : 'Nueva Clase'}
            </Typography>
            <IconButton onClick={() => setOpenClaseModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 3, borderBottomWidth: 2, borderColor: '#000000ff' }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="ID Clase"
              value={claseForm.clase}
              onChange={(e) => setClaseForm({ ...claseForm, clase: e.target.value })}
              disabled={!!editingClase}
              fullWidth
            />
            <TextField
              label="ID Departamento"
              value={claseForm.depto}
              onChange={(e) => setClaseForm({ ...claseForm, depto: e.target.value })}
              fullWidth
            />
            <TextField
              label="Descripción"
              value={claseForm.descripcion}
              onChange={(e) => setClaseForm({ ...claseForm, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button onClick={() => setOpenClaseModal(false)} variant="outlined">
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveClase}
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#000000ff' }}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* --- SNACKBAR PARA MENSAJES --- */}
      {message && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
          <Alert 
            severity={message.type} 
            onClose={() => setMessage(null)}
            sx={{ minWidth: 300 }}
          >
            {message.text}
          </Alert>
        </Box>
      )}

      <PWABadge />
    </Box>
  )
}