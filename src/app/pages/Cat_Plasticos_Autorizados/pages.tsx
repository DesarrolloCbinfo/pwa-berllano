import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField, Paper, Grid } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { useSessionContext } from '../../../context/SessionProvider'
import PWABadge from '../../../PWABadge'
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import Swal from 'sweetalert2'

interface Plastico {
  id: number
  plastico: string
}

export default function CatPlasticosAutorizados() {
  const { consumoApi } = useConsumoApi()
  const { session } = useSessionContext() // <--- Agregamos la sesión
  const [rows, setRows] = useState<Plastico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [openReasignacion, setOpenReasignacion] = useState(false)
  const [openReporte, setOpenReporte] = useState(false)
  const [openAgregar, setOpenAgregar] = useState(false)
  const [openEditar, setOpenEditar] = useState(false)
  const [plasticoEditando, setPlasticoEditando] = useState<Plastico | null>(null)
  const [nuevoPlastico, setNuevoPlastico] = useState('')
  const [nuevoPlasticoAgregar, setNuevoPlasticoAgregar] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Funciones de manejo antes de las columnas
  const handleEditar = (plastico: Plastico) => {
    setPlasticoEditando(plastico);
    setNuevoPlastico(plastico.plastico);
    setOpenEditar(true);
  }

  const handleEliminar = async (plastico: Plastico) => {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar Plástico?',
      text: `¿Está seguro de eliminar el plástico ${plastico.plastico}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#333333',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (!confirmacion.isConfirmed) return

    try {
      await consumoApi.delete(`/api/CatPlasticos_Autorizados/sp_bw_cat_config_plasticos_autorizados_del?id=${plastico.id}`)
      Swal.fire({ 
        title: '¡Éxito!', 
        text: 'Plástico eliminado correctamente', 
        icon: 'success',
        confirmButtonColor: '#333333'
      })
      fetchPlasticos()
    } catch (error) {
      Swal.fire({ 
        title: 'Error', 
        text: 'Error al eliminar el plástico', 
        icon: 'error',
        confirmButtonColor: '#333333'
      })
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEditar(params.row)}
            sx={{ '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleEliminar(params.row)}
            sx={{ '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.08)' } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
    { 
      field: 'plastico', 
      headerName: 'Plástico', 
      flex: 1,
      minWidth: 200,
      headerAlign: 'center',
      align: 'center',
    },
  ]

  const fetchPlasticos = async () => {
    try {
      setLoading(true)
      const res = await consumoApi.get('/api/CatPlasticos_Autorizados/sp_bw_cat_config_plasticos_autorizados_sel')
      
      const data = res.data.map((item: any) => ({
        id: item.id,
        plastico: item.num_plastico,
      }))

      setRows(data)
      setError(null)
    } catch (err) {
      console.error('Error al cargar plásticos:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlasticos()
  }, [])

  const handleReasignacion = () => {
    setOpenReasignacion(true)
  }

  const handleReporte = () => {
    setOpenReporte(true)
  }

  const handleSalir = () => {
    window.history.back()
  }

  // Filtrar plásticos según la búsqueda
  const plasticosFiltrados = rows.filter(plastico => 
    plastico.plastico.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleActualizarPlastico = async () => {
    if (!nuevoPlastico.trim()) {
      Swal.fire({
        title: 'Atención',
        text: 'El número de plástico es obligatorio',
        icon: 'warning',
        confirmButtonColor: '#333333'
      });
      return;
    }

    try {
      await consumoApi.put(`/api/CatPlasticos_Autorizados/sp_bw_cat_config_plasticos_autorizados_upd?id=${plasticoEditando?.id}&num_plastico=${nuevoPlastico.trim()}`);
      Swal.fire({
        title: '¡Éxito!',
        text: 'Plástico actualizado correctamente',
        icon: 'success',
        confirmButtonColor: '#333333'
      });
      setOpenEditar(false);
      fetchPlasticos();
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Error al actualizar el plástico',
        icon: 'error',
        confirmButtonColor: '#333333'
      });
    }
  }

  const handleAgregarPlastico = async () => {
    if (!nuevoPlasticoAgregar.trim()) {
      Swal.fire({
        title: 'Atención',
        text: 'El número de plástico es obligatorio',
        icon: 'warning',
        confirmButtonColor: '#333333'
      });
      return;
    }

    try {
      // Endpoint correcto para agregar plásticos
      await consumoApi.post(`/api/CatPlasticos_Autorizados/sp_bw_cat_config_plasticos_autorizados_add?num_plastico=${nuevoPlasticoAgregar.trim()}`);
      Swal.fire({
        title: '¡Éxito!',
        text: 'Plástico agregado correctamente',
        icon: 'success',
        confirmButtonColor: '#333333'
      });
      setOpenAgregar(false);
      setNuevoPlasticoAgregar('');
      fetchPlasticos();
    } catch (error: any) {
      console.error('Error al agregar plástico:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.mensaje || 'Error al agregar el plástico',
        icon: 'error',
        confirmButtonColor: '#333333'
      });
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ width: '100%', p: 3, backgroundColor: '#ececec', minHeight: '100vh' }}>
        
        <style>{`
          .swal2-container {
            z-index: 9999 !important;
          }
        `}</style>

       {/* CONTENEDOR BLANCO SUPERIOR (ENCABEZADO + FILTROS) */}
        <Paper sx={{ p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', mb: 3 }}>
          
          {/* RECUADRO INTERIOR ELEGANTE */}
          <Box sx={{ border: '1px solid #2c3e50', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem', textTransform: 'uppercase' }}>
                      ALTA DE PLÁSTICOS AUTORIZADOS
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                      Sucursal: {session?.dSucursal || 'Cargando...'}
                  </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                      {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replaceAll('/', '-')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                      Usuario Activo: {session?.nombre || 'Cargando...'}
                  </Typography>
              </Box>
          </Box>

          {/* BARRA DE BOTÓN AGREGAR Y BÚSQUEDA INTEGRADA LIMPIAMENTE */}
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} sm={4} md={3}>
              <Button
                variant="contained"
                onClick={() => setOpenAgregar(true)}
                fullWidth
                sx={{ 
                  height: '40px', 
                  bgcolor: '#333333', 
                  fontWeight: 'bold', 
                  borderRadius: '8px',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(51,51,51,0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': { bgcolor: '#555555', transform: 'translateY(-1px)' }
                }}
              >
                + AGREGAR PLÁSTICO
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar plástico"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#555',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#333',
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* CONTENEDOR DE LA TABLA */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
          <Box sx={{ height: 500, width: '100%', mb: 3 }}>
            <DataGrid
              rows={plasticosFiltrados}
              columns={columns}
              getRowId={(row) => row.id}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 50 },
                },
              }}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                height: '100%',
                fontSize: '0.95rem', /* Tamaño de letra general */
                '& .MuiDataGrid-columnHeaders': { 
                  borderBottom: '2px solid #000', 
                  fontSize: '1rem', /* Encabezados un poco más grandes */
                  fontWeight: 'bold', 
                  backgroundColor: '#f5f5f5' 
                },
                '& .MuiDataGrid-cell': { 
                  borderBottom: '1px solid #e0e0e000' /* Quita líneas divisorias de las celdas */
                },
                '& .MuiDataGrid-row': { 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease' 
                },
                '& .MuiDataGrid-row:hover': { 
                  bgcolor: '#fafafa' /* Efecto sutil al pasar el mouse */
                }
              }}
            />
          </Box>

          {/* BOTONERA INFERIOR */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleReasignacion}
              sx={{ 
                minWidth: 200, 
                bgcolor: '#333333', 
                fontWeight: 600, 
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(51,51,51,0.3)',
                '&:hover': { bgcolor: '#555555' }
              }}
            >
              Reasignación de Plásticos
            </Button>
            <Button
              variant="contained"
              onClick={handleReporte}
              sx={{ 
                minWidth: 200, 
                bgcolor: '#333333', 
                fontWeight: 600, 
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(51,51,51,0.3)',
                '&:hover': { bgcolor: '#555555' }
              }}
            >
              Reporte de Reasignación
            </Button>
          
          </Box>
        </Box>
        </Box>

      {/* Dialog de Reasignación */}
      <Dialog open={openReasignacion} onClose={() => setOpenReasignacion(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reasignación de Plásticos</DialogTitle>
        <DialogContent>
          <Typography>Funcionalidad de reasignación de plásticos</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReasignacion(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Reporte */}
      <Dialog open={openReporte} onClose={() => setOpenReporte(false)} maxWidth="md" fullWidth>
        <DialogTitle>Reporte de Reasignación de Plásticos</DialogTitle>
        <DialogContent>
          <Typography>Reporte de reasignación de plásticos</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReporte(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Agregar Plástico */}
      <Dialog 
        open={openAgregar} 
        onClose={() => setOpenAgregar(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <Box sx={{ p: 4, bgcolor: '#fdfdfd' }}>
          <Box sx={{ bgcolor: '#000000ff', p: 3, borderRadius: '8px 8px 0 0', ml: -4, mr: -4, mt: -4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
              Agregar Plástico Autorizado
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
              Ingrese el número de plástico a agregar:
            </Typography>
            <IconButton 
              onClick={() => setOpenAgregar(false)}
              sx={{ 
                position: 'absolute', 
                top: 16, 
                right: 16, 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <EditIcon />
            </IconButton>
          </Box>
          
          <DialogContent sx={{ p: 0, mt: 3 }}>
            <TextField
              fullWidth
              label="Número de Plástico"
              value={nuevoPlasticoAgregar}
              onChange={(e) => setNuevoPlasticoAgregar(e.target.value)}
              variant="outlined"
              placeholder="Ej: 1234567890123"
            />
          </DialogContent>
          
          <DialogActions sx={{ p: 0, mt: 3 }}>
            <Button onClick={() => setOpenAgregar(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleAgregarPlastico}>Agregar</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Dialog de Editar Plástico */}
      <Dialog 
        open={openEditar} 
        onClose={() => setOpenEditar(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <Box sx={{ p: 4, bgcolor: '#fdfdfd' }}>
          <Box sx={{ bgcolor: '#000000ff', p: 3, borderRadius: '8px 8px 0 0', ml: -4, mr: -4, mt: -4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
              Editar Plástico Autorizado
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
              Modifique el número de plástico:
            </Typography>
            <IconButton 
              onClick={() => setOpenEditar(false)}
              sx={{ 
                position: 'absolute', 
                top: 16, 
                right: 16, 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <EditIcon />
            </IconButton>
          </Box>
          
          <DialogContent sx={{ p: 0, mt: 3 }}>
            <TextField
              fullWidth
              label="Número de Plástico"
              value={nuevoPlastico}
              onChange={(e) => setNuevoPlastico(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          </DialogContent>
          
          <DialogActions sx={{ p: 0, mt: 3 }}>
            <Button onClick={() => setOpenEditar(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleActualizarPlastico}>Actualizar</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <PWABadge />
    </>
  )
}
