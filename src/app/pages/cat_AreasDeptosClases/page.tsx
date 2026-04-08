import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
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
import { useSessionContext } from '../../../context/SessionProvider' // <--- Importamos la sesión
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
  claveSAT: string
  unidadMedidaSAT: string
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
  claveSAT: string
  unidadMedidaSAT: string
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
  const { session } = useSessionContext() // <--- Extraemos la sesión
  
  // Estados para Áreas
  const [areas, setAreas] = useState<CatArea[]>([])
  const [openAreaModal, setOpenAreaModal] = useState(false)
  const [areaForm, setAreaForm] = useState<AreaForm>({ area: '', descripcion: '' })
  const [editingArea, setEditingArea] = useState<CatArea | null>(null)
  
  // Estados para Departamentos
  const [deptos, setDeptos] = useState<CatDepto[]>([])
  const [openDeptoModal, setOpenDeptoModal] = useState(false)
  const [deptoForm, setDeptoForm] = useState<DeptoForm>({ depto: '', area: '', descripcion: '', claveSAT: '', unidadMedidaSAT: '' })
  const [editingDepto, setEditingDepto] = useState<CatDepto | null>(null)
  const [selectedArea, setSelectedArea] = useState<string>('0') // Área seleccionada para filtrar deptos
  
  // Estados para Clases
  const [clases, setClases] = useState<CatClase[]>([])
  const [openClaseModal, setOpenClaseModal] = useState(false)
  const [claseForm, setClaseForm] = useState<ClaseForm>({ clase: '', depto: '', area: '', descripcion: '', dias_min: 0, dias_max: 0, dias_muestra: 0, margen_minimo_remates: 0, tasa_iva: 0 })
  const [editingClase, setEditingClase] = useState<CatClase | null>(null)
  const [selectedDepto, setSelectedDepto] = useState<string>('0') // Departamento seleccionado para filtrar clases
  
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

  const fetchDeptos = async (areaId: string = '0') => {
    setLoading(true)
    try {
      const res = await consumoApi.consumoApi.get(`/api/CatAreas/sp_bw_cat_deptos_sel?area=${areaId}`)
      if (res.status === 200) {
        setDeptos(res.data || [])
      }
    } catch (error: any) {
      setMessage({ text: "Error al cargar departamentos", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchClases = async (areaId: string = '0', deptoId: string = '0') => {
    setLoading(true)
    try {
      const res = await consumoApi.consumoApi.get(`/api/CatAreas/sp_bw_cat_clases_sel?area=${areaId}&depto=${deptoId}`)
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
    fetchDeptos(selectedArea) // Usar el área seleccionada
    fetchClases(selectedArea, selectedDepto) // Usar el área y departamento seleccionados
  }, [selectedArea, selectedDepto])

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
    if (!areaForm.area || !areaForm.descripcion) {
      Swal.fire({
        title: 'Atención',
        text: 'El área y la descripción son obligatorios',
        icon: 'warning',
        confirmButtonColor: '#333333'
      });
      return;
    }

    setLoading(true)
    try {
      if (editingArea) {
        // Editar área
        const res = await consumoApi.consumoApi.put('/api/CatAreas/sp_bw_cat_areas_upd', null, {
          params: { area: areaForm.area, descripcion: areaForm.descripcion }
        })
        if (res.data?.[0]?.codigo === 0) {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Área actualizada correctamente',
            icon: 'success',
            confirmButtonColor: '#333333'
          });
          setMessage({ text: "Área actualizada correctamente", type: 'success' })
        }
      } else {
        // Agregar área
        const res = await consumoApi.consumoApi.post('/api/CatAreas/sp_bw_cat_areas_add', null, {
          params: { area: areaForm.area, descripcion: areaForm.descripcion }
        })
        if (res.data?.[0]?.codigo === 0) {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Área agregada correctamente',
            icon: 'success',
            confirmButtonColor: '#333333'
          });
          setMessage({ text: "Área agregada correctamente", type: 'success' })
        }
      }
      fetchAreas()
      setOpenAreaModal(false)
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: 'Error al guardar área',
        icon: 'error',
        confirmButtonColor: '#333333'
      });
      setMessage({ text: "Error al guardar área", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteArea = async (area: CatArea) => {
    const result = await Swal.fire({
      title: '¿Eliminar Área?',
      text: `¿Seguro que desea eliminar el área "${area.descripcion}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#333333',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) return;

    setLoading(true)
    try {
      const res = await consumoApi.consumoApi.delete('/api/CatAreas/sp_bw_cat_areas_del', {
        params: { area: area.area }
      })
      if (res.data?.[0]?.codigo === 0) {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Área eliminada correctamente',
          icon: 'success',
          confirmButtonColor: '#333333'
        });
        setMessage({ text: "Área eliminada correctamente", type: 'success' })
        fetchAreas()
      }
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: 'Error al eliminar área',
        icon: 'error',
        confirmButtonColor: '#333333'
      });
      setMessage({ text: "Error al eliminar área", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Handler para cuando se selecciona un departamento
  const handleDeptoSelect = (deptoId: string, areaId: string) => {
    setSelectedDepto(deptoId)
    fetchClases(areaId, deptoId) // Cargar clases filtradas por área y departamento
  }
  const handleAreaSelect = (areaId: string) => {
    setSelectedArea(areaId)
    fetchDeptos(areaId) // Cargar departamentos filtrados por área
  }
  const handleOpenNewDepto = () => {
    setDeptoForm({ 
      depto: '', 
      area: selectedArea,  // Pre-seleccionar el área seleccionada
      descripcion: '', 
      claveSAT: '', 
      unidadMedidaSAT: '' 
    })
    setEditingDepto(null)
    setOpenDeptoModal(true)
  }

  const handleEditDepto = (depto: CatDepto) => {
    setDeptoForm({ depto: depto.depto, area: depto.area, descripcion: depto.descripcion, claveSAT: depto.claveSAT, unidadMedidaSAT: depto.unidadMedidaSAT })
    setEditingDepto(depto)
    setOpenDeptoModal(true)
  }

  const handleSaveDepto = async () => {
    if (!deptoForm.depto || !deptoForm.area || !deptoForm.descripcion) {
      Swal.fire({
        title: 'Atención',
        text: 'El departamento, área y descripción son obligatorios',
        icon: 'warning',
        confirmButtonColor: '#333333'
      });
      return;
    }

    // Limpiar descripción: eliminar saltos de línea y caracteres especiales
    const descripcionLimpia = deptoForm.descripcion
      .replace(/[\r\n]+/g, ' ')  // Reemplazar saltos de línea con espacios
      .replace(/\s+/g, ' ')       // Reemplazar múltiples espacios con uno solo
      .trim();                    // Eliminar espacios al inicio y final

    // Limpiar campos SAT también (enviar null si están vacíos, SP ahora lo soporta)
    const claveSATLimpia = deptoForm.claveSAT ? deptoForm.claveSAT.trim() || null : null;
    const unidadMedidaSATLimpia = deptoForm.unidadMedidaSAT ? deptoForm.unidadMedidaSAT.trim() || null : null;

    console.log('Enviando datos:', {
      depto: deptoForm.depto,
      area: deptoForm.area,
      descripcion: descripcionLimpia,
      claveSAT: claveSATLimpia,
      unidadMedidaSAT: unidadMedidaSATLimpia
    });

    setLoading(true)
    try {
      if (editingDepto) {
        const res = await consumoApi.consumoApi.put('/api/CatAreas/sp_bw_cat_deptos_upd', {
          area: deptoForm.area,
          depto: deptoForm.depto,
          descripcion: descripcionLimpia,
          claveSAT: claveSATLimpia,
          unidadMedidaSAT: unidadMedidaSATLimpia
        })
        if (res.data?.[0]?.codigo === 0) {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Departamento actualizado correctamente',
            icon: 'success',
            confirmButtonColor: '#333333'
          });
          setMessage({ text: "Departamento actualizado correctamente", type: 'success' })
        } else {
          // Mostrar mensaje específico del servidor si hay error
          const errorMessage = res.data?.[0]?.mensaje || 'Error desconocido al actualizar departamento';
          Swal.fire({
            title: 'Error',
            text: errorMessage,
            icon: 'error',
          });
          setMessage({ text: errorMessage, type: 'error' })
        }
      } else {
        const res = await consumoApi.consumoApi.post('/api/CatAreas/sp_bw_cat_deptos_add', {
          area: deptoForm.area.trim(),
          depto: deptoForm.depto.trim(),
          descripcion: descripcionLimpia,
          claveSAT: claveSATLimpia,
          unidadMedidaSAT: unidadMedidaSATLimpia
        })
        if (res.data?.[0]?.codigo === 0) {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Departamento agregado correctamente',
            icon: 'success',
            confirmButtonColor: '#333333'
          });
          setMessage({ text: "Departamento agregado correctamente", type: 'success' })
        } else {
          // Mostrar mensaje específico del servidor si hay error
          const errorMessage = res.data?.[0]?.mensaje || 'Error desconocido al agregar departamento';
          Swal.fire({
            title: 'Error',
            text: errorMessage,
            icon: 'error',
            confirmButtonColor: '#333333'
          });
          setMessage({ text: errorMessage, type: 'error' })
        }
      }
      fetchDeptos(selectedArea) // Usar el área seleccionada
      setOpenDeptoModal(false)
    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Detalles del error 400:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.response?.config,
        params: error.response?.config?.params,
        url: error.response?.config?.url
      });
      
      let errorMessage = 'Error al guardar departamento';
      
      // Extraer mensaje de error más específico si está disponible
      if (error.response?.data?.[0]?.mensaje) {
        errorMessage = error.response.data[0].mensaje;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Datos inválidos o incompletos. Verifique que todos los campos obligatorios estén completos.';
      } else if (error.response?.statusText) {
        errorMessage = `Error del servidor: ${error.response.statusText}`;
      }
      
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#333333'
      });
      setMessage({ text: errorMessage, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDepto = async (depto: CatDepto) => {
    const result = await Swal.fire({
      title: '¿Eliminar Departamento?',
      text: `¿Seguro que desea eliminar el departamento "${depto.descripcion}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#333333',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) return;

    setLoading(true)
    try {
      const res = await consumoApi.consumoApi.delete('/api/CatAreas/sp_bw_cat_deptos_del', {
        params: { area: depto.area, depto: depto.depto }
      })
      if (res.data?.[0]?.codigo === 0) {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Departamento eliminado correctamente',
          icon: 'success',
          confirmButtonColor: '#333333'
        });
        setMessage({ text: "Departamento eliminado correctamente", type: 'success' })
        fetchDeptos(selectedArea) // Usar el área seleccionada
      }
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: 'Error al eliminar departamento',
        icon: 'error',
        confirmButtonColor: '#333333'
      });
      setMessage({ text: "Error al eliminar departamento", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Handlers para Clases
  const handleOpenNewClase = () => {
    setClaseForm({ 
      clase: '', 
      depto: selectedDepto, 
      area: selectedArea, 
      descripcion: '', 
      dias_min: 0, 
      dias_max: 0, 
      dias_muestra: 0, 
      margen_minimo_remates: 0, 
      tasa_iva: 0 
    })
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
    if (!claseForm.clase || !claseForm.depto || !claseForm.descripcion) {
      Swal.fire({
        title: 'Atención',
        text: 'La clase, departamento y descripción son obligatorios',
        icon: 'warning',
        confirmButtonColor: '#333333'
      });
      return;
    }

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
          Swal.fire({
            title: '¡Éxito!',
            text: 'Clase actualizada correctamente',
            icon: 'success',
            confirmButtonColor: '#333333'
          });
          setMessage({ text: "Clase actualizada correctamente", type: 'success' })
        }
      } else {
        // Para agregar: todos los campos
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
          Swal.fire({
            title: '¡Éxito!',
            text: 'Clase agregada correctamente',
            icon: 'success',
            confirmButtonColor: '#333333'
          });
          setMessage({ text: "Clase agregada correctamente", type: 'success' })
        }
      }
      fetchClases(selectedArea, selectedDepto) // Usar el área y departamento seleccionados
      setOpenClaseModal(false)
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: 'Error al guardar clase',
        icon: 'error',
        confirmButtonColor: '#333333'
      });
      setMessage({ text: "Error al guardar clase", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClase = async (clase: CatClase) => {
    const result = await Swal.fire({
      title: '¿Eliminar Clase?',
      text: `¿Seguro que desea eliminar la clase "${clase.descripcion}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#333333',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) return;

    setLoading(true)
    try {
      const res = await consumoApi.consumoApi.delete('/api/CatAreas/sp_bw_cat_clases_del', {
        params: { area: clase.area, depto: clase.depto, clase: clase.clase }
      })
      if (res.data?.[0]?.codigo === 0) {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Clase eliminada correctamente',
          icon: 'success',
          confirmButtonColor: '#333333'
        });
        setMessage({ text: "Clase eliminada correctamente", type: 'success' })
        fetchClases(selectedArea, selectedDepto) // Usar el área y departamento seleccionados
      }
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: 'Error al eliminar clase',
        icon: 'error',
        confirmButtonColor: '#333333'
      });
      setMessage({ text: "Error al eliminar clase", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

return (
    <>
      <Box sx={{ width: '100%', p: 3, backgroundColor: '#ececec', minHeight: '100vh' }}>
        
        <style>{`
          .swal2-container {
            z-index: 9999 !important;
          }
        `}</style>

        {/* CONTENEDOR BLANCO PRINCIPAL (ENCABEZADO ELEGANTE) */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', mb: 3 }}>
          
          {/* RECUADRO INTERIOR ELEGANTE */}
          <Box sx={{ border: '1px solid #000000ff', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem', textTransform: 'uppercase' }}>
                      CATÁLOGO DE ÁREAS, DEPARTAMENTOS Y CLASES
                  </Typography>
                  
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                      {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replaceAll('/', '-')}
                  </Typography>
                  
              </Box>
          </Box>
        </Box>
      <Grid container spacing={3}>
        {/* TABLA DE ÁREAS */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '& .super-app-theme--header': {
              backgroundColor: '#818181ff',
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
                { field: 'area', headerName: 'ID', width: 60 },
                { field: 'descripcion', headerName: 'Descripción', flex: 1 },
                {
                  field: 'acciones',
                  headerName: 'Acciones',
                  width: 90,
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" sx={{ color: '#707070ff' }}
                        onClick={(e) => { e.stopPropagation(); handleEditArea(params.row); }}
                        title="Editar Área"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" sx={{ color: '#555555ff' }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteArea(params.row); }}
                        title="Eliminar Área"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ),
                },
              ]}
              loading={loading}
              getRowId={(row) => `area_${row.area}`}
              hideFooter
              onRowClick={(params) => handleAreaSelect(params.row.area)}
              sx={{
                height: 400,
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  borderBottom: '2px solid #000',
                  color: '#000',
                  fontWeight: 'bold',
                },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' },
                '& .MuiDataGrid-row': { cursor: 'pointer', transition: 'all 0.2s ease' },
                '& .MuiDataGrid-row:hover': { bgcolor: '#fafafa' }
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
              backgroundColor: '#9b9b9bff',
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
                disabled={selectedArea === '0'}
                sx={{ 
                  bgcolor: selectedArea === '0' ? '#cccccc' : '#000000ff', 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  px: 2,
                  py: 0.5,
                  borderRadius: '6px',
                  width: '100%',
                  '&:hover': {
                    bgcolor: selectedArea === '0' ? '#bbbbbb' : '#333333ff'
                  }
                }}
              >
                {selectedArea === '0' ? 'Seleccione un área primero' : 'Agregar Departamento'}
              </Button>
            </Box>
            <DataGrid
              rows={deptos}
              columns={[
                { field: 'depto', headerName: 'ID', width: 60 },
                { field: 'area', headerName: 'Área', width: 60 },
                { field: 'descripcion', headerName: 'Descripción', flex: 1 },
                { field: 'claveSAT', headerName: 'C. SAT', width: 90 },
                { field: 'unidadMedidaSAT', headerName: 'U. SAT', width: 90 },
                {
                  field: 'acciones',
                  headerName: 'Acciones',
                  width: 90,
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" sx={{ color: '#707070ff' }}
                        onClick={(e) => { e.stopPropagation(); handleEditDepto(params.row); }}
                        title="Editar Departamento"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" sx={{ color: '#555555ff' }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteDepto(params.row); }}
                        title="Eliminar Departamento"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ),
                },
              ]}
              loading={loading}
              getRowId={(row) => `depto_${row.depto}`}
              hideFooter
              onRowClick={(params) => handleDeptoSelect(params.row.depto, params.row.area)}
              sx={{
                height: 400,
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  borderBottom: '2px solid #000',
                  color: '#000',
                  fontWeight: 'bold',
                },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' },
                '& .MuiDataGrid-row': { cursor: 'pointer', transition: 'all 0.2s ease' },
                '& .MuiDataGrid-row:hover': { bgcolor: '#fafafa' }
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
              backgroundColor: '#818181ff',
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
                disabled={selectedDepto === '0'}
                sx={{ 
                  bgcolor: selectedDepto === '0' ? '#cccccc' : '#000000ff', 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  px: 2,
                  py: 0.5,
                  borderRadius: '6px',
                  width: '100%',
                  '&:hover': {
                    bgcolor: selectedDepto === '0' ? '#bbbbbb' : '#333333ff'
                  }
                }}
              >
                {selectedDepto === '0' ? 'Seleccione un departamento primero' : 'Agregar Clase'}
              </Button>
            </Box>
            <DataGrid
              rows={clases}
              columns={[
                { field: 'area', headerName: 'Área', width: 60 },
                { field: 'depto', headerName: 'Depto', width: 60 },
                { field: 'clase', headerName: 'ID', width: 60 },
                { field: 'descripcion', headerName: 'Descripción', flex: 1, minWidth: 120 },
                { field: 'dias_min', headerName: 'D. Min', width: 70 },
                { field: 'dias_max', headerName: 'D. Max', width: 70 },
                { field: 'dias_muestra', headerName: 'Muestra', width: 80 },
                { field: 'margen_minimo_remates', headerName: 'Remates', width: 80 },
                { field: 'tasa_iva', headerName: 'IVA', width: 60 },
                {
                  field: 'acciones',
                  headerName: 'Acciones',
                  width: 90,
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" sx={{ color: '#707070ff' }}
                        onClick={() => handleEditClase(params.row)}
                        title="Editar Clase"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" sx={{ color: '#555555ff' }}
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
              getRowId={(row) => `area_${row.area}_depto_${row.depto}_clase_${row.clase}`}
              hideFooter
              sx={{
                height: 400,
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  borderBottom: '2px solid #000',
                  color: '#000',
                  fontWeight: 'bold',
                },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' },
                '& .MuiDataGrid-row': { transition: 'all 0.2s ease' },
                '& .MuiDataGrid-row:hover': { bgcolor: '#fafafa' }
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
          <Box sx={{ bgcolor: '#000000ff', p: 3, borderRadius: '8px 8px 0 0', ml: -4, mr: -4, mt: -4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
              {editingArea ? 'Editar Área' : 'Nueva Área'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
              Complete la información del proveedor en los campos correspondientes
            </Typography>
            <IconButton 
              onClick={() => setOpenAreaModal(false)}
              sx={{ 
                position: 'absolute', 
                top: 16, 
                right: 16, 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
            <TextField
              label="Área *"
              value={areaForm.area}
              onChange={(e) => setAreaForm({ ...areaForm, area: e.target.value })}
              disabled={!!editingArea}
              fullWidth
            />
            <TextField
              label="Descripción *"
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
          <Box sx={{ bgcolor: '#000000ff', p: 3, borderRadius: '8px 8px 0 0', ml: -4, mr: -4, mt: -4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
              {editingDepto ? 'Editar Departamento' : 'Nuevo Departamento'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
              Complete la información del departamento en los campos correspondientes
            </Typography>
            <IconButton 
              onClick={() => setOpenDeptoModal(false)}
              sx={{ 
                position: 'absolute', 
                top: 16, 
                right: 16, 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
            <TextField
              label="Área"
              value={deptoForm.area}
              onChange={(e) => setDeptoForm({ ...deptoForm, area: e.target.value })}
              disabled={!editingDepto}
              fullWidth
            />
            <TextField
              label="Departamento *"
              value={deptoForm.depto}
              onChange={(e) => setDeptoForm({ ...deptoForm, depto: e.target.value })}
              disabled={!!editingDepto}
              fullWidth
            />
            <TextField
              label="Descripción *"
              value={deptoForm.descripcion}
              onChange={(e) => setDeptoForm({ ...deptoForm, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Clave SAT"
              value={deptoForm.claveSAT || ''}
              onChange={(e) => {
                if (e.target.value.length <= 10) {
                  setDeptoForm({ ...deptoForm, claveSAT: e.target.value })
                }
              }}
              inputProps={{ maxLength: 10 }}
              fullWidth
            />
            <TextField
              label="Unidad SAT"
              value={deptoForm.unidadMedidaSAT || ''}
              onChange={(e) => {
                if (e.target.value.length <= 3) {
                  setDeptoForm({ ...deptoForm, unidadMedidaSAT: e.target.value })
                }
              }}
              inputProps={{ maxLength: 3 }}
              fullWidth
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
          <Box sx={{ bgcolor: '#000000ff', p: 3, borderRadius: '8px 8px 0 0', ml: -4, mr: -4, mt: -4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
              {editingClase ? 'Editar Clase' : 'Nueva Clase'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
              Complete la información de la clase en los campos correspondientes
            </Typography>
            <IconButton 
              onClick={() => setOpenClaseModal(false)}
              sx={{ 
                position: 'absolute', 
                top: 16, 
                right: 16, 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
            <TextField
              label="Área *"
              value={claseForm.area}
              onChange={(e) => setClaseForm({ ...claseForm, area: e.target.value })}
              disabled={selectedArea !== '0'}
              fullWidth
            />
            <TextField
              label="Departamento *"
              value={claseForm.depto}
              onChange={(e) => setClaseForm({ ...claseForm, depto: e.target.value })}
              disabled={selectedDepto !== '0'}
              fullWidth
            />
            <TextField
              label="Clase *"
              value={claseForm.clase}
              onChange={(e) => setClaseForm({ ...claseForm, clase: e.target.value })}
              disabled={!!editingClase}
              fullWidth
            />
            <TextField
              label="Descripción *"
              value={claseForm.descripcion}
              onChange={(e) => setClaseForm({ ...claseForm, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Días Mínimos"
              type="number"
              value={claseForm.dias_min}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (value >= 0) {
                  setClaseForm({ ...claseForm, dias_min: value });
                }
              }}
              inputProps={{ min: 0, step: 1 }}
              fullWidth
            />
            <TextField
              label="Días Máximos"
              type="number"
              value={claseForm.dias_max}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (value >= 0) {
                  setClaseForm({ ...claseForm, dias_max: value });
                }
              }}
              inputProps={{ min: 0, step: 1 }}
              fullWidth
            />
            <TextField
              label="Días Muestra"
              type="number"
              value={claseForm.dias_muestra}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (value >= 0) {
                  setClaseForm({ ...claseForm, dias_muestra: value });
                }
              }}
              inputProps={{ min: 0, step: 1 }}
              fullWidth
            />
            <TextField
              label="Margen Mínimo Remates *"
              type="number"
              value={claseForm.margen_minimo_remates}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (value >= 0) {
                  setClaseForm({ ...claseForm, margen_minimo_remates: value });
                }
              }}
              inputProps={{ min: 0, step: 1 }}
              fullWidth
            />
            <TextField
              label="Tasa IVA *"
              type="number"
              value={claseForm.tasa_iva}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (value >= 0) {
                  setClaseForm({ ...claseForm, tasa_iva: value });
                }
              }}
              inputProps={{ min: 0, step: 1 }}
              fullWidth
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
  </>
  )
}